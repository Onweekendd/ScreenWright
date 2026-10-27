import { afterEach, describe, expect, it, vi } from "vitest";

import { inlineCaptureImages } from "@/views/build/components/buildConfig/graphConfig/screenCapture/inlineCaptureImages";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it("直接复用已解码图片，只修改截图副本，不重新下载原图", async () => {
  const element = document.createElement("div");
  element.innerHTML = '<img src="https://assets.example.com/large.png" srcset="large.png 2x" sizes="100vw">';
  const image = element.querySelector("img")!;
  Object.defineProperties(image, {
    complete: { value: true },
    naturalWidth: { value: 1000 },
    naturalHeight: { value: 600 }
  });
  const clone = element.cloneNode(true) as HTMLElement;
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn()
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,AAA");
  await inlineCaptureImages().afterClone!({ element, clone });
  expect(clone.querySelector("img")!.src).toBe("data:image/png;base64,AAA");
  expect(clone.querySelector("img")!.hasAttribute("srcset")).toBe(false);
  expect(image.src).toBe("https://assets.example.com/large.png");
  expect(image.hasAttribute("srcset")).toBe(true);
  expect(fetch).not.toHaveBeenCalled();
});

describe("截图图片下载超时", () => {
  it("超过三秒仍继续等待，四十五秒后明确报错，不生成灰色占位截图", async () => {
    vi.useFakeTimers();
    const element = document.createElement("div");
    element.innerHTML = '<img src="https://assets.example.com/large.png">';
    const clone = element.cloneNode(true) as HTMLElement;
    let signal: AbortSignal;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url, options) =>
          new Promise((_resolve, reject) => {
            signal = options.signal;
            signal.addEventListener("abort", () => reject(new Error("aborted")));
          })
      )
    );
    const capture = inlineCaptureImages().afterClone!({ element, clone });
    const rejected = expect(capture).rejects.toThrow("截图中的图片加载失败");
    await vi.advanceTimersByTimeAsync(3001);
    expect(signal!.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(42000);
    await rejected;
  });
});
