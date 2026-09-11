// 根据 模板「核心布局.分区布局」自动渲染 ASCII 布局示意图，写回模板的「布局示意图」字段（字符串数组）。
// 原则：几何归代码——框图由网格坐标确定性渲染，不手画。
// 用法： node render-template-ascii.mjs <模板路径>
import fs from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("用法: node render-template-ascii.mjs <模板路径>");
  process.exit(1);
}

const tmpl = JSON.parse(fs.readFileSync(file, "utf-8"));
const 分区 = tmpl["核心布局"]?.["分区布局"];
const { cols: COLS, rows: ROWS } = tmpl["网格"] ?? { cols: 24, rows: 12 };
if (!分区) {
  console.error("找不到 核心布局.分区布局");
  process.exit(1);
}

// ---- 1. 分区归一化 + 背景层剔除（面积占比>80% 视为贯穿背景）----
const 面积比 = (z) => ((z.colEnd - z.colStart + 1) * (z.rowEnd - z.rowStart + 1)) / (COLS * ROWS);
const 条目 = Object.entries(分区).map(([k, z]) => ({ key: k, ...z }));
const 背景 = 条目.filter((z) => 面积比(z) > 0.8);
const 实体 = 条目.filter((z) => 面积比(z) <= 0.8);

// ---- 2. 工具：切段 / 覆盖判定 ----
const segments = (items, axis, max) => {
  const pts = new Set([1, max + 1]);
  for (const z of items) {
    pts.add(z[`${axis}Start`]);
    pts.add(z[`${axis}End`] + 1);
  }
  const sorted = [...pts].sort((a, b) => a - b);
  const segs = [];
  for (let i = 0; i < sorted.length - 1; i++) segs.push({ start: sorted[i], end: sorted[i + 1] - 1 });
  return segs;
};
const covers = (z, seg, axis) => z[`${axis}Start`] <= seg.start && z[`${axis}End`] >= seg.end;

const colSegs = segments(实体, "col", COLS);

// ---- 3. 预处理：部分宽分区让出与全宽分区共享的首行，消除重叠碎段 ----
// 例：header row1-2 与 left/right row2-12 共享 row2 → left/right 改从 row3 起，行段变干净
const isFullWidth = (z) => colSegs.every((s) => covers(z, s, "col"));
for (const z of 实体) {
  if (isFullWidth(z)) continue;
  for (const f of 实体) {
    if (f !== z && isFullWidth(f) && z.rowStart <= f.rowEnd) z.rowStart = f.rowEnd + 1;
  }
}
const rowSegs = segments(实体, "row", ROWS);
const nR = rowSegs.length;
const nC = colSegs.length;

// ---- 4. cell 归属（最具体者赢；无则 null=背景透出）----
const spanOf = (z) =>
  colSegs.filter((s) => covers(z, s, "col")).length * rowSegs.filter((s) => covers(z, s, "row")).length;
const grid = rowSegs.map((rs) =>
  colSegs.map((cs) => {
    const cand = 实体.filter((z) => covers(z, cs, "col") && covers(z, rs, "row"));
    return cand.length ? cand.sort((a, b) => spanOf(a) - spanOf(b))[0] : null;
  })
);

// ---- 5. 统一框图渲染（合并相邻同区；null 背景区不画框，避免误导连接）----
const dw = (s) => [...s].reduce((n, ch) => n + (/[　-鿿＀-￯]/.test(ch) ? 2 : 1), 0);
const pad = (s, w) => s + " ".repeat(Math.max(0, w - dw(s)));
const segW = (s) => Math.max(10, (s.end - s.start + 1) * 4);
const colPx0 = [0];
for (const s of colSegs) colPx0.push(colPx0[colPx0.length - 1] + segW(s) + 1);
const rowH = 3;
const rowPx0 = [0];
for (const s of rowSegs) rowPx0.push(rowPx0[rowPx0.length - 1] + rowH + 1);
const cw = colPx0[nC] + 1; // +1：补最后一条右边线
const ch = rowPx0[nR] + 1; // +1：补最后一条底边线，避免竖线压到底边
const cv = Array.from({ length: ch }, () => " ".repeat(cw).split(""));
const set = (r, c, s) => {
  if (r >= 0 && r < ch && c >= 0 && c < cw) cv[r][c] = s;
};
const hAt = (r, ci) => {
  for (let x = colPx0[ci] + 1; x <= colPx0[ci + 1] - 1; x++) set(r, x, "─");
};
const vAt = (c, ri) => {
  for (let y = rowPx0[ri] + 1; y <= rowPx0[ri + 1] - 1; y++) set(y, c, "│");
};

