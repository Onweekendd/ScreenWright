use crate::types::{BBox, HasBBox, RBushNode};
use core::f64;

/**
 * 计算单个边界框的面积。
 *
 * 面积公式： (max_x - min_x) * (max_y - min_y)
 */
pub fn calculate_area(bbox: &BBox) -> f64 {
    (bbox.max_x - bbox.min_x) * (bbox.max_y - bbox.min_y)
}

/**
 * 计算包含两个边界框 `a` 和 `b` 的合并边界框的面积。
 *
 * 合并后的边界框是同时覆盖 a 和 b 的最小矩形。
 */
pub fn calculate_enlarged_area(a: &BBox, b: &BBox) -> f64 {
    (b.max_x.max(a.max_x) - b.min_x.min(a.min_x)) * (b.max_y.max(a.max_y) - b.min_y.min(a.min_y))
}

/**
 * 计算一组节点的分布边界框(并集的最小包围矩形)。
 */
pub fn calculate_distribution_bbox_from_nodes<T: HasBBox>(nodes: &[&Box<RBushNode<T>>]) -> BBox {
    calculate_distribution_bbox(&nodes.iter().map(|n| n.bbox).collect::<Vec<_>>())
}

/**
 * 计算一组边界框的总分布边界框（并集的最小包围矩形）。
 *
 * - 如果切片为空，返回一个全 0 的 bbox。
 * - 否则遍历所有 bbox，按最小 min_x/min_y 和最大 max_x/max_y 合并。
 */
pub fn calculate_distribution_bbox(bboxs: &[BBox]) -> BBox {
    if bboxs.is_empty() {
        BBox::new(0.0, 0.0, 0.0, 0.0)
    } else {
        bboxs.iter().fold(
            BBox::new(
                f64::INFINITY,
                f64::INFINITY,
                f64::NEG_INFINITY,
                f64::NEG_INFINITY,
            ),
            |acc, b| BBox {
                min_x: acc.min_x.min(b.min_x),
                min_y: acc.min_y.min(b.min_y),
                max_x: acc.max_x.max(b.max_x),
                max_y: acc.max_y.max(b.max_y),
            },
        )
    }
}

/**
 * 计算边界框的"边距"（周长的近似值）。
 *
 * 定义： (max_x - min_x) + (max_y - min_y)。
 * 在 R 树分裂算法中用于衡量 bbox 的紧凑程度：边距越小越紧凑。
 */
pub fn calculate_margin(bbox: &BBox) -> f64 {
    (bbox.max_x - bbox.min_x) + (bbox.max_y - bbox.min_y)
}

/**
 * 扩展边界框以包含另一个边界框。
 *
 * 返回一个新的边界框，包含两个输入边界框的并集。
 */
pub fn extend_bbox(bbox: &BBox, new_bbox: &BBox) -> BBox {
    BBox {
        min_x: bbox.min_x.min(new_bbox.min_x),
        min_y: bbox.min_y.min(new_bbox.min_y),
        max_x: bbox.max_x.max(new_bbox.max_x),
        max_y: bbox.max_y.max(new_bbox.max_y),
    }
}

/**
 * 根据路径找到节点的不可变引用。
 *
 * @param root 根节点
 * @param path 从根到目标节点的子节点索引数组
 * @returns 目标节点的不可变引用
 *
 * # Panics
 * 如果路径中的任何索引超出子节点数组边界，将会 panic。
 */
pub fn find_node_by_path<'a, T: HasBBox>(
    root: &'a RBushNode<T>,
    path: &[usize],
) -> &'a RBushNode<T> {
    let mut current = root;
    for (level, &idx) in path.iter().enumerate() {
        assert!(
            idx < current.children.len(),
            "Invalid path at level {}: index {} out of bounds (max {})",
            level,
            idx,
            current.children.len()
        );
        current = current.children[idx].as_ref();
    }
    current
}

/**
 * 根据路径找到节点的可变引用。
 *
 * @param root 根节点
 * @param path 从根到目标节点的子节点索引数组
 * @returns 目标节点的可变引用
 *
 * # Panics
 * 如果路径中的任何索引超出子节点数组边界，将会 panic。
 */
pub fn find_mut_node_by_path<'a, T: HasBBox>(
    root: &'a mut RBushNode<T>,
    path: &[usize],
) -> &'a mut RBushNode<T> {
    let mut current = root;
    for (level, &idx) in path.iter().enumerate() {
        assert!(
            idx < current.children.len(),
            "Invalid path at level {}: index {} out of bounds (max {})",
            level,
            idx,
            current.children.len()
        );
        current = current.children[idx].as_mut();
    }
    current
}

