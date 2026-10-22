import sharp from "sharp";

/** 每格缩略图的最大尺寸：一张总览图最多十几格，长边压到 1280 后每格仍看得清造型和配色 */
const CELL = { width: 360, height: 240 };
const GAP = 16;
const MAX_COLUMNS = 4;
/** 中灰底：深色科技风素材和浅色素材放上去都看得出边界 */
const BACKGROUND = { r: 128, g: 128, b: 128 };

/**
 * 把一批素材拼成一张总览图给主模型看。工具图每次最多注入最近 3 张（MAX_TOOL_IMAGES），
 * 一批十几张素材逐张给，模型只看得到最后 3 张；拼成一张就都能看到。
 *
 * 不在图上写 key：服务器（Docker 镜像）里不一定装了字体，文字会渲染成方块或干脆不显示。
 * 顺序是确定的——从左到右、从上到下与 images 一一对应，说明由调用方写进图片标签。
 */
export async function buildContactSheet(images: Buffer[]): Promise<Buffer> {
  const columns = Math.min(MAX_COLUMNS, Math.ceil(Math.sqrt(images.length)));
  const rows = Math.ceil(images.length / columns);
  const thumbs = await Promise.all(
    images.map((image) =>
      sharp(image)
        .resize({ ...CELL, fit: "inside", withoutEnlargement: false })
        .png()
        .toBuffer({ resolveWithObject: true })
    )
  );

  const composites = thumbs.map(({ data, info }, i) => {
    const column = i % columns;
    const row = Math.floor(i / columns);
    // 格内居中，扁图上下留灰、窄图左右留灰
    return {
      input: data,
      left: GAP + column * (CELL.width + GAP) + Math.floor((CELL.width - info.width) / 2),
      top: GAP + row * (CELL.height + GAP) + Math.floor((CELL.height - info.height) / 2)
    };
  });

  return sharp({
    create: {
      width: GAP + columns * (CELL.width + GAP),
      height: GAP + rows * (CELL.height + GAP),
      channels: 3,
      background: BACKGROUND
    }
  })
    .composite(composites)
    .jpeg({ quality: 85 })
    .toBuffer();
}
