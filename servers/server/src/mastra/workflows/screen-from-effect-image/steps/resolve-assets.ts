import { createHash } from "node:crypto";

import sharp from "sharp";

import { assetStore } from "@/lib/storage";
import { generateAndStoreImage } from "@/mastra/services/image-generation.server";

import { type AssetRole, assetRoleSchema, type EffectImageRegion } from "../types";
import { estimateBackgroundColor, knockOutBackground } from "./knock-out";

/**
 * kind=asset 区域的「分组去重 → 代表生图 → 其余复用」。
 *
 * 为什么不逐个抠图：同一批卡片框视觉上是同一个东西，只是尺寸不同；逐个抠要跟
 * 「这条线是不是真边框」死磕，2026-09-17 用投影吸附实测过分不开真边框和相似亮度的装饰线。
 * 生图完全绕开这个问题——只要给它一块参考图和"把留白描述成实体"的 prompt，
 * 画出来的就是一张干净的空面板，用九宫格拉伸适配每个成员的尺寸。
 *
 * 优先级（见 docs §3②）：background > title-bar > card-frame。底图不由 vision 给，
 * 上游固定合成一条铺满画布的区域，这里按 role 一视同仁地处理。
 */

export type PixelBox = [number, number, number, number];

/**
 * 只有 `decoration` 按宽高比再细分（零散装饰形状各异，横光带和竖分隔线不是一回事）。
 * 其余 role 一律**按 role 一组**：卡片框不管 3:1 还是 1:1 都是同一套边框样式，
 * 一张图拉伸适配就行（2026-09-17 用户定的："框框的图片只要一个"）。
 * 第一版按宽高比分组把 7 个卡片框分成了 6 组、生了 6 张几乎一样的图，白花 6 倍生图时间。
 */
const ASPECT_TOLERANCE = 0.2;
const ROLES_SPLIT_BY_ASPECT: ReadonlySet<AssetRole> = new Set(["decoration"]);

/** 豆包 seedream 的最小面积（921600）再留 5% 余量；小于它的请求会被服务端直接拒掉。 */
const MIN_GENERATION_AREA = 921_600 * 1.05;

/**
 * 宽高比夹在 1/16 ~ 16：再极端的（整屏宽的细分隔线）按 16:1 生，前端拉伸。
 * 16:1 满足最小面积要求需要 3935px 长边，所以不再另设长边上限——加上限就会像第一版那样
 * 把极端比例缩到面积不达标，被服务端拒掉。
 */
const MAX_ASPECT = 16;

export interface AssetGroup {
  role: AssetRole;
  /**
   * 宽高比取组内中位数的那个成员：这张图要拉伸去适配全组，选中间比例的能把最坏的
   * 拉伸失真压到最小（选最大的那张，遇到 3:1 页签卡和 1:1 方卡就有一边要拉三倍）。
   */
  representative: EffectImageRegion;
  members: EffectImageRegion[];
}

const aspectOf = (r: EffectImageRegion): number => {
  const [x1, y1, x2, y2] = r.bounds;
  const h = Math.max(1, y2 - y1);
  return (x2 - x1) / h;
};

const areaOf = (r: EffectImageRegion): number => {
  const [x1, y1, x2, y2] = r.bounds;
  return (x2 - x1) * (y2 - y1);
};

const roleOf = (r: EffectImageRegion): AssetRole => {
  const parsed = assetRoleSchema.safeParse(r.role);
  return parsed.success ? parsed.data : "decoration";
};

const medianAspectMember = (members: EffectImageRegion[]): EffectImageRegion => {
  const byAspect = [...members].sort((a, b) => aspectOf(a) - aspectOf(b));
  return byAspect[Math.floor((byAspect.length - 1) / 2)];
};

/** 按 role（decoration 再按宽高比）分组。输入顺序无关；组内成员按面积降序。 */
export const groupAssetRegions = (regions: EffectImageRegion[]): AssetGroup[] => {
  const buckets: Array<{ role: AssetRole; anchorAspect: number; members: EffectImageRegion[] }> = [];
  const sorted = [...regions].sort((a, b) => areaOf(b) - areaOf(a));

  for (const region of sorted) {
    const role = roleOf(region);
    const aspect = aspectOf(region);
    const hit = buckets.find(
      (b) =>
        b.role === role &&
        (!ROLES_SPLIT_BY_ASPECT.has(role) ||
          Math.abs(aspect - b.anchorAspect) / Math.max(b.anchorAspect, 1e-6) <= ASPECT_TOLERANCE)
    );
    if (hit) {
      hit.members.push(region);
    } else {
      buckets.push({ role, anchorAspect: aspect, members: [region] });
    }
  }
  return buckets.map((b) => ({ role: b.role, representative: medianAspectMember(b.members), members: b.members }));
};

