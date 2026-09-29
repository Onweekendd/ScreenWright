import sharp from "sharp";

/**
 * 把生成的素材图（卡片框、标题条、页签条、装饰）的底色抠成透明。
 *
 * 生图模型只会输出不透明图，prompt 里写"透明"没用。卡片框的裁切框是个矩形，斜切角外面、
 * 框线以外的那块"底"落到画布上就是一块死黑压在底图上——素材必须自己带 alpha 才能叠。
 *
 * 算法是 GIMP 的 color-to-alpha：给定底色 b，每个像素 c 离 b 越远越不透明，
 * 并把颜色反预乘（`b + (c - b) / alpha`），这样发光边缘不会带一圈暗边。
 * 底色不让调用方给——取整图逐通道的中位色：框线、光效只占一小部分像素，中位数就是那块
 * 平底/填充色。它和平底的噪点一起被噪声门压掉，比它亮得多的框线、光晕留下来。
 *
 * 第一版底色取"最暗 25% 的中位"：填充里的噪点全比它亮，抠完一片雪花（screen_23 的卡片框实测）。
 */

/** alpha 低于它归零，往上平滑抬到 1：生成图的平底有噪点，硬阈值会留一层看不见但挡鼠标的雾 */
const NOISE_GATE = 0.18;
/** 估底色的采样步长（像素），全图逐像素排序没必要 */
const SAMPLE_STRIDE = 4;
/** 算 alpha 之前先轻微模糊，把 JPEG 块噪、粒子噪压平；框线宽度远大于这个半径，不会糊 */
const PRE_BLUR_SIGMA = 0.8;

type Rgb = [number, number, number];

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

/** 整图逐通道中位色，当作要抠掉的底色 */
export const estimateBackgroundColor = (rgb: Buffer, width: number, height: number, channels: number): Rgb => {
  const perChannel: [number[], number[], number[]] = [[], [], []];
  for (let y = 0; y < height; y += SAMPLE_STRIDE) {
    for (let x = 0; x < width; x += SAMPLE_STRIDE) {
      const i = (y * width + x) * channels;
      perChannel[0].push(rgb[i]);
      perChannel[1].push(rgb[i + 1]);
      perChannel[2].push(rgb[i + 2]);
    }
  }
  return perChannel.map(median) as Rgb;
};

/**
 * GIMP color-to-alpha 单像素版，但**只算比底色亮的方向**：返回 alpha ∈ [0,1] 与反预乘后的颜色。
 * 框线、光晕全比深色底亮；比底色暗的像素（斜切角外的黑、填充里的暗斑）一律当透明。
 * 双向算的话底色通道值本来就小（≈40），暗 10 就成了 25% 不透明，整块填充抠成雪花。
 */
export const colorToAlpha = (c: Rgb, bg: Rgb): { alpha: number; rgb: Rgb } => {
  let alpha = 0;
  for (let ch = 0; ch < 3; ch += 1) {
    const diff = c[ch] - bg[ch];
    const range = 255 - bg[ch];
    if (diff > 0 && range > 0) {
      alpha = Math.max(alpha, diff / range);
    }
  }
  if (alpha < NOISE_GATE) {
    return { alpha: 0, rgb: bg };
  }
  const rgb = [0, 1, 2].map((ch) => Math.min(255, Math.max(0, bg[ch] + (c[ch] - bg[ch]) / alpha))) as Rgb;
  return { alpha: (alpha - NOISE_GATE) / (1 - NOISE_GATE), rgb };
};

/** 输入任意 sharp 能解的图，输出带 alpha 的 PNG */
export const knockOutBackground = async (image: Buffer): Promise<Buffer> => {
  const { data, info } = await sharp(image)
    .removeAlpha()
    .blur(PRE_BLUR_SIGMA)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const bg = estimateBackgroundColor(data, width, height, channels);

  const out = Buffer.alloc(width * height * 4);
  for (let p = 0; p < width * height; p += 1) {
    const i = p * channels;
    const { alpha, rgb } = colorToAlpha([data[i], data[i + 1], data[i + 2]], bg);
    const o = p * 4;
    out[o] = Math.round(rgb[0]);
    out[o + 1] = Math.round(rgb[1]);
    out[o + 2] = Math.round(rgb[2]);
    out[o + 3] = Math.round(alpha * 255);
  }
  return sharp(out, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
};
