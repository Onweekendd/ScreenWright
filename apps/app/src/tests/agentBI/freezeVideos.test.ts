import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { freezeVideosForCapture } from "@/views/build/components/agentBI/hooks/capture/freezeVideos";

/**
 * jsdom 不做布局：getClientRects 恒为空、offsetLeft/Width 全是 0。
 * 这里按「屏幕上的真实布局」手动钉住，断言的是换上去那张静态帧的位置、大小和还原行为。
 */
const buildVideo = ({ visible = true, left = 40, top = 20, width = 480, height = 270 } = {}) => {
  const root = document.createElement("div");
  const video = document.createElement("video");
  video.style.objectFit = "cover";
  root.appendChild(video);
  document.body.appendChild(root);
  video.getClientRects = () => (visible ? ([{}] as unknown as DOMRectList) : ([] as unknown as DOMRectList));
  for (const [key, value] of Object.entries({
    offsetLeft: left,
    offsetTop: top,
    offsetWidth: width,
    offsetHeight: height
  })) {
    Object.defineProperty(video, key, { value });
  }
  return { root, video };
};

const frames = () => document.querySelectorAll("img[data-capture-video-frame]");

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.useRealTimers();
});

describe("freezeVideosForCapture", () => {
  it("可见的视频：在它旁边放一张同位置、同大小、同裁切方式的当前帧，视频本身隐藏", async () => {
    const { root, video } = buildVideo();

    await freezeVideosForCapture(root, async () => "data:image/png;base64,AAA");

    const [frame] = Array.from(frames()) as HTMLImageElement[];
    expect(frame.src).toBe("data:image/png;base64,AAA");
    expect(frame.previousElementSibling).toBe(video);
    expect(frame.style).toMatchObject({
      position: "absolute",
      left: "40px",
      top: "20px",
      width: "480px",
      height: "270px"
    });
    expect(frame.style.objectFit).toBe("cover");
    expect(video.style.visibility).toBe("hidden");
  });

  it("还原：静态帧移除，视频的原有 visibility 写回（没写过的恢复成空）", async () => {
    const { root, video } = buildVideo();
    video.style.visibility = "visible";
    const restore = await freezeVideosForCapture(root, async () => "data:image/png;base64,AAA");
    expect(video.style.visibility).toBe("hidden");

    restore();

    expect(frames()).toHaveLength(0);
    expect(video.style.visibility).toBe("visible");
  });

  it("看不见的视频（display:none、被裁剪的组件）不抓帧", async () => {
    const { root } = buildVideo({ visible: false });
    const grab = vi.fn(async () => "data:image/png;base64,AAA");

    await freezeVideosForCapture(root, grab);

    expect(grab).not.toHaveBeenCalled();
    expect(frames()).toHaveLength(0);
  });

  it("某个视频抓不到帧（返回 null 或抛错）：只有它保持原样，其他视频照常冻结", async () => {
    const root = document.createElement("div");
    const videos = [buildVideo(), buildVideo(), buildVideo()].map(({ root: r, video }) => {
      root.appendChild(r);
      return video;
    });
    document.body.appendChild(root);
    videos.forEach((v, i) => v.setAttribute("data-i", String(i)));

    await freezeVideosForCapture(root, async (video) => {
      const i = video.getAttribute("data-i");
      if (i === "0") {
        return null;
      }
      if (i === "1") {
        throw new Error("跨域");
      }
      return "data:image/png;base64,OK";
    });

    expect(frames()).toHaveLength(1);
    expect(videos[0].style.visibility).toBe("");
    expect(videos[1].style.visibility).toBe("");
    expect(videos[2].style.visibility).toBe("hidden");
  });

  it("多个视频并行抓帧，不是一个等一个", async () => {
    const root = document.createElement("div");
    for (let i = 0; i < 3; i++) {
      root.appendChild(buildVideo().root);
    }
    document.body.appendChild(root);
    let started = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));

    const pending = freezeVideosForCapture(root, async () => {
      started += 1;
      await gate;
      return "data:image/png;base64,AAA";
    });
    // 这版 vitest 没有 vi.waitFor：让出一轮事件循环，已经发出的 grab 都会走到 await gate
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(started).toBe(3);
    release();
    await pending;

    expect(frames()).toHaveLength(3);
  });

  it("抓帧卡住不拖住整次截图：8 秒后放弃，这个视频保持原样", async () => {
    vi.useFakeTimers();
    const { root, video } = buildVideo();

    const pending = freezeVideosForCapture(root, () => new Promise<string | null>(() => undefined));
    await vi.advanceTimersByTimeAsync(8000);
    await pending;

    expect(frames()).toHaveLength(0);
    expect(video.style.visibility).toBe("");
  });

  it("没有视频时什么都不做，还原函数也能安全调用", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);

    const restore = await freezeVideosForCapture(root, vi.fn());

    expect(() => restore()).not.toThrow();
  });
});
