/**
 * 把一个「大致框住目标」的矩形，四条边各自吸附到附近真实的边框线上。
 *
 * 模型从截图上读坐标，就算叠了网格也会差上十几二十像素——它看到的图被服务商缩放过，细线只有一两个像素。
 * 这里直接在渲染出来的像素上找线，模型只需要把目标大致框进来。
 *
 * **只认「细亮线」，不认亮块**：判定一个像素在线上，要求它比两侧 k 像素外都亮出一截（脊线检测）。
 * 面积图填充、整块高亮底色两侧至少有一边同样亮，不会被当成边框。
 *
 * **不按「离原边最近」选线**——真实底图上实测，这样一偏二十像素就会选错，两种诱饵：
 * - 隔壁卡片的边框：卡片之间只隔三十来像素，它的覆盖率跟本卡边框一样高（0.92 vs 0.94）
 * - 卡内的长线（图表轴线、指标块的边）：离原边可能更近
 *
 * 所以按「卡片边缘」的结构打分：真边框**往里**一点，相邻的两条垂直边框是有的（至少一个角是直角）；
 * **往外**一点是卡片之间的空隙，什么都没有。隔壁卡片的边框往里是空隙；卡内的线往外还是本卡的边框。
 * 这个结构要用到垂直方向的两条边，所以先按最近线粗定位，再横竖交替细化几轮。
 */

export interface PixelImage {
  /** RGBA，与 ImageData.data 同布局 */
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** 像素坐标的矩形，四条边都是**包含**的（right / bottom 是最后一列 / 一行） */
export interface PixelBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export type Edge = "left" | "top" | "right" | "bottom";

export interface SnapOptions {
  /** 每条边最多移动多少像素 */
  maxShift: number;
  /** 脊线检测往两侧看多远（像素），要比线宽（含发光）的一半大 */
  ridgeReach: number;
  /** 线上像素至少比两侧亮多少（亮度 0–255） */
  minContrast?: number;
  /** 一列 / 一行里至少多大比例的像素在线上，才算一条贯穿的边框（斜切角、标题楔形会让覆盖率低于 1） */
  minCoverage?: number;
}

export interface SnapResult {
  box: PixelBox;
  /** 哪些边找到了边框线；没找到的保持原位 */
  snapped: Record<Edge, boolean>;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** 结构打分里「往里 / 往外看多远」，按 ridgeReach 等比，与渲染倍率无关 */
const BAND_PER_REACH = 2;
/** 结构分的权重：离原边的距离只是打破平手用的，权重要小 */
const DISTANCE_WEIGHT = 0.3;
/** 每条边最多保留几条候选线参与组合（按覆盖率取前几），组合数是它的四次方 */
const MAX_CANDIDATES = 6;

/**
 * 脊线图 + 前缀和：任意一列在任意一段行上的「在线」比例 O(1) 可查（行同理）。
 * 线有粗细、还可能被 JPEG 糊开一两像素，所以统计前沿垂直于线的方向膨胀几个像素。
 */
class RidgeMaps {
  private readonly colPrefix: Int32Array;
  private readonly rowPrefix: Int32Array;

  constructor(
    private readonly width: number,
    private readonly height: number,
    img: PixelImage,
    reach: number,
    minContrast: number,
    tolerance: number
  ) {
    const lum = new Float32Array(width * height);
    for (let i = 0; i < lum.length; i++) {
      const o = i * 4;
      lum[i] = 0.299 * img.data[o] + 0.587 * img.data[o + 1] + 0.114 * img.data[o + 2];
    }
    const at = (x: number, y: number) => lum[y * width + x];

    // 竖线：比左右 reach 外都亮；横线：比上下 reach 外都亮
    const vertical = new Uint8Array(width * height);
    const horizontal = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const v = at(x, y);
        if (x - reach >= 0 && x + reach < width && v - Math.max(at(x - reach, y), at(x + reach, y)) >= minContrast) {
          vertical[y * width + x] = 1;
        }
        if (y - reach >= 0 && y + reach < height && v - Math.max(at(x, y - reach), at(x, y + reach)) >= minContrast) {
          horizontal[y * width + x] = 1;
        }
      }
    }

