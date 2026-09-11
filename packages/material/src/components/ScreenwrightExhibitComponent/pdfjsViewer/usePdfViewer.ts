import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import type { CSSProperties } from "vue";
import { computed, nextTick, onMounted, ref, watch } from "vue";

export const usePdfViewer = (options: ComponentType) => {
  const { width, height, option, dataChart } = useBaseData(options);

  const total = ref<number>(1);
  const current = ref<number>(1);
  const zoomScale = ref<number>(1);
  const viewerAll = ref<HTMLDivElement | null>(null);
  const viewer = ref<HTMLDivElement | null>(null);
  const pdfCanvas = ref<HTMLCanvasElement | null>(null);
  let pdfDoc: any = null;
  let loadSeq = 0;
  let renderTask: { cancel: () => void; promise: Promise<void> } | null = null;
  let suppressPageWatch = false;

  const viewerBackground = computed<CSSProperties>(() => {
    return {
      backgroundColor: option.value.backgroundColor,
    };
  });

  const pageStyle = computed<CSSProperties>(() => {
    return {
      color: option.value.fontColor,
      fontSize: `${option.value.fontSize || 16}px`,
      fontWeight: option.value.fontWeight,
      fontFamily: option.value.fontFamily,
      fontStyle: option.value.fontStyle,
      transform: `translate(${option.value.textTranslateX || 0}px, ${option.value.textTranslateY || 0}px)`,
      backgroundColor: option.value.backgroundColor,
    };
  });

  const viewBoxStyle = computed(() => {
    return {
      width: width.value + "px",
      height: height.value + "px",
      overflow: "auto",
    };
  });

  const clearCanvas = async () => {
    await nextTick();
    if (viewerAll.value === null || pdfCanvas.value === null) {
      return;
    }
    if (option.value.showAll) {
      viewerAll.value.replaceChildren();
    } else {
      const ctx = pdfCanvas.value.getContext("2d");
      if (ctx === null) {
        return;
      }
      ctx.clearRect(0, 0, width.value, height.value);
    }
  };

  const cancelRenderTask = () => {
    if (renderTask) {
      renderTask.cancel();
      renderTask = null;
    }
  };

  const renderPages = async () => {
    if (!pdfDoc) {
      return;
    }

    cancelRenderTask();

    if (option.value.showAll) {
      if (viewerAll.value === null) {
        return;
      }
      viewerAll.value.replaceChildren();
      const len = [...Array(total.value).keys()];
      for (const index of len) {
        const canvas = document.createElement("canvas");
        viewerAll.value.appendChild(canvas);
        const currentPage = index + 1;
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale: 1 });
        // 设置缩放比例 - 宽度为准
        zoomScale.value = width.value / viewport.width;
        const viewportScale = page.getViewport({ scale: zoomScale.value });
        const context = canvas.getContext("2d");
        canvas.id = "page_" + currentPage;
        canvas.style.marginBottom = "10px";
        canvas.width = viewportScale.width;
        canvas.height = viewportScale.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewportScale,
        };
        await page.render(renderContext).promise;
      }
      return;
    }

    if (pdfCanvas.value === null) {
      return;
    }

    const page = await pdfDoc.getPage(current.value);
    const viewport = page.getViewport({ scale: 1 });
    // 设置缩放比例 - 宽度为准
    zoomScale.value = width.value / viewport.width;
    const viewportScale = page.getViewport({ scale: zoomScale.value });
    const canvas = pdfCanvas.value;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    canvas.width = viewportScale.width;
    canvas.height = viewportScale.height;

    const renderContext = {
      canvasContext: context,
      viewport: viewportScale,
    };
    const task = page.render(renderContext);
    renderTask = task;
    await task.promise;
    renderTask = null;
  };

  const setScrollPage = async () => {
    await nextTick();
    if (viewerAll.value === null) {
      return;
    }
    const scrollPage = viewerAll.value.querySelector("#page_" + current.value);
    if (scrollPage === null) {
      return;
    }
    scrollPage.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  };

  /** dataChart 可能是数组 [{ url }] 或直接对象 { url } */
  const resolveDataChartUrl = (chart: unknown): string | undefined => {
    if (chart == null) {
      return undefined;
    }
    if (Array.isArray(chart)) {
      const first = chart[0];
      if (first != null && typeof first === "object" && "url" in first) {
        const url = (first as { url?: unknown }).url;
        return typeof url === "string" ? url : undefined;
      }
      return undefined;
    }
    if (typeof chart === "object" && "url" in chart) {
      const url = (chart as { url?: unknown }).url;
      return typeof url === "string" ? url : undefined;
    }
    return undefined;
  };

  const loadPdf = async () => {
    const seq = ++loadSeq;
    const dataUrl = resolveDataChartUrl(dataChart.value);
    const hasDataUrl = Boolean(dataUrl);
    const PDFURL = hasDataUrl
      ? setMinioUrl(dataUrl!)
      : setMinioUrl(option.value.pdfUrl);

    if (!PDFURL) {
      cancelRenderTask();
      pdfDoc = null;
      await clearCanvas();
      return;
    }

    const pdfjsLib = (window as any).pdfjsLib;
    if (!pdfjsLib) {
      return;
    }

    try {
      cancelRenderTask();
      const loadingTask = pdfjsLib.getDocument(PDFURL);
      const doc = await loadingTask.promise;
      if (seq !== loadSeq) {
        return;
      }

      pdfDoc = doc;
      total.value = pdfDoc.numPages || 0;

      suppressPageWatch = true;
      if (option.value.current <= total.value) {
        current.value = option.value.current || 1;
      } else {
        current.value = 1;
      }
      suppressPageWatch = false;

      await renderPages();
    } catch (error) {
      if (seq === loadSeq) {
        console.error("PDF加载失败:", error);
      }
    }
  };

  const handlePageChange = async (currentPage: number) => {
    current.value = currentPage;
    await renderPages();
    setScrollPage();
  };

  const changePage = (type: string, value?: number) => {
    switch (type) {
      case "prev":
        if (current.value > 1) {
          current.value--;
        }
        break;
      case "next":
        if (current.value < total.value) {
          current.value++;
        }
        break;
      case "zoomOut":
        if (option.value.zoomValue < 0) {
          return;
        }
        option.value.zoomValue = parseFloat(
          (option.value.zoomValue - 0.2).toFixed(1),
        );
        break;
      case "zoomIn":
        option.value.zoomValue = parseFloat(
          (option.value.zoomValue + 0.2).toFixed(1),
        );
        break;
      default:
        if (value && value <= total.value) {
          current.value = value;
        }
        break;
    }
  };

  // 监听 showAll 变化
  watch(
    () => option.value.showAll,
    () => {
      renderPages();
    },
  );

  // 监听配置中的 current 变化
  watch(
    () => option.value.current,
    () => {
      if (option.value.current <= total.value) {
        current.value = option.value.current;
        renderPages();
        setScrollPage();
      }
    },
  );

  // 监听当前页码变化
  watch(
    () => current.value,
    (v) => {
      if (suppressPageWatch) {
        return;
      }
      if (v > total.value) {
        current.value = total.value;
        return;
      }
      if (option.value.showAll) {
        setScrollPage();
      } else {
        void renderPages();
      }
    },
  );

  // 监听 PDF URL 变化
  watch(
    () => option.value.pdfUrl,
    (v) => {
      if (resolveDataChartUrl(dataChart.value)) {
        return;
      }
      suppressPageWatch = true;
      current.value = 1;
      suppressPageWatch = false;
      if (v) {
        void loadPdf();
      } else {
        void clearCanvas();
      }
    },
  );

  // 监听宽度变化
  watch(
    () => width.value,
    () => {
      renderPages();
    },
  );

  // 监听高度变化
  watch(
    () => height.value,
    () => {
      renderPages();
    },
  );

  // 仅监听 dataChart 中的 url 变化，避免无关数据变动触发重复渲染
  watch(
    () => resolveDataChartUrl(dataChart.value),
    (url, oldUrl) => {
      if (url === oldUrl) {
        return;
      }
      suppressPageWatch = true;
      current.value = 1;
      suppressPageWatch = false;
      void loadPdf();
    },
  );

  // 初始化加载
  onMounted(() => {
    if ((window as any).pdfjsLib) {
      loadPdf();
    }
  });

  return {
    width,
    height,
    current,
    total,
    zoomScale,
    viewerBackground,
    option,
    pageStyle,
    viewBoxStyle,
    viewerAll,
    viewer,
    pdfCanvas,
    changePage,
    handlePageChange,
    loadPdf,
    renderPages,
    clearCanvas,
    setScrollPage,
  };
};

