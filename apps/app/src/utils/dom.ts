// 寻找指定的父节点元素
const findParentElement = (e: MouseEvent, className: string): HTMLElement | null => {
  let currentElement: HTMLElement | null = e.target as HTMLElement;
  while (currentElement && currentElement !== document.documentElement) {
    if (currentElement.classList.contains(className.replace(".", ""))) {
      return currentElement;
    }
    currentElement = currentElement.parentElement;
  }
  return null;
};

const findParentElementWithClasses = (e: MouseEvent, classNames: string[]): HTMLElement | null => {
  let currentElement: HTMLElement | null = e.target as HTMLElement;
  const processedClassNames = classNames.map((className) => className.replace(".", ""));
  while (currentElement && currentElement !== document.documentElement) {
    const hasMatchingClass =
      currentElement !== null && processedClassNames.some((className) => currentElement!.classList.contains(className));
    if (hasMatchingClass) {
      return currentElement;
    }
    currentElement = currentElement.parentElement;
  }
  return null;
};

/**
 * 重建DOM结构（复用/创建screeShotArea，不添加无关内容）
 * @param originalDom 原始DOM元素
 * @returns 重建的包含完整内容的DOM节点
 */
export async function getRebuiltDom(originalDom: HTMLElement): Promise<HTMLElement> {
  if (!originalDom || !(originalDom instanceof HTMLElement)) {
    throw new Error("无效的DOM元素");
  }

  // 核心：获取或创建screeShotArea（仅保留必要定位，无多余样式）
  const debugContainer = getOrCreateShotContainer();

  try {
    // 1. 捕获原始元素HTML结构（包含当前状态）
    const originalHtml = originalDom.outerHTML;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = originalHtml;
    const rebuiltDom = tempDiv.firstElementChild as HTMLElement;
    if (!rebuiltDom) {
      throw new Error("无法重建DOM元素");
    }

    // 2. 生成唯一ID避免冲突（防止与页面其他元素重复）
    const newId = `rebuilt_${Date.now()}`;
    rebuiltDom.id = newId;

    // 3. 复制元素数据（输入框、Canvas、图片等核心内容）
    await copyElementData(originalDom, rebuiltDom);

    // 4. 清空screeShotArea并插入重建DOM（确保容器内只有目标元素）
    debugContainer.innerHTML = "";
    debugContainer.appendChild(rebuiltDom);

    // 5. 触发渲染（确保内容绘制完成，避免空白）
    await triggerAllRendering(rebuiltDom);

    return rebuiltDom;
  } catch (error) {
    console.error("重建DOM失败:", error);
    throw error;
  }
}

/**
 * 核心工具：获取已存在的screeShotArea，不存在则创建（仅基础定位）
 * 不添加多余样式，确保容器不干扰页面
 */
function getOrCreateShotContainer(): HTMLElement {
  let container = document.getElementById("screeShotArea");
  if (container) {
    // 若已存在，清空内部内容（避免残留旧元素）
    container.innerHTML = "";
    return container;
  }

  // 若不存在，创建基础容器（仅必要定位，无多余样式）
  container = document.createElement("div");
  container.id = "screeShotArea";
  // 定位到视口外但保持渲染能力（避免用户可见，同时不触发浏览器惰性渲染）
  container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: auto;
    height: auto;
    pointer-events: none; /* 不干扰页面交互 */
  `;
  document.body.appendChild(container);
  return container;
}

/**
 * 复制元素数据和内容（仅处理核心元素，不添加无关逻辑）
 */
async function copyElementData(original: HTMLElement, target: HTMLElement) {
  // 复制输入框内容
  if (original instanceof HTMLInputElement && target instanceof HTMLInputElement) {
    target.value = original.value;
  }

  // 复制文本区域内容
  if (original instanceof HTMLTextAreaElement && target instanceof HTMLTextAreaElement) {
    target.value = original.value;
  }

  // 处理Canvas（复制绘图内容，避免空白）
  if (original.tagName === "CANVAS" && target.tagName === "CANVAS") {
    const originalCanvas = original as HTMLCanvasElement;
    const targetCanvas = target as HTMLCanvasElement;
    targetCanvas.width = originalCanvas.width;
    targetCanvas.height = originalCanvas.height;
    targetCanvas.getContext("2d")?.drawImage(originalCanvas, 0, 0);
  }

  // 处理图片（确保加载完成，避免跨域/缓存问题）
  if (original.tagName === "IMG" && target.tagName === "IMG") {
    await new Promise((resolve) => {
      const img = target as HTMLImageElement;
      const originalImg = original as HTMLImageElement;
      img.crossOrigin = "anonymous";
      img.onload = resolve;
      img.onerror = resolve;
      // 添加时间戳避免缓存导致的旧图问题
      img.src = originalImg.src + (originalImg.src.includes("?") ? "&" : "?") + "t=" + Date.now();
    });
  }

  // 递归处理子元素（确保嵌套内容也能复制）
  if (original.children.length > 0 && target.children.length > 0) {
    for (let i = 0; i < Math.min(original.children.length, target.children.length); i++) {
      await copyElementData(original.children[i] as HTMLElement, target.children[i] as HTMLElement);
    }
  }
}

/**
 * 触发所有内容渲染（确保图表、图片等加载完成）
 */
async function triggerAllRendering(element: HTMLElement) {
  // 强制重绘（触发浏览器重新计算布局，避免样式未生效）
  forceRedraw(element);

  // 等待ECharts渲染（若存在图表，给足渲染时间）
  if (window.echarts) {
    const charts = element.querySelectorAll(".ec-extension, [data-echarts-instance]");
    if (charts.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  // 等待图片加载（确保图片不空白）
  const images = element.querySelectorAll("img");
  if (images.length > 0) {
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) resolve(null);
            img.onload = resolve;
            img.onerror = resolve;
          })
      )
    );
  }

  // 等待浏览器下一帧渲染（最终确认内容已绘制）
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

/**
 * 强制重绘元素（解决浏览器渲染优化导致的内容空白）
 */
function forceRedraw(element: HTMLElement) {
  const display = element.style.display;
  element.style.display = "none";
  element.offsetHeight; // 触发重排（强制浏览器更新布局）
  element.style.display = display;
}

// 导出函数
export { findParentElement, findParentElementWithClasses };