/** 0~1000 归一化框 → 原图像素框；左上向下取整、右下向上取整，宁可多裁一像素别削边。 */
export const boundsToPixelBox = (
  bounds: EffectImageRegion["bounds"],
  imageWidth: number,
  imageHeight: number
): PixelBox => {
  const [x1, y1, x2, y2] = bounds;
  const left = Math.max(0, Math.floor((x1 / 1000) * imageWidth));
  const top = Math.max(0, Math.floor((y1 / 1000) * imageHeight));
  const right = Math.min(imageWidth, Math.ceil((x2 / 1000) * imageWidth));
  const bottom = Math.min(imageHeight, Math.ceil((y2 / 1000) * imageHeight));
  return [left, top, Math.max(left + 1, right), Math.max(top + 1, bottom)];
};

/**
 * 按宽高比算一个满足服务商最小面积的生成尺寸。
 * 小尺寸装饰素材不能按最终尺寸请求（会被拒），得生大图再由前端按组件尺寸缩放。
 */
export const fitGenerationSize = (aspect: number): { width: number; height: number } => {
  const safeAspect = Math.min(MAX_ASPECT, Math.max(1 / MAX_ASPECT, aspect));
  const height = Math.sqrt(MIN_GENERATION_AREA / safeAspect);
  const width = height * safeAspect;
  const round8 = (n: number): number => Math.ceil(n / 8) * 8;
  return { width: round8(width), height: round8(height) };
};

/**
 * 各 role 的生图 prompt。核心技巧是**把留白描述成实体**（"主体是一块完整均匀的纯色面板"），
 * 比堆否定词有效——只说"留空"模型会自己往里加内框、加文字（2026-09-16 豆包实测）。
 */
const promptFor = (role: AssetRole): string => {
  const common =
    "严格沿用参考图的配色、材质、光效与线条风格，输出与参考图同一视觉体系的一张素材图。" +
    "画面里不得出现任何文字、数字、图标、图表、曲线、表格或标注。";
  // 生成之后要把底色抠成透明（knock-out.ts），素材以外的区域越平、越暗越好抠
  const keyable = "素材以外的画面区域是一整块均匀的纯黑色（#000000）底，没有渐变、纹理或光晕。";
  switch (role) {
    case "background":
      return (
        "数据可视化大屏的整屏底图。主体是一整块均匀连续的深色渐变背景，带有参考图同款的网格、" +
        "光晕、粒子或线条装饰。这是一张空底图：画面上没有任何卡片、面板、边框、标题栏、图表或文字，" +
        "所有内容区域都是干净的背景本身。" +
        common
      );
    case "title-bar":
      return (
        "数据大屏顶部标题栏的装饰底图。主体是一条横向的、完整均匀的深色面板，两侧带参考图同款的" +
        "光线、斜切角或渐变装饰，中间是一整块留给标题文字的均匀空面板，不写任何文字。" +
        keyable +
        common
      );
    case "card-frame":
      return (
        "数据大屏的卡片面板底图。主体是一块完整均匀的半透明深色纯色面板，只有一圈参考图同款的" +
        "外轮廓线与四角装饰，面板内部是均匀的纯色。顶部也是同样的纯色与外轮廓线，" +
        "没有页签、没有标题条、没有第二圈线框，面板里没有任何内容。" +
        keyable +
        common
      );
    case "card-title-bar":
      return (
        "数据大屏卡片顶部、横向贯穿整个画面宽度的标题装饰带。左侧是一块带参考图同款斜切角、渐变或光线装饰的" +
        "页签面板，内部是均匀的纯色留给标题文字；从页签向右延伸一条参考图同款的细装饰线直到画面最右端。" +
        "整条带子从最左画到最右，不留空白段，不写任何文字。" +
        keyable +
        common
      );
    case "outer-frame":
      return (
        "数据大屏的整屏外框装饰。主体是一圈参考图同款的边框线与四角装饰，框内是一整块完全均匀的" +
        "透明或纯深色区域，不带任何内部结构。" +
        keyable +
        common
      );
    case "decoration":
      return "数据大屏上的一块纯装饰性图形，沿用参考图的形状与光效，内部不含任何文字或数据内容。" + keyable + common;
  }
};

