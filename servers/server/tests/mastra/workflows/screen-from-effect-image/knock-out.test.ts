import { existsSync, readFileSync, writeFileSync } from "node:fs";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  colorToAlpha,
  estimateBackgroundColor,
  knockOutBackground
} from "@/mastra/workflows/screen-from-effect-image/steps/knock-out";

/** 底色 (10,20,40) 的 40×40 图，中间 10×10 是亮青色，(5,5) 是比底色略亮的"半透明填充" */
const makeImage = async (): Promise<Buffer> => {
  const w = 40;
  const h = 40;
  const raw = Buffer.alloc(w * h * 3);
  for (let p = 0; p < w * h; p += 1) {
    const x = p % w;
    const y = Math.floor(p / w);
    const inside = x >= 15 && x < 25 && y >= 15 && y < 25;
    const tint = x >= 3 && x < 8 && y >= 3 && y < 8;
    const [r, g, b] = inside ? [0, 220, 255] : tint ? [40, 60, 100] : [10, 20, 40];
    raw[p * 3] = r;
    raw[p * 3 + 1] = g;
    raw[p * 3 + 2] = b;
  }
  return sharp(raw, { raw: { width: w, height: h, channels: 3 } })
    .png()
    .toBuffer();
};

describe("knock-out", () => {
  it("底色估成整图中位色（亮块只占一小部分，不影响中位数）", async () => {
    const { data, info } = await sharp(await makeImage())
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(estimateBackgroundColor(data, info.width, info.height, info.channels)).toEqual([10, 20, 40]);
  });

  it("colorToAlpha：等于底色全透，远离底色不透且颜色反预乘，微小差异被噪声门拦住", () => {
    expect(colorToAlpha([10, 20, 40], [10, 20, 40]).alpha).toBe(0);
    const bright = colorToAlpha([0, 220, 255], [10, 20, 40]);
    expect(bright.alpha).toBeCloseTo(1, 1);
    expect(bright.rgb[1]).toBeGreaterThan(200);
    expect(colorToAlpha([14, 26, 48], [10, 20, 40]).alpha).toBe(0);
    // 比底色暗只可能是斜切角外面的黑或填充的暗斑，一律透明
    expect(colorToAlpha([0, 0, 0], [10, 20, 40]).alpha).toBe(0);
    const tint = colorToAlpha([40, 60, 100], [10, 20, 40]);
    expect(tint.alpha).toBeGreaterThan(0.05);
    expect(tint.alpha).toBeLessThan(0.3);
  });

  it("整图抠底：角落全透、亮块不透、略亮填充半透", async () => {
    const out = await knockOutBackground(await makeImage());
    const { data, info } = await sharp(out).raw().toBuffer({ resolveWithObject: true });
    expect(info.channels).toBe(4);
    const alphaAt = (x: number, y: number) => data[(y * info.width + x) * 4 + 3];
    expect(alphaAt(0, 0)).toBe(0);
    expect(alphaAt(39, 39)).toBe(0);
    expect(alphaAt(20, 20)).toBeGreaterThan(240);
    expect(alphaAt(5, 5)).toBeGreaterThan(10);
    expect(alphaAt(5, 5)).toBeLessThan(90);
  });

  // 本地有 screen_23 那批生成图时顺手出一张预览到 scratchpad，人眼看抠得干不干净（CI 上没有这些文件，跳过）
  const sample = "blob-storage/generated-images/48298cf1e3b5be183698c3ab7305f31205a4543800caa7ea7c30344041a27e3f.png";
  it.skipIf(!existsSync(sample) || !process.env.KNOCK_OUT_PREVIEW_DIR)("真实生成图预览", async () => {
    const dir = process.env.KNOCK_OUT_PREVIEW_DIR!;
    for (const hash of [
      "48298cf1e3b5be183698c3ab7305f31205a4543800caa7ea7c30344041a27e3f",
      "561e0713c89799fcf9809639611349650621800ac66ce0c8b1bf5e92b0b1316c",
      "2279f27c6b9d99acff9bdb865a3b97cd7be8fe41554ee28fd74f2b80d5fd65a6"
    ]) {
      const t = await knockOutBackground(readFileSync(`blob-storage/generated-images/${hash}.png`));
      const meta = await sharp(t).metadata();
      const preview = await sharp({
        create: { width: meta.width!, height: meta.height!, channels: 3, background: "#808080" }
      })
        .composite([{ input: t }])
        .png()
        .toBuffer();
      writeFileSync(`${dir}/${hash.slice(0, 8)}-preview.png`, preview);
    }
  });
});
