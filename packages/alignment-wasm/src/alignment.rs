use crate::types::{BBox, HasBBox, RBush};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

/// 包含中点坐标的包围盒
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct BBoxWithMid {
    pub min_x: f64,
    pub min_y: f64,
    pub mid_x: f64,
    pub mid_y: f64,
    pub max_x: f64,
    pub max_y: f64,
}

impl BBoxWithMid {
    /// 从标准 BBox 创建带中点的包围盒
    pub fn from_bbox(bbox: &BBox) -> Self {
        BBoxWithMid {
            min_x: bbox.min_x,
            min_y: bbox.min_y,
            mid_x: (bbox.min_x + bbox.max_x) / 2.0,
            mid_y: (bbox.min_y + bbox.max_y) / 2.0,
            max_x: bbox.max_x,
            max_y: bbox.max_y,
        }
    }

    /// 转换为标准 BBox
    pub fn to_bbox(&self) -> BBox {
        BBox::new(self.min_x, self.min_y, self.max_x, self.max_y)
    }
}

/// 垂直参考线（x 相同，包含多个 y 坐标点）
#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct VerticalLine {
    x: f64,
    ys: Vec<f64>,
}

#[wasm_bindgen]
impl VerticalLine {
    /// 获取垂直线的 x 坐标
    #[wasm_bindgen(getter)]
    pub fn x(&self) -> f64 {
        self.x
    }

    /// 获取垂直线的 y 坐标数组
    #[wasm_bindgen(getter)]
    pub fn ys(&self) -> Vec<f64> {
        self.ys.clone()
    }
}

/// 水平参考线（y 相同，包含多个 x 坐标点）
#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct HorizontalLine {
    y: f64,
    xs: Vec<f64>,
}

#[wasm_bindgen]
impl HorizontalLine {
    /// 获取水平线的 y 坐标
    #[wasm_bindgen(getter)]
    pub fn y(&self) -> f64 {
        self.y
    }

    /// 获取水平线的 x 坐标数组
    #[wasm_bindgen(getter)]
    pub fn xs(&self) -> Vec<f64> {
        self.xs.clone()
    }
}

/// 边界类型枚举：用于区分最小值、中点、最大值
#[derive(Debug, Clone, Copy, PartialEq)]
enum BoundaryType {
    Min,
    Mid,
    Max,
}

/// 对齐候选项：包含位置、距离和类型
#[derive(Debug, Clone, Copy)]
struct AlignmentCandidate {
    value: f64,        // 参考线的位置
    distance: f64,     // 到目标的距离
    boundary_type: BoundaryType,  // 是哪个边界对齐
}

impl AlignmentCandidate {
    fn new(ref_value: f64, target_value: f64, boundary_type: BoundaryType) -> Self {
        Self {
            value: ref_value,
            distance: (ref_value - target_value).abs(),
            boundary_type,
        }
    }

    /// 计算偏移量
    fn offset(&self, target_value: f64) -> f64 {
        self.value - target_value
    }
}

/// 对齐结果
#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct AlignmentResult {
    offset_x: f64,
    offset_y: f64,
}

#[wasm_bindgen]
impl AlignmentResult {
    /// 创建新的对齐结果
    pub fn new(offset_x: f64, offset_y: f64) -> Self {
        AlignmentResult { offset_x, offset_y }
    }

    /// 创建零偏移的对齐结果
    pub fn zero() -> Self {
        AlignmentResult {
            offset_x: 0.0,
            offset_y: 0.0,
        }
    }

    /// 获取 X 轴的偏移量
    #[wasm_bindgen(getter)]
    pub fn offset_x(&self) -> f64 {
        self.offset_x
    }

    /// 获取 Y 轴的偏移量
    #[wasm_bindgen(getter)]
    pub fn offset_y(&self) -> f64 {
        self.offset_y
    }
}

/// 参考线管理器
pub struct RefLineManager {
    /// 垂直参考线的映射：x -> [y1, y2, ...]
    vertical_lines: HashMap<OrderedFloat, Vec<f64>>,
    /// 水平参考线的映射：y -> [x1, x2, ...]
    horizontal_lines: HashMap<OrderedFloat, Vec<f64>>,

    /// 排序后的 x 坐标数组（用于二分查找）
    sorted_xs: Vec<f64>,
    /// 排序后的 y 坐标数组（用于二分查找）
    sorted_ys: Vec<f64>,

