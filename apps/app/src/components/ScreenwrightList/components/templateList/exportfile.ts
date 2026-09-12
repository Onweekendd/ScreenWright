import { isTauri } from "@tauri-apps/api/core";
import { ElMessage, ElNotification } from "element-plus";
import JSZip from "jszip";

import { getScreenObj } from "@/api/visual";
import to from "@/utils/await-to-js";
import { BaseName, downFile, setMinioUrl } from "@/utils/config";

import {
  DEFAULT_FONT_FAMILY,
  EXPORT_FONT_DIR,
  EXPORT_RUNTIME_FILES,
  renderIndexHtml,
  renderReadme
} from "./exportTemplate";
import type { ExportParams, TempMode } from "./type";

/** 导出包内存放大屏素材的目录；运行时 setMinioUrl 会把 `./assets/...` 解析为相对 index.html 的路径 */
const ASSETS_DIR = "assets";
/** 导出包内存放运行时依赖的目录，与 exportTemplate 里 index.html 引用的 `./public` 对应 */
const PUBLIC_DIR = "public";
/** 素材并发下载数 */
const DOWNLOAD_CONCURRENCY = 6;

const { MINIO_DEFAULT_PREFIX, PUBLIC_PATH } = process.env;

/** 当前站点 public/ 的访问前缀，用来取 lib/、cdn/ 下的运行时文件 */
const publicBase = () => {
  const base = (PUBLIC_PATH || "/").replace(/\/?$/, "/");
  return `${location.origin}${base.startsWith("/") ? base : `/${base}`}`;
};

const parseJSON = <T>(value: unknown, fallback: T): T => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  return typeof value === "string" ? (JSON.parse(value) as T) : (value as T);
};

const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * 从序列化后的大屏配置中找出对象存储里的素材引用。
 * 两种形态：fs 存储的绝对地址 `http://host/blobs/<key>`，MinIO 的相对地址 `<prefix><key>`（prefix 来自 env）。
 * 返回 原始引用 → 对象 key 的映射；key 即导出后 assets/ 下的相对路径。
 */
export const collectAssetRefs = (modeStr: string): Map<string, string> => {
  const refs = new Map<string, string>();
  // JSON 字符串里 url 到引号、反斜杠（转义引号）、空白或右括号为止
  const stop = `[^"'\\\\\\s)]+`;

  for (const match of modeStr.matchAll(new RegExp(`https?://${stop}?/blobs/(${stop})`, "g"))) {
    refs.set(match[0], decodeURIComponent(match[1]));
  }
  if (MINIO_DEFAULT_PREFIX) {
    const prefix = escapeRegExp(MINIO_DEFAULT_PREFIX);
    for (const match of modeStr.matchAll(new RegExp(`(?<![\\w/])${prefix}(${stop})`, "g"))) {
      refs.set(match[0], match[1]);
    }
  }
  return refs;
};

