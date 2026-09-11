// bi直接使用
use crate::{
    AlignmentResult, BBox, GraphShape, HasBBox, HorizontalLine, RBush, RefLineManager, VerticalLine,
};
use wasm_bindgen::prelude::*;

// use web_sys::console::*;

// macro_rules! log {
//     ( $( $t:tt )* ) => {
//         log_1(&format!( $( $t )* ).into());
//     }
// }

/// BI 节点结构体
///
/// 表示一个可以参与对齐计算的图形节点，包含其位置和尺寸信息。
/// 用于存储在 R树中进行空间索引，并参与对齐线的计算。
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct BINode {
    id: usize,
    left: f64,
    top: f64,
    width: f64,
    height: f64,
}

#[wasm_bindgen]
impl BINode {
    /// 创建一个新的 BINode 实例
    ///
    /// # 参数
    /// - `id`: 节点的唯一标识符
    /// - `left`: 节点左边缘的 x 坐标
    /// - `top`: 节点上边缘的 y 坐标
    /// - `width`: 节点的宽度
    /// - `height`: 节点的高度
    ///
    /// # 返回
    /// 返回新创建的 BINode 实例
    #[wasm_bindgen(constructor)]
    pub fn new(id: usize, left: f64, top: f64, width: f64, height: f64) -> Self {
        BINode {
            id,
            left,
            top,
            width,
            height,
        }
    }

    /// 获取节点 ID
    #[wasm_bindgen(getter)]
    pub fn id(&self) -> usize {
        self.id
    }

    /// 获取节点左边缘 x 坐标
    #[wasm_bindgen(getter)]
    pub fn left(&self) -> f64 {
        self.left
    }

    /// 获取节点上边缘 y 坐标
    #[wasm_bindgen(getter)]
    pub fn top(&self) -> f64 {
        self.top
    }

    /// 获取节点宽度
    #[wasm_bindgen(getter)]
    pub fn width(&self) -> f64 {
        self.width
    }

    /// 获取节点高度
    #[wasm_bindgen(getter)]
    pub fn height(&self) -> f64 {
        self.height
    }
}

impl PartialEq for BINode {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id
    }
}

impl HasBBox for BINode {
    fn bbox(&self) -> crate::BBox {
        crate::BBox {
            min_x: self.left,
            min_y: self.top,
            max_x: self.left + self.width,
            max_y: self.top + self.height,
        }
    }
}

impl GraphShape for BINode {
    fn id(&self) -> String {
        self.id.to_string()
    }
}

/// BI 对齐实例
///
/// 管理图形节点的空间索引（R树）和对齐线计算。
/// 提供完整的节点管理和实时对齐线功能。
#[wasm_bindgen]
pub struct BIAlignmentInstance {
    rbush: Option<RBush<BINode>>,
    alignment: Option<RefLineManager>,
}

#[wasm_bindgen]
impl BIAlignmentInstance {
    /// 创建一个新的 BIAlignmentInstance 实例
    ///
    /// 初始化 R树（max_entries=9, min_entries=4）和对齐线管理器（tolerance=2.0px）
    ///
    /// # 返回
    /// 返回新创建的实例
    ///
    /// # 示例
    /// ```javascript
    /// const instance = new BIAlignmentInstance();
    /// ```
    #[wasm_bindgen(constructor)]
    pub fn new(tolerance: f64) -> Self {
        Self {
            rbush: Some(RBush::new(9, 4)),
            alignment: Some(RefLineManager::new(tolerance)),
        }
    }

    /// 批量初始化所有节点到 R树
    ///
    /// 使用高效的批量加载算法，比逐个插入快得多。
    /// 适合在应用启动时一次性加载所有节点。
    ///
    /// # 参数
    /// - `nodes`: 要加载的节点数组
    ///
    /// # 示例
    /// ```javascript
    /// const nodes = [
    ///   new BINode(1, 100, 100, 50, 50),
    ///   new BINode(2, 200, 150, 60, 40)
    /// ];
    /// instance.initialize(nodes);
    /// ```
    #[wasm_bindgen]
    pub fn initialize(&mut self, nodes: Vec<BINode>) {
        if let Some(rbush) = &mut self.rbush {
            rbush.rebuild_tree(nodes);
        }
    }

    /// 向 R树添加单个节点
    ///
    /// # 参数
    /// - `node`: 要添加的节点
    ///
    /// # 返回
    /// 成功返回 true，失败返回 false
    ///
    /// # 示例
    /// ```javascript
    /// const node = new BINode(3, 300, 200, 70, 50);
    /// instance.add_node(node);
    /// ```
    #[wasm_bindgen]
    pub fn add_node(&mut self, node: BINode) -> bool {
        if let Some(rbush) = &mut self.rbush {
            rbush.insert(node, rbush.root.as_ref().unwrap().height as usize + 1)
        } else {
            false
        }
    }

    /// 从 R树删除指定节点
    ///
    /// # 参数
    /// - `node`: 要删除的节点（根据 ID 匹配）
    ///
    /// # 返回
    /// 成功返回 true，失败返回 false
    ///
    /// # 示例
    /// ```javascript
    /// instance.delete_node(node);
    /// ```
    #[wasm_bindgen]
    pub fn delete_node(&mut self, node: &BINode) -> bool {
        if let Some(rbush) = &mut self.rbush {
            rbush.remove(node, Some(|a: &BINode, b: &BINode| a.id == b.id))
        } else {
            false
        }
    }