    // 竖线沿水平方向膨胀、横线沿竖直方向膨胀，再按列 / 按行做前缀和
    this.colPrefix = new Int32Array(width * (height + 1));
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let y = 0; y < height; y++) {
        let hit = 0;
        for (let dx = -tolerance; dx <= tolerance && !hit; dx++) {
          const xx = x + dx;
          hit = xx >= 0 && xx < width ? vertical[y * width + xx] : 0;
        }
        sum += hit;
        this.colPrefix[x * (height + 1) + y + 1] = sum;
      }
    }
    this.rowPrefix = new Int32Array(height * (width + 1));
    for (let y = 0; y < height; y++) {
      let sum = 0;
      for (let x = 0; x < width; x++) {
        let hit = 0;
        for (let dy = -tolerance; dy <= tolerance && !hit; dy++) {
          const yy = y + dy;
          hit = yy >= 0 && yy < height ? horizontal[yy * width + x] : 0;
        }
        sum += hit;
        this.rowPrefix[y * (width + 1) + x + 1] = sum;
      }
    }
  }

  /** 第 x 列在 [y0, y1] 行上的在线比例 */
  column(x: number, y0: number, y1: number): number {
    if (x < 0 || x >= this.width) {
      return 0;
    }
    const a = clamp(Math.min(y0, y1), 0, this.height - 1);
    const b = clamp(Math.max(y0, y1), 0, this.height - 1);
    const base = x * (this.height + 1);
    return (this.colPrefix[base + b + 1] - this.colPrefix[base + a]) / (b - a + 1);
  }

  /** 第 y 行在 [x0, x1] 列上的在线比例 */
  row(y: number, x0: number, x1: number): number {
    if (y < 0 || y >= this.height) {
      return 0;
    }
    const a = clamp(Math.min(x0, x1), 0, this.width - 1);
    const b = clamp(Math.max(x0, x1), 0, this.width - 1);
    const base = y * (this.width + 1);
    return (this.rowPrefix[base + b + 1] - this.rowPrefix[base + a]) / (b - a + 1);
  }
}

interface Candidate {
  /** 线覆盖率最高的位置：用来量覆盖率 */
  peak: number;
  /** 线朝外的那一侧：裁切边界落在这里，线才完整 */
  outer: number;
  coverage: number;
}

/**
 * 窗口里所有够格的线。连续几个位置都够格的算同一条线（线有粗细），取覆盖率最高处为峰、朝外的端点为外沿。
 *
 * @param outward 向外的方向：左 / 上边是 -1，右 / 下边是 +1
 */
const findCandidates = (
  coverage: (pos: number) => number,
  origin: number,
  outward: -1 | 1,
  lo: number,
  hi: number,
  maxShift: number,
  minCoverage: number,
  dilation: number
): Candidate[] => {
  const from = clamp(origin - maxShift, lo, hi);
  const to = clamp(origin + maxShift, lo, hi);
  const candidates: Candidate[] = [];
  let pos = from;
  while (pos <= to) {
    if (coverage(pos) < minCoverage) {
      pos++;
      continue;
    }
    let runEnd = pos;
    let peak = pos;
    while (runEnd + 1 <= to && coverage(runEnd + 1) >= minCoverage) {
      runEnd++;
      if (coverage(runEnd) > coverage(peak)) {
        peak = runEnd;
      }
    }
    // 线的外沿：从朝外那一端再顺着把发光的半强度部分吃进来
    let outer = outward < 0 ? pos : runEnd;
    while (outer + outward >= lo && outer + outward <= hi && coverage(outer + outward) >= minCoverage / 2) {
      outer += outward;
    }
    // 统计前把线膨胀了 dilation 像素（容忍 JPEG 糊边），外沿要扣回来，否则裁出来四周多一圈背景
    outer = clamp(outer - outward * dilation, lo, hi);
    candidates.push({ peak, outer, coverage: coverage(peak) });
    pos = runEnd + 1;
  }
  return candidates;
};

