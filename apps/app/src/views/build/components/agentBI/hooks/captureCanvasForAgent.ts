import { captureEditorScreenShot } from "../../buildConfig/graphConfig/screenCapture";
import { withCullingSuspended } from "../../buildRender/hooks/cullingSuspend";
import { type Edge, snapToBorders } from "./borderSnap";
import { freezeVideosForCapture } from "./freezeVideos";

/**
 * capture_canvas 工具的前端实现：给主模型截「它要看的那部分画布」。
 *
 * - 不传组件：截整个画布
 * - 1 个组件：直接截它的 `.go-shape-box`——只渲染这棵子树，比整屏快；小组件还能放大渲染，细节更清楚
 * - 多个组件：截整屏后按并集外框裁切，保留它们之间的相对位置和背后的底图
 * - 任意区域：截整屏后按设计稿坐标裁切
 *
 * **图片像素与设计稿像素必须是精确的 scale 倍**：模型从截图读坐标、再按坐标截图，换算差一点它就永远截不准。
 * snapdom 默认有两处会破坏这一点，截图时都关掉：
 * - 按 window.devicePixelRatio 光栅化：浏览器缩放 110% 时整张图凭空多出 1.1 倍 → 固定 dpr: 1
 * - 为根节点的阴影扩大截图范围：画布曾带 box-shadow（0 8px 10px，现已去掉），图的四周会多出一圈（左 10 上 18 右 10 下 26），
 *   裁切原点随之偏移 → outerShadows: false。**注意 snapdom 2.0.1 这个开关与它的类型注释相反**：
 *   源码里 true 才按阴影外扩、false（默认）是剥掉阴影取紧框。曾按注释传 true，整屏截出 1940×1124，所有裁切偏 (10, 18)
 */

const CANVAS_SELECTOR = "#go-chart-edit-content";

/** 编辑器自身的叠加层（选中框、框选、对齐线、网格、事件标记、agent 扫光）不是画面内容，别让模型看到 */
const EDITOR_OVERLAYS = [
  ".sw-transform",
  ".go-edit-select",
  ".alignment-lines-container",
  ".grid-rect",
  ".shape-modal",
  ".editing-scan"
];

/**
 * 组件自己内联在 DOM 里的 <style>（vue 片段会把样式以 `#preview-app-inner-xxx .cls{…}` 的形式注入到
 * 自己的容器里）必须排除：snapdom 已经把计算后的样式内联到每个元素上，截图用不着它；
 * 留着的话，ID 选择器的优先级压过内联结果，含它的那一整棵子树会渲染成全透明——
 * 单组件截图是一张黑图，整屏截图里这个组件则整个消失，agent 就看不到自己刚写的片段。
 */
const INLINE_STYLE_SELECTOR = "style";

/** 实际传给截图的排除列表 */
export const CAPTURE_EXCLUDE = [...EDITOR_OVERLAYS, INLINE_STYLE_SELECTOR];

/** 多组件裁切时四周留的边距（设计稿像素），带一点上下文 */
export const REGION_PADDING = 24;

/** 小区域截图的目标长边：放大渲染到这个量级，模型才看得清文字 */
const DETAIL_TARGET_LONG_EDGE = 1280;
const DETAIL_MAX_SCALE = 2;

export interface CanvasRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AgentCanvasShot {
  file: File;
  width: number;
  height: number;
  /** 截图覆盖的画布区域（设计稿像素）；整屏截图就是整块画布 */
  region: CanvasRegion;
  /** 每 1 设计稿像素对应的图片像素数：图片坐标 = (画布坐标 - region 左上角) × scale */
  scale: number;
  /** 叠了网格时实际用的间距（设计稿像素）；可能比请求的大，见 {@link gridStep} */
  gridStep?: number;
  /** 开了 snap 时，哪些边吸附到了真实边框线上 */
  snapped?: Record<Edge, boolean>;
  missingIds: number[];
}

export interface AgentCaptureRequest {
  componentIds?: number[];
  region?: CanvasRegion;
  /** 叠一层标了画布坐标的网格，给模型读坐标用；要当生图参考图的别加 */
  grid?: boolean;
  /** 网格间距（设计稿像素），不传自动 */
  gridStep?: number;
  /** 只对 region 生效：把四条边吸附到附近的边框线上，region 只需大致框住目标 */
  snap?: boolean;
}

/**
 * 吸附时每条边最多移动多少（设计稿像素）。
 * 用真实底图（电力运维大屏，6 张卡片间隔约 30 像素）实测：每条边偏 60 像素以内都能吸对，
 * 唯一的例外是框画得比卡片**小**一圈、刚好框住卡内一组嵌套的小方块——那时内层本身就是一个合格的矩形。
 * 所以工具描述里让模型宁大勿小。范围再放大会把更远的整屏外框、隔壁卡片都纳进来，没必要
 */