    /// 更新节点位置
    ///
    /// 在 R树中删除旧节点并插入新节点，自动重新平衡树结构。
    ///
    /// # 参数
    /// - `old_item`: 旧节点（用于查找）
    /// - `new_item`: 新节点（更新后的位置）
    ///
    /// # 返回
    /// 成功返回 true，失败返回 false
    ///
    /// # 示例
    /// ```javascript
    /// const oldNode = new BINode(1, 100, 100, 50, 50);
    /// const newNode = new BINode(1, 150, 150, 50, 50);
    /// instance.update_node(oldNode, newNode);
    /// ```
    #[wasm_bindgen]
    pub fn update_node(&mut self, old_item: &BINode, new_item: BINode) -> bool {
        let result = if let Some(rbush) = &mut self.rbush {
            rbush.update(
                old_item,
                new_item,
                Some(|a: &BINode, b: &BINode| a.id == b.id),
            )
        } else {
            false
        };

        result
    }

    /// 缓存视口内的参考图形，用于对齐线计算
    ///
    /// 使用 R树快速查询视口内的所有节点，并为它们生成对齐参考线。
    /// 应在拖动开始时调用一次，以提高拖动过程中的性能。
    ///
    /// # 参数
    /// - `min_x`: 视口左边界
    /// - `min_y`: 视口上边界
    /// - `max_x`: 视口右边界
    /// - `max_y`: 视口下边界
    /// - `exclude_ids`: 要排除的节点 ID 数组（通常是正在拖动的节点）
    ///
    /// # 示例
    /// ```javascript
    /// instance.cache_reference_shapes(0, 0, 1920, 1080, ["1", "2"]);
    /// ```
    #[wasm_bindgen]
    pub fn search_point(&self, x: f64, y: f64) -> Vec<usize> {
        if let Some(rbush) = &self.rbush {
            let point_bbox = BBox::new(x, y, x, y);
            rbush
                .search(&point_bbox)
                .iter()
                .map(|node| node.id)
                .collect()
        } else {
            Vec::new()
        }
    }

    #[wasm_bindgen]
    pub fn cache_reference_shapes(
        &mut self,
        min_x: f64,
        min_y: f64,
        max_x: f64,
        max_y: f64,
        exclude_ids: Vec<String>,
    ) {
        let viewport = BBox::new(min_x, min_y, max_x, max_y);
        if let (Some(rbush), Some(alignment)) = (&self.rbush, &mut self.alignment) {
            alignment.cache_reference_shapes(rbush, &viewport, &exclude_ids);
        }
    }

    /// 计算对齐线和吸附偏移量
    ///
    /// 根据被拖动节点的当前位置，计算最近的对齐参考线，
    /// 并返回吸附偏移量。同时更新待绘制的对齐线列表。
    ///
    /// # 参数
    /// - `min_x`: 节点左边界
    /// - `min_y`: 节点上边界
    /// - `max_x`: 节点右边界
    /// - `max_y`: 节点下边界
    ///
    /// # 返回
    /// 返回 AlignmentResult 对象，包含 offset_x 和 offset_y
    ///
    /// # 示例
    /// ```javascript
    /// const result = instance.update_ref_line(100, 100, 150, 150);
    /// const finalX = currentX + result.offset_x;
    /// const finalY = currentY + result.offset_y;
    /// ```
    #[wasm_bindgen]
    pub fn update_ref_line(
        &mut self,
        min_x: f64,
        min_y: f64,
        max_x: f64,
        max_y: f64,
    ) -> AlignmentResult {
        let target_bbox = BBox::new(min_x, min_y, max_x, max_y);
        if let Some(alignment) = &mut self.alignment {
            alignment.update_ref_line(&target_bbox)
        } else {
            AlignmentResult::zero()
        }
    }

    /// 获取需要绘制的垂直参考线
    ///
    /// 返回所有应该绘制的垂直对齐线（红色虚线）。
    /// 每条线包含 x 坐标和对应的 y 坐标数组。
    ///
    /// # 返回
    /// 垂直线数组
    ///
    /// # 示例
    /// ```javascript
    /// const vLines = instance.get_vertical_lines();
    /// vLines.forEach(line => {
    ///   const x = line.x;
    ///   const ys = line.ys;
    ///   // 绘制从 min(ys) 到 max(ys) 的垂直线
    /// });
    /// ```
    #[wasm_bindgen]
    pub fn get_vertical_lines(&self) -> Vec<VerticalLine> {
        if let Some(alignment) = &self.alignment {
            alignment.to_draw_vertical_lines.clone()
        } else {
            Vec::new()
        }
    }

    /// 获取需要绘制的水平参考线
    ///
    /// 返回所有应该绘制的水平对齐线（红色虚线）。
    /// 每条线包含 y 坐标和对应的 x 坐标数组。
    ///
    /// # 返回
    /// 水平线数组
    ///
    /// # 示例
    /// ```javascript
    /// const hLines = instance.get_horizontal_lines();
    /// hLines.forEach(line => {
    ///   const y = line.y;
    ///   const xs = line.xs;
    ///   // 绘制从 min(xs) 到 max(xs) 的水平线
    /// });
    /// ```
    #[wasm_bindgen]
    pub fn get_horizontal_lines(&self) -> Vec<HorizontalLine> {
        if let Some(alignment) = &self.alignment {
            alignment.to_draw_horizontal_lines.clone()
        } else {
            Vec::new()
        }
    }

    /// 清除对齐线缓存
    ///
    /// 清空所有待绘制的对齐线。
    /// 通常在拖动结束时调用，以隐藏对齐线。
    ///
    /// # 示例
    /// ```javascript
    /// instance.clear_alignment();
    /// ```
    #[wasm_bindgen]
    pub fn clear_alignment(&mut self) {
        if let Some(alignment) = &mut self.alignment {
            alignment.to_draw_vertical_lines.clear();
            alignment.to_draw_horizontal_lines.clear();
        }
    }
}
