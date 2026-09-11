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

#[derive(Debug, Clone, PartialEq)]
struct Rectangle {
    min_x: f64,
    min_y: f64,
    max_x: f64,
    max_y: f64,
}

impl Rectangle {
    fn new(min_x: f64, min_y: f64, max_x: f64, max_y: f64) -> Self {
        Rectangle {
            min_x,
            min_y,
            max_x,
            max_y,
        }
    }
}

impl HasBBox for Rectangle {
    fn bbox(&self) -> BBox {
        BBox::new(self.min_x, self.min_y, self.max_x, self.max_y)
    }
}

// ==================== 辅助函数 ====================

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
        if !is_root && (node.items.len() < min_entries || node.items.len() > max_entries) {
            return Err(format!(
                "Leaf node has {} items, expected {}-{}",
                node.items.len(),
                min_entries,
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
        if !is_root && (node.children.len() < min_entries || node.children.len() > max_entries) {
            return Err(format!(
                "Internal node has {} children, expected {}-{}",
                node.children.len(),
                min_entries,
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

fn bbox_contains(outer: &BBox, inner: &BBox) -> bool {
    outer.min_x <= inner.min_x
        && outer.min_y <= inner.min_y
        && outer.max_x >= inner.max_x
        && outer.max_y >= inner.max_y
}

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

// ==================== 基础插入测试 ====================

#[cfg(test)]
mod basic_insert_tests {
    use super::*;

    #[test]
    fn test_insert_to_empty_tree() {
        let mut tree: RBush<Point> = RBush::new(4, 2);
        let point = Point::new(1.0, 1.0);

        tree.insert(point.clone(), 0);

        assert!(tree.root.is_some(), "Root should exist after insert");
        let root = tree.root.as_ref().unwrap();
        assert!(root.leaf, "Root should be a leaf node");
        assert_eq!(root.items.len(), 1, "Root should have 1 item");
        assert_eq!(root.items[0], point, "Inserted point should match");
        assert_eq!(root.bbox, point.bbox(), "Root bbox should match point");
    }

    #[test]
    fn test_insert_multiple_points_no_split() {
        let mut tree: RBush<Point> = RBush::new(4, 2);

        tree.insert(Point::new(0.0, 0.0), 0);
        tree.insert(Point::new(1.0, 1.0), 0);
        tree.insert(Point::new(2.0, 2.0), 0);

        let root = tree.root.as_ref().unwrap();
        assert!(root.leaf, "Root should still be a leaf");
        assert_eq!(root.items.len(), 3, "Root should have 3 items");
        assert_eq!(root.bbox.min_x, 0.0);
        assert_eq!(root.bbox.min_y, 0.0);
        assert_eq!(root.bbox.max_x, 2.0);
        assert_eq!(root.bbox.max_y, 2.0);
    }

    #[test]
    fn test_insert_with_negative_coordinates() {
        let mut tree: RBush<Point> = RBush::new(4, 2);

        tree.insert(Point::new(-5.0, -5.0), 0);
        tree.insert(Point::new(5.0, 5.0), 0);

        let root = tree.root.as_ref().unwrap();
        assert_eq!(root.bbox.min_x, -5.0);
        assert_eq!(root.bbox.min_y, -5.0);
        assert_eq!(root.bbox.max_x, 5.0);
        assert_eq!(root.bbox.max_y, 5.0);
    }

    #[test]
    fn test_insert_with_decimal_coordinates() {
        let mut tree: RBush<Point> = RBush::new(4, 2);

        tree.insert(Point::new(1.5, 2.5), 0);
        tree.insert(Point::new(3.7, 4.2), 0);

        let root = tree.root.as_ref().unwrap();
        assert_eq!(root.bbox.min_x, 1.5);
        assert_eq!(root.bbox.max_y, 4.2);
    }

    #[test]
    fn test_insert_duplicate_points() {
        let mut tree: RBush<Point> = RBush::new(4, 2);
        let point = Point::new(1.0, 1.0);

        tree.insert(point.clone(), 0);
        tree.insert(point.clone(), 0);
        tree.insert(point.clone(), 0);

        let root = tree.root.as_ref().unwrap();
        assert_eq!(root.items.len(), 3, "All duplicate points should be inserted");
    }

    #[test]
    fn test_insert_rectangles() {
        let mut tree: RBush<Rectangle> = RBush::new(4, 2);

        tree.insert(Rectangle::new(0.0, 0.0, 2.0, 2.0), 0);
        tree.insert(Rectangle::new(3.0, 3.0, 5.0, 5.0), 0);

        let root = tree.root.as_ref().unwrap();
        assert_eq!(root.items.len(), 2);
        assert_eq!(root.bbox.min_x, 0.0);
        assert_eq!(root.bbox.max_x, 5.0);
    }
}

// ==================== 节点分裂测试 ====================

#[cfg(test)]
mod split_tests {
    use super::*;

    #[test]
    fn test_leaf_node_split() {
        let mut tree: RBush<Point> = RBush::new(4, 2);

        // 插入5个点，触发分裂（max_entries=4）
        for i in 0..=4 {
            tree.insert(Point::new(i as f64, i as f64), 0);
        }

        let root = tree.root.as_ref().unwrap();

        // 分裂后，根节点应该不再是叶子节点
        assert!(
            !root.leaf,
            "Root should become internal node after split"
        );

        // 应该有2个子节点
        assert_eq!(root.children.len(), 2, "Root should have 2 children");

        // 验证总item数
        assert_eq!(count_items(root), 5, "Total items should be 5");

        // 验证树结构合法性
        assert!(validate_tree_structure(&tree).is_ok());
    }

    #[test]
    fn test_root_split_height_increase() {
        let mut tree: RBush<Point> = RBush::new(4, 2);

        // 插入足够多的点触发根节点分裂
        for i in 0..=4 {
            tree.insert(Point::new(i as f64, i as f64), 0);
        }

        let root = tree.root.as_ref().unwrap();
        assert_eq!(root.height, 2, "Tree height should increase to 2");
        assert!(!root.leaf, "Root should be internal after split");

        // 验证子节点
        for child in &root.children {
            assert_eq!(child.height, 1, "Children should have height 1");
            assert!(child.leaf, "Children should be leaf nodes");
        }
    }

    #[test]
    fn test_cascading_split() {
        let mut tree: RBush<Point> = RBush::new(4, 2);

        // 插入大量点触发多层级分裂
        for i in 0..20 {
            tree.insert(Point::new(i as f64, i as f64), 0);
        }

        // 验证所有点都被插入
        let root = tree.root.as_ref().unwrap();
        assert_eq!(count_items(root), 20, "All 20 items should be in tree");

        // 验证树结构合法性
        assert!(
            validate_tree_structure(&tree).is_ok(),
            "Tree structure should be valid"
        );
    }

    #[test]
    fn test_bbox_after_split() {
        let mut tree: RBush<Point> = RBush::new(4, 2);

        // 插入点在不同位置
        let points = vec![
            Point::new(0.0, 0.0),
            Point::new(10.0, 10.0),
            Point::new(5.0, 5.0),
            Point::new(15.0, 15.0),
            Point::new(20.0, 20.0),
        ];

        for point in &points {
            tree.insert(point.clone(), 0);
        }

        let root = tree.root.as_ref().unwrap();

        // 根节点的 bbox 应该包含所有点
        assert_eq!(root.bbox.min_x, 0.0);
        assert_eq!(root.bbox.min_y, 0.0);
        assert_eq!(root.bbox.max_x, 20.0);
        assert_eq!(root.bbox.max_y, 20.0);

        // 验证所有子节点的 bbox 被正确包含
        for child in &root.children {
            assert!(bbox_contains(&root.bbox, &child.bbox));
        }
    }

    #[test]
    fn test_split_distribution() {
        let mut tree: RBush<Point> = RBush::new(4, 2);

        // 插入5个点
        for i in 0..=4 {
            tree.insert(Point::new(i as f64, i as f64), 0);
        }

        let root = tree.root.as_ref().unwrap();

        // 检查分裂是否合理（每个子节点至少有 min_entries 个项）
        for child in &root.children {
            if child.leaf {
                assert!(
                    child.items.len() >= tree.min_entries,
                    "Each child should have at least min_entries items"
                );
            }
        }
    }
}

// ==================== BBox 更新测试 ====================

#[cfg(test)]
mod bbox_update_tests {
    use super::*;

    #[test]
    fn test_bbox_expansion_on_insert() {
        let mut tree: RBush<Point> = RBush::new(4, 2);

        tree.insert(Point::new(0.0, 0.0), 0);
        tree.insert(Point::new(5.0, 5.0), 0);

        let root = tree.root.as_ref().unwrap();
        assert_eq!(root.bbox.min_x, 0.0);
        assert_eq!(root.bbox.max_x, 5.0);

        // 插入扩展 bbox 的点
        tree.insert(Point::new(-2.0, 10.0), 0);

        let root = tree.root.as_ref().unwrap();
        assert_eq!(root.bbox.min_x, -2.0, "BBox should expand to -2");
        assert_eq!(root.bbox.max_y, 10.0, "BBox should expand to 10");
    }

    #[test]
    fn test_bbox_contains_all_children_after_split() {
        let mut tree: RBush<Point> = RBush::new(4, 2);

        for i in 0..10 {
            tree.insert(Point::new(i as f64, i as f64), 0);
        }

        fn check_bbox_containment<T: HasBBox>(node: &RBushNode<T>) -> bool {
            if node.leaf {
                node.items
                    .iter()
                    .all(|item| bbox_contains(&node.bbox, &item.bbox()))
            } else {
                node.children.iter().all(|child| {
                    bbox_contains(&node.bbox, &child.bbox) && check_bbox_containment(child.as_ref())
                })
            }
        }

        let root = tree.root.as_ref().unwrap();
        assert!(
            check_bbox_containment(root),
            "All bboxes should contain their children/items"
        );
    }
}

// ==================== 边界条件测试 ====================

#[cfg(test)]
mod edge_case_tests {
    use super::*;

    #[test]
    fn test_single_point_in_tree() {
        let mut tree: RBush<Point> = RBush::new(4, 2);
        tree.insert(Point::new(1.0, 1.0), 0);

        assert!(validate_tree_structure(&tree).is_ok());

        let root = tree.root.as_ref().unwrap();
        assert_eq!(count_items(root), 1);
    }

    #[test]
    fn test_max_entries_boundary() {
        let mut tree: RBush<Point> = RBush::new(4, 2);

        // 插入恰好 max_entries 个点，不应该分裂
        for i in 0..4 {
            tree.insert(Point::new(i as f64, i as f64), 0);
        }

        let root = tree.root.as_ref().unwrap();
        assert!(root.leaf, "Should not split at max_entries");

        // 再插入一个，应该分裂
        tree.insert(Point::new(4.0, 4.0), 0);

        let root = tree.root.as_ref().unwrap();
        assert!(!root.leaf, "Should split after exceeding max_entries");
    }

    #[test]
    fn test_large_coordinate_values() {
        let mut tree: RBush<Point> = RBush::new(4, 2);

        tree.insert(Point::new(1000000.0, 1000000.0), 0);
        tree.insert(Point::new(-1000000.0, -1000000.0), 0);

        assert!(validate_tree_structure(&tree).is_ok());
    }

    #[test]
    fn test_zero_coordinates() {
        let mut tree: RBush<Point> = RBush::new(4, 2);

        tree.insert(Point::new(0.0, 0.0), 0);
        tree.insert(Point::new(0.0, 1.0), 0);
        tree.insert(Point::new(1.0, 0.0), 0);

        assert_eq!(count_items(tree.root.as_ref().unwrap()), 3);
    }
}

// ==================== 集成测试 ====================

#[cfg(test)]
mod integration_tests {
    use super::*;

    #[test]
    fn test_insert_50_sequential_points() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        for i in 0..50 {
            tree.insert(Point::new(i as f64, i as f64), 0);
        }

        let root = tree.root.as_ref().unwrap();
        assert_eq!(count_items(root), 50, "All 50 points should be inserted");
        assert!(
            validate_tree_structure(&tree).is_ok(),
            "Tree structure should be valid"
        );
    }

    #[test]
    fn test_insert_random_distribution() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        // 模拟随机分布的点
        let points = vec![
            (5.0, 10.0),
            (15.0, 3.0),
            (2.0, 18.0),
            (20.0, 1.0),
            (8.0, 12.0),
            (18.0, 15.0),
            (3.0, 7.0),
            (12.0, 20.0),
            (7.0, 5.0),
            (16.0, 9.0),
        ];

        for (x, y) in points {
            tree.insert(Point::new(x, y), 0);
        }

        assert_eq!(count_items(tree.root.as_ref().unwrap()), 10);
        assert!(validate_tree_structure(&tree).is_ok());
    }

    #[test]
    fn test_insert_clustered_points() {
        let mut tree: RBush<Point> = RBush::new(4, 2);

        // 第一个聚类：(0-5, 0-5)
        for i in 0..=5 {
            for j in 0..=5 {
                tree.insert(Point::new(i as f64, j as f64), 0);
            }
        }

        // 第二个聚类：(100-105, 100-105)
        for i in 100..=105 {
            for j in 100..=105 {
                tree.insert(Point::new(i as f64, j as f64), 0);
            }
        }

        let root = tree.root.as_ref().unwrap();
        assert_eq!(count_items(root), 72, "All clustered points inserted");
        assert!(validate_tree_structure(&tree).is_ok());
    }

    #[test]
    fn test_mixed_data_types() {
        let mut tree: RBush<Rectangle> = RBush::new(4, 2);

        tree.insert(Rectangle::new(0.0, 0.0, 2.0, 2.0), 0);
        tree.insert(Rectangle::new(3.0, 3.0, 5.0, 5.0), 0);
        tree.insert(Rectangle::new(1.0, 1.0, 4.0, 4.0), 0);
        tree.insert(Rectangle::new(6.0, 6.0, 8.0, 8.0), 0);
        tree.insert(Rectangle::new(2.0, 2.0, 7.0, 7.0), 0);

        assert_eq!(count_items(tree.root.as_ref().unwrap()), 5);
        assert!(validate_tree_structure(&tree).is_ok());
    }

    #[test]
    fn test_tree_balancing_with_many_inserts() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        // 插入100个点
        for i in 0..100 {
            tree.insert(Point::new((i % 10) as f64, (i / 10) as f64), 0);
        }

        let root = tree.root.as_ref().unwrap();
        assert_eq!(count_items(root), 100);

        // 验证树的高度是合理的（不应该退化成链表）
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

        let height = get_tree_height(root);
        assert!(
            height <= 5,
            "Tree height should be reasonable (got {})",
            height
        );
    }
}
