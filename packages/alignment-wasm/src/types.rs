use core::f64;

/// 表示二维空间中的边界框
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct BBox {
    pub min_x: f64,
    pub min_y: f64,
    pub max_x: f64,
    pub max_y: f64,
}

impl BBox {
    pub fn new(min_x: f64, min_y: f64, max_x: f64, max_y: f64) -> Self {
        BBox {
            min_x,
            min_y,
            max_x,
            max_y,
        }
    }

    pub fn area(&self) -> f64 {
        (self.max_x - self.min_x) * (self.max_y - self.min_y)
    }
}

/// Trait：要求类型可以提供边界框，并且可以克隆
///
/// 所有存储在 RBush 树中的数据类型都必须实现此 trait
pub trait HasBBox: Clone {
    /// 返回该项的边界框
    fn bbox(&self) -> BBox;
}

/// RBush 树的内部节点结构
///
/// 节点既可以是叶子节点（包含数据），也可以是非叶子节点（包含子节点）
/// 通过 `leaf` 字段来区分节点类型
#[derive(Debug, Clone)]
pub struct RBushNode<T: HasBBox> {
    /// 节点的边界框，覆盖所有子项的空间范围
    pub bbox: BBox,

    /// 子节点（仅在非叶子节点使用）
    pub children: Vec<Box<RBushNode<T>>>,

    /// 叶子节点的数据项（仅在叶子节点使用）
    pub items: Vec<T>,

    /// 节点的高度（叶子节点为 1，向上递增）
    pub height: u32,

    /// 是否为叶子节点（叶子节点直接包含数据，非叶子节点包含其他节点）
    pub leaf: bool,
}

impl<T: HasBBox> RBushNode<T> {
    /// 创建一个新的叶子节点
    ///
    /// 叶子节点直接包含数据项，高度为 1
    pub fn new_leaf(items: Vec<T>) -> Self {
        RBushNode {
            bbox: BBox::new(0.0, 0.0, 0.0, 0.0), // 需要后续计算
            children: Vec::new(),
            items: items,
            height: 1,
            leaf: true,
        }
    }

    /// 创建一个新的非叶子节点
    ///
    /// 非叶子节点包含其他节点，高度为子节点高度 + 1
    pub fn new_internal(nodes: Vec<RBushNode<T>>) -> Self {
        let height = nodes.first().map(|n| n.height + 1).unwrap_or(1);
        RBushNode {
            bbox: BBox::new(0.0, 0.0, 0.0, 0.0), // 需要后续计算
            children: nodes.into_iter().map(|n| Box::new(n)).collect(),
            items: Vec::new(),
            height,
            leaf: false,
        }
    }
}

/// 轴枚举：用于指定分裂轴
pub enum Axis {
    X,
    Y,
}

/// RBush 树的主要结构
pub struct RBush<T: HasBBox> {
    pub root: Option<Box<RBushNode<T>>>,
    pub max_entries: usize,
    pub min_entries: usize,
}