/**
 * 从 PDF 中获取指定页面的图片 URL
 * @param pdfUrl - PDF 文件 URL
 * @param pageNumber - 页码（从 1 开始）
 * @param options - 可选配置
 * @returns Promise<string> 返回图片的 Data URL 或 Blob URL
 */
export const getPdfPageAsImage = async (
  pdfUrl: string,
  pageNumber: number,
  options?: {
    scale?: number; // 缩放比例，默认为 1
    imageType?: "png" | "jpeg"; // 图片类型，默认为 png
    quality?: number; // 图片质量（仅 jpeg），0-1，默认 0.92
    outputType?: "dataUrl" | "blobUrl"; // 输出类型，默认 dataUrl
    maxWidth?: number; // 最大宽度，会自动计算 scale
  },
): Promise<string> => {
  const {
    scale = 1,
    imageType = "png",
    quality = 0.92,
    outputType = "dataUrl",
    maxWidth,
  } = options || {};

  // 确保 PDF.js 已加载
  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) {
    throw new Error("PDF.js 未加载，请确保已引入 PDF.js 库");
  }

  try {
    // 处理 URL
    const url = setMinioUrl(pdfUrl);

    // 加载 PDF 文档
    const loadingTask = pdfjsLib.getDocument(url);
    const pdfDocument = await loadingTask.promise;

    // 检查页码是否有效
    if (pageNumber < 1 || pageNumber > pdfDocument.numPages) {
      throw new Error(
        `页码 ${pageNumber} 无效，PDF 共有 ${pdfDocument.numPages} 页`,
      );
    }

    // 获取指定页面
    const page = await pdfDocument.getPage(pageNumber);

    // 获取视口
    const viewport = page.getViewport({ scale: 1 });

    // 计算实际缩放比例
    let actualScale = scale;
    if (maxWidth && viewport.width * scale > maxWidth) {
      actualScale = maxWidth / viewport.width;
    }

    const scaledViewport = page.getViewport({ scale: actualScale });

    // 创建临时 canvas
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("无法创建 Canvas 上下文");
    }

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    // 渲染页面
    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport,
    };

    await page.render(renderContext).promise;

    // 转换为图片 URL
    if (outputType === "blobUrl") {
      return new Promise<string>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const blobUrl = URL.createObjectURL(blob);
              resolve(blobUrl);
            } else {
              reject(new Error("无法创建 Blob"));
            }
          },
          `image/${imageType}`,
          imageType === "jpeg" ? quality : undefined,
        );
      });
    } else {
      // dataUrl
      const mimeType = imageType === "jpeg" ? "image/jpeg" : "image/png";
      return canvas.toDataURL(
        mimeType,
        imageType === "jpeg" ? quality : undefined,
      );
    }
  } catch (error) {
    console.error("获取 PDF 页面图片失败:", error);
    throw error;
  }
};

/**
 * 批量获取 PDF 多个页面的图片 URL
 * @param pdfUrl - PDF 文件 URL
 * @param pageNumbers - 页码数组（从 1 开始）
 * @param options - 可选配置
 * @returns Promise<string[]> 返回图片 URL 数组
 */
export const getPdfPagesAsImages = async (
  pdfUrl: string,
  pageNumbers: number[],
  options?: {
    scale?: number;
    imageType?: "png" | "jpeg";
    quality?: number;
    outputType?: "dataUrl" | "blobUrl";
    maxWidth?: number;
  },
): Promise<string[]> => {
  const results: string[] = [];

  for (const pageNumber of pageNumbers) {
    try {
      const imageUrl = await getPdfPageAsImage(pdfUrl, pageNumber, options);
      results.push(imageUrl);
    } catch (error) {
      console.error(`获取第 ${pageNumber} 页失败:`, error);
      results.push(""); // 失败时推入空字符串
    }
  }

  return results;
};
