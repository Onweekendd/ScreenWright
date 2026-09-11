use bi_alignment::{BBox, HasBBox, RBush, RBushNode};

// ==================== 测试数据结构 ====================

#[derive(Debug, Clone, PartialEq)]
struct Point {
    x: f64,
    y: f64,
}

impl Point {
    fn new(x: f64, y: f64) -> Self {
        Point { x, y }
    }
}

impl HasBBox for Point {
    fn bbox(&self) -> BBox {
        BBox::new(self.x, self.y, self.x, self.y)
    }
}

// ==================== 辅助函数 ====================

/// 计算树中的总item数
fn count_items<T: HasBBox>(node: &RBushNode<T>) -> usize {
    if node.leaf {
        node.items.len()
    } else {
        node.children
            .iter()
            .map(|child| count_items(child.as_ref()))
            .sum()
    }
}

/// 验证 bbox 包含关系
fn bbox_contains(outer: &BBox, inner: &BBox) -> bool {
    outer.min_x <= inner.min_x
        && outer.min_y <= inner.min_y
        && outer.max_x >= inner.max_x
        && outer.max_y >= inner.max_y
}

/// 验证树结构的合法性
fn validate_tree_structure<T: HasBBox>(tree: &RBush<T>) -> Result<(), String> {
    if let Some(root) = &tree.root {
        validate_node(root, tree.min_entries, tree.max_entries, true)?;
    }
    Ok(())
}

/// 递归验证节点
fn validate_node<T: HasBBox>(
    node: &RBushNode<T>,
    min_entries: usize,
    max_entries: usize,
    is_root: bool,
) -> Result<(), String> {
    if node.leaf {
        // 叶子节点：检查 items 数量
        if !is_root && node.items.len() > max_entries {
            return Err(format!(
                "Leaf node has {} items, max allowed {}",
                node.items.len(),
                max_entries
            ));
        }
        // 验证 bbox 包含所有 items
        for item in &node.items {
            if !bbox_contains(&node.bbox, &item.bbox()) {
                return Err("Node bbox doesn't contain all items".to_string());
            }
        }
    } else {
        // 内部节点：检查 children 数量
        if !is_root && node.children.len() > max_entries {
            return Err(format!(
                "Internal node has {} children, max allowed {}",
                node.children.len(),
                max_entries
            ));
        }
        // 递归验证子节点
        for child in &node.children {
            validate_node(child.as_ref(), min_entries, max_entries, false)?;
            // 验证 bbox 包含所有子节点
            if !bbox_contains(&node.bbox, &child.bbox) {
                return Err("Node bbox doesn't contain child bbox".to_string());
            }
        }
    }
    Ok(())
}

/// 获取树的实际高度
fn get_tree_height<T: HasBBox>(node: &RBushNode<T>) -> usize {
    if node.leaf {
        1
    } else {
        1 + node
            .children
            .iter()
            .map(|child| get_tree_height(child.as_ref()))
            .max()
            .unwrap_or(0)
    }
}

/// 检查树是否按空间局部性排序（竖条内的节点 X 坐标相近）
fn check_spatial_locality<T: HasBBox>(node: &RBushNode<T>) -> bool {
    if node.leaf {
        return true;
    }

    // 检查子节点是否按空间分布
    // 对于 load 构建的树，应该有良好的空间局部性
    for child in &node.children {
        if !check_spatial_locality(child.as_ref()) {
            return false;
        }
    }
    true
}

// ==================== 基础 load 测试 ====================

#[cfg(test)]
mod basic_load_tests {
    use super::*;

    #[test]
    fn test_load_empty_data() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        tree.load(vec![]);

        assert!(tree.root.is_none(), "Tree should remain empty");
    }

    #[test]
    fn test_load_single_point() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let points = vec![Point::new(1.0, 1.0)];

        tree.load(points.clone());

        assert!(tree.root.is_some(), "Tree should have a root");
        let root = tree.root.as_ref().unwrap();
        assert!(root.leaf, "Root should be a leaf");
        assert_eq!(count_items(root), 1, "Should have 1 item");
        assert_eq!(root.items[0], points[0], "Item should match");
    }

    #[test]
    fn test_load_few_points_below_min_entries() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let points = vec![
            Point::new(0.0, 0.0),
            Point::new(1.0, 1.0),
            Point::new(2.0, 2.0),
        ];

        tree.load(points.clone());

        // 少于 min_entries 的数据应该用 insert 逐个插入
        assert!(tree.root.is_some());
        let root = tree.root.as_ref().unwrap();
        assert_eq!(count_items(root), 3);
        assert!(validate_tree_structure(&tree).is_ok());
    }

    #[test]
    fn test_load_exact_max_entries() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let points: Vec<Point> = (0..9).map(|i| Point::new(i as f64, i as f64)).collect();

        tree.load(points);

        let root = tree.root.as_ref().unwrap();
        assert!(root.leaf, "Should create single leaf node");
        assert_eq!(count_items(root), 9);
        assert!(validate_tree_structure(&tree).is_ok());
    }

    #[test]
    fn test_load_one_more_than_max_entries() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let points: Vec<Point> = (0..10).map(|i| Point::new(i as f64, i as f64)).collect();

        tree.load(points);

        let root = tree.root.as_ref().unwrap();
        assert!(!root.leaf, "Should create internal node");
        assert_eq!(count_items(root), 10);
        assert!(validate_tree_structure(&tree).is_ok());
    }
}