/** 夹到 int32 正数：方舟要求 seed ≤ 2147483647，`GeneratedImage.seed` 也是 Prisma Int（int32） */
const seedFor = (imageId: string, role: AssetRole, groupIndex: number): number =>
  createHash("sha256").update(`${imageId}:${role}:${groupIndex}`).digest().readUInt32BE(0) & 0x7fffffff;

/**
 * 参考图的宽高比夹到服务商允许的范围（方舟：0.06 ~ 16）。标题栏这种 22:1 的细条超限，
 * 处理方式是把裁切框在原图里**向外扩**到 16:1（多带一点上下文，比填黑边更接近真实观感）。
 */
const clampReferenceBox = (box: PixelBox, imageWidth: number, imageHeight: number): PixelBox => {
  let [left, top, right, bottom] = box;
  const width = right - left;
  const height = bottom - top;
  if (width / height > MAX_ASPECT) {
    const needHeight = Math.ceil(width / MAX_ASPECT);
    const grow = needHeight - height;
    top = Math.max(0, top - Math.floor(grow / 2));
    bottom = Math.min(imageHeight, top + needHeight);
    top = Math.max(0, bottom - needHeight);
  } else if (height / width > MAX_ASPECT) {
    const needWidth = Math.ceil(height / MAX_ASPECT);
    const grow = needWidth - width;
    left = Math.max(0, left - Math.floor(grow / 2));
    right = Math.min(imageWidth, left + needWidth);
    left = Math.max(0, right - needWidth);
  }
  return [left, top, right, bottom];
};

/**
 * 底图的参考图要**先糊掉**再喂给模型：整张效果图直接当参考，模型会忠实复刻所有卡片和文字
 * （2026-09-17 电力大屏实测，生出来的"底图"就是效果图的劣化复印件，文字全变乱码）。
 * 缩到 1/4 再高斯模糊，卡片边框和文字就没了，只剩色调分布与光效走向——这正是底图要继承的全部。
 * 其它 role 的参考图要保留边框细节，不糊。
 */
const referenceImage = async (
  role: AssetRole,
  imageBuffer: Buffer,
  region: { left: number; top: number; width: number; height: number },
  masks: PixelBox[] = []
): Promise<Buffer> => {
  const cropped = sharp(imageBuffer).extract(region);
  if (role !== "background") {
    return shrinkForUpload(masks.length > 0 ? await paintOut(cropped, region, masks) : cropped);
  }
  const small = Math.max(64, Math.round(region.width / 4));
  return shrinkForUpload(
    cropped.resize({ width: small }).blur(12).resize({ width: region.width, height: region.height, fit: "fill" })
  );
};

/**
 * 把参考图里的若干矩形涂成整图底色（与抠底用同一个"整图中位色"估计）。
 * img2img 会忠实复刻参考图里的结构——卡片框参考图里留着页签，生出来的框就带页签；涂掉才干净。
 */
const paintOut = async (
  image: sharp.Sharp,
  region: { left: number; top: number; width: number; height: number },
  masks: PixelBox[]
): Promise<sharp.Sharp> => {
  const { data, info } = await image.clone().removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const [r, g, b] = estimateBackgroundColor(data, info.width, info.height, info.channels);
  const patches = masks
    .map(([x1, y1, x2, y2]) => ({
      left: Math.max(0, x1 - region.left),
      top: Math.max(0, y1 - region.top),
      width: Math.min(region.width, x2 - region.left) - Math.max(0, x1 - region.left),
      height: Math.min(region.height, y2 - region.top) - Math.max(0, y1 - region.top)
    }))
    .filter((p) => p.width > 0 && p.height > 0);
  if (patches.length === 0) {
    return image;
  }
  return sharp(await image.png().toBuffer()).composite(
    patches.map((p) => ({
      input: { create: { width: p.width, height: p.height, channels: 3, background: { r, g, b } } },
      left: p.left,
      top: p.top
    }))
  );
};