export const SNAP_MARGIN = 64;

/** 按 id 找组件外壳；找不到或当前不可见（v-show 隐藏、动态面板的其他状态）都算缺失 */
export const findComponentElements = (
  canvas: HTMLElement,
  ids: number[]
): { elements: HTMLElement[]; missingIds: number[] } => {
  const elements: HTMLElement[] = [];
  const missingIds: number[] = [];
  for (const id of ids) {
    // 限定在画布内的 .go-shape-box：物料内部可能也有裸数字 id，直接 getElementById 会撞上
    const el = canvas.querySelector<HTMLElement>(`.go-shape-box[id="${id}"]`);
    if (el && el.getClientRects().length > 0) {
      elements.push(el);
    } else {
      missingIds.push(id);
    }
  }
  return { elements, missingIds };
};

/**
 * 一组元素在画布上的并集外框（设计稿像素）。
 * 用 rect 除以画布当前的显示缩放换算回设计稿坐标，与无限画布的相机平移/缩放无关。
 */
export const measureRegion = (canvas: HTMLElement, elements: HTMLElement[], padding = 0): CanvasRegion => {
  const canvasRect = canvas.getBoundingClientRect();
  const zoom = canvas.offsetWidth > 0 ? canvasRect.width / canvas.offsetWidth : 1;

  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const el of elements) {
    const rect = el.getBoundingClientRect();
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  }

  const x = Math.max(0, Math.floor((left - canvasRect.left) / zoom - padding));
  const y = Math.max(0, Math.floor((top - canvasRect.top) / zoom - padding));
  const x2 = Math.min(canvas.offsetWidth, Math.ceil((right - canvasRect.left) / zoom + padding));
  const y2 = Math.min(canvas.offsetHeight, Math.ceil((bottom - canvasRect.top) / zoom + padding));
  return { x, y, width: Math.max(1, x2 - x), height: Math.max(1, y2 - y) };
};

/**
 * 把 agent 要的区域（设计稿像素）收进画布范围内：坐标取整、越界部分裁掉。
 * 与画布完全没有交集（或宽高非正）时返回 null，由调用方报错，别静默截出一张空图。
 */
export const clampRegion = (canvas: HTMLElement, wanted: CanvasRegion): CanvasRegion | null => {
  const left = Math.max(0, Math.floor(wanted.x));
  const top = Math.max(0, Math.floor(wanted.y));
  const right = Math.min(canvas.offsetWidth, Math.ceil(wanted.x + wanted.width));
  const bottom = Math.min(canvas.offsetHeight, Math.ceil(wanted.y + wanted.height));
  if (!(right > left) || !(bottom > top)) {
    return null;
  }
  return { x: left, y: top, width: right - left, height: bottom - top };
};

const NICE_STEPS = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];

/** 相邻网格线在**图片上**至少隔这么多像素，否则刻度标签（如 `x1240`）放不下、互相压住 */
export const MIN_GRID_PX = 48;

/**
 * 网格间距（设计稿像素）。
 *
 * - 不指定：长边大约 10 格，取整到好读的数
 * - 指定了：尽量照用，但不小于 {@link MIN_GRID_PX} 换算出的下限——小区域放大倍数有限，
 *   指定 10 在图上可能只有 20 像素，标签叠成一片，读不出坐标。被调大时取整到好读的数
 *
 * @param scale 每 1 设计稿像素对应的图片像素数
 */
export const gridStep = (region: CanvasRegion, scale: number, requested?: number): number => {
  const minStep = MIN_GRID_PX / scale;
  const wanted = requested && requested > 0 ? requested : Math.max(region.width, region.height) / 10;
  if (requested && requested >= minStep) {
    return requested;
  }
  const floor = Math.max(wanted, minStep);
  return NICE_STEPS.find((step) => step >= floor) ?? NICE_STEPS[NICE_STEPS.length - 1];
};

/** 区域里落在网格上的刻度（画布绝对坐标），从第一个整步长开始，含右/下边界 */
export const gridTicks = (start: number, length: number, step: number): number[] => {
  const ticks: number[] = [];
  for (let t = Math.ceil(start / step) * step; t <= start + length; t += step) {
    ticks.push(t);
  }
  return ticks;
};

const imageSize = async (file: File) => {
  const bitmap = await createImageBitmap(file);
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return size;
};

const toJpeg = async (canvas: HTMLCanvasElement): Promise<File> => {
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("截图编码失败"))), "image/jpeg", 0.92)
  );
  return new File([blob], "screenshot.jpg", { type: "image/jpeg" });
};