/** 配置里出现过的字体名（`fontFamily` 字段，支持逗号分隔的字体栈） */
export const collectUsedFonts = (modeStr: string): Set<string> => {
  const fonts = new Set<string>();
  for (const match of modeStr.matchAll(/"fontFamily":"([^"]*)"/g)) {
    match[1]
      .split(",")
      .map((name) => name.trim().replace(/^['"]|['"]$/g, ""))
      .filter(Boolean)
      .forEach((name) => fonts.add(name));
  }
  return fonts;
};

/** 解析 lib/fontface.css，得到 字体名 → 字体文件名 */
export const parseFontFace = (css: string): Map<string, string> => {
  const map = new Map<string, string>();
  for (const match of css.matchAll(/font-family:\s*"([^"]+)";\s*src:\s*url\("\.\/fonts\/([^"]+)"\)/g)) {
    map.set(match[1], match[2]);
  }
  return map;
};

const fetchBlob = async (url: string): Promise<Blob> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${res.status} ${url}`);
  }
  return res.blob();
};

/** 限制并发地把一组文件拉下来写入 zip；返回失败的 url 列表 */
const downloadInto = async (zip: JSZip, entries: Array<{ url: string; path: string }>): Promise<string[]> => {
  const failed: string[] = [];
  const queue = [...entries];
  const worker = async () => {
    for (let entry = queue.shift(); entry; entry = queue.shift()) {
      const [error, blob] = await to(fetchBlob(entry.url));
      if (error || !blob) {
        failed.push(entry.url);
      } else {
        zip.file(entry.path, blob);
      }
    }
  };
  await Promise.all(Array.from({ length: DOWNLOAD_CONCURRENCY }, worker));
  return failed;
};

const buildTempMode = (screen: Awaited<ReturnType<typeof getScreenObj>>["result"]): TempMode => ({
  aniFrameSet: parseJSON(screen.aniFrameSet, {}),
  statusAnimation: parseJSON(screen.statusAnimation, {}),
  dataFilterArr: parseJSON(screen.dataFilterArr, null),
  detail: parseJSON(screen.detail, null),
  component: parseJSON<unknown[]>(screen.layers, []).map((layer) => parseJSON(layer, layer)),
  encodedControl: parseJSON<string[] | null>(screen.encodedControl, null),
  config: parseJSON(screen.config, null)
});

/** 导出过程中逐步填充的上下文；各 with* 步骤只登记任务，真正的网络请求延迟到 commit() 时按序执行 */
interface ExportContext {
  id: number;
  outputName: string;
  mode: TempMode | null;
  modeStr: string;
  zip: JSZip;
  assetEntries: Array<{ url: string; path: string }>;
  runtimeEntries: Array<{ url: string; path: string }>;
  fontEntries: Array<{ url: string; path: string }>;
}

type ExportStep = (ctx: ExportContext) => Promise<void>;

/**
 * 链式导出任务：`createExportTask(params).withScreenData().withAssets().withRuntime().commit()`。
 * with* 方法都是同步的（只把要做的事登记进队列），保持浏览器端调用链清爽；
 * 真正的请求、装包、下载都发生在最后的 commit() 里，串行执行、统一处理失败。
 */
export class ExportTask {
  private readonly ctx: ExportContext;
  private readonly steps: ExportStep[] = [];

  constructor({ id, name = "" }: ExportParams) {
    this.ctx = {
      id,
      outputName: name || "screenwright",
      mode: null,
      modeStr: "",
      zip: new JSZip(),
      assetEntries: [],
      runtimeEntries: [],
      fontEntries: []
    };
  }

  /** 拉取大屏配置，解析为写入 view.js 的结构 */
  withScreenData(): this {
    this.steps.push(async (ctx) => {
      const [error, res] = await to(getScreenObj(ctx.id));
      if (error || !res?.result) {
        throw new Error("获取大屏配置失败");
      }
      ctx.mode = buildTempMode(res.result);
      ctx.modeStr = JSON.stringify(ctx.mode);
    });
    return this;
  }

  /** 把配置里的对象存储素材引用改写为包内相对路径，并登记下载任务 */
  withAssets(): this {
    this.steps.push(async (ctx) => {
      // 长引用先替换，避免短引用恰好是长引用前缀时串改
      const assetRefs = [...collectAssetRefs(ctx.modeStr)].sort(([a], [b]) => b.length - a.length);
      for (const [ref, key] of assetRefs) {
        ctx.modeStr = ctx.modeStr.split(ref).join(`./${ASSETS_DIR}/${key}`);
        ctx.assetEntries.push({ url: setMinioUrl(ref), path: `${ASSETS_DIR}/${key}` });
      }
    });
    return this;
  }

  /** 登记运行时依赖（vue/element-plus/screenwright.umd.js）与配置里用到的字体 */
  withRuntime(): this {
    this.steps.push(async (ctx) => {
      const base = publicBase();
      const [fontError, fontCss] = await to(fetch(`${base}lib/fontface.css`).then((r) => (r.ok ? r.text() : "")));
      if (fontError) {
        throw new Error("读取字体清单失败，请确认已执行 pnpm build:lib");
      }
      const fontFiles = parseFontFace(fontCss || "");
      const usedFonts = collectUsedFonts(ctx.modeStr).add(DEFAULT_FONT_FAMILY);
      ctx.fontEntries = [...usedFonts]
        .map((font) => fontFiles.get(font))
        .filter((file): file is string => Boolean(file))
        .map((file) => ({
          url: `${base}${EXPORT_FONT_DIR}/${file}`,
          path: `${PUBLIC_DIR}/${EXPORT_FONT_DIR}/${file}`
        }));
      ctx.runtimeEntries = EXPORT_RUNTIME_FILES.map((file) => ({
        url: `${base}${file}`,
        path: `${PUBLIC_DIR}/${file}`
      }));
    });
    return this;
  }

  /** 按序跑完前面登记的步骤，装包、下载素材与运行时依赖，生成 zip 并触发下载 */
  async commit(): Promise<void> {
    const { ctx } = this;
    const notify = ElNotification({
      title: "导出进度",
      message: `${ctx.outputName} 正在构建，请稍等…`,
      duration: 0,
      customClass: "el-notification-custom",
      position: "bottom-right"
    });

    try {
      for (const step of this.steps) {
        await step(ctx);
      }
      if (!ctx.mode) {
        throw new Error("获取大屏配置失败");
      }

      ctx.zip.file("index.html", renderIndexHtml(ctx.outputName));
      ctx.zip.file("view.js", `const option = ${ctx.modeStr};`);
      if (ctx.mode.encodedControl?.length) {
        ctx.zip.file(
          "README.md",
          renderReadme({ system: BaseName.System, appId: ctx.id, encodedList: ctx.mode.encodedControl })
        );
      }

      const failedRuntime = await downloadInto(ctx.zip, [...ctx.runtimeEntries, ...ctx.fontEntries]);
      const missingRuntime = failedRuntime.filter((url) => url.includes("/lib/"));
      if (missingRuntime.length) {
        throw new Error(`运行时依赖缺失（${missingRuntime.length} 个），请先执行 pnpm build:lib`);
      }
      const failedAssets = await downloadInto(ctx.zip, ctx.assetEntries);

      const blob = await ctx.zip.generateAsync({ type: "blob" });
      const saved = await downFile(blob, `${ctx.outputName}-${ctx.id}.zip`);
      if (!saved) {
        return; // 桌面端：用户在保存对话框里取消了
      }

      const savedHint = isTauri() ? "文件已保存" : "如果浏览器提示下载请允许";
      if (failedAssets.length) {
        ElMessage.warning(`导出完成，但有 ${failedAssets.length} 个素材下载失败，已跳过`);
        console.warn("[export] 素材下载失败：", failedAssets);
      } else {
        ElMessage.success(`导出完成，${savedHint}！`);
      }
    } finally {
      notify.close();
    }
  }
}

export const createExportTask = (params: ExportParams): ExportTask => new ExportTask(params);

/**
 * 导出离线应用包：index.html + view.js + public/（运行时依赖）+ assets/（大屏素材）。
 * 全部在浏览器内完成，素材直接从对象存储逐个拉取，不依赖后端打包接口。
 */
export const outputExportFile = (params: ExportParams): Promise<void> =>
  createExportTask(params).withScreenData().withAssets().withRuntime().commit();
