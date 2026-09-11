use bi_alignment::bi::{BIAlignmentInstance, BINode};
use bi_alignment::{BBox, GraphShape, HasBBox, RBush, RefLineManager};

/// 测试用的图形结构
#[derive(Clone, Debug)]
struct TestShape {
    id: String,
    bbox: BBox,
}

impl TestShape {
    fn new(id: &str, min_x: f64, min_y: f64, max_x: f64, max_y: f64) -> Self {
        TestShape {
            id: id.to_string(),
            bbox: BBox::new(min_x, min_y, max_x, max_y),
        }
    }
}

impl HasBBox for TestShape {
    fn bbox(&self) -> BBox {
        self.bbox
    }
}

impl GraphShape for TestShape {
    fn id(&self) -> String {
        self.id.clone()
    }
}

#[test]
fn test_alignment_with_rtree() {
    // 创建 R 树
    let mut rtree = RBush::new(9, 4);

    // 添加参考图形
    rtree.insert(TestShape::new("ref1", 0.0, 0.0, 100.0, 100.0), 0);
    rtree.insert(TestShape::new("ref2", 200.0, 0.0, 300.0, 100.0), 0);

    // 创建参考线管理器
    let mut manager = RefLineManager::new(5.0);

    // 定义视口
    let viewport = BBox::new(0.0, 0.0, 400.0, 200.0);

    // 缓存参考图形
    manager.cache_reference_shapes(&rtree, &viewport, &["moving".to_string()]);

    // 测试吸附到左边参考线
    let target = BBox::new(103.0, 50.0, 203.0, 150.0);
    let result = manager.update_ref_line(&target);

    // 应该吸附到 x = 100（ref1 的右边）
    assert!((result.offset_x() - (-3.0)).abs() < 0.01);
}

#[test]
fn test_search_point_returns_hit_node_ids() {
    let mut instance = BIAlignmentInstance::new(5.0);

    instance.initialize(vec![
        BINode::new(1, 0.0, 0.0, 100.0, 100.0),
        BINode::new(2, 50.0, 50.0, 100.0, 100.0),
        BINode::new(3, 200.0, 200.0, 50.0, 50.0),
    ]);

    let mut hit_ids = instance.search_point(75.0, 75.0);
    hit_ids.sort();

    assert_eq!(hit_ids, vec![1, 2]);
    assert!(instance.search_point(180.0, 180.0).is_empty());
}

#[test]
fn test_alignment_with_tolerance() {
    let mut rtree = RBush::new(9, 4);
    rtree.insert(TestShape::new("ref", 0.0, 0.0, 100.0, 100.0), 0);

    let mut manager = RefLineManager::new(5.0);
    let viewport = BBox::new(0.0, 0.0, 200.0, 200.0);
    manager.cache_reference_shapes(&rtree, &viewport, &[]);

    // 在容差范围内，应该吸附
    let target1 = BBox::new(103.0, 50.0, 203.0, 150.0);
    let result1 = manager.update_ref_line(&target1);
    assert!(result1.offset_x().abs() > 0.01); // 有偏移

    // 超出容差范围，不应该吸附
    let target2 = BBox::new(110.0, 50.0, 210.0, 150.0);
    let result2 = manager.update_ref_line(&target2);
    assert!(result2.offset_x().abs() < 0.01); // 无偏移
}

#[test]
fn test_alignment_midline() {
    let mut rtree = RBush::new(9, 4);
    // ref 的中线在 x = 50
    rtree.insert(TestShape::new("ref", 0.0, 0.0, 100.0, 100.0), 0);

    let mut manager = RefLineManager::new(5.0);
    let viewport = BBox::new(0.0, 0.0, 200.0, 200.0);
    manager.cache_reference_shapes(&rtree, &viewport, &[]);

    // target 的中线在 x = 53，应该吸附到 x = 50
    let target = BBox::new(3.0, 50.0, 103.0, 150.0);
    let result = manager.update_ref_line(&target);

    // 应该吸附到中线
    assert!((result.offset_x() - (-3.0)).abs() < 0.01);
}

