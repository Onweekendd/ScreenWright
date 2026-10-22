import { createHash } from "node:crypto";

import sharp from "sharp";

import { assetStore } from "@/lib/storage";
import { readStoredImage } from "@/mastra/services/chat-image.server";

import { isSameLayout } from "./check";
import type { Blueprint, NodeKind, Region } from "./schema";

/** 和工具图注入时的缩放上限一致：按这个尺寸画，线宽和字号到模型眼里不会再被缩一遍 */
const LONG_EDGE = 1280;
const STROKE = 2;
const FONT_SIZE = 14;
const PAD = 4;
const LABEL_HEIGHT = FONT_SIZE + PAD * 2;
/** 标签用系统字体渲染（librsvg 走 fontconfig），列几个常见中文字体兜底 */
const FONT_FAMILY = "Microsoft YaHei, PingFang SC, WenQuanYi Micro Hei, Noto Sans CJK SC, sans-serif";
/** 没有效果图可画时的线框底色：中深灰，几种框色都看得清 */
const WIREFRAME_BACKGROUND = { r: 40, g: 40, b: 48 };

export const CROP_COLOR = "#ff3b30";
export const KIND_COLORS: Record<NodeKind, string> = { group: "#ffcc00", asset: "#ff2dd4", component: "#00e5ff" };

const escapeXml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** 估算标签宽度：拿不到字体度量，按中文一个字号宽、其它半个多字号宽算，宁宽勿窄 */
const labelWidth = (text: string) =>
  Math.ceil([...text].reduce((sum, char) => sum + (char.charCodeAt(0) > 0xff ? 1 : 0.6), 0) * FONT_SIZE) + PAD * 2;

const intersects = (a: Region, b: Region): boolean =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

export interface AnnotationBox {
  region: Region;
  label: string;
  color: string;
}

/**
 * 生成叠在图上的 SVG：boxes 的坐标已是图片像素。
 * 标签贴在框的左上角外侧，框顶到图片上沿放不下时贴在框内；和已放的标签撞上就往右挪（分组和底板常常同一位置）。
 * 先画全部框再画全部标签，标签不会被后画的框线压住。
 */
export function annotationSvg(size: { width: number; height: number }, boxes: AnnotationBox[]): string {
  const placed: Region[] = [];
  const parts = boxes.map(({ region, label, color }) => {
    const x = Math.round(region.x);
    const y = Math.round(region.y);
    const width = Math.max(1, Math.round(region.width));
    const height = Math.max(1, Math.round(region.height));
    const frame =
      `<rect x="${x + STROKE / 2}" y="${y + STROKE / 2}" width="${Math.max(1, width - STROKE)}" ` +
      `height="${Math.max(1, height - STROKE)}" fill="none" stroke="${color}" stroke-width="${STROKE}"/>`;
    const tagWidth = labelWidth(label);
    // 候选位置：框外上方、框内顶部；各自往右挪到不撞为止，取挪得最少的
    const candidates = [y - LABEL_HEIGHT, Math.max(0, y)]
      .filter((top) => top >= 0)
      .map((top) => {
        const slot: Region = { x: Math.max(0, x), y: top, width: tagWidth, height: LABEL_HEIGHT };
        for (let hit = placed.find((other) => intersects(other, slot)); hit; ) {
          slot.x = hit.x + hit.width + 2;
          hit = placed.find((other) => intersects(other, slot));
        }
        return slot;
      });
    const slot = candidates.reduce((best, next) => (next.x < best.x ? next : best));
    // 挪到右边放不下了就贴着右边，宁可压住别的标签也别出图
    slot.x = Math.min(size.width - tagWidth, slot.x);
    placed.push(slot);
    const { x: tagX, y: tagY } = slot;
    const tag =
      `<rect x="${tagX}" y="${tagY}" width="${tagWidth}" height="${LABEL_HEIGHT}" fill="${color}"/>` +
      `<text x="${tagX + PAD}" y="${tagY + PAD + FONT_SIZE - 2}" font-size="${FONT_SIZE}" fill="#000">${escapeXml(label)}</text>`;
    return { frame, tag };
  });
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" font-family="${FONT_FAMILY}">` +
    parts.map((part) => part.frame).join("") +
    parts.map((part) => part.tag).join("") +
    "</svg>"
  );
}

/**
 * 在图上画框和标签。boxes 的坐标在 space（宽×高）这套坐标里，按图片实际缩放后的尺寸等比换算。
 * 图片缩放到长边 {@link LONG_EDGE}（小图也放大，保证线宽、字号在不同尺寸的效果图上一样）。
 */
export async function drawBoxes(
  base: Buffer,
  space: { width: number; height: number },
  boxes: AnnotationBox[]
): Promise<Buffer> {
  const { data, info } = await sharp(base)
    .rotate()
    .resize({ width: LONG_EDGE, height: LONG_EDGE, fit: "inside" })
    .png()
    .toBuffer({ resolveWithObject: true });
  const sx = info.width / space.width;
  const sy = info.height / space.height;
  const svg = annotationSvg(
    info,
    boxes.map((box) => ({ ...box, region: scaleRegion(box.region, sx, sy) }))
  );
  return sharp(data)
    .composite([{ input: Buffer.from(svg) }])
    .jpeg({ quality: 85 })
    .toBuffer();
}