/** 从整屏截图里裁出一块。整屏是按 dpr 1、不外扩阴影渲染的，图片像素 = 设计稿像素 × scale，直接换算 */
const cropShot = async (file: File, region: CanvasRegion, scale: number): Promise<File> => {
  const bitmap = await createImageBitmap(file);
  const out = document.createElement("canvas");
  out.width = Math.round(region.width * scale);
  out.height = Math.round(region.height * scale);
  out
    .getContext("2d")
    ?.drawImage(
      bitmap,
      region.x * scale,
      region.y * scale,
      region.width * scale,
      region.height * scale,
      0,
      0,
      out.width,
      out.height
    );
  bitmap.close();
  return toJpeg(out);
};

/**
 * 在截图上叠一层坐标网格，刻度标的是**画布上的绝对坐标**（设计稿像素），不是图片像素。
 * 模型直接读刻度就能写出 region，不受「图片被服务商缩放」「截的只是局部」这些因素影响。
 */
const overlayGrid = async (
  file: File,
  region: CanvasRegion,
  scale: number,
  requestedStep?: number
): Promise<{ file: File; step: number }> => {
  const step = gridStep(region, scale, requestedStep);
  const bitmap = await createImageBitmap(file);
  const out = document.createElement("canvas");
  out.width = bitmap.width;
  out.height = bitmap.height;
  const ctx = out.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { file, step };
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  // 字号跟着线距走：标签约 5 个字符宽（≈ 3 × 字号），要放得进两条线之间
  const fontSize = Math.min(24, Math.max(12, Math.floor((step * scale - 10) / 3)));
  ctx.lineWidth = Math.max(1, Math.round(scale));
  ctx.strokeStyle = "rgba(255, 0, 200, 0.6)";
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textBaseline = "top";

  const label = (text: string, x: number, y: number) => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(x, y, ctx.measureText(text).width + 6, fontSize + 4);
    ctx.fillStyle = "#ffff00";
    ctx.fillText(text, x + 3, y + 2);
  };
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  // 正好落在右/下边界上的刻度画出来在图外（宽 400 的图最后一列是 399），不画
  const xs = gridTicks(region.x, region.width, step)
    .map((gx) => ({ gx, px: Math.round((gx - region.x) * scale) }))
    .filter(({ px }) => px < out.width);
  const ys = gridTicks(region.y, region.height, step)
    .map((gy) => ({ gy, py: Math.round((gy - region.y) * scale) }))
    .filter(({ py }) => py < out.height);

  // 区域左上角正好压在两条网格线上时，x / y 两个标签都会画在 (2,2) 互相盖住，合成一个
  const cornerY = ys[0]?.py === 0 ? ys[0].gy : undefined;
  for (const { gx, px } of xs) {
    line(px, 0, px, out.height);
    label(px === 0 && cornerY !== undefined ? `x${gx} y${cornerY}` : `x${gx}`, px + 2, 2);
  }
  for (const { gy, py } of ys) {
    line(0, py, out.width, py);
    if (!(py === 0 && xs[0]?.px === 0)) {
      label(`y${gy}`, 2, py + 2);
    }
  }
  return { file: await toJpeg(out), step };
};

/** 画布底色：单组件截图截不到画布背景，透明处用它填，比 JPEG 默认的黑底更接近实际观感 */
const canvasBackground = (canvas: HTMLElement): string | undefined => {
  const color = getComputedStyle(canvas).backgroundColor;
  return color && color !== "transparent" && color !== "rgba(0, 0, 0, 0)" ? color : undefined;
};

const shoot = async (target: HTMLElement, scale: number, backgroundColor?: string): Promise<File> => {
  // snapdom 画不出 video 的画面（视频组件会是一块黑），截图前先把视频换成当前帧，截完还原
  const restoreVideos = await freezeVideosForCapture(target);
  try {
    const shot = await captureEditorScreenShot({
      screenShotMode: "simple",
      canvas: target,
      mimeType: "image/jpeg",
      exclude: CAPTURE_EXCLUDE,
      scale,
      backgroundColor,
      dpr: 1,
      outerShadows: false
    });
    if (!shot) {
      throw new Error("截图失败");
    }
    return shot.file;
  } finally {
    restoreVideos();
  }
};

/** 小区域放大渲染：长边凑到 DETAIL_TARGET_LONG_EDGE，最多 DETAIL_MAX_SCALE 倍 */
const detailScale = (region: CanvasRegion) =>
  Math.min(DETAIL_MAX_SCALE, Math.max(1, DETAIL_TARGET_LONG_EDGE / Math.max(region.width, region.height)));

/** 截整屏后按区域裁切；scale > 1 时整屏按更高倍率渲染，小区域裁出来文字才看得清 */
const captureRegion = async (canvas: HTMLElement, region: CanvasRegion, scale: number) =>
  cropShot(await shoot(canvas, scale), region, scale);