/**
 * 评估子节点：计算插入边界框后的扩张代价。
 *
 * @param bbox 要插入的边界框
 * @param child 候选子节点
 * @returns (enlargement, child_area) - 扩张代价和子节点原始面积
 */
pub fn evaluate_child<T: HasBBox>(bbox: &BBox, child: &RBushNode<T>) -> (f64, f64) {
    let child_bbox = child.bbox;
    let child_area = calculate_area(&child_bbox);
    let enlarged_area = calculate_enlarged_area(bbox, &child_bbox);
    let enlargement = enlarged_area - child_area;
    (enlargement, child_area)
}

/**
 * 计算两个边界框的交集面积。
 * 注意：如果两个边界框没有交集，返回 0.0。
 *
 * @param a 边界框 a
 * @param b 边界框 b
 * @returns 两个边界框的交集面积
 */
pub fn calculate_intersection_area(a: &BBox, b: &BBox) -> f64 {
    let min_x = a.min_x.max(b.min_x);
    let min_y = a.min_y.max(b.min_y);
    let max_x = a.max_x.min(b.max_x);
    let max_y = a.max_y.min(b.max_y);
    if min_x >= max_x || min_y >= max_y {
        return 0.0;
    }

    (max_x - min_x) * (max_y - min_y)
}

/**
 * Quickselect 算法：在未排序的数组中找到第 k 个最小元素。
 *
 * 这个算法会重新排列数组，使得索引 k 处的元素处于正确的位置，
 * 左边的元素都小于等于它，右边的元素都大于等于它。
 *
 * @param arr 要操作的数组（可变引用）
 * @param k 目标索引位置
 * @param left 左边界索引
 * @param right 右边界索引
 * @param compare 比较函数，返回 a 和 b 的比较结果
 */
pub fn quickselect<T, F>(arr: &mut [T], k: usize, mut left: usize, mut right: usize, mut compare: F)
where
    F: FnMut(&T, &T) -> std::cmp::Ordering,
{
    while left < right {
        // 使用中间元素作为基准
        let pivot_index = (left + right) / 2;

        // 分区并获取基准元素的新位置
        let new_pivot_index = partition(arr, left, right, pivot_index, &mut compare);

        if k == new_pivot_index {
            // 找到了目标位置
            return;
        } else if k < new_pivot_index {
            // 在左半部分继续查找
            right = new_pivot_index - 1;
        } else {
            // 在右半部分继续查找
            left = new_pivot_index + 1;
        }
    }
}

/**
 * 分区函数：将数组按照基准元素分区。
 *
 * @param arr 要分区的数组
 * @param left 左边界
 * @param right 右边界
 * @param pivot_index 基准元素的索引
 * @param compare 比较函数
 * @returns 基准元素的新位置
 */
fn partition<T, F>(
    arr: &mut [T],
    left: usize,
    right: usize,
    pivot_index: usize,
    compare: &mut F,
) -> usize
where
    F: FnMut(&T, &T) -> std::cmp::Ordering,
{
    // 将基准元素移到最右边
    arr.swap(pivot_index, right);

    let mut store_index = left;

    // 将所有小于基准的元素移到左边
    for i in left..right {
        if compare(&arr[i], &arr[right]) == std::cmp::Ordering::Less {
            arr.swap(i, store_index);
            store_index += 1;
        }
    }

    // 将基准元素移到正确的位置
    arr.swap(store_index, right);

    store_index
}

/**
 * MultiSelect 算法：对数组进行排序，使项以 n 个未排序项为一组，
 * 组与组之间排序。结合选择算法与二分分治法。
 *
 * 这个算法用于批量构建 R-tree 时的空间排序，它不会完全排序数组，
 * 而是将数组分成多个大小为 n 的块，这些块之间是有序的，
 * 但块内部的元素不一定有序。这样可以提高性能。
 *
 * @param arr 要排序的数组（可变引用）
 * @param left 左边界索引
 * @param right 右边界索引
 * @param n 分组大小
 * @param compare 比较函数
 *
 * # Example
 * ```
 * use bi_alignment::rbush_utils::multi_select;
 *
 * let mut data = vec![5, 2, 8, 1, 9, 3, 7, 4, 6];
 * multi_select(&mut data, 0, 8, 3, |a, b| a.cmp(b));
 * // 现在数组被分成若干组，组与组之间有序
 * ```
 */
