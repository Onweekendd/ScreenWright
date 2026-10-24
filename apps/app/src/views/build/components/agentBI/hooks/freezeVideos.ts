/**
 * 截图前把画布上的 <video> 换成「当前这一帧」的静态图，截完再还原。
 *
 * capture_canvas 用 snapdom 截图（把 DOM 序列化进 SVG foreignObject 再光栅化），而 snapdom 不会把 video 的
 * 画面画进去——视频组件在截图里是一块纯黑，agent 因此看不到动态背景 / 视频组件长什么样（实测三个视频组件全黑）。
 * 编辑器自带的「完整截图」模式有一整套视频抓帧策略，agent 用的是更轻的 simple 模式，没有走那套，这里补上。
 *
 * 做法：对每个可见的 video 抓一帧（复用编辑器已有的 `CorsMediaFallback.captureFrameFromVideoElement`：
 * 取它当前播放的地址，拉成 blob 再离屏抓帧，不受跨域污染画布的限制），在 video 旁边放一张同位置、同大小的 img，
 * 并把 video 临时设为 visibility:hidden。不替换 video 节点本身——截图要一两秒，期间 Vue 可能还在 patch，
 * 动它的节点比加一个兄弟节点风险大。
 */

/** 抓一帧，返回 data URL；抓不到返回 null（那个视频就保持原样，不影响其他的） */
export type GrabVideoFrame = (video: HTMLVideoElement) => Promise<string | null>;

const defaultGrab: GrabVideoFrame = async (video) => {
  // 只有真有视频时才加载抓帧模块：它带一串编辑器依赖，没视频的截图不该为它付出代价
  const { CorsMediaFallback } = await import("../../buildConfig/graphConfig/screenCapture/corsMediaFallback");
  return CorsMediaFallback.captureFrameFromVideoElement(video);
};

const isVisible = (el: HTMLElement) => el.getClientRects().length > 0;

/** 抓帧最多等多久：单个视频卡住不能拖住整次截图 */
const GRAB_TIMEOUT_MS = 8000;

const withTimeout = <T>(promise: Promise<T>, fallback: T): Promise<T> =>
  Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), GRAB_TIMEOUT_MS))]);

/** 在 video 旁边放一张同位置、同大小、同裁切方式的静态帧 */
const placeFrame = (video: HTMLVideoElement, dataUrl: string): HTMLImageElement => {
  const style = getComputedStyle(video);
  const img = document.createElement("img");
  img.src = dataUrl;
  img.alt = "";
  img.setAttribute("data-capture-video-frame", "");
  Object.assign(img.style, {
    position: "absolute",
    // offsetLeft/Top 相对 offsetParent，img 与 video 是兄弟，包含块相同，位置一致
    left: `${video.offsetLeft}px`,
    top: `${video.offsetTop}px`,
    width: `${video.offsetWidth}px`,
    height: `${video.offsetHeight}px`,
    margin: "0",
    padding: "0",
    border: style.border,
    objectFit: style.objectFit,
    objectPosition: style.objectPosition,
    borderRadius: style.borderRadius,
    opacity: style.opacity,
    mixBlendMode: style.mixBlendMode,
    filter: style.filter,
    transform: style.transform,
    transformOrigin: style.transformOrigin,
    zIndex: style.zIndex,
    pointerEvents: "none"
  });
  video.insertAdjacentElement("afterend", img);
  return img;
};

/**
 * 冻结 root 下所有可见 video，返回还原函数（务必在 finally 里调）。
 * 某个视频抓帧失败不抛错，只是那一个仍然是黑的。
 */
export async function freezeVideosForCapture(
  root: HTMLElement,
  grab: GrabVideoFrame = defaultGrab
): Promise<() => void> {
  const videos = Array.from(root.querySelectorAll("video")).filter(isVisible);
  const restores: Array<() => void> = [];

  await Promise.all(
    videos.map(async (video) => {
      const dataUrl = await withTimeout(
        grab(video).catch(() => null),
        null
      );
      if (!dataUrl) {
        return;
      }
      const img = placeFrame(video, dataUrl);
      const previousVisibility = video.style.visibility;
      video.style.visibility = "hidden";
      restores.push(() => {
        img.remove();
        video.style.visibility = previousVisibility;
      });
      // 等图解码完再截：snapdom 序列化时图还没就绪会画成空白
      await Promise.resolve(img.decode?.()).catch(() => undefined);
    })
  );

  return () => restores.forEach((restore) => restore());
}