const readPixels = async (file: File) => {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("无法读取截图像素");
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

/**
 * 按「大致框」截图并把四条边吸附到真实边框线上（见 borderSnap）。
 * 先把框四周各放宽 {@link SNAP_MARGIN} 截一张，在这张图的像素上找线，再从里面裁出吸附后的区域。
 */
const captureSnapped = async (canvas: HTMLElement, rough: CanvasRegion, scale: number) => {
  const outer =
    clampRegion(canvas, {
      x: rough.x - SNAP_MARGIN,
      y: rough.y - SNAP_MARGIN,
      width: rough.width + SNAP_MARGIN * 2,
      height: rough.height + SNAP_MARGIN * 2
    }) ?? rough;
  const shot = await captureRegion(canvas, outer, scale);

  const toPx = (v: number, origin: number) => Math.round((v - origin) * scale);
  const { box, snapped } = snapToBorders(
    await readPixels(shot),
    {
      left: toPx(rough.x, outer.x),
      top: toPx(rough.y, outer.y),
      right: toPx(rough.x + rough.width, outer.x) - 1,
      bottom: toPx(rough.y + rough.height, outer.y) - 1
    },
    // 往两侧看 6 个设计稿像素：边框线连发光一般不超过这个宽度
    { maxShift: Math.round(SNAP_MARGIN * scale), ridgeReach: Math.ceil(6 * scale) }
  );

  // 像素框换回设计稿坐标：向外取整，宁可多一像素也别把线切掉
  const x = outer.x + Math.floor(box.left / scale);
  const y = outer.y + Math.floor(box.top / scale);
  const region = {
    x,
    y,
    width: outer.x + Math.ceil((box.right + 1) / scale) - x,
    height: outer.y + Math.ceil((box.bottom + 1) / scale) - y
  };
  const file = await cropShot(
    shot,
    { x: region.x - outer.x, y: region.y - outer.y, width: region.width, height: region.height },
    scale
  );
  return { file, region, snapped };
};

/** 统一收尾：按需叠网格，量出最终尺寸 */
const finish = async (
  file: File,
  region: CanvasRegion,
  scale: number,
  request: AgentCaptureRequest,
  missingIds: number[]
): Promise<AgentCanvasShot> => {
  if (!request.grid) {
    return { file, ...(await imageSize(file)), region, scale, missingIds };
  }
  const withGrid = await overlayGrid(file, region, scale, request.gridStep);
  return {
    file: withGrid.file,
    ...(await imageSize(withGrid.file)),
    region,
    scale,
    gridStep: withGrid.step,
    missingIds
  };
};

/** 截图期间暂停画布裁剪：要量 DOM 的组件不能是 display: none 的 */
export function captureCanvasForAgent(request: AgentCaptureRequest = {}): Promise<AgentCanvasShot> {
  return withCullingSuspended(() => captureCanvasForAgentUncovered(request));
}

async function captureCanvasForAgentUncovered(request: AgentCaptureRequest): Promise<AgentCanvasShot> {
  const { componentIds, region: wantedRegion } = request;
  const canvas = document.querySelector<HTMLElement>(CANVAS_SELECTOR);
  if (!canvas) {
    throw new Error("未找到编辑器画布");
  }

  // 任意位置：不依赖某个组件，直接按设计稿坐标裁
  if (wantedRegion && !componentIds?.length) {
    const region = clampRegion(canvas, wantedRegion);
    if (!region) {
      throw new Error(
        `截图区域在画布之外：画布是 ${canvas.offsetWidth}×${canvas.offsetHeight}，` +
          `收到 x=${wantedRegion.x} y=${wantedRegion.y} w=${wantedRegion.width} h=${wantedRegion.height}`
      );
    }
    const scale = detailScale(region);
    if (request.snap) {
      const snappedShot = await captureSnapped(canvas, region, scale);
      return {
        ...(await finish(snappedShot.file, snappedShot.region, scale, request, [])),
        snapped: snappedShot.snapped
      };
    }
    return finish(await captureRegion(canvas, region, scale), region, scale, request, []);
  }

  if (!componentIds?.length) {
    const region = { x: 0, y: 0, width: canvas.offsetWidth, height: canvas.offsetHeight };
    return finish(await shoot(canvas, 1), region, 1, request, []);
  }

  const { elements, missingIds } = findComponentElements(canvas, componentIds);
  if (elements.length === 0) {
    throw new Error(`画布上找不到这些组件，或它们当前不可见：${missingIds.join("、")}`);
  }

  if (elements.length === 1) {
    const region = measureRegion(canvas, elements);
    const scale = detailScale(region);
    const file = await shoot(elements[0], scale, canvasBackground(canvas));
    return finish(file, region, scale, request, missingIds);
  }

  const region = measureRegion(canvas, elements, REGION_PADDING);
  return finish(await captureRegion(canvas, region, 1), region, 1, request, missingIds);
}