pub fn multi_select<T, F>(arr: &mut [T], mut left: usize, mut right: usize, n: usize, compare: F)
where
    F: FnMut(&T, &T) -> std::cmp::Ordering + Copy,
{
    // 使用栈来模拟递归，避免栈溢出
    // 栈中存储 (left, right) 边界对
    let mut stack: Vec<(usize, usize)> = Vec::new();
    stack.push((left, right));

    while let Some((current_left, current_right)) = stack.pop() {
        left = current_left;
        right = current_right;

        // 如果范围太小，跳过
        if right <= left + n {
            continue;
        }

        // 计算中间分割点（使用 ceil 向上取整）
        // 目标：将范围分成大小为 n 的块，取中间块的起始位置

        // 步骤 1: 计算当前范围的大小
        let range_size = right - left;

        // 步骤 2: 计算能分成多少个块（浮点数，便于精确计算）
        let total_blocks = range_size as f64 / n as f64;

        // 步骤 3: 计算中间块的索引（取一半，向上取整确保至少有一个块）
        let middle_block_index = (total_blocks / 2.0).ceil() as usize;

        // 步骤 4: 计算中间块相对于起始位置的偏移量
        let offset_from_left = middle_block_index * n;

        // 步骤 5: 计算中间分割点的绝对位置
        let mid = left + offset_from_left;

        // 使用 quickselect 将第 mid 个元素放到正确的位置
        quickselect(arr, mid, left, right, compare);

        // 将左右两部分压入栈中继续处理
        // 注意：push的顺序很重要，先push (left, mid)，再push (mid, right)
        stack.push((left, mid));
        stack.push((mid, right));
    }
}

// ==================== 边界框关系检查 ====================

/**
 * 检查两个边界框是否相交。
 *
 * 两个矩形相交的条件：
 * - b 的左边界 <= a 的右边界
 * - b 的下边界 <= a 的上边界
 * - b 的右边界 >= a 的左边界
 * - b 的上边界 >= a 的下边界
 *
 * @param a 第一个边界框
 * @param b 第二个边界框
 * @returns 如果相交返回 true，否则返回 false
 */
pub fn intersects(a: &BBox, b: &BBox) -> bool {
    b.min_x <= a.max_x && b.min_y <= a.max_y && b.max_x >= a.min_x && b.max_y >= a.min_y
}

/**
 * 检查边界框 a 是否完全包含边界框 b。
 *
 * 包含的条件：
 * - a 的左边界 <= b 的左边界
 * - a 的下边界 <= b 的下边界
 * - b 的右边界 <= a 的右边界
 * - b 的上边界 <= a 的上边界
 *
 * @param a 可能包含其他边界框的边界框
 * @param b 可能被包含的边界框
 * @returns 如果 a 包含 b 返回 true，否则返回 false
 */
pub fn contains(a: &BBox, b: &BBox) -> bool {
    a.min_x <= b.min_x && a.min_y <= b.min_y && b.max_x <= a.max_x && b.max_y <= a.max_y
}

// ==================== 分裂相关函数 ====================

/**
 * 通用的选择最佳分裂索引函数。
 *
 * 遍历所有可能的分裂位置，选择重叠面积最小、总面积最小的分裂点。
 *
 * @param elements 要分裂的元素数组
 * @param min_entries 最小条目数
 * @param get_bbox 获取元素边界框的闭包
 * @returns 最佳分裂索引
 */
pub fn choose_split_index<E>(
    elements: &[E],
    min_entries: usize,
    get_bbox: impl Fn(&E) -> BBox,
) -> usize {
    let mut index: usize = min_entries;
    let mut min_overlap = f64::INFINITY;
    let mut min_area = f64::INFINITY;

    let current_len = elements.len();

    for i in min_entries..current_len - min_entries {
        // 计算左侧的合并 bbox
        let left_bbox = elements[..i]
            .iter()
            .map(|e| get_bbox(e))
            .fold(get_bbox(&elements[0]), |acc, bbox| extend_bbox(&acc, &bbox));

        // 计算右侧的合并 bbox
        let right_bbox = elements[i..]
            .iter()
            .map(|e| get_bbox(e))
            .fold(get_bbox(&elements[i]), |acc, bbox| extend_bbox(&acc, &bbox));

        let overlap = calculate_intersection_area(&left_bbox, &right_bbox);
        let area = calculate_area(&left_bbox) + calculate_area(&right_bbox);

        if overlap < min_overlap {
            min_overlap = overlap;
            min_area = area;
            index = i;
        } else if overlap == min_overlap && area < min_area {
            min_area = area;
            index = i;
        }
    }

    index
}

