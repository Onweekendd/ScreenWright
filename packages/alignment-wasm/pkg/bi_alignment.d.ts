/* tslint:disable */
/* eslint-disable */

/**
 * 对齐结果
 */
export class AlignmentResult {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * 创建新的对齐结果
     */
    static new(offset_x: number, offset_y: number): AlignmentResult;
    /**
     * 创建零偏移的对齐结果
     */
    static zero(): AlignmentResult;
    /**
     * 获取 X 轴的偏移量
     */
    readonly offset_x: number;
    /**
     * 获取 Y 轴的偏移量
     */
    readonly offset_y: number;
}

/**
 * BI 对齐实例
 *
 * 管理图形节点的空间索引（R树）和对齐线计算。
 * 提供完整的节点管理和实时对齐线功能。
 */
export class BIAlignmentInstance {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * 向 R树添加单个节点
     *
     * # 参数
     * - `node`: 要添加的节点
     *
     * # 返回
     * 成功返回 true，失败返回 false
     *
     * # 示例
     * ```javascript
     * const node = new BINode(3, 300, 200, 70, 50);
     * instance.add_node(node);
     * ```
     */
    add_node(node: BINode): boolean;
    cache_reference_shapes(min_x: number, min_y: number, max_x: number, max_y: number, exclude_ids: string[]): void;
    /**
     * 清除对齐线缓存
     *
     * 清空所有待绘制的对齐线。
     * 通常在拖动结束时调用，以隐藏对齐线。
     *
     * # 示例
     * ```javascript
     * instance.clear_alignment();
     * ```
     */
    clear_alignment(): void;
    /**
     * 从 R树删除指定节点
     *
     * # 参数
     * - `node`: 要删除的节点（根据 ID 匹配）
     *
     * # 返回
     * 成功返回 true，失败返回 false
     *
     * # 示例
     * ```javascript
     * instance.delete_node(node);
     * ```
     */
    delete_node(node: BINode): boolean;
    /**
     * 获取需要绘制的水平参考线
     *
     * 返回所有应该绘制的水平对齐线（红色虚线）。
     * 每条线包含 y 坐标和对应的 x 坐标数组。
     *
     * # 返回
     * 水平线数组
     *
     * # 示例
     * ```javascript
     * const hLines = instance.get_horizontal_lines();
     * hLines.forEach(line => {
     *   const y = line.y;
     *   const xs = line.xs;
     *   // 绘制从 min(xs) 到 max(xs) 的水平线
     * });
     * ```
     */
    get_horizontal_lines(): HorizontalLine[];
    /**
     * 获取需要绘制的垂直参考线
     *
     * 返回所有应该绘制的垂直对齐线（红色虚线）。
     * 每条线包含 x 坐标和对应的 y 坐标数组。
     *
     * # 返回
     * 垂直线数组
     *
     * # 示例
     * ```javascript
     * const vLines = instance.get_vertical_lines();
     * vLines.forEach(line => {
     *   const x = line.x;
     *   const ys = line.ys;
     *   // 绘制从 min(ys) 到 max(ys) 的垂直线
     * });
     * ```
     */
    get_vertical_lines(): VerticalLine[];
    /**
     * 批量初始化所有节点到 R树
     *
     * 使用高效的批量加载算法，比逐个插入快得多。
     * 适合在应用启动时一次性加载所有节点。
     *
     * # 参数
     * - `nodes`: 要加载的节点数组
     *
     * # 示例
     * ```javascript
     * const nodes = [
     *   new BINode(1, 100, 100, 50, 50),
     *   new BINode(2, 200, 150, 60, 40)
     * ];
     * instance.initialize(nodes);
     * ```
     */
    initialize(nodes: BINode[]): void;
    /**
     * 创建一个新的 BIAlignmentInstance 实例
     *
     * 初始化 R树（max_entries=9, min_entries=4）和对齐线管理器（tolerance=2.0px）
     *
     * # 返回
     * 返回新创建的实例
     *
     * # 示例
     * ```javascript
     * const instance = new BIAlignmentInstance();
     * ```
     */
    constructor(tolerance: number);
    /**
     * 缓存视口内的参考图形，用于对齐线计算
     *
     * 使用 R树快速查询视口内的所有节点，并为它们生成对齐参考线。
     * 应在拖动开始时调用一次，以提高拖动过程中的性能。
     *
     * # 参数
     * - `min_x`: 视口左边界
     * - `min_y`: 视口上边界
     * - `max_x`: 视口右边界
     * - `max_y`: 视口下边界
     * - `exclude_ids`: 要排除的节点 ID 数组（通常是正在拖动的节点）
     *
     * # 示例
     * ```javascript
     * instance.cache_reference_shapes(0, 0, 1920, 1080, ["1", "2"]);
     * ```
     */
    search_point(x: number, y: number): Uint32Array;
    /**
     * 更新节点位置
     *
     * 在 R树中删除旧节点并插入新节点，自动重新平衡树结构。
     *
     * # 参数
     * - `old_item`: 旧节点（用于查找）
     * - `new_item`: 新节点（更新后的位置）
     *
     * # 返回
     * 成功返回 true，失败返回 false
     *
     * # 示例
     * ```javascript
     * const oldNode = new BINode(1, 100, 100, 50, 50);
     * const newNode = new BINode(1, 150, 150, 50, 50);
     * instance.update_node(oldNode, newNode);
     * ```
     */
    update_node(old_item: BINode, new_item: BINode): boolean;
    /**
     * 计算对齐线和吸附偏移量
     *
     * 根据被拖动节点的当前位置，计算最近的对齐参考线，
     * 并返回吸附偏移量。同时更新待绘制的对齐线列表。
     *
     * # 参数
     * - `min_x`: 节点左边界
     * - `min_y`: 节点上边界
     * - `max_x`: 节点右边界
     * - `max_y`: 节点下边界
     *
     * # 返回
     * 返回 AlignmentResult 对象，包含 offset_x 和 offset_y
     *
     * # 示例
     * ```javascript
     * const result = instance.update_ref_line(100, 100, 150, 150);
     * const finalX = currentX + result.offset_x;
     * const finalY = currentY + result.offset_y;
     * ```
     */
    update_ref_line(min_x: number, min_y: number, max_x: number, max_y: number): AlignmentResult;
}

