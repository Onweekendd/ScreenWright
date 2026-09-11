import { hash } from "node:crypto";

import fs from "fs";
import path from "path";

import { retryWithBackoff } from "@/mastra/workflows/figma-to-bi/utils/async";

export type StyleId = `${string}_${string}` & { __brand: "StyleId" };

/**
 * 写入错误日志到 JSON 文件
 */
function writeErrorLog(errorType: string, errorData: Record<string, unknown>): void {
  try {
    const logDir = path.join(process.cwd(), "logs", "image-errors");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const logFile = path.join(logDir, `${errorType}-${timestamp}.json`);
    fs.writeFileSync(logFile, JSON.stringify(errorData, null, 2), "utf-8");
    console.log(`[ErrorLog] Written to: ${logFile}`);
  } catch (err) {
    console.error(`[ErrorLog] Failed to write error log:`, err);
  }
}

/**
 * 带超时控制的 fetch 请求
 * @param url - 请求的 URL 地址
 * @param timeoutMs - 超时时间（毫秒）
 * @returns Promise<Response> 返回 fetch 的响应对象
 * @throws {Error} 当请求超时或网络错误时抛出异常
 *
 * @example
 * ```ts
 * const response = await fetchWithTimeout("https://example.com/image.png", 5000);
 * if (response.ok) {
 *   const buffer = await response.arrayBuffer();
 * }
 * ```
 */
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    console.log(`[fetchWithTimeout] Requesting: ${url.substring(0, 150)}...`);
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal
    });
    console.log(`[fetchWithTimeout] Response: ${response.status} ${response.statusText}`);
    return response;
  } catch (error) {
    const err = error as Error;
    const errorLog = {
      timestamp: new Date().toISOString(),
      errorType: "fetch_failed",
      errorName: err.name,
      errorMessage: err.message,
      url: url.substring(0, 200),
      timeoutMs,
      stack: err.stack
    };
    writeErrorLog("fetch-error", errorLog);
    console.error(`[fetchWithTimeout] Error: ${err.name} - ${err.message}`);
    throw new Error(`Failed to fetch image: ${err.name} - ${err.message}`);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 下载单个图片的核心逻辑
 * @param fullPath - 文件保存的完整路径
 * @param imageUrl - 图片的 URL 地址
 * @param timeoutMs - 请求超时时间（毫秒）
 * @returns Promise<string> 返回保存的文件完整路径
 * @throws {Error} 当下载失败、写入失败或响应状态码非 2xx 时抛出异常
 *
 * @example
 * ```ts
 * const filePath = await downloadImageCore(
 *   "/local/path/image.png",
 *   "https://example.com/image.png",
 *   10000
 * );
 * console.log(`图片已保存至: ${filePath}`);
 * ```
 */
async function downloadImageCore(fullPath: string, imageUrl: string, timeoutMs: number): Promise<string> {
  const response = await fetchWithTimeout(imageUrl, timeoutMs);

  if (!response.ok) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      errorType: "http_error",
      status: response.status,
      statusText: response.statusText,
      url: imageUrl.substring(0, 200),
      fullPath,
      headers: Object.fromEntries((response.headers as any).entries())
    };
    writeErrorLog("http-error", errorLog);
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const writer = fs.createWriteStream(fullPath);
  const reader = response.body?.getReader();

  if (!reader) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      errorType: "no_response_body",
      url: imageUrl.substring(0, 200),
      fullPath
    };
    writeErrorLog("no-body-error", errorLog);
    throw new Error("Failed to get response body");
  }

  return new Promise<string>((resolve, reject) => {
    const processStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            writer.end();
            break;
          }
          writer.write(value);
        }
      } catch (err) {
        writer.end();
        fs.unlink(fullPath, () => {});
        const error = err as Error;
        const errorLog = {
          timestamp: new Date().toISOString(),
          errorType: "stream_read_error",
          errorMessage: error.message,
          url: imageUrl.substring(0, 200),
          fullPath,
          stack: error.stack
        };
        writeErrorLog("stream-error", errorLog);
        reject(err);
      }
    };

    writer.on("finish", () => resolve(fullPath));
    writer.on("error", (err) => {
      reader.cancel();
      fs.unlink(fullPath, () => {});
      const errorLog = {
        timestamp: new Date().toISOString(),
        errorType: "file_write_error",
        errorMessage: err.message,
        url: imageUrl.substring(0, 200),
        fullPath,
        stack: err.stack
      };
      writeErrorLog("write-error", errorLog);
      reject(new Error(`Failed to write image: ${err.message}`));
    });

    processStream();
  });
}