/** 参考图长边上限。它只给模型看风格，不需要全分辨率 */
const MAX_REFERENCE_SIDE = 1280;

/**
 * 参考图走 JPEG 且长边压到 1280：整屏底图的 PNG 参考图 1MB+，base64 后 1.4MB 塞进 JSON 请求体，
 * 方舟那边直接断连（undici 报 `fetch failed`，同批 200KB 的卡片框参考图却成功）。
 * 压完 50~150KB，请求稳定；模型看到的风格信息没损失。
 */
const shrinkForUpload = (image: sharp.Sharp): Promise<Buffer> =>
  image
    .resize({ width: MAX_REFERENCE_SIDE, height: MAX_REFERENCE_SIDE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 88 })
    .toBuffer();

export interface ProducedAsset {
  url: string;
  generated: boolean;
}

export interface ProduceAssetInput {
  imageId: string;
  imageBuffer: Buffer;
  imageWidth: number;
  imageHeight: number;
  group: AssetGroup;
  groupIndex: number;
  /** 参考图里要涂成底色的区域（0~1000 归一化，源图坐标）：卡片框传它框里的页签条，生出来的框才不带页签 */
  masks?: EffectImageRegion["bounds"][];
}

/**
 * 给一组产一张代表素材：先从效果图裁出代表区域存进 assetStore 当参考图，再 img2img 生成干净底图。
 * 生图没跑通（没配生图模型、服务端拒绝、超时）就降级用参考图本身——那是带内容的原图裁切，
 * 不好看但链路不断，用户能在画布上看到"这块是有底图的"。
 */
/** 把 assetStore 里的一张生成图抠底后另存；抠失败就退回不透明的原图，链路不断 */
const knockOut = async (generatedUrl: string, targetKey: string): Promise<string> => {
  const key = assetStore().keyFromUrl(generatedUrl);
  if (!key) {
    return generatedUrl;
  }
  try {
    const transparent = await knockOutBackground(await assetStore().get(key));
    const { url } = await assetStore().put(targetKey, transparent, { contentType: "image/png" });
    return url;
  } catch (error) {
    console.warn(
      `[screen-from-effect-image] 素材抠底失败，用不透明原图：${error instanceof Error ? error.message : String(error)}`
    );
    return generatedUrl;
  }
};

export const produceRepresentativeAsset = async (input: ProduceAssetInput): Promise<ProducedAsset> => {
  const { imageId, imageBuffer, imageWidth, imageHeight, group, groupIndex } = input;
  const [left, top, right, bottom] = clampReferenceBox(
    boundsToPixelBox(group.representative.bounds, imageWidth, imageHeight),
    imageWidth,
    imageHeight
  );

  const cropBuffer = await referenceImage(
    group.role,
    imageBuffer,
    { left, top, width: right - left, height: bottom - top },
    (input.masks ?? []).map((m) => boundsToPixelBox(m, imageWidth, imageHeight))
  );
  // 文件名带内容 hash：生图的幂等键算的是参考图 **url** 不是字节，url 不变就会命中旧结果——
  // 参考图处理方式一改（比如底图改成先糊掉）而 url 不变，拿回来的就是按旧参考图生的那张
  const cropDigest = createHash("sha256").update(cropBuffer).digest("hex").slice(0, 12);
  const cropKey = `effect-image-assets/${imageId}/${group.role}-${groupIndex}-${cropDigest}.jpg`;
  const { url: cropUrl } = await assetStore().put(cropKey, cropBuffer, { contentType: "image/jpeg" });

  const aspect = (right - left) / Math.max(1, bottom - top);
  const size = fitGenerationSize(aspect);

  try {
    const generated = await generateAndStoreImage({
      prompt: promptFor(group.role),
      seed: seedFor(imageId, group.role, groupIndex),
      width: size.width,
      height: size.height,
      seedImageUrl: cropUrl
    });
    if (group.role === "background") {
      return { url: generated.url, generated: true };
    }
    // 底图以外的素材都要叠在底图上，生成图不透明，得把底色抠掉再落库
    return { url: await knockOut(generated.url, `${cropKey.slice(0, -4)}-alpha.png`), generated: true };
  } catch (error) {
    console.warn(
      `[screen-from-effect-image] 素材「${group.role}」生图失败，降级为原图裁切：${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return { url: cropUrl, generated: false };
  }
};