    /// 待绘制的垂直线
    pub to_draw_vertical_lines: Vec<VerticalLine>,
    /// 待绘制的水平线
    pub to_draw_horizontal_lines: Vec<HorizontalLine>,

    /// 吸附临界值（像素）
    tolerance: f64,
}

/// 用于 HashMap key 的浮点数包装器（实现 Eq 和 Hash）
#[derive(Debug, Clone, Copy)]
struct OrderedFloat(f64);

impl PartialEq for OrderedFloat {
    fn eq(&self, other: &Self) -> bool {
        is_equal_float(self.0, other.0)
    }
}

impl Eq for OrderedFloat {}

impl std::hash::Hash for OrderedFloat {
    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
        // 将浮点数转换为有限精度的整数进行哈希
        let rounded = (self.0 * 100000.0).round() as i64;
        rounded.hash(state);
    }
}

impl RefLineManager {
    /// 创建新的参考线管理器
    ///
    /// # 参数
    /// - `tolerance`: 吸附临界值（单位：像素）
    pub fn new(tolerance: f64) -> Self {
        RefLineManager {
            vertical_lines: HashMap::new(),
            horizontal_lines: HashMap::new(),
            sorted_xs: Vec::new(),
            sorted_ys: Vec::new(),
            to_draw_vertical_lines: Vec::new(),
            to_draw_horizontal_lines: Vec::new(),
            tolerance,
        }
    }

    /// 使用 R 树缓存视口内的参考图形
    ///
    /// # 参数
    /// - `rtree`: R 树索引
    /// - `viewport`: 视口边界框
    /// - `exclude_ids`: 要排除的图形 ID（被移动的目标图形）
    pub fn cache_reference_shapes<T: HasBBox + GraphShape>(
        &mut self,
        rtree: &RBush<T>,
        viewport: &BBox,
        exclude_ids: &[String],
    ) {
        self.clear();

        // 使用 R 树查询视口内的所有图形
        let shapes_in_viewport = rtree.search(viewport);

        for shape in shapes_in_viewport.iter() {
            // 排除被移动的目标图形
            if exclude_ids.contains(&shape.id()) {
                continue;
            }

            let bbox = BBoxWithMid::from_bbox(&shape.bbox());

            // 添加垂直参考线（三条：min_x, mid_x, max_x）
            self.add_to_vertical_map(bbox.min_x, &[bbox.min_y, bbox.max_y]);
            self.add_to_vertical_map(bbox.mid_x, &[bbox.min_y, bbox.max_y]);
            self.add_to_vertical_map(bbox.max_x, &[bbox.min_y, bbox.max_y]);

            // 添加水平参考线（三条：min_y, mid_y, max_y）
            self.add_to_horizontal_map(bbox.min_y, &[bbox.min_x, bbox.max_x]);
            self.add_to_horizontal_map(bbox.mid_y, &[bbox.min_x, bbox.max_x]);
            self.add_to_horizontal_map(bbox.max_y, &[bbox.min_x, bbox.max_x]);
        }

        // 对 x 和 y 坐标排序，用于二分查找
        self.sorted_xs = self.vertical_lines.keys().map(|k| k.0).collect();
        self.sorted_xs.sort_by(|a, b| a.partial_cmp(b).unwrap());

        self.sorted_ys = self.horizontal_lines.keys().map(|k| k.0).collect();
        self.sorted_ys.sort_by(|a, b| a.partial_cmp(b).unwrap());
    }

    /// 找到最佳对齐候选项（从三个边界中选择距离最近的）
    ///
    /// # 参数
    /// - `sorted_refs`: 已排序的参考线位置数组
    /// - `target`: 目标包围盒（带中点）
    /// - `get_values`: 闭包，提取三个边界值（min, mid, max）
    ///
    /// # 返回
    /// 返回最接近的候选项（如果在容差范围内）
    fn find_best_alignment<F>(
        &self,
        sorted_refs: &[f64],
        target: &BBoxWithMid,
        get_values: F,
    ) -> Option<AlignmentCandidate>
    where
        F: Fn(&BBoxWithMid) -> (f64, f64, f64),
    {
        if sorted_refs.is_empty() {
            return None;
        }

        let (min_val, mid_val, max_val) = get_values(target);

        // 创建三个候选项
        let candidates = [
            AlignmentCandidate::new(
                find_closest_in_sorted(sorted_refs, min_val),
                min_val,
                BoundaryType::Min,
            ),
            AlignmentCandidate::new(
                find_closest_in_sorted(sorted_refs, mid_val),
                mid_val,
                BoundaryType::Mid,
            ),
            AlignmentCandidate::new(
                find_closest_in_sorted(sorted_refs, max_val),
                max_val,
                BoundaryType::Max,
            ),
        ];

        // 找到距离最小的候选项
        candidates
            .iter()
            .min_by(|a, b| a.distance.partial_cmp(&b.distance).unwrap())
            .filter(|c| c.distance <= self.tolerance)
            .copied()
    }

