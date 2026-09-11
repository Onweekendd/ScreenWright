use bi_alignment::rbush_utils::{
    calculate_area, calculate_distribution_bbox, calculate_enlarged_area, calculate_margin,
    extend_bbox,
};
use bi_alignment::{Axis, BBox, HasBBox, RBush, RBushNode};

// 测试用的简单点结构
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

// 测试用的矩形结构
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

#[cfg(test)]
mod bbox_tests {
    use super::*;

    #[test]
    fn test_bbox_new() {
        let bbox = BBox::new(0.0, 0.0, 10.0, 10.0);
        assert_eq!(bbox.min_x, 0.0);
        assert_eq!(bbox.min_y, 0.0);
        assert_eq!(bbox.max_x, 10.0);
        assert_eq!(bbox.max_y, 10.0);
    }

    #[test]
    fn test_bbox_area() {
        let bbox = BBox::new(0.0, 0.0, 10.0, 10.0);
        assert_eq!(bbox.area(), 100.0);

        let bbox2 = BBox::new(5.0, 5.0, 15.0, 20.0);
        assert_eq!(bbox2.area(), 150.0);

        let bbox3 = BBox::new(0.0, 0.0, 0.0, 0.0);
        assert_eq!(bbox3.area(), 0.0);
    }

    #[test]
    fn test_bbox_area_negative_coords() {
        let bbox = BBox::new(-10.0, -10.0, 10.0, 10.0);
        assert_eq!(bbox.area(), 400.0);
    }

    #[test]
    fn test_bbox_area_fractional() {
        let bbox = BBox::new(0.0, 0.0, 2.5, 3.5);
        assert_eq!(bbox.area(), 8.75);
    }

    #[test]
    fn test_bbox_clone() {
        let bbox1 = BBox::new(1.0, 2.0, 3.0, 4.0);
        let bbox2 = bbox1.clone();
        assert_eq!(bbox1, bbox2);
    }

    #[test]
    fn test_bbox_debug() {
        let bbox = BBox::new(1.0, 2.0, 3.0, 4.0);
        let debug_str = format!("{:?}", bbox);
        assert!(debug_str.contains("BBox"));
        assert!(debug_str.contains("1.0"));
    }
}

#[cfg(test)]
mod calculate_functions_tests {
    use super::*;

    #[test]
    fn test_calculate_area() {
        let bbox = BBox::new(0.0, 0.0, 10.0, 10.0);
        assert_eq!(calculate_area(&bbox), 100.0);

        let bbox2 = BBox::new(5.0, 5.0, 15.0, 20.0);
        assert_eq!(calculate_area(&bbox2), 150.0);

        let bbox3 = BBox::new(-10.0, -10.0, 10.0, 10.0);
        assert_eq!(calculate_area(&bbox3), 400.0);
    }

    #[test]
    fn test_calculate_enlarged_area() {
        let bbox1 = BBox::new(0.0, 0.0, 10.0, 10.0);
        let bbox2 = BBox::new(5.0, 5.0, 15.0, 15.0);
        // 合并后的边界框是 (0.0, 0.0) -> (15.0, 15.0)
        assert_eq!(calculate_enlarged_area(&bbox1, &bbox2), 225.0);

        let bbox3 = BBox::new(0.0, 0.0, 5.0, 5.0);
        let bbox4 = BBox::new(10.0, 10.0, 15.0, 15.0);
        // 合并后的边界框是 (0.0, 0.0) -> (15.0, 15.0)
        assert_eq!(calculate_enlarged_area(&bbox3, &bbox4), 225.0);
    }

    #[test]
    fn test_calculate_enlarged_area_contained() {
        let bbox_large = BBox::new(0.0, 0.0, 100.0, 100.0);
        let bbox_small = BBox::new(10.0, 10.0, 20.0, 20.0);
        // 小边界框完全包含在大边界框内，合并后面积不变
        assert_eq!(calculate_enlarged_area(&bbox_large, &bbox_small), 10000.0);
    }

