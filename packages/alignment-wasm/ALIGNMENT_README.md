# 对齐线功能 (Alignment Snap Lines)

基于 R 树的图形编辑器对齐线吸附功能，自动将移动的图形吸附到周围图形的边界和中线。

## 功能特点

- ✅ **基于 R 树的高性能空间查询**：使用 R 树索引快速查找视口内的参考图形
- ✅ **智能吸附**：支持左、中、右（上、中、下）三条参考线的吸附
- ✅ **可配置的吸附距离**：自定义吸附临界值
- ✅ **视口过滤**：只考虑视口内的图形作为参考
- ✅ **排除目标图形**：被移动的图形不会作为参考线
- ✅ **实时更新**：动态计算偏移量和待绘制的参考线

## 使用方法

### 1. 定义图形结构

你的图形类型需要实现两个 trait：

```rust
use bi-alignment::{BBox, HasBBox, GraphShape};

#[derive(Clone, Debug)]
struct Shape {
    id: String,
    bbox: BBox,
}

impl HasBBox for Shape {
    fn bbox(&self) -> BBox {
        self.bbox
    }
}

impl GraphShape for Shape {
    fn id(&self) -> String {
        self.id.clone()
    }
}
```

### 2. 创建 R 树并插入图形

```rust
use bi-alignment::RBush;

let mut rtree = RBush::new(9, 4);

let shape = Shape {
    id: "shape1".to_string(),
    bbox: BBox::new(0.0, 0.0, 100.0, 100.0),
};

rtree.insert(shape, 0);
```

### 3. 创建参考线管理器

```rust
use bi-alignment::RefLineManager;

// 创建管理器，吸附距离为 5 像素
let mut ref_line_manager = RefLineManager::new(5.0);
```

### 4. 缓存视口内的参考图形

```rust
// 定义视口
let viewport = BBox::new(0.0, 0.0, 800.0, 600.0);

// 排除正在移动的图形 ID
let exclude_ids = vec!["moving_shape".to_string()];

// 缓存参考图形
ref_line_manager.cache_reference_shapes(&rtree, &viewport, &exclude_ids);
```

### 5. 更新对齐线并获取偏移量

```rust
// 目标图形的当前位置
let target_bbox = BBox::new(103.0, 50.0, 203.0, 150.0);

// 计算吸附偏移量
let result = ref_line_manager.update_ref_line(&target_bbox);

println!("吸附偏移: x={}, y={}", result.offset_x, result.offset_y);

// 应用偏移量到图形
let final_x = target_bbox.min_x + result.offset_x;
let final_y = target_bbox.min_y + result.offset_y;
```

### 6. 获取需要绘制的参考线

```rust
// 垂直参考线
for v_line in &ref_line_manager.to_draw_vertical_lines {
    println!("绘制垂直线: x={}, y点: {:?}", v_line.x, v_line.ys);
    // 在 UI 中绘制这条垂直线
}

// 水平参考线
for h_line in &ref_line_manager.to_draw_horizontal_lines {
    println!("绘制水平线: y={}, x点: {:?}", h_line.y, h_line.xs);
    // 在 UI 中绘制这条水平线
}
```

## 完整示例

```rust
use bi-alignment::{BBox, GraphShape, HasBBox, RBush, RefLineManager};

#[derive(Clone, Debug)]
struct Shape {
    id: String,
    bbox: BBox,
}

impl HasBBox for Shape {
    fn bbox(&self) -> BBox {
        self.bbox
    }
}

impl GraphShape for Shape {
    fn id(&self) -> String {
        self.id.clone()
    }
}

fn main() {
    // 1. 创建 R 树
    let mut rtree = RBush::new(9, 4);

    // 2. 插入参考图形
    rtree.insert(Shape {
        id: "ref1".to_string(),
        bbox: BBox::new(0.0, 0.0, 100.0, 100.0),
    }, 0);

    rtree.insert(Shape {
        id: "ref2".to_string(),
        bbox: BBox::new(200.0, 0.0, 300.0, 100.0),
    }, 0);

    // 3. 创建对齐线管理器
    let mut manager = RefLineManager::new(5.0);

    // 4. 缓存参考图形
    let viewport = BBox::new(0.0, 0.0, 400.0, 200.0);
    manager.cache_reference_shapes(&rtree, &viewport, &[]);

    // 5. 更新对齐线
    let target = BBox::new(103.0, 50.0, 203.0, 150.0);
    let result = manager.update_ref_line(&target);

    // 6. 应用偏移
    println!("偏移: ({}, {})", result.offset_x, result.offset_y);

    // 7. 绘制参考线
    for line in &manager.to_draw_vertical_lines {
        println!("垂直线: x={}", line.x);
    }
}
```