// 边存在性：外框强制有；内部按相邻 cell 是否同区（null 不主动有边，其边由相邻实体给出）
const hasH = (r, ci) => {
  if (r === 0 || r === nR) return true;
  const a = grid[r - 1][ci];
  const b = grid[r][ci];
  return (a || b) && (!a || !b || a.key !== b.key);
};
const hasV = (c, ri) => {
  if (c === 0 || c === nC) return true;
  const a = grid[ri][c - 1];
  const b = grid[ri][c];
  return (a || b) && (!a || !b || a.key !== b.key);
};
// 水平边中段（不含交叉点）
for (let r = 0; r <= nR; r++)
  for (let ci = 0; ci < nC; ci++)
    if (hasH(r, ci)) for (let x = colPx0[ci] + 1; x < colPx0[ci + 1]; x++) set(rowPx0[r], x, "─");
// 竖直边中段
for (let c = 0; c <= nC; c++)
  for (let ri = 0; ri < nR; ri++)
    if (hasV(c, ri)) for (let y = rowPx0[ri] + 1; y < rowPx0[ri + 1]; y++) set(y, colPx0[c], "│");
// 交叉点：据 4 向边存在性填角字符
const CORNERS = {
  "0001": "─", "0010": "─", "0011": "─",
  "0100": "│", "1000": "│", "1100": "│",
  "0101": "┌", "0110": "┐",
  "1001": "└", "1010": "┘",
  "0111": "┬", "1011": "┴",
  "1101": "├", "1110": "┤",
  "1111": "┼"
};
for (let r = 0; r <= nR; r++) {
  for (let c = 0; c <= nC; c++) {
    const up = r > 0 && hasV(c, r - 1);
    const dn = r < nR && hasV(c, r);
    const lf = c > 0 && hasH(r, c - 1);
    const rt = c < nC && hasH(r, c);
    const k = (up ? 8 : 0) | (dn ? 4 : 0) | (lf ? 2 : 0) | (rt ? 1 : 0);
    if (k) set(rowPx0[r], colPx0[c], CORNERS[k.toString(2).padStart(4, "0")]);
  }
}

// 标签：每个分区在其连通 bbox 中心写一次（避免跨 cell 重复，如全宽 header / 跨行段 left）
const bbox = new Map();
for (let ri = 0; ri < nR; ri++) {
  for (let ci = 0; ci < nC; ci++) {
    const z = grid[ri][ci];
    if (!z) continue;
    const b = bbox.get(z.key);
    if (!b) bbox.set(z.key, { minRi: ri, maxRi: ri, minCi: ci, maxCi: ci, key: z.key });
    else {
      b.minRi = Math.min(b.minRi, ri);
      b.maxRi = Math.max(b.maxRi, ri);
      b.minCi = Math.min(b.minCi, ci);
      b.maxCi = Math.max(b.maxCi, ci);
    }
  }
}
for (const b of bbox.values()) {
  const riC = Math.floor((b.minRi + b.maxRi) / 2);
  const y = rowPx0[riC] + 1 + Math.floor((rowH - 1) / 2);
  const xCenter = (colPx0[b.minCi] + colPx0[b.maxCi + 1] - 1) / 2;
  const off = Math.round(xCenter - dw(b.key) / 2);
  [...b.key].forEach((ch2, i) => set(y, off + i, ch2));
}

// ---- 6. 拼装：行标尺 + 列标尺 + 图 + 图例（字符串数组）----
const PADW = 11;
const colRuler =
  " ".repeat(PADW) +
  colSegs.map((s, i) => pad(`col${s.start}-${s.end}`, colPx0[i + 1] - colPx0[i] - 1)).join(" ");
const midRow = (ri) => rowPx0[ri] + 1 + Math.floor((rowH - 1) / 2);
const lines = [
  colRuler,
  ...cv.map((row, y) => {
    const ri = rowSegs.findIndex((_, i) => y === midRow(i));
    const tag = ri >= 0 ? `row${rowSegs[ri].start}-${rowSegs[ri].end}` : "";
    return pad(tag, PADW) + row.join("").replace(/\s+$/g, "");
  })
];

const legend = [];
if (背景.length) legend.push(`背景层（贯穿全屏，图中空白处即背景透出）：${背景.map((z) => `${z.key}(${z.role})`).join("、")}`);
legend.push("左右面板在 col 轴严格对称：col 1-5 ↔ col 20-24");
const 图行 = [...lines, "", ...legend.map((l) => `· ${l}`)];

console.log(图行.join("\n"));
console.log("\n──────── 已渲染，写回", file.split(/[\\/]/).pop(), "────────");

// 写回：「布局示意图」存为字符串数组，置于「网格」之后
tmpl["布局示意图"] = 图行;
const order = ["模板ID", "模板名称", "来源", "分辨率", "网格", "布局示意图", "嵌入摘要", "适配场景", "核心布局", "核心组件", "视觉风格", "交互模式", "AI匹配语义标签"];
const out = {};
for (const k of order) if (k in tmpl) out[k] = tmpl[k];
for (const k of Object.keys(tmpl)) if (!(k in out)) out[k] = tmpl[k];
fs.writeFileSync(file, JSON.stringify(out, null, 2) + "\n", "utf-8");
console.log("完成 ✓");
