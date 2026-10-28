import { describe, expect, it } from "vitest";

import {
  type PixelBox,
  type PixelImage,
  snapToBorders
} from "@/views/build/components/agentBI/hooks/capture/borderSnap";

/**
 * 合成一张「深色底 + 青色细边框卡片」的图，复现实测时让模型截不准的几种干扰：
 * 卡内横贯的图表网格线、靠右边框的大块面积图填充、二十来像素外的相邻卡片边框。
 */
const W = 320;
const H = 260;
const BG = 20;
const LINE = 200;

const blank = (): PixelImage => {
  const data = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    data.set([BG, BG, BG, 255], i * 4);
  }
  return { data, width: W, height: H };
};

const fill = (img: PixelImage, x0: number, y0: number, x1: number, y1: number, v = LINE) => {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      img.data.set([v * 0.2, v, v, 255], (y * W + x) * 4);
    }
  }
};

/** 2 像素粗的矩形边框，四边都包含 */
const frame = (img: PixelImage, box: PixelBox) => {
  fill(img, box.left, box.top, box.right, box.top + 1);
  fill(img, box.left, box.bottom - 1, box.right, box.bottom);
  fill(img, box.left, box.top, box.left + 1, box.bottom);
  fill(img, box.right - 1, box.top, box.right, box.bottom);
};

const CARD: PixelBox = { left: 60, top: 60, right: 260, bottom: 200 };
const OPTIONS = { maxShift: 30, ridgeReach: 6 };

const card = () => {
  const img = blank();
  frame(img, CARD);
  return img;
};

describe("snapToBorders", () => {
  it("框偏外或偏内都能吸附到边框线外沿", () => {
    const img = card();

    const outside = snapToBorders(img, { left: 45, top: 48, right: 275, bottom: 215 }, OPTIONS);
    const inside = snapToBorders(img, { left: 75, top: 72, right: 245, bottom: 188 }, OPTIONS);

    expect(outside.box).toEqual(CARD);
    expect(inside.box).toEqual(CARD);
    expect(outside.snapped).toEqual({ left: true, top: true, right: true, bottom: true });
  });

  it("相邻卡片只隔二十来像素、框又画得偏它那边时，也不跳到隔壁卡片", () => {
    const img = card();
    frame(img, { left: 60, top: 0, right: 260, bottom: 38 }); // 上方卡片，底边在 y=38

    // 模型读偏了：把上边读成了 72（偏内 12），离本卡上边 12、离隔壁底边 34
    const { box } = snapToBorders(img, { left: 60, top: 72, right: 260, bottom: 200 }, OPTIONS);

    expect(box.top).toBe(CARD.top);
  });

  it("卡内横贯的网格线比真实边框离得远时，不会被当成底边", () => {
    const img = card();
    fill(img, 70, 175, 250, 175); // 图表横向网格线，在底边上方 25 像素

    const { box } = snapToBorders(img, { left: 60, top: 60, right: 260, bottom: 196 }, OPTIONS);

    expect(box.bottom).toBe(CARD.bottom);
  });

  it("靠边的大块高亮填充不是细线，不会被当成右边框", () => {
    const img = card();
    fill(img, 200, 90, 252, 195); // 面积图填充，右缘离边框只有几像素

    const { box } = snapToBorders(img, { left: 60, top: 60, right: 248, bottom: 200 }, OPTIONS);

    expect(box.right).toBe(CARD.right);
  });

  it("上边框被左上角标题楔形占掉一截、只剩六成宽，框画得比卡宽一些也能吸上", () => {
    const img = blank();
    frame(img, CARD);
    // 擦掉上边框左侧 35%，换成一块实心的标题楔形（亮块，不是细线）
    fill(img, CARD.left, CARD.top, CARD.left + 70, CARD.top + 1, BG);
    fill(img, CARD.left, CARD.top, CARD.left + 70, CARD.top + 22);

    const { box, snapped } = snapToBorders(img, { left: 45, top: 70, right: 275, bottom: 200 }, OPTIONS);

    expect(snapped.top).toBe(true);
    expect(box.top).toBe(CARD.top);
  });

  it("范围内找不到边框线的边保持原位，并如实标出没吸附上", () => {
    const img = blank();
    fill(img, 60, 60, 61, 200); // 只有左边框

    const result = snapToBorders(img, { left: 70, top: 70, right: 250, bottom: 190 }, OPTIONS);

    expect(result.box).toEqual({ left: 60, top: 70, right: 250, bottom: 190 });
    expect(result.snapped).toEqual({ left: true, top: false, right: false, bottom: false });
  });

  // ↓ 以下几条复现的是真实底图（电力运维大屏）上「按最近线选」会选错的情形：
  //   诱饵离原边比真边框更近，只能靠「卡片边缘」的结构把它们排除

  it("框画大了、比真边框更靠近隔壁卡片的边框时，靠结构认出隔壁卡片", () => {
    const img = card();
    frame(img, { left: 60, top: 0, right: 260, bottom: 30 }); // 上方卡片底边在 y=30，与本卡上边隔 30

    // 上边画到了 y=38：离隔壁底边 8、离本卡上边 22
    const { box } = snapToBorders(img, { left: 50, top: 38, right: 270, bottom: 210 }, OPTIONS);

    expect(box).toEqual(CARD);
  });

  it("框画小了、卡内横贯的长线比真边框更近时，靠结构认出它在卡内", () => {
    const img = card();
    fill(img, 62, 175, 258, 176); // 卡内长横线，几乎贯穿整卡，离底边 25

    // 底边画到了 y=186：离卡内线 10、离真底边 14
    const { box } = snapToBorders(img, { left: 60, top: 60, right: 260, bottom: 186 }, OPTIONS);

    expect(box.bottom).toBe(CARD.bottom);
  });

  it("框外更远处有一条整屏外框竖线，不会被当成卡片左边", () => {
    const img = card();
    fill(img, 30, 0, 31, H - 1); // 整屏外框：贯穿整张图的竖线，覆盖率比卡片左边还高

    const { box } = snapToBorders(img, { left: 40, top: 55, right: 265, bottom: 205 }, OPTIONS);

    expect(box.left).toBe(CARD.left);
  });
});