    #[test]
    fn test_calculate_distribution_bbox() {
        let bboxes = vec![
            BBox::new(0.0, 0.0, 10.0, 10.0),
            BBox::new(20.0, 20.0, 30.0, 30.0),
            BBox::new(40.0, 40.0, 50.0, 50.0),
        ];
        let result = calculate_distribution_bbox(&bboxes);
        assert_eq!(result.min_x, 0.0);
        assert_eq!(result.min_y, 0.0);
        assert_eq!(result.max_x, 50.0);
        assert_eq!(result.max_y, 50.0);
    }

    #[test]
    fn test_calculate_distribution_bbox_empty() {
        let bboxes: Vec<BBox> = vec![];
        let result = calculate_distribution_bbox(&bboxes);
        assert_eq!(result.min_x, 0.0);
        assert_eq!(result.min_y, 0.0);
        assert_eq!(result.max_x, 0.0);
        assert_eq!(result.max_y, 0.0);
    }

    #[test]
    fn test_calculate_distribution_bbox_single() {
        let bboxes = vec![BBox::new(5.0, 10.0, 15.0, 20.0)];
        let result = calculate_distribution_bbox(&bboxes);
        assert_eq!(result.min_x, 5.0);
        assert_eq!(result.min_y, 10.0);
        assert_eq!(result.max_x, 15.0);
        assert_eq!(result.max_y, 20.0);
    }

    #[test]
    fn test_calculate_margin() {
        let bbox = BBox::new(0.0, 0.0, 10.0, 10.0);
        // margin = (10.0 - 0.0) + (10.0 - 0.0) = 20.0
        assert_eq!(calculate_margin(&bbox), 20.0);

        let bbox2 = BBox::new(0.0, 0.0, 5.0, 15.0);
        // margin = (5.0 - 0.0) + (15.0 - 0.0) = 20.0
        assert_eq!(calculate_margin(&bbox2), 20.0);

        let bbox3 = BBox::new(0.0, 0.0, 10.0, 5.0);
        // margin = (10.0 - 0.0) + (5.0 - 0.0) = 15.0
        assert_eq!(calculate_margin(&bbox3), 15.0);
    }

    #[test]
    fn test_extend_bbox() {
        let bbox1 = BBox::new(0.0, 0.0, 10.0, 10.0);
        let bbox2 = BBox::new(5.0, 5.0, 15.0, 15.0);
        let extended = extend_bbox(&bbox1, &bbox2);

        assert_eq!(extended.min_x, 0.0);
        assert_eq!(extended.min_y, 0.0);
        assert_eq!(extended.max_x, 15.0);
        assert_eq!(extended.max_y, 15.0);
    }

    #[test]
    fn test_extend_bbox_no_overlap() {
        let bbox1 = BBox::new(0.0, 0.0, 5.0, 5.0);
        let bbox2 = BBox::new(10.0, 10.0, 15.0, 15.0);
        let extended = extend_bbox(&bbox1, &bbox2);

        assert_eq!(extended.min_x, 0.0);
        assert_eq!(extended.min_y, 0.0);
        assert_eq!(extended.max_x, 15.0);
        assert_eq!(extended.max_y, 15.0);
    }

    #[test]
    fn test_extend_bbox_contained() {
        let bbox_large = BBox::new(0.0, 0.0, 100.0, 100.0);
        let bbox_small = BBox::new(10.0, 10.0, 20.0, 20.0);
        let extended = extend_bbox(&bbox_large, &bbox_small);

        // 大边界框完全包含小边界框，扩展后应该等于大边界框
        assert_eq!(extended.min_x, 0.0);
        assert_eq!(extended.min_y, 0.0);
        assert_eq!(extended.max_x, 100.0);
        assert_eq!(extended.max_y, 100.0);
    }
}

#[cfg(test)]
mod has_bbox_tests {
    use super::*;

    #[test]
    fn test_point_bbox() {
        let point = Point::new(5.0, 10.0);
        let bbox = point.bbox();
        assert_eq!(bbox.min_x, 5.0);
        assert_eq!(bbox.min_y, 10.0);
        assert_eq!(bbox.max_x, 5.0);
        assert_eq!(bbox.max_y, 10.0);
        assert_eq!(bbox.area(), 0.0);
    }