/**
 * 下载 Figma 图片并保存到本地，支持重试机制
 * @param fileName - 保存的文件名（如 "icon.png" 或 "image.svg"）
 * @param localPath - 本地保存目录的路径（如果不存在会自动创建）
 * @param imageUrl - 图片的 URL 地址（通常来自 Figma API 的 images[nodeId] 返回值）
 * @param options - 重试配置选项
 * @param options.maxRetries - 最大重试次数，默认为 3
 * @param options.timeoutMs - 单次请求超时时间（毫秒），默认为 30000
 * @returns Promise<string> 返回文件保存的完整路径
 * @throws {Error} 当所有重试都失败后抛出异常
 *
 * @example
 * ```ts
 * const filePath = await downloadFigmaImage(
 *   "frame-1.png",
 *   "./assets/images",
 *   "https://figma.com/api/images/123...",
 *   { maxRetries: 5, timeoutMs: 60000 }
 * );
 * // 返回: "./assets/images/frame-1.png"
 * ```
 */
export async function downloadFigmaImage(
  fileName: string,
  localPath: string,
  imageUrl: string,
  options: { maxRetries?: number; timeoutMs?: number } = {}
): Promise<string> {
  const { maxRetries = 7, timeoutMs = 10000000 } = options;

  // Ensure local path exists
  if (!fs.existsSync(localPath)) {
    fs.mkdirSync(localPath, { recursive: true });
  }

  const fullPath = path.join(localPath, fileName);

  return retryWithBackoff(() => downloadImageCore(fullPath, imageUrl, timeoutMs), {
    maxRetries,
    onRetry: (attempt, error) => {
      console.warn(`[Retry ${attempt}/${maxRetries}] Download failed for ${fileName}: ${error.message}`);
    }
  });
}

/**
 * 移除对象中的空数组或空对象键
 * @param input - 输入的对象或任意值
 * @returns 返回处理后的对象，或返回原始值（非对象类型）
 *
 * @example
 * ```ts
 * removeEmptyKeys({ a: 1, b: [], c: { d: {} } })
 * // 返回: { a: 1 }
 *
 * removeEmptyKeys({ items: [{ name: "test" }, {}] })
 * // 返回: { items: [{ name: "test" }, {}] }  // 注意：数组内的空对象不会被移除
 *
 * removeEmptyKeys("string")
 * // 返回: "string"
 * ```
 */
export function removeEmptyKeys<T>(input: T): T {
  // If not an object type or null, return directly
  if (typeof input !== "object" || input === null) {
    return input;
  }

  // Handle array type
  if (Array.isArray(input)) {
    return input.map((item) => removeEmptyKeys(item)) as T;
  }

  // Handle object type
  const result = {} as T;
  for (const key in input) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      const value = input[key];

      // Recursively process nested objects
      const cleanedValue = removeEmptyKeys(value);

      // Skip empty arrays and empty objects
      if (
        cleanedValue !== undefined &&
        !(Array.isArray(cleanedValue) && cleanedValue.length === 0) &&
        !(typeof cleanedValue === "object" && cleanedValue !== null && Object.keys(cleanedValue).length === 0)
      ) {
        result[key] = cleanedValue;
      }
    }
  }

  return result;
}

/**
 * 生成带前缀的 6 位随机变量 ID
 * @param prefix - ID 前缀，默认为 "var"
 * @param value - 用于生成哈希的源字符串
 * @returns 返回格式为 `{prefix}_{6位哈希值}` 的 StyleId 类型字符串
 *
 * @example
 * ```ts
 * generateVarId("color", "red-background")
 * // 返回: "color_a1b2c3"  (实际哈希值会有所不同)
 *
 * generateVarId("spacing", "20px")
 * // 返回: "spacing_d4e5f6"
 * ```
 */
export function generateVarId(prefix: string = "var", value: string): StyleId {
  const result = hash("sha1", value).slice(0, 6);

  return `${prefix}_${result}` as StyleId;
}

