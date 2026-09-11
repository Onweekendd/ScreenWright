/* @ts-self-types="./bi_alignment.d.ts" */

/**
 * 对齐结果
 */
export class AlignmentResult {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AlignmentResult.prototype);
        obj.__wbg_ptr = ptr;
        AlignmentResultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AlignmentResultFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_alignmentresult_free(ptr, 0);
    }
    /**
     * 创建新的对齐结果
     * @param {number} offset_x
     * @param {number} offset_y
     * @returns {AlignmentResult}
     */
    static new(offset_x, offset_y) {
        const ret = wasm.alignmentresult_new(offset_x, offset_y);
        return AlignmentResult.__wrap(ret);
    }
    /**
     * 获取 X 轴的偏移量
     * @returns {number}
     */
    get offset_x() {
        const ret = wasm.alignmentresult_offset_x(this.__wbg_ptr);
        return ret;
    }
    /**
     * 获取 Y 轴的偏移量
     * @returns {number}
     */
    get offset_y() {
        const ret = wasm.alignmentresult_offset_y(this.__wbg_ptr);
        return ret;
    }
    /**
     * 创建零偏移的对齐结果
     * @returns {AlignmentResult}
     */
    static zero() {
        const ret = wasm.alignmentresult_zero();
        return AlignmentResult.__wrap(ret);
    }
}
if (Symbol.dispose) AlignmentResult.prototype[Symbol.dispose] = AlignmentResult.prototype.free;

/**
 * BI 对齐实例
 *
 * 管理图形节点的空间索引（R树）和对齐线计算。
 * 提供完整的节点管理和实时对齐线功能。
 */