/**
 * 计算叶子节点 items 的所有分布边距（用于选择分裂轴）。
 *
 * @param items 叶子节点的数据项
 * @param min_entries 最小条目数
 * @param current_len 当前长度
 * @param compare 比较函数
 * @param get_bbox 获取边界框的函数
 * @returns 总边距值
 */
pub fn calculate_all_distribution_margins_for_items<T>(
    items: &[T],
    min_entries: usize,
    current_len: usize,
    compare: fn(&T, &T) -> std::cmp::Ordering,
    get_bbox: impl Fn(&T) -> BBox,
) -> f64 {
    // 创建 items 引用的副本并排序
    let mut sorted_items: Vec<&T> = items.iter().collect();
    sorted_items.sort_by(|a, b| compare(a, b));

    // 计算初始左右 bbox
    let mut left_bbox = sorted_items[..min_entries]
        .iter()
        .map(|item| get_bbox(item))
        .fold(get_bbox(sorted_items[0]), |acc, bbox| {
            extend_bbox(&acc, &bbox)
        });

    let mut right_bbox = sorted_items[current_len - min_entries..]
        .iter()
        .map(|item| get_bbox(item))
        .fold(
            get_bbox(sorted_items[current_len - min_entries]),
            |acc, bbox| extend_bbox(&acc, &bbox),
        );

    let mut margin = calculate_margin(&left_bbox) + calculate_margin(&right_bbox);

    // 逐步扩展左侧 bbox
    for i in min_entries..current_len - min_entries {
        let item = sorted_items[i];
        left_bbox = extend_bbox(&left_bbox, &get_bbox(item));
        margin += calculate_margin(&left_bbox);
    }

    // 逐步扩展右侧 bbox
    for i in current_len - min_entries..current_len {
        let item = sorted_items[i];
        right_bbox = extend_bbox(&right_bbox, &get_bbox(item));
        margin += calculate_margin(&right_bbox);
    }

    margin
}

/**
 * 计算内部节点 children 的所有分布边距（用于选择分裂轴）。
 *
 * @param children 子节点引用数组
 * @param child_min_len 最小子节点数
 * @param current_len 当前长度
 * @param compare 比较函数
 * @returns 总边距值
 */
pub fn calculate_all_distribution_margins_for_nodes<T: HasBBox>(
    children: &[&Box<RBushNode<T>>],
    child_min_len: usize,
    current_len: usize,
    compare: fn(&RBushNode<T>, &RBushNode<T>) -> std::cmp::Ordering,
) -> f64 {
    // 创建子节点引用的副本并排序
    let mut sorted_children = children.to_vec();
    sorted_children.sort_by(|a, b| compare(a, b));

    let mut left_bbox = calculate_distribution_bbox_from_nodes(&sorted_children[..child_min_len]);
    let mut right_bbox =
        calculate_distribution_bbox_from_nodes(&sorted_children[current_len - child_min_len..]);
    let mut margin = calculate_margin(&left_bbox) + calculate_margin(&right_bbox);

    for i in child_min_len..current_len - child_min_len {
        let child = sorted_children[i];
        left_bbox = extend_bbox(&left_bbox, &child.bbox);
        margin += calculate_margin(&left_bbox);
    }

    for i in current_len - child_min_len..current_len {
        let child = sorted_children[i];
        right_bbox = extend_bbox(&right_bbox, &child.bbox);
        margin += calculate_margin(&right_bbox);
    }

    margin
}

// ==================== 查找辅助函数 ====================

/**
 * 在数组中查找项的索引。
 *
 * @param item 要查找的项
 * @param items 要搜索的数组
 * @param equals_fn 可选的自定义相等性函数
 * @returns 如果找到返回索引，否则返回 usize::MAX
 */
pub fn find_item_index<T, F>(item: &T, items: &[T], equals_fn: Option<&F>) -> usize
where
    T: PartialEq,
    F: Fn(&T, &T) -> bool,
{
    if let Some(eq_fn) = equals_fn {
        for (i, current_item) in items.iter().enumerate() {
            if eq_fn(item, current_item) {
                return i;
            }
        }
    } else {
        for (i, current_item) in items.iter().enumerate() {
            if item == current_item {
                return i;
            }
        }
    }
    usize::MAX
}