    #[test]
    fn test_rectangle_bbox() {
        let rect = Rectangle::new(0.0, 0.0, 10.0, 20.0);
        let bbox = rect.bbox();
        assert_eq!(bbox.min_x, 0.0);
        assert_eq!(bbox.min_y, 0.0);
        assert_eq!(bbox.max_x, 10.0);
        assert_eq!(bbox.max_y, 20.0);
        assert_eq!(bbox.area(), 200.0);
    }

    #[test]
    fn test_point_clone() {
        let point1 = Point::new(1.0, 2.0);
        let point2 = point1.clone();
        assert_eq!(point1, point2);
    }

    #[test]
    fn test_rectangle_clone() {
        let rect1 = Rectangle::new(0.0, 0.0, 5.0, 5.0);
        let rect2 = rect1.clone();
        assert_eq!(rect1, rect2);
    }
}

#[cfg(test)]
mod rbush_node_tests {
    use super::*;

    #[test]
    fn test_new_leaf_node() {
        let points = vec![
            Point::new(1.0, 1.0),
            Point::new(2.0, 2.0),
            Point::new(3.0, 3.0),
        ];
        let node = RBushNode::new_leaf(points.clone());

        assert!(node.leaf);
        assert_eq!(node.height, 1);
        assert_eq!(node.items.len(), 3);
        assert_eq!(node.children.len(), 0);
        assert_eq!(node.items[0], points[0]);
    }

    #[test]
    fn test_new_leaf_node_empty() {
        let node: RBushNode<Point> = RBushNode::new_leaf(vec![]);

        assert!(node.leaf);
        assert_eq!(node.height, 1);
        assert_eq!(node.items.len(), 0);
        assert_eq!(node.children.len(), 0);
    }

    #[test]
    fn test_new_internal_node() {
        let leaf1 = RBushNode::new_leaf(vec![Point::new(1.0, 1.0)]);
        let leaf2 = RBushNode::new_leaf(vec![Point::new(2.0, 2.0)]);

        let internal = RBushNode::new_internal(vec![leaf1, leaf2]);

        assert!(!internal.leaf);
        assert_eq!(internal.height, 2);
        assert_eq!(internal.items.len(), 0);
        assert_eq!(internal.children.len(), 2);
    }

    #[test]
    fn test_new_internal_node_empty() {
        let internal: RBushNode<Point> = RBushNode::new_internal(vec![]);

        assert!(!internal.leaf);
        assert_eq!(internal.height, 1);
        assert_eq!(internal.items.len(), 0);
        assert_eq!(internal.children.len(), 0);
    }

    #[test]
    fn test_new_internal_node_nested() {
        let leaf1 = RBushNode::new_leaf(vec![Point::new(1.0, 1.0)]);
        let leaf2 = RBushNode::new_leaf(vec![Point::new(2.0, 2.0)]);
        let internal1 = RBushNode::new_internal(vec![leaf1, leaf2]);

        let leaf3 = RBushNode::new_leaf(vec![Point::new(3.0, 3.0)]);
        let internal2 = RBushNode::new_internal(vec![internal1, leaf3]);

        assert!(!internal2.leaf);
        assert_eq!(internal2.height, 3);
    }

    #[test]
    fn test_node_clone() {
        let points = vec![Point::new(1.0, 1.0), Point::new(2.0, 2.0)];
        let node1 = RBushNode::new_leaf(points);
        let node2 = node1.clone();

        assert_eq!(node1.leaf, node2.leaf);
        assert_eq!(node1.height, node2.height);
        assert_eq!(node1.items.len(), node2.items.len());
    }

    #[test]
    fn test_node_with_rectangles() {
        let rects = vec![
            Rectangle::new(0.0, 0.0, 5.0, 5.0),
            Rectangle::new(10.0, 10.0, 15.0, 15.0),
        ];
        let node = RBushNode::new_leaf(rects.clone());

        assert!(node.leaf);
        assert_eq!(node.items.len(), 2);
        assert_eq!(node.items[0], rects[0]);
    }