/**
 * 生成 CSS 简写属性值（用于 top、right、bottom、left 四个方向的值）
 *
 * 根据四个方向的值，按照 CSS 简写规则生成字符串：
 * - 四值相同：返回单个值（如 "10px"）
 * - 左右相同、上下不同：返回 "上下 左右"（如 "10px 20px"）
 * - 仅左右相同：返回 "上 右 下"（如 "10px 20px 30px"）
 * - 四值都不同：返回 "上 右 下 左"（如 "10px 20px 30px 40px"）
 *
 * @param values - 包含 top、right、bottom、left 四个方向值的对象
 * @param options - 配置选项
 * @param options.ignoreZero - 如果为 true 且所有值都为 0，则返回 undefined。默认为 true
 * @param options.suffix - 添加到每个值后的后缀，默认为 "px"
 * @returns 返回 CSS 简写字符串，或 undefined（当所有值为 0 且 ignoreZero 为 true 时）
 *
 * @example
 * ```ts
 * // 四值相同
 * generateCSSShorthand({ top: 10, right: 10, bottom: 10, left: 10 })
 * // 返回: "10px"
 *
 * // 左右相同，上下不同
 * generateCSSShorthand({ top: 10, right: 20, bottom: 10, left: 20 })
 * // 返回: "10px 20px"
 *
 * // 仅左右相同
 * generateCSSShorthand({ top: 10, right: 20, bottom: 30, left: 20 })
 * // 返回: "10px 20px 30px"
 *
 * // 四值不同
 * generateCSSShorthand({ top: 10, right: 20, bottom: 30, left: 40 })
 * // 返回: "10px 20px 30px 40px"
 *
 * // 全为 0 且 ignoreZero 为 true
 * generateCSSShorthand({ top: 0, right: 0, bottom: 0, left: 0 })
 * // 返回: undefined
 *
 * // 自定义后缀
 * generateCSSShorthand({ top: 1, right: 2, bottom: 1, left: 2 }, { suffix: "rem" })
 * // 返回: "1rem 2rem"
 * ```
 */
export function generateCSSShorthand(
  values: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  },
  {
    ignoreZero = true,
    suffix = "px"
  }: {
    /**
     * 如果为 true 且所有值都为 0，则返回 undefined。默认为 true
     */
    ignoreZero?: boolean;
    /**
     * 添加到每个值后的后缀。默认为 "px"
     */
    suffix?: string;
  } = {}
) {
  const { top, right, bottom, left } = values;
  if (ignoreZero && top === 0 && right === 0 && bottom === 0 && left === 0) {
    return undefined;
  }
  if (top === right && right === bottom && bottom === left) {
    return `${top}${suffix}`;
  }
  if (right === left) {
    if (top === bottom) {
      return `${top}${suffix} ${right}${suffix}`;
    }
    return `${top}${suffix} ${right}${suffix} ${bottom}${suffix}`;
  }
  return `${top}${suffix} ${right}${suffix} ${bottom}${suffix} ${left}${suffix}`;
}

/**
 * 检查元素是否可见
 * @param element - 包含 visible 属性的元素对象
 * @returns 返回 true 表示元素可见，false 表示元素被隐藏
 *
 * @example
 * ```ts
 * isVisible({ visible: true })   // 返回: true
 * isVisible({ visible: false })  // 返回: false
 * isVisible({})                  // 返回: true (默认可见)
 * ```
 */
export function isVisible(element: { visible?: boolean }): boolean {
  return element.visible ?? true;
}

/**
 * 对数值进行四舍五入，保留两位小数（适用于像素值处理）
 * @param num - 需要四舍五入的数值
 * @returns 返回保留两位小数的数值
 * @throws {TypeError} 当输入不是有效数字时抛出异常
 *
 * @example
 * ```ts
 * pixelRound(3.14159)    // 返回: 3.14
 * pixelRound(10.456)     // 返回: 10.46
 * pixelRound(0.005)      // 返回: 0.01
 * pixelRound(100)        // 返回: 100
 * pixelRound(NaN)        // 抛出 TypeError
 * ```
 */
export function pixelRound(num: number): number {
  if (isNaN(num)) {
    throw new TypeError(`Input must be a valid number`);
  }
  return Number(Number(num).toFixed(2));
}