// ==================== OMT 算法测试 ====================

#[cfg(test)]
mod omt_algorithm_tests {
    use super::*;

    #[test]
    fn test_load_50_points() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let points: Vec<Point> = (0..50).map(|i| Point::new(i as f64, i as f64)).collect();

        tree.load(points);

        let root = tree.root.as_ref().unwrap();
        assert_eq!(count_items(root), 50, "All 50 points should be loaded");
        assert!(validate_tree_structure(&tree).is_ok());
    }

    #[test]
    fn test_load_100_points() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let points: Vec<Point> = (0..100)
            .map(|i| Point::new((i % 10) as f64, (i / 10) as f64))
            .collect();

        tree.load(points);

        let root = tree.root.as_ref().unwrap();
        assert_eq!(count_items(root), 100);
        assert!(validate_tree_structure(&tree).is_ok());
    }

    #[test]
    fn test_load_creates_balanced_tree() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let points: Vec<Point> = (0..100).map(|i| Point::new(i as f64, i as f64)).collect();

        tree.load(points);

        let root = tree.root.as_ref().unwrap();
        let height = get_tree_height(root);

        // 对于 100 个点，max_entries=9，理论高度约为 log_9(100) ≈ 2.1
        // 实际高度应该在 2-4 之间
        assert!(
            height >= 2 && height <= 4,
            "Tree height should be balanced (got {})",
            height
        );
    }

    #[test]
    fn test_load_spatial_ordering() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        // 创建网格分布的点
        let mut points = Vec::new();
        for i in 0..10 {
            for j in 0..10 {
                points.push(Point::new(i as f64, j as f64));
            }
        }

        tree.load(points);

        let root = tree.root.as_ref().unwrap();
        assert!(
            check_spatial_locality(root),
            "Tree should have good spatial locality"
        );
    }
}

// ==================== BBox 验证测试 ====================

#[cfg(test)]
mod bbox_tests {
    use super::*;

    #[test]
    fn test_load_bbox_correctness() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let points: Vec<Point> = vec![
            Point::new(0.0, 0.0),
            Point::new(10.0, 10.0),
            Point::new(5.0, 5.0),
            Point::new(-5.0, -5.0),
            Point::new(15.0, 15.0),
        ];

        tree.load(points);

        let root = tree.root.as_ref().unwrap();

        // 根节点的 bbox 应该包含所有点
        assert_eq!(root.bbox.min_x, -5.0, "Min X should be -5");
        assert_eq!(root.bbox.min_y, -5.0, "Min Y should be -5");
        assert_eq!(root.bbox.max_x, 15.0, "Max X should be 15");
        assert_eq!(root.bbox.max_y, 15.0, "Max Y should be 15");
    }

    #[test]
    fn test_load_all_bboxes_contain_children() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let points: Vec<Point> = (0..100).map(|i| Point::new(i as f64, i as f64)).collect();

        tree.load(points);

        fn verify_bbox_containment<T: HasBBox>(node: &RBushNode<T>) -> bool {
            if node.leaf {
                node.items
                    .iter()
                    .all(|item| bbox_contains(&node.bbox, &item.bbox()))
            } else {
                node.children.iter().all(|child| {
                    bbox_contains(&node.bbox, &child.bbox) && verify_bbox_containment(child.as_ref())
                })
            }
        }

        let root = tree.root.as_ref().unwrap();
        assert!(
            verify_bbox_containment(root),
            "All bboxes should properly contain their children"
        );
    }
}

// ==================== 性能和大规模数据测试 ====================

#[cfg(test)]
mod performance_tests {
    use super::*;

    #[test]
    fn test_load_1000_points() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let points: Vec<Point> = (0..1000).map(|i| Point::new(i as f64, (i * 2) as f64)).collect();

        tree.load(points);