    #[test]
    fn test_leaf_node_initial_bbox() {
        let points = vec![Point::new(1.0, 1.0)];
        let node = RBushNode::new_leaf(points);

        // 初始 bbox 应该是 (0.0, 0.0, 0.0, 0.0)
        assert_eq!(node.bbox.min_x, 0.0);
        assert_eq!(node.bbox.min_y, 0.0);
        assert_eq!(node.bbox.max_x, 0.0);
        assert_eq!(node.bbox.max_y, 0.0);
    }

    #[test]
    fn test_internal_node_initial_bbox() {
        let leaf = RBushNode::new_leaf(vec![Point::new(1.0, 1.0)]);
        let internal = RBushNode::new_internal(vec![leaf]);

        // 初始 bbox 应该是 (0.0, 0.0, 0.0, 0.0)
        assert_eq!(internal.bbox.min_x, 0.0);
        assert_eq!(internal.bbox.min_y, 0.0);
        assert_eq!(internal.bbox.max_x, 0.0);
        assert_eq!(internal.bbox.max_y, 0.0);
    }
}

#[cfg(test)]
mod rbush_tests {
    use super::*;

    #[test]
    fn test_rbush_new() {
        let tree: RBush<Point> = RBush::new(9, 4);
        assert_eq!(tree.max_entries, 9);
        assert_eq!(tree.min_entries, 4);
        assert!(tree.root.is_none());
    }

    #[test]
    fn test_rbush_new_different_params() {
        let tree: RBush<Rectangle> = RBush::new(16, 8);
        assert_eq!(tree.max_entries, 16);
        assert_eq!(tree.min_entries, 8);
        assert!(tree.root.is_none());
    }

    #[test]
    fn test_rbush_with_root() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let leaf = RBushNode::new_leaf(vec![Point::new(1.0, 1.0)]);
        tree.root = Some(Box::new(leaf));

        assert!(tree.root.is_some());
        let root = tree.root.unwrap();
        assert!(root.leaf);
        assert_eq!(root.items.len(), 1);
    }
}

#[cfg(test)]
mod axis_tests {
    use super::*;

    #[test]
    fn test_axis_enum() {
        let x_axis = Axis::X;
        let y_axis = Axis::Y;

        // 只是确保枚举可以被使用
        match x_axis {
            Axis::X => assert!(true),
            Axis::Y => assert!(false),
        }

        match y_axis {
            Axis::X => assert!(false),
            Axis::Y => assert!(true),
        }
    }
}

#[cfg(test)]
mod integration_tests {
    use super::*;

    #[test]
    fn test_point_workflow() {
        // 创建一些点
        let points = vec![
            Point::new(0.0, 0.0),
            Point::new(10.0, 10.0),
            Point::new(20.0, 20.0),
        ];

        // 创建叶子节点
        let leaf = RBushNode::new_leaf(points.clone());

        // 验证节点属性
        assert!(leaf.leaf);
        assert_eq!(leaf.height, 1);
        assert_eq!(leaf.items.len(), 3);

        // 验证每个点的 bbox
        for (i, point) in points.iter().enumerate() {
            let bbox = point.bbox();
            assert_eq!(bbox.min_x, bbox.max_x);
            assert_eq!(bbox.min_y, bbox.max_y);
            assert_eq!(bbox.area(), 0.0);
            assert_eq!(leaf.items[i], *point);
        }
    }

    #[test]
    fn test_rectangle_workflow() {
        // 创建一些矩形
        let rects = vec![
            Rectangle::new(0.0, 0.0, 10.0, 10.0),
            Rectangle::new(20.0, 20.0, 30.0, 30.0),
            Rectangle::new(40.0, 40.0, 50.0, 50.0),
        ];

        // 创建叶子节点
        let leaf = RBushNode::new_leaf(rects.clone());

        // 验证节点
        assert!(leaf.leaf);
        assert_eq!(leaf.items.len(), 3);

        // 验证 bbox 面积
        assert_eq!(rects[0].bbox().area(), 100.0);
        assert_eq!(rects[1].bbox().area(), 100.0);
        assert_eq!(rects[2].bbox().area(), 100.0);
    }