## 工作原理

### 1. 缓存阶段 (`cache_reference_shapes`)

- 使用 R 树的 `search` 方法查询视口内的所有图形
- 排除被移动的目标图形
- 为每个参考图形提取 6 条参考线：
  - 垂直线：`min_x`、`mid_x`、`max_x`
  - 水平线：`min_y`、`mid_y`、`max_y`
- 将参考线存储在 HashMap 中，并对坐标进行排序以支持二分查找

### 2. 更新阶段 (`update_ref_line`)

- 计算目标图形的 3 个关键点（左/中/右 或 上/中/下）
- 使用二分查找找到每个关键点最近的参考线
- 比较三个距离，选择最近的一条
- 如果距离在容差范围内，计算偏移量
- 标记需要绘制的参考线

### 3. 二分查找算法 (`find_closest_in_sorted`)

- 使用二分查找在排序数组中找到最接近目标值的元素
- 时间复杂度：O(log n)
- 当距离相等时，选择较小的值

## API 文档

### `RefLineManager`

参考线管理器的主要接口。

#### 方法

- `new(tolerance: f64) -> Self`
  - 创建新的管理器
  - `tolerance`: 吸附临界值（像素）

- `cache_reference_shapes<T>(&mut self, rtree: &RBush<T>, viewport: &BBox, exclude_ids: &[String])`
  - 缓存视口内的参考图形
  - `rtree`: R 树索引
  - `viewport`: 视口边界
  - `exclude_ids`: 要排除的图形 ID

- `update_ref_line(&mut self, target_bbox: &BBox) -> AlignmentResult`
  - 更新参考线并计算偏移量
  - `target_bbox`: 目标图形的边界框
  - 返回：吸附结果（包含 offset_x 和 offset_y）

### `AlignmentResult`

对齐结果结构。

```rust
pub struct AlignmentResult {
    pub offset_x: f64,
    pub offset_y: f64,
}
```

### `VerticalLine` / `HorizontalLine`

待绘制的参考线。

```rust
pub struct VerticalLine {
    pub x: f64,      // 垂直线的 x 坐标
    pub ys: Vec<f64>, // 线上的 y 坐标点
}

pub struct HorizontalLine {
    pub y: f64,      // 水平线的 y 坐标
    pub xs: Vec<f64>, // 线上的 x 坐标点
}
```

## 运行示例

```bash
# 运行演示程序
cargo run --example alignment_demo

# 运行测试
cargo test alignment
```

## 性能特点

- **R 树查询**：O(log n) 的空间查询性能
- **二分查找**：O(log m) 的最近线查找，m 为参考线数量
- **整体复杂度**：O(log n + log m)，远优于暴力遍历的 O(n * m)

## 未来改进

- [ ] 支持旋转图形的对齐
- [ ] 支持自定义参考线（用户手动添加的辅助线）
- [ ] 支持对齐历史记录
- [ ] 支持多图形同时移动的对齐
- [ ] 添加对齐动画效果的支持

## 参考资料

本实现基于文章《图形编辑器开发：参考线吸附效功能，让图形自动对齐》中描述的算法，并结合 R 树数据结构进行了优化。

- R 树论文：Guttman, A. (1984). "R-trees: A Dynamic Index Structure for Spatial Searching"
- 原始文章：https://mp.weixin.qq.com/s?__biz=MzI0NTc2NTEyNA==&mid=2247487200