export class BIAlignmentInstance {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BIAlignmentInstanceFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bialignmentinstance_free(ptr, 0);
    }
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
     * @param {BINode} node
     * @returns {boolean}
     */
    add_node(node) {
        _assertClass(node, BINode);
        var ptr0 = node.__destroy_into_raw();
        const ret = wasm.bialignmentinstance_add_node(this.__wbg_ptr, ptr0);
        return ret !== 0;
    }
    /**
     * @param {number} min_x
     * @param {number} min_y
     * @param {number} max_x
     * @param {number} max_y
     * @param {string[]} exclude_ids
     */
    cache_reference_shapes(min_x, min_y, max_x, max_y, exclude_ids) {
        const ptr0 = passArrayJsValueToWasm0(exclude_ids, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.bialignmentinstance_cache_reference_shapes(this.__wbg_ptr, min_x, min_y, max_x, max_y, ptr0, len0);
    }
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
    clear_alignment() {
        wasm.bialignmentinstance_clear_alignment(this.__wbg_ptr);
    }
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
     * @param {BINode} node
     * @returns {boolean}
     */
    delete_node(node) {
        _assertClass(node, BINode);
        const ret = wasm.bialignmentinstance_delete_node(this.__wbg_ptr, node.__wbg_ptr);
        return ret !== 0;
    }
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
     * @returns {HorizontalLine[]}
     */
    get_horizontal_lines() {
        const ret = wasm.bialignmentinstance_get_horizontal_lines(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
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
     * @returns {VerticalLine[]}
     */
    get_vertical_lines() {
        const ret = wasm.bialignmentinstance_get_vertical_lines(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
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
     * @param {BINode[]} nodes
     */
    initialize(nodes) {
        const ptr0 = passArrayJsValueToWasm0(nodes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.bialignmentinstance_initialize(this.__wbg_ptr, ptr0, len0);
    }
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
     * @param {number} tolerance
     */
    constructor(tolerance) {
        const ret = wasm.bialignmentinstance_new(tolerance);
        this.__wbg_ptr = ret >>> 0;
        BIAlignmentInstanceFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
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
     * @param {number} x
     * @param {number} y
     * @returns {Uint32Array}
     */
    search_point(x, y) {
        const ret = wasm.bialignmentinstance_search_point(this.__wbg_ptr, x, y);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
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
     * @param {BINode} old_item
     * @param {BINode} new_item
     * @returns {boolean}
     */
    update_node(old_item, new_item) {
        _assertClass(old_item, BINode);
        _assertClass(new_item, BINode);
        var ptr0 = new_item.__destroy_into_raw();
        const ret = wasm.bialignmentinstance_update_node(this.__wbg_ptr, old_item.__wbg_ptr, ptr0);
        return ret !== 0;
    }
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
     * @param {number} min_x
     * @param {number} min_y
     * @param {number} max_x
     * @param {number} max_y
     * @returns {AlignmentResult}
     */
    update_ref_line(min_x, min_y, max_x, max_y) {
        const ret = wasm.bialignmentinstance_update_ref_line(this.__wbg_ptr, min_x, min_y, max_x, max_y);
        return AlignmentResult.__wrap(ret);
    }
}
if (Symbol.dispose) BIAlignmentInstance.prototype[Symbol.dispose] = BIAlignmentInstance.prototype.free;

/**
 * BI 节点结构体
 *
 * 表示一个可以参与对齐计算的图形节点，包含其位置和尺寸信息。
 * 用于存储在 R树中进行空间索引，并参与对齐线的计算。
 */
export class BINode {
    static __unwrap(jsValue) {
        if (!(jsValue instanceof BINode)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BINodeFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_binode_free(ptr, 0);
    }
    /**
     * 获取节点高度
     * @returns {number}
     */
    get height() {
        const ret = wasm.binode_height(this.__wbg_ptr);
        return ret;
    }
    /**
     * 获取节点 ID
     * @returns {number}
     */
    get id() {
        const ret = wasm.binode_id(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * 获取节点左边缘 x 坐标
     * @returns {number}
     */
    get left() {
        const ret = wasm.binode_left(this.__wbg_ptr);
        return ret;
    }
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
     * @param {number} id
     * @param {number} left
     * @param {number} top
     * @param {number} width
     * @param {number} height
     */
    constructor(id, left, top, width, height) {
        const ret = wasm.binode_new(id, left, top, width, height);
        this.__wbg_ptr = ret >>> 0;
        BINodeFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * 获取节点上边缘 y 坐标
     * @returns {number}
     */
    get top() {
        const ret = wasm.binode_top(this.__wbg_ptr);
        return ret;
    }
    /**
     * 获取节点宽度
     * @returns {number}
     */
    get width() {
        const ret = wasm.binode_width(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) BINode.prototype[Symbol.dispose] = BINode.prototype.free;

/**
 * 水平参考线（y 相同，包含多个 x 坐标点）
 */
export class HorizontalLine {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(HorizontalLine.prototype);
        obj.__wbg_ptr = ptr;
        HorizontalLineFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        HorizontalLineFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_horizontalline_free(ptr, 0);
    }
    /**
     * 获取水平线的 x 坐标数组
     * @returns {Float64Array}
     */
    get xs() {
        const ret = wasm.horizontalline_xs(this.__wbg_ptr);
        var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v1;
    }
    /**
     * 获取水平线的 y 坐标
     * @returns {number}
     */
    get y() {
        const ret = wasm.horizontalline_y(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) HorizontalLine.prototype[Symbol.dispose] = HorizontalLine.prototype.free;

/**
 * 垂直参考线（x 相同，包含多个 y 坐标点）
 */
export class VerticalLine {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(VerticalLine.prototype);
        obj.__wbg_ptr = ptr;
        VerticalLineFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        VerticalLineFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_verticalline_free(ptr, 0);
    }
    /**
     * 获取垂直线的 x 坐标
     * @returns {number}
     */
    get x() {
        const ret = wasm.verticalline_x(this.__wbg_ptr);
        return ret;
    }
    /**
     * 获取垂直线的 y 坐标数组
     * @returns {Float64Array}
     */
    get ys() {
        const ret = wasm.verticalline_ys(this.__wbg_ptr);
        var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v1;
    }
}
if (Symbol.dispose) VerticalLine.prototype[Symbol.dispose] = VerticalLine.prototype.free;

function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_string_get_395e606bd0ee4427: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_6ddd609b62940d55: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_binode_unwrap: function(arg0) {
            const ret = BINode.__unwrap(arg0);
            return ret;
        },
        __wbg_horizontalline_new: function(arg0) {
            const ret = HorizontalLine.__wrap(arg0);
            return ret;
        },
        __wbg_verticalline_new: function(arg0) {
            const ret = VerticalLine.__wrap(arg0);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./bi_alignment_bg.js": import0,
    };
}

const AlignmentResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_alignmentresult_free(ptr >>> 0, 1));
const BIAlignmentInstanceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bialignmentinstance_free(ptr >>> 0, 1));
const BINodeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_binode_free(ptr >>> 0, 1));
const HorizontalLineFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_horizontalline_free(ptr >>> 0, 1));
const VerticalLineFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_verticalline_free(ptr >>> 0, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

function getArrayF64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(wasm.__wbindgen_externrefs.get(mem.getUint32(i, true)));
    }
    wasm.__externref_drop_slice(ptr, len);
    return result;
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

let cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArrayJsValueToWasm0(array, malloc) {
    const ptr = malloc(array.length * 4, 4) >>> 0;
    for (let i = 0; i < array.length; i++) {
        const add = addToExternrefTable0(array[i]);
        getDataViewMemory0().setUint32(ptr + 4 * i, add, true);
    }
    WASM_VECTOR_LEN = array.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasm;
function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedFloat64ArrayMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('bi_alignment_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