    /// 标记需要绘制的垂直参考线
    ///
    /// # 参数
    /// - `candidate`: 对齐候选项
    /// - `target`: 原始目标包围盒
    /// - `corrected`: 修正后的目标包围盒
    fn mark_vertical_line(
        &mut self,
        candidate: &AlignmentCandidate,
        target: &BBoxWithMid,
        corrected: &BBoxWithMid,
    ) {
        let (x, point_ys) = match candidate.boundary_type {
            BoundaryType::Min => {
                let expected_offset = candidate.offset(target.min_x);
                if !is_equal_float(candidate.offset(target.min_x), expected_offset) {
                    return;
                }
                (corrected.min_x, vec![corrected.min_y, corrected.max_y])
            }
            BoundaryType::Mid => {
                let expected_offset = candidate.offset(target.mid_x);
                if !is_equal_float(candidate.offset(target.mid_x), expected_offset) {
                    return;
                }
                (corrected.mid_x, vec![corrected.mid_y])
            }
            BoundaryType::Max => {
                let expected_offset = candidate.offset(target.max_x);
                if !is_equal_float(candidate.offset(target.max_x), expected_offset) {
                    return;
                }
                (corrected.max_x, vec![corrected.min_y, corrected.max_y])
            }
        };

        if let Some(ref_ys) = self.vertical_lines.get(&OrderedFloat(x)) {
            let mut all_ys = point_ys;
            all_ys.extend_from_slice(ref_ys);
            self.to_draw_vertical_lines.push(VerticalLine { x, ys: all_ys });
        }
    }

    /// 标记需要绘制的水平参考线
    ///
    /// # 参数
    /// - `candidate`: 对齐候选项
    /// - `target`: 原始目标包围盒
    /// - `corrected`: 修正后的目标包围盒
    fn mark_horizontal_line(
        &mut self,
        candidate: &AlignmentCandidate,
        target: &BBoxWithMid,
        corrected: &BBoxWithMid,
    ) {
        let (y, point_xs) = match candidate.boundary_type {
            BoundaryType::Min => {
                let expected_offset = candidate.offset(target.min_y);
                if !is_equal_float(candidate.offset(target.min_y), expected_offset) {
                    return;
                }
                (corrected.min_y, vec![corrected.min_x, corrected.max_x])
            }
            BoundaryType::Mid => {
                let expected_offset = candidate.offset(target.mid_y);
                if !is_equal_float(candidate.offset(target.mid_y), expected_offset) {
                    return;
                }
                (corrected.mid_y, vec![corrected.mid_x])
            }
            BoundaryType::Max => {
                let expected_offset = candidate.offset(target.max_y);
                if !is_equal_float(candidate.offset(target.max_y), expected_offset) {
                    return;
                }
                (corrected.max_y, vec![corrected.min_x, corrected.max_x])
            }
        };

        if let Some(ref_xs) = self.horizontal_lines.get(&OrderedFloat(y)) {
            let mut all_xs = point_xs;
            all_xs.extend_from_slice(ref_xs);
            self.to_draw_horizontal_lines.push(HorizontalLine { y, xs: all_xs });
        }
    }