const scaleRegion = (region: Region, sx: number, sy: number): Region => ({
  x: region.x * sx,
  y: region.y * sy,
  width: region.width * sx,
  height: region.height * sy
});

/** 相差两像素以内算同一块：同一版面不写 cropRegion 时，裁切区域就是节点位置换算过来的，不重复画 */
const sameRegion = (a: Region, b: Region) =>
  Math.abs(a.x - b.x) <= 2 &&
  Math.abs(a.y - b.y) <= 2 &&
  Math.abs(a.width - b.width) <= 2 &&
  Math.abs(a.height - b.height) <= 2;

export interface AnnotatedImage {
  image: Buffer;
  label: string;
}

const LEGEND = "框上标的是「节点 key 中文名」，颜色：黄=group、品红=asset、青=component";

/**
 * 把蓝图画成标注图给模型核对坐标：
 * - 照搬版面：效果图上画全部节点框（换算到效果图坐标）+ 和节点位置不一致的裁切框（红，标素材 key）；
 * - 重排版面：效果图上只画裁切框，另画一张画布尺寸的线框图看节点布局；
 * - 没有效果图（或读不到）：只画线框图。
 */
export async function renderBlueprintAnnotations(
  blueprint: Blueprint,
  source: Buffer | null
): Promise<AnnotatedImage[]> {
  const { canvas, sourceImage } = blueprint;
  const nodeBoxes = blueprint.nodes.map((node) => ({
    region: node.region,
    label: `${node.key} ${node.name}`,
    color: KIND_COLORS[node.kind]
  }));
  const crops = blueprint.assets.filter((asset) => asset.source === "crop" && asset.cropRegion);
  const images: AnnotatedImage[] = [];

  if (source && sourceImage) {
    const sameLayout = isSameLayout(sourceImage, canvas);
    const toSource = (region: Region) =>
      scaleRegion(region, sourceImage.width / canvas.width, sourceImage.height / canvas.height);
    const cropBoxes = crops
      .filter((asset) => {
        if (!sameLayout) {
          return true;
        }
        const user = blueprint.nodes.find((node) => node.key === asset.usedBy[0]);
        return !user || !sameRegion(toSource(user.region), asset.cropRegion!);
      })
      .map((asset) => ({ region: asset.cropRegion!, label: `${asset.key} ${asset.name}`, color: CROP_COLOR }));
    const boxes = sameLayout
      ? [...nodeBoxes.map((box) => ({ ...box, region: toSource(box.region) })), ...cropBoxes]
      : cropBoxes;

    if (boxes.length > 0) {
      const cropNote = cropBoxes.length > 0 ? "；红框是单独写了 cropRegion 的裁切区域，标的是「素材 key 中文名」" : "";
      images.push({
        image: await drawBoxes(source, sourceImage, boxes),
        label: sameLayout
          ? `设计蓝图标注图（画在效果图上）：${LEGEND}${cropNote}。核对每个框是否正好框住对应元素，偏了就改坐标重新 save_blueprint`
          : "设计蓝图裁切标注图（画在效果图上）：红框是每个裁切素材的 cropRegion，标的是「素材 key 中文名」。" +
            "核对是否正好框住要裁的元素、没带进文字或旁边的东西，偏了就改 cropRegion 重新 save_blueprint"
      });
    }
    if (sameLayout) {
      return images;
    }
  }

  const blank = await sharp({
    create: { width: canvas.width, height: canvas.height, channels: 3, background: WIREFRAME_BACKGROUND }
  })
    .png()
    .toBuffer();
  images.push({
    image: await drawBoxes(blank, canvas, nodeBoxes),
    label: `设计蓝图版面线框图（画布 ${canvas.width}×${canvas.height}）：${LEGEND}。核对版面是否合理：有没有该对齐没对齐、该留白被挤占、不该重叠却叠在一起的`
  });
  return images;
}

/** 画好标注图并存起来，返回给模型看的 url 与说明。效果图读不到时只出线框图 */
export async function annotateBlueprint(blueprint: Blueprint): Promise<Array<{ url: string; label: string }>> {
  const stored = blueprint.sourceImage ? await readStoredImage(blueprint.sourceImage.url) : null;
  const images = await renderBlueprintAnnotations(blueprint, stored?.buffer ?? null);
  return Promise.all(
    images.map(async ({ image, label }, i) => {
      const digest = createHash("sha256").update(image).digest("hex").slice(0, 12);
      const { url } = await assetStore().put(
        `blueprint-assets/${blueprint.screenKey}/annotated-${i}-${digest}.jpg`,
        image,
        {
          contentType: "image/jpeg"
        }
      );
      return { url, label };
    })
  );
}