export function snapToBorders(img: PixelImage, rough: PixelBox, options: SnapOptions): SnapResult {
  const { maxShift, ridgeReach, minContrast = 40, minCoverage = 0.4 } = options;
  const { width, height } = img;
  const tolerance = Math.max(1, Math.round(ridgeReach / 4));
  const maps = new RidgeMaps(width, height, img, ridgeReach, minContrast, tolerance);
  const gap = ridgeReach;
  const band = ridgeReach * BAND_PER_REACH;

  // 覆盖率只在原框的跨度内统计：边框线贯穿这段，框外别的东西不掺进来
  const span = {
    left: clamp(rough.left, 0, width - 1),
    right: clamp(rough.right, 0, width - 1),
    top: clamp(rough.top, 0, height - 1),
    bottom: clamp(rough.bottom, 0, height - 1)
  };
  const column = (x: number) => maps.column(x, span.top, span.bottom);
  const row = (y: number) => maps.row(y, span.left, span.right);
  const find = (coverage: (pos: number) => number, edge: Edge, outward: -1 | 1, hi: number) =>
    findCandidates(coverage, rough[edge], outward, 0, hi, maxShift, minCoverage, tolerance);
  const candidates: Record<Edge, Candidate[]> = {
    left: find(column, "left", -1, width - 1),
    right: find(column, "right", 1, width - 1),
    top: find(row, "top", -1, height - 1),
    bottom: find(row, "bottom", 1, height - 1)
  };

  /**
   * 结构分：往里 band 像素内，垂直的两条边框（至少一条）在不在；往外 band 像素内，它们是不是已经没了。
   * 跳过线本身的 gap 像素再看，免得把这条线自己的发光算进去。
   */
  const structure = (edge: Edge, c: Candidate, box: PixelBox): number => {
    const inward = edge === "left" || edge === "top" ? 1 : -1;
    const insideFrom = c.peak + inward * gap;
    const insideTo = c.peak + inward * (gap + band);
    const outsideFrom = c.peak - inward * gap;
    const outsideTo = c.peak - inward * (gap + band);
    if (edge === "left" || edge === "right") {
      const rows = [box.top, box.bottom];
      const inside = Math.max(...rows.map((y) => maps.row(y, insideFrom, insideTo)));
      const outside = Math.max(...rows.map((y) => maps.row(y, outsideFrom, outsideTo)));
      return inside - outside;
    }
    const cols = [box.left, box.right];
    const inside = Math.max(...cols.map((x) => maps.column(x, insideFrom, insideTo)));
    const outside = Math.max(...cols.map((x) => maps.column(x, outsideFrom, outsideTo)));
    return inside - outside;
  };

  /**
   * 一条边在某个候选矩形里的得分：覆盖率（按这个矩形自己的跨度量）+ 结构分 − 离原边的距离。
   * 没有候选的边固定在原位，不加分也不扣分。
   */
  const edgeScore = (edge: Edge, c: Candidate | null, box: PixelBox): number => {
    if (!c) {
      return 0;
    }
    const coverage =
      edge === "left" || edge === "right"
        ? maps.column(c.peak, box.top, box.bottom)
        : maps.row(c.peak, box.left, box.right);
    const distance = Math.abs(c.outer - rough[edge]) / Math.max(1, maxShift);
    return coverage + structure(edge, c, box) - DISTANCE_WEIGHT * distance;
  };

  // 四条边**一起**选：枚举候选组合，每个组合用它自己的四条边互相判定。逐条边交替细化会出现两条边一起选错、
  // 互相印证、再也绕不出来的情况（实测：框画大 30 像素，左边吸到整屏外框、底边吸到隔壁卡片，结构分彼此成立）
  const choicesFor = (edge: Edge): Array<Candidate | null> => {
    const list = [...candidates[edge]].sort((a, b) => b.coverage - a.coverage).slice(0, MAX_CANDIDATES);
    return list.length > 0 ? list : [null];
  };
  const peakOf = (edge: Edge, c: Candidate | null) => c?.peak ?? rough[edge];

  const chosen: Record<Edge, Candidate | null> = { left: null, top: null, right: null, bottom: null };
  let bestScore = -Infinity;
  for (const left of choicesFor("left")) {
    for (const right of choicesFor("right")) {
      for (const top of choicesFor("top")) {
        for (const bottom of choicesFor("bottom")) {
          const box = {
            left: peakOf("left", left),
            right: peakOf("right", right),
            top: peakOf("top", top),
            bottom: peakOf("bottom", bottom)
          };
          if (box.right <= box.left || box.bottom <= box.top) {
            continue;
          }
          const score =
            edgeScore("left", left, box) +
            edgeScore("right", right, box) +
            edgeScore("top", top, box) +
            edgeScore("bottom", bottom, box);
          if (score > bestScore) {
            bestScore = score;
            Object.assign(chosen, { left, right, top, bottom });
          }
        }
      }
    }
  }

  return {
    box: {
      left: chosen.left?.outer ?? rough.left,
      top: chosen.top?.outer ?? rough.top,
      right: chosen.right?.outer ?? rough.right,
      bottom: chosen.bottom?.outer ?? rough.bottom
    },
    snapped: {
      left: chosen.left !== null,
      top: chosen.top !== null,
      right: chosen.right !== null,
      bottom: chosen.bottom !== null
    }
  };
}