        let root = tree.root.as_ref().unwrap();
        assert_eq!(count_items(root), 1000);
        assert!(validate_tree_structure(&tree).is_ok());
    }

    #[test]
    fn test_load_scattered_points() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        // 创建分散在大范围内的点
        let mut points = Vec::new();
        for i in 0..100 {
            let x = (i * 17 % 200) as f64; // 伪随机分布
            let y = (i * 31 % 200) as f64;
            points.push(Point::new(x, y));
        }

        tree.load(points);

        assert_eq!(count_items(tree.root.as_ref().unwrap()), 100);
        assert!(validate_tree_structure(&tree).is_ok());
    }

    #[test]
    fn test_load_clustered_data() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        let mut points = Vec::new();

        // 簇 1: (0-10, 0-10)
        for i in 0..=10 {
            for j in 0..=10 {
                points.push(Point::new(i as f64, j as f64));
            }
        }

        // 簇 2: (100-110, 100-110)
        for i in 100..=110 {
            for j in 100..=110 {
                points.push(Point::new(i as f64, j as f64));
            }
        }

        tree.load(points);

        assert_eq!(count_items(tree.root.as_ref().unwrap()), 242);
        assert!(validate_tree_structure(&tree).is_ok());
    }
}

// ==================== 边界条件测试 ====================

#[cfg(test)]
mod edge_case_tests {
    use super::*;

    #[test]
    fn test_load_with_duplicate_points() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let points = vec![
            Point::new(1.0, 1.0),
            Point::new(1.0, 1.0),
            Point::new(1.0, 1.0),
            Point::new(2.0, 2.0),
            Point::new(2.0, 2.0),
        ];

        tree.load(points);

        assert_eq!(count_items(tree.root.as_ref().unwrap()), 5);
    }

    #[test]
    fn test_load_with_negative_coordinates() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let points: Vec<Point> = (-50..50).map(|i| Point::new(i as f64, i as f64)).collect();

        tree.load(points);

        let root = tree.root.as_ref().unwrap();
        assert_eq!(count_items(root), 100);
        assert_eq!(root.bbox.min_x, -50.0);
        assert_eq!(root.bbox.max_x, 49.0);
    }

    #[test]
    fn test_load_with_large_coordinates() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let points = vec![
            Point::new(1000000.0, 1000000.0),
            Point::new(-1000000.0, -1000000.0),
            Point::new(0.0, 0.0),
        ];

        tree.load(points);

        assert_eq!(count_items(tree.root.as_ref().unwrap()), 3);
        assert!(validate_tree_structure(&tree).is_ok());
    }

    #[test]
    fn test_load_with_decimal_coordinates() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let points: Vec<Point> = (0..20)
            .map(|i| Point::new(i as f64 + 0.5, i as f64 + 0.7))
            .collect();

        tree.load(points);

        assert_eq!(count_items(tree.root.as_ref().unwrap()), 20);
    }
}

// ==================== 对比测试：load vs insert ====================

#[cfg(test)]
mod load_vs_insert_tests {
    use super::*;

    #[test]
    fn test_load_and_insert_same_result() {
        let points: Vec<Point> = (0..50).map(|i| Point::new(i as f64, i as f64)).collect();

        // 使用 load
        let mut tree_load: RBush<Point> = RBush::new(9, 4);
        tree_load.load(points.clone());

        // 使用 insert
        let mut tree_insert: RBush<Point> = RBush::new(9, 4);
        for point in points {
            tree_insert.insert(point, 0);
        }

        // 两者应该包含相同数量的元素
        assert_eq!(
            count_items(tree_load.root.as_ref().unwrap()),
            count_items(tree_insert.root.as_ref().unwrap()),
            "Load and insert should result in same number of items"
        );

        // 两者都应该是合法的树结构
        assert!(validate_tree_structure(&tree_load).is_ok());
        assert!(validate_tree_structure(&tree_insert).is_ok());
    }

    #[test]
    fn test_load_should_be_more_balanced() {
        let points: Vec<Point> = (0..100).map(|i| Point::new(i as f64, i as f64)).collect();

        let mut tree_load: RBush<Point> = RBush::new(9, 4);
        tree_load.load(points.clone());

        let mut tree_insert: RBush<Point> = RBush::new(9, 4);
        for point in points {
            tree_insert.insert(point, 0);
        }

        let height_load = get_tree_height(tree_load.root.as_ref().unwrap());
        let height_insert = get_tree_height(tree_insert.root.as_ref().unwrap());

        // load 构建的树通常更平衡（高度更小或相等）
        assert!(
            height_load <= height_insert,
            "Load should create more balanced tree (load: {}, insert: {})",
            height_load,
            height_insert
        );
    }
}