    #[test]
    fn test_multi_level_tree() {
        // 创建多层树结构
        let points_a = vec![Point::new(0.0, 0.0), Point::new(1.0, 1.0)];
        let points_b = vec![Point::new(10.0, 10.0), Point::new(11.0, 11.0)];
        let points_c = vec![Point::new(20.0, 20.0), Point::new(21.0, 21.0)];

        let leaf_a = RBushNode::new_leaf(points_a);
        let leaf_b = RBushNode::new_leaf(points_b);
        let leaf_c = RBushNode::new_leaf(points_c);

        // 创建内部节点
        let internal_1 = RBushNode::new_internal(vec![leaf_a, leaf_b]);
        assert_eq!(internal_1.height, 2);
        assert_eq!(internal_1.children.len(), 2);

        // 创建更高层的内部节点
        let root = RBushNode::new_internal(vec![internal_1, leaf_c]);
        assert_eq!(root.height, 3);
        assert_eq!(root.children.len(), 2);
        assert!(!root.leaf);
    }

    #[test]
    fn test_mixed_coordinates() {
        // 测试负坐标和小数坐标
        let points = vec![
            Point::new(-10.5, -20.3),
            Point::new(0.0, 0.0),
            Point::new(10.7, 20.9),
        ];

        let leaf = RBushNode::new_leaf(points.clone());
        assert_eq!(leaf.items.len(), 3);

        for point in points {
            let bbox = point.bbox();
            assert_eq!(bbox.min_x, point.x);
            assert_eq!(bbox.min_y, point.y);
        }
    }

    #[test]
    fn test_rbush_tree_creation() {
        let tree: RBush<Point> = RBush::new(9, 4);
        assert!(tree.root.is_none());

        // 可以手动设置根节点
        let mut tree_with_root = tree;
        let points = vec![Point::new(1.0, 1.0), Point::new(2.0, 2.0)];
        let leaf = RBushNode::new_leaf(points);
        tree_with_root.root = Some(Box::new(leaf));

        assert!(tree_with_root.root.is_some());
    }

    #[test]
    fn test_calculate_bbox_for_points() {
        let points = vec![
            Point::new(0.0, 0.0),
            Point::new(10.0, 5.0),
            Point::new(5.0, 10.0),
        ];

        let bboxes: Vec<BBox> = points.iter().map(|p| p.bbox()).collect();
        let total_bbox = calculate_distribution_bbox(&bboxes);

        assert_eq!(total_bbox.min_x, 0.0);
        assert_eq!(total_bbox.min_y, 0.0);
        assert_eq!(total_bbox.max_x, 10.0);
        assert_eq!(total_bbox.max_y, 10.0);
    }

    #[test]
    fn test_calculate_bbox_for_rectangles() {
        let rects = vec![
            Rectangle::new(0.0, 0.0, 10.0, 10.0),
            Rectangle::new(20.0, 20.0, 30.0, 30.0),
        ];

        let bboxes: Vec<BBox> = rects.iter().map(|r| r.bbox()).collect();
        let total_bbox = calculate_distribution_bbox(&bboxes);

        assert_eq!(total_bbox.min_x, 0.0);
        assert_eq!(total_bbox.min_y, 0.0);
        assert_eq!(total_bbox.max_x, 30.0);
        assert_eq!(total_bbox.max_y, 30.0);
        assert_eq!(calculate_area(&total_bbox), 900.0);
    }

    #[test]
    fn test_extend_bbox_chain() {
        let bbox1 = BBox::new(0.0, 0.0, 10.0, 10.0);
        let bbox2 = BBox::new(15.0, 15.0, 20.0, 20.0);
        let bbox3 = BBox::new(-5.0, -5.0, 5.0, 5.0);

        let extended1 = extend_bbox(&bbox1, &bbox2);
        let extended2 = extend_bbox(&extended1, &bbox3);

        assert_eq!(extended2.min_x, -5.0);
        assert_eq!(extended2.min_y, -5.0);
        assert_eq!(extended2.max_x, 20.0);
        assert_eq!(extended2.max_y, 20.0);
    }
}
