import type { SnapdomPlugin } from "@zumer/snapdom";

const IMAGE_TIMEOUT_MS = 45_000;

async function imageDataUrl(image: HTMLImageElement | undefined, url: string): Promise<string> {
  // Reuse decoded pixels: snapdom otherwise downloads even same-origin images again
  // with a 3-second timeout, replacing large images with a grey "img" placeholder.
  if (image?.complete && image.naturalWidth > 0) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(image, 0, 0);
        const data = canvas.toDataURL("image/png");
        if (data.startsWith("data:image/")) {
          return data;
        }
      }
    } catch {
      // Cross-origin pixels may be tainted; try a CORS fetch instead.
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("图片读取失败"));
      reader.readAsDataURL(blob);
    });
  } catch {
    throw new Error("截图中的图片加载失败，请等待图片加载完成后重试");
  } finally {
    clearTimeout(timer);
  }
}

/** Embed resources only in the detached clone; leave Vue's live DOM untouched. */
export function inlineCaptureImages(): SnapdomPlugin {
  return {
    name: "screenwright-inline-capture-images",
    async afterClone({ element, clone }) {
      if (!clone) {
        return;
      }
      const originals = new Map<string, HTMLImageElement>();
      const liveImages = Array.from(element.querySelectorAll("img"));
      if (element instanceof HTMLImageElement) {
        liveImages.unshift(element);
      }
      for (const image of liveImages) {
        originals.set(image.src, image);
        if (image.currentSrc) {
          originals.set(image.currentSrc, image);
        }
      }
      const images = Array.from(clone.querySelectorAll("img"));
      if (clone instanceof HTMLImageElement) {
        images.unshift(clone);
      }
      const pending = new Map<string, Promise<string>>();
      await Promise.all(images.map(async (image) => {
        const source = image.src;
        if (!source || source.startsWith("data:")) {
          return;
        }
        const original = originals.get(source);
        const url = original?.currentSrc || source;
        let data = pending.get(url);
        if (!data) {
          data = imageDataUrl(original, url);
          pending.set(url, data);
        }
        image.src = await data;
        image.removeAttribute("srcset");
        image.removeAttribute("sizes");
      }));
    }
  };
}