/**
 * BI 节点结构体
 *
 * 表示一个可以参与对齐计算的图形节点，包含其位置和尺寸信息。
 * 用于存储在 R树中进行空间索引，并参与对齐线的计算。
 */
export class BINode {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * 创建一个新的 BINode 实例
     *
     * # 参数
     * - `id`: 节点的唯一标识符
     * - `left`: 节点左边缘的 x 坐标
     * - `top`: 节点上边缘的 y 坐标
     * - `width`: 节点的宽度
     * - `height`: 节点的高度
     *
     * # 返回
     * 返回新创建的 BINode 实例
     */
    constructor(id: number, left: number, top: number, width: number, height: number);
    /**
     * 获取节点高度
     */
    readonly height: number;
    /**
     * 获取节点 ID
     */
    readonly id: number;
    /**
     * 获取节点左边缘 x 坐标
     */
    readonly left: number;
    /**
     * 获取节点上边缘 y 坐标
     */
    readonly top: number;
    /**
     * 获取节点宽度
     */
    readonly width: number;
}

/**
 * 水平参考线（y 相同，包含多个 x 坐标点）
 */
export class HorizontalLine {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * 获取水平线的 x 坐标数组
     */
    readonly xs: Float64Array;
    /**
     * 获取水平线的 y 坐标
     */
    readonly y: number;
}

/**
 * 垂直参考线（x 相同，包含多个 y 坐标点）
 */
export class VerticalLine {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * 获取垂直线的 x 坐标
     */
    readonly x: number;
    /**
     * 获取垂直线的 y 坐标数组
     */
    readonly ys: Float64Array;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_alignmentresult_free: (a: number, b: number) => void;
    readonly __wbg_horizontalline_free: (a: number, b: number) => void;
    readonly __wbg_verticalline_free: (a: number, b: number) => void;
    readonly alignmentresult_new: (a: number, b: number) => number;
    readonly alignmentresult_offset_x: (a: number) => number;
    readonly alignmentresult_offset_y: (a: number) => number;
    readonly alignmentresult_zero: () => number;
    readonly horizontalline_xs: (a: number) => [number, number];
    readonly horizontalline_y: (a: number) => number;
    readonly verticalline_x: (a: number) => number;
    readonly verticalline_ys: (a: number) => [number, number];
    readonly __wbg_bialignmentinstance_free: (a: number, b: number) => void;
    readonly __wbg_binode_free: (a: number, b: number) => void;
    readonly bialignmentinstance_add_node: (a: number, b: number) => number;
    readonly bialignmentinstance_cache_reference_shapes: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly bialignmentinstance_clear_alignment: (a: number) => void;
    readonly bialignmentinstance_delete_node: (a: number, b: number) => number;
    readonly bialignmentinstance_get_horizontal_lines: (a: number) => [number, number];
    readonly bialignmentinstance_get_vertical_lines: (a: number) => [number, number];
    readonly bialignmentinstance_initialize: (a: number, b: number, c: number) => void;
    readonly bialignmentinstance_new: (a: number) => number;
    readonly bialignmentinstance_search_point: (a: number, b: number, c: number) => [number, number];
    readonly bialignmentinstance_update_node: (a: number, b: number, c: number) => number;
    readonly bialignmentinstance_update_ref_line: (a: number, b: number, c: number, d: number, e: number) => number;
    readonly binode_height: (a: number) => number;
    readonly binode_id: (a: number) => number;
    readonly binode_left: (a: number) => number;
    readonly binode_new: (a: number, b: number, c: number, d: number, e: number) => number;
    readonly binode_top: (a: number) => number;
    readonly binode_width: (a: number) => number;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_alloc: () => number;
    readonly __externref_drop_slice: (a: number, b: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