#[test]
fn test_alignment_both_directions() {
    let mut rtree = RBush::new(9, 4);
    rtree.insert(TestShape::new("ref", 0.0, 0.0, 100.0, 100.0), 0);

    let mut manager = RefLineManager::new(5.0);
    let viewport = BBox::new(0.0, 0.0, 200.0, 200.0);
    manager.cache_reference_shapes(&rtree, &viewport, &[]);

    // 同时在 X 和 Y 方向靠近参考线
    let target = BBox::new(103.0, 103.0, 203.0, 203.0);
    let result = manager.update_ref_line(&target);

    // 两个方向都应该吸附
    assert!(result.offset_x().abs() > 0.01);
    assert!(result.offset_y().abs() > 0.01);
}

#[test]
fn test_alignment_with_excluded_shapes() {
    let mut rtree = RBush::new(9, 4);
    rtree.insert(TestShape::new("ref1", 0.0, 0.0, 100.0, 100.0), 0);
    rtree.insert(TestShape::new("excluded", 200.0, 0.0, 300.0, 100.0), 0);

    let mut manager = RefLineManager::new(5.0);
    let viewport = BBox::new(0.0, 0.0, 400.0, 200.0);

    // 排除 excluded 图形
    manager.cache_reference_shapes(&rtree, &viewport, &["excluded".to_string()]);

    // 靠近被排除的图形，不应该吸附
    let target = BBox::new(203.0, 50.0, 303.0, 150.0);
    let result = manager.update_ref_line(&target);

    // 不应该吸附（因为 excluded 被排除了）
    assert!(result.offset_x().abs() < 0.01);
}

#[test]
fn test_draw_lines_generation() {
    let mut rtree = RBush::new(9, 4);
    rtree.insert(TestShape::new("ref", 0.0, 0.0, 100.0, 100.0), 0);

    let mut manager = RefLineManager::new(5.0);
    let viewport = BBox::new(0.0, 0.0, 200.0, 200.0);
    manager.cache_reference_shapes(&rtree, &viewport, &[]);

    // 吸附到参考线
    let target = BBox::new(103.0, 50.0, 203.0, 150.0);
    manager.update_ref_line(&target);

    // 应该生成绘制线
    assert!(manager.to_draw_vertical_lines.len() > 0);
}

#[test]
fn test_viewport_filtering() {
    let mut rtree = RBush::new(9, 4);
    rtree.insert(TestShape::new("inside", 50.0, 50.0, 150.0, 150.0), 0);
    rtree.insert(
        TestShape::new("outside", 1000.0, 1000.0, 1100.0, 1100.0),
        0,
    );

    let mut manager = RefLineManager::new(5.0);
    let viewport = BBox::new(0.0, 0.0, 200.0, 200.0);

    // 只缓存视口内的图形
    manager.cache_reference_shapes(&rtree, &viewport, &[]);

    // 应该只能吸附到 inside 图形
    let target = BBox::new(153.0, 50.0, 253.0, 150.0);
    let result = manager.update_ref_line(&target);

    // 应该吸附到 inside 的 max_x = 150
    assert!(result.offset_x().abs() > 0.01);
}

#[test]
fn test_multiple_reference_shapes() {
    let mut rtree = RBush::new(9, 4);

    // 添加多个参考图形
    rtree.insert(TestShape::new("ref1", 0.0, 0.0, 100.0, 100.0), 0);
    rtree.insert(TestShape::new("ref2", 150.0, 0.0, 250.0, 100.0), 0);
    rtree.insert(TestShape::new("ref3", 300.0, 0.0, 400.0, 100.0), 0);

    let mut manager = RefLineManager::new(5.0);
    let viewport = BBox::new(0.0, 0.0, 500.0, 200.0);
    manager.cache_reference_shapes(&rtree, &viewport, &[]);

    // 应该吸附到最近的参考线（ref2 的左边）
    let target = BBox::new(153.0, 50.0, 253.0, 150.0);
    let result = manager.update_ref_line(&target);

    assert!((result.offset_x() - (-3.0)).abs() < 0.01);
}