    /// 更新参考线并计算偏移量
    ///
    /// # 参数
    /// - `target_bbox`: 被移动图形的包围盒
    ///
    /// # 返回
    /// 返回吸附的偏移量
    pub fn update_ref_line(&mut self, target_bbox: &BBox) -> AlignmentResult {
        // 重置待绘制的参考线
        self.to_draw_vertical_lines.clear();
        self.to_draw_horizontal_lines.clear();

        let target = BBoxWithMid::from_bbox(target_bbox);

        // 如果没有参考线，直接返回
        if self.sorted_xs.is_empty() && self.sorted_ys.is_empty() {
            return AlignmentResult::zero();
        }

        // 使用辅助方法找到最佳对齐候选项
        let x_candidate = self.find_best_alignment(&self.sorted_xs, &target, |t| {
            (t.min_x, t.mid_x, t.max_x)
        });

        let y_candidate = self.find_best_alignment(&self.sorted_ys, &target, |t| {
            (t.min_y, t.mid_y, t.max_y)
        });

        // 计算偏移量
        let offset_x = x_candidate.map(|c| match c.boundary_type {
            BoundaryType::Min => c.offset(target.min_x),
            BoundaryType::Mid => c.offset(target.mid_x),
            BoundaryType::Max => c.offset(target.max_x),
        });

        let offset_y = y_candidate.map(|c| match c.boundary_type {
            BoundaryType::Min => c.offset(target.min_y),
            BoundaryType::Mid => c.offset(target.mid_y),
            BoundaryType::Max => c.offset(target.max_y),
        });

        // 应用偏移量到目标包围盒
        let mut corrected_target = target;
        if let Some(ox) = offset_x {
            corrected_target.min_x += ox;
            corrected_target.mid_x += ox;
            corrected_target.max_x += ox;
        }
        if let Some(oy) = offset_y {
            corrected_target.min_y += oy;
            corrected_target.mid_y += oy;
            corrected_target.max_y += oy;
        }

        // 标记需要绘制的参考线
        if let Some(candidate) = x_candidate {
            self.mark_vertical_line(&candidate, &target, &corrected_target);
        }
        if let Some(candidate) = y_candidate {
            self.mark_horizontal_line(&candidate, &target, &corrected_target);
        }

        AlignmentResult::new(offset_x.unwrap_or(0.0), offset_y.unwrap_or(0.0))
    }

    /// 清除所有缓存
    fn clear(&mut self) {
        self.vertical_lines.clear();
        self.horizontal_lines.clear();
        self.sorted_xs.clear();
        self.sorted_ys.clear();
        self.to_draw_vertical_lines.clear();
        self.to_draw_horizontal_lines.clear();
    }

    /// 添加垂直线到映射
    fn add_to_vertical_map(&mut self, x: f64, ys: &[f64]) {
        let key = OrderedFloat(x);
        self.vertical_lines
            .entry(key)
            .or_insert_with(Vec::new)
            .extend_from_slice(ys);
    }

    /// 添加水平线到映射
    fn add_to_horizontal_map(&mut self, y: f64, xs: &[f64]) {
        let key = OrderedFloat(y);
        self.horizontal_lines
            .entry(key)
            .or_insert_with(Vec::new)
            .extend_from_slice(xs);
    }
}

/// 在排序数组中找到最接近目标值的元素（二分查找变体）
///
/// # 参数
/// - `sorted_arr`: 已排序的数组
/// - `target`: 目标值
///
/// # 返回
/// 数组中最接近目标值的元素
pub fn find_closest_in_sorted(sorted_arr: &[f64], target: f64) -> f64 {
    if sorted_arr.is_empty() {
        panic!("sortedArr can not be empty");
    }

    if sorted_arr.len() == 1 {
        return sorted_arr[0];
    }

    let mut left = 0;
    let mut right = sorted_arr.len() - 1;

    while left <= right {
        let mid = (left + right) / 2;

        if sorted_arr[mid] == target {
            return sorted_arr[mid];
        } else if sorted_arr[mid] < target {
            left = mid + 1;
        } else {
            if mid == 0 {
                break;
            }
            right = mid - 1;
        }
    }

    // 检查边界
    if left >= sorted_arr.len() {
        return sorted_arr[right];
    }
    if right == 0 && sorted_arr[0] > target {
        return sorted_arr[left];
    }

    // 比较哪个更接近
    if (sorted_arr[right] - target).abs() <= (sorted_arr[left] - target).abs() {
        sorted_arr[right]
    } else {
        sorted_arr[left]
    }
}

/// 判断两个浮点数是否相等（考虑浮点数误差）
pub fn is_equal_float(a: f64, b: f64) -> bool {
    (a - b).abs() < 0.00001
}

/// 图形形状 trait（需要实现此 trait 才能使用对齐功能）
pub trait GraphShape {
    fn id(&self) -> String;
}