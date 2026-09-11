use bi_alignment::{BBox, HasBBox, RBush};

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

// ==================== all() 方法测试 ====================

#[cfg(test)]
mod all_tests {
    use super::*;

    #[test]
    fn test_all_on_empty_tree() {
        let tree: RBush<Point> = RBush::new(9, 4);
        let all_items = tree.all();

        assert_eq!(all_items.len(), 0, "Empty tree should return no items");
    }

    #[test]
    fn test_all_with_single_item() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let point = Point::new(1.0, 1.0);

        tree.insert(point.clone(), 0);

        let all_items = tree.all();
        assert_eq!(all_items.len(), 1);
        assert_eq!(all_items[0], point);
    }

    #[test]
    fn test_all_with_multiple_items() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        for i in 0..10 {
            tree.insert(Point::new(i as f64, i as f64), 0);
        }

        let all_items = tree.all();
        assert_eq!(all_items.len(), 10, "Should return all 10 items");
    }

    #[test]
    fn test_all_after_split() {
        let mut tree: RBush<Point> = RBush::new(4, 2);

        // 插入足够多的点触发分裂
        for i in 0..20 {
            tree.insert(Point::new(i as f64, i as f64), 0);
        }

        let all_items = tree.all();
        assert_eq!(all_items.len(), 20, "Should return all items after split");
    }

    #[test]
    fn test_all_with_load() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let points: Vec<Point> = (0..50).map(|i| Point::new(i as f64, i as f64)).collect();

        tree.load(points.clone());

        let all_items = tree.all();
        assert_eq!(all_items.len(), 50, "Should return all loaded items");
    }

    #[test]
    fn test_all_with_rectangles() {
        let mut tree: RBush<Rectangle> = RBush::new(9, 4);

        tree.insert(Rectangle::new(0.0, 0.0, 2.0, 2.0), 0);
        tree.insert(Rectangle::new(3.0, 3.0, 5.0, 5.0), 0);
        tree.insert(Rectangle::new(6.0, 6.0, 8.0, 8.0), 0);

        let all_items = tree.all();
        assert_eq!(all_items.len(), 3);
    }
}

// ==================== search() 方法测试 ====================

#[cfg(test)]
mod search_tests {
    use super::*;

    #[test]
    fn test_search_empty_tree() {
        let tree: RBush<Point> = RBush::new(9, 4);
        let search_bbox = BBox::new(0.0, 0.0, 10.0, 10.0);

        let results = tree.search(&search_bbox);
        assert_eq!(results.len(), 0, "Empty tree should return no results");
    }

    #[test]
    fn test_search_single_point_hit() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        tree.insert(Point::new(5.0, 5.0), 0);

        let search_bbox = BBox::new(0.0, 0.0, 10.0, 10.0);
        let results = tree.search(&search_bbox);

        assert_eq!(results.len(), 1, "Should find the point");
        assert_eq!(results[0], Point::new(5.0, 5.0));
    }

    #[test]
    fn test_search_single_point_miss() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        tree.insert(Point::new(15.0, 15.0), 0);

        let search_bbox = BBox::new(0.0, 0.0, 10.0, 10.0);
        let results = tree.search(&search_bbox);

        assert_eq!(results.len(), 0, "Should not find the point");
    }

    #[test]
    fn test_search_multiple_points() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        // 插入点网格
        for i in 0..10 {
            for j in 0..10 {
                tree.insert(Point::new(i as f64, j as f64), 0);
            }
        }

        // 搜索左上角区域 [0,0,5,5]
        let search_bbox = BBox::new(0.0, 0.0, 5.0, 5.0);
        let results = tree.search(&search_bbox);

        // 应该找到 (0-5) x (0-5) = 36 个点
        assert_eq!(results.len(), 36, "Should find 36 points in the region");
    }

    #[test]
    fn test_search_boundary_exact() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        tree.insert(Point::new(5.0, 5.0), 0);

        // 搜索框边界正好在点上
        let search_bbox = BBox::new(5.0, 5.0, 10.0, 10.0);
        let results = tree.search(&search_bbox);

        assert_eq!(results.len(), 1, "Should find point on boundary");
    }

    #[test]
    fn test_search_rectangles() {
        let mut tree: RBush<Rectangle> = RBush::new(9, 4);

        tree.insert(Rectangle::new(0.0, 0.0, 2.0, 2.0), 0);
        tree.insert(Rectangle::new(5.0, 5.0, 7.0, 7.0), 0);
        tree.insert(Rectangle::new(10.0, 10.0, 12.0, 12.0), 0);

        // 搜索中间区域，应该只找到第二个矩形
        let search_bbox = BBox::new(4.0, 4.0, 8.0, 8.0);
        let results = tree.search(&search_bbox);

        assert_eq!(results.len(), 1);
        assert_eq!(results[0], Rectangle::new(5.0, 5.0, 7.0, 7.0));
    }

    #[test]
    fn test_search_overlapping_rectangles() {
        let mut tree: RBush<Rectangle> = RBush::new(9, 4);

        tree.insert(Rectangle::new(0.0, 0.0, 5.0, 5.0), 0);
        tree.insert(Rectangle::new(3.0, 3.0, 8.0, 8.0), 0);
        tree.insert(Rectangle::new(6.0, 6.0, 10.0, 10.0), 0);

        // 搜索框 [4,4,7,7] 应该与所有三个矩形相交
        // Rect1 [0,0,5,5]: 相交 ✓
        // Rect2 [3,3,8,8]: 相交 ✓
        // Rect3 [6,6,10,10]: 相交 ✓
        let search_bbox = BBox::new(4.0, 4.0, 7.0, 7.0);
        let results = tree.search(&search_bbox);

        assert_eq!(results.len(), 3, "Should find 3 overlapping rectangles");
    }

    #[test]
    fn test_search_after_split() {
        let mut tree: RBush<Point> = RBush::new(4, 2);

        // 插入触发分裂
        for i in 0..20 {
            tree.insert(Point::new(i as f64, i as f64), 0);
        }

        // 搜索前半部分
        let search_bbox = BBox::new(0.0, 0.0, 10.0, 10.0);
        let results = tree.search(&search_bbox);

        assert_eq!(results.len(), 11, "Should find points 0-10");
    }

    #[test]
    fn test_search_with_negative_coordinates() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        tree.insert(Point::new(-5.0, -5.0), 0);
        tree.insert(Point::new(0.0, 0.0), 0);
        tree.insert(Point::new(5.0, 5.0), 0);

        let search_bbox = BBox::new(-10.0, -10.0, 1.0, 1.0);
        let results = tree.search(&search_bbox);

        assert_eq!(results.len(), 2, "Should find 2 points in negative region");
    }

    #[test]
    fn test_search_large_bbox() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        for i in 0..10 {
            tree.insert(Point::new(i as f64, i as f64), 0);
        }

        // 搜索框覆盖所有点
        let search_bbox = BBox::new(-100.0, -100.0, 100.0, 100.0);
        let results = tree.search(&search_bbox);

        assert_eq!(results.len(), 10, "Should find all points");
    }

    #[test]
    fn test_search_with_load() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let points: Vec<Point> = (0..100)
            .map(|i| Point::new((i % 10) as f64, (i / 10) as f64))
            .collect();

        tree.load(points);

        // 搜索左上角区域
        let search_bbox = BBox::new(0.0, 0.0, 5.0, 5.0);
        let results = tree.search(&search_bbox);

        assert!(results.len() > 0, "Should find points in loaded tree");
    }
}

// ==================== collides() 方法测试 ====================

#[cfg(test)]
mod collides_tests {
    use super::*;

    #[test]
    fn test_collides_empty_tree() {
        let tree: RBush<Point> = RBush::new(9, 4);
        let search_bbox = BBox::new(0.0, 0.0, 10.0, 10.0);

        assert!(!tree.collides(&search_bbox), "Empty tree has no collisions");
    }

    #[test]
    fn test_collides_single_point_hit() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        tree.insert(Point::new(5.0, 5.0), 0);

        let search_bbox = BBox::new(0.0, 0.0, 10.0, 10.0);
        assert!(tree.collides(&search_bbox), "Should collide with the point");
    }

    #[test]
    fn test_collides_single_point_miss() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        tree.insert(Point::new(15.0, 15.0), 0);

        let search_bbox = BBox::new(0.0, 0.0, 10.0, 10.0);
        assert!(
            !tree.collides(&search_bbox),
            "Should not collide with the point"
        );
    }

    #[test]
    fn test_collides_multiple_points() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        for i in 0..10 {
            tree.insert(Point::new(i as f64, i as f64), 0);
        }

        let search_bbox = BBox::new(5.0, 5.0, 15.0, 15.0);
        assert!(tree.collides(&search_bbox), "Should collide with some points");
    }

    #[test]
    fn test_collides_early_exit() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        // 插入大量点
        for i in 0..1000 {
            tree.insert(Point::new(i as f64, i as f64), 0);
        }

        // collides 应该在找到第一个碰撞后立即返回
        let search_bbox = BBox::new(0.0, 0.0, 10.0, 10.0);
        assert!(tree.collides(&search_bbox), "Should find collision quickly");
    }

    #[test]
    fn test_collides_rectangles() {
        let mut tree: RBush<Rectangle> = RBush::new(9, 4);

        tree.insert(Rectangle::new(0.0, 0.0, 2.0, 2.0), 0);
        tree.insert(Rectangle::new(10.0, 10.0, 12.0, 12.0), 0);

        // 与第一个矩形碰撞
        let bbox1 = BBox::new(1.0, 1.0, 3.0, 3.0);
        assert!(tree.collides(&bbox1));

        // 与第二个矩形碰撞
        let bbox2 = BBox::new(9.0, 9.0, 11.0, 11.0);
        assert!(tree.collides(&bbox2));

        // 不与任何矩形碰撞
        let bbox3 = BBox::new(5.0, 5.0, 7.0, 7.0);
        assert!(!tree.collides(&bbox3));
    }

    #[test]
    fn test_collides_boundary() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        tree.insert(Point::new(5.0, 5.0), 0);

        // 边界正好触碰
        let search_bbox = BBox::new(5.0, 5.0, 10.0, 10.0);
        assert!(tree.collides(&search_bbox), "Boundary touch should collide");
    }

    #[test]
    fn test_collides_with_negative_coords() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        tree.insert(Point::new(-5.0, -5.0), 0);
        tree.insert(Point::new(5.0, 5.0), 0);

        let bbox_neg = BBox::new(-10.0, -10.0, 0.0, 0.0);
        assert!(tree.collides(&bbox_neg), "Should collide in negative region");

        let bbox_pos = BBox::new(0.0, 0.0, 10.0, 10.0);
        assert!(tree.collides(&bbox_pos), "Should collide in positive region");
    }
}

// ==================== 集成测试 ====================

#[cfg(test)]
mod integration_tests {
    use super::*;

    #[test]
    fn test_search_and_all_consistency() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        for i in 0..50 {
            tree.insert(Point::new(i as f64, i as f64), 0);
        }

        let all_items = tree.all();

        // 搜索覆盖所有点的区域
        let search_bbox = BBox::new(-10.0, -10.0, 100.0, 100.0);
        let search_results = tree.search(&search_bbox);

        assert_eq!(
            all_items.len(),
            search_results.len(),
            "all() and search(large bbox) should return same count"
        );
    }

    #[test]
    fn test_collides_implies_search_not_empty() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        for i in 0..20 {
            tree.insert(Point::new(i as f64, i as f64), 0);
        }

        let search_bbox = BBox::new(5.0, 5.0, 15.0, 15.0);

        if tree.collides(&search_bbox) {
            let results = tree.search(&search_bbox);
            assert!(
                !results.is_empty(),
                "If collides is true, search must return results"
            );
        }
    }

    #[test]
    fn test_search_clustered_data() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        // 簇 1: (0-10, 0-10)
        for i in 0..=10 {
            for j in 0..=10 {
                tree.insert(Point::new(i as f64, j as f64), 0);
            }
        }

        // 簇 2: (100-110, 100-110)
        for i in 100..=110 {
            for j in 100..=110 {
                tree.insert(Point::new(i as f64, j as f64), 0);
            }
        }

        // 搜索簇 1
        let bbox1 = BBox::new(-5.0, -5.0, 15.0, 15.0);
        let results1 = tree.search(&bbox1);
        assert_eq!(results1.len(), 121, "Should find all points in cluster 1");

        // 搜索簇 2
        let bbox2 = BBox::new(95.0, 95.0, 115.0, 115.0);
        let results2 = tree.search(&bbox2);
        assert_eq!(results2.len(), 121, "Should find all points in cluster 2");

        // 搜索中间空白区域
        let bbox3 = BBox::new(50.0, 50.0, 60.0, 60.0);
        let results3 = tree.search(&bbox3);
        assert_eq!(results3.len(), 0, "Should find no points in empty region");
    }

    #[test]
    fn test_search_performance_with_load() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        // 使用 load 构建树
        let points: Vec<Point> = (0..1000)
            .map(|i| Point::new((i % 100) as f64, (i / 100) as f64))
            .collect();
        tree.load(points);

        // 搜索小区域
        let search_bbox = BBox::new(10.0, 0.0, 20.0, 5.0);
        let results = tree.search(&search_bbox);

        // 应该找到 (10-20) x (0-5) 的点
        assert!(results.len() > 0, "Should find points in the region");
        assert!(
            results.len() < 100,
            "Should not return all points (spatial pruning working)"
        );
    }

    #[test]
    fn test_mixed_operations() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        // 先 load 一批
        let points1: Vec<Point> = (0..50).map(|i| Point::new(i as f64, i as f64)).collect();
        tree.load(points1);

        // 再 insert 一些
        for i in 50..100 {
            tree.insert(Point::new(i as f64, i as f64), 0);
        }

        // 验证 all() 返回所有点
        let all_items = tree.all();
        assert_eq!(all_items.len(), 100, "Should have 100 items total");

        // 验证 search 正常工作
        let search_bbox = BBox::new(0.0, 0.0, 25.0, 25.0);
        let results = tree.search(&search_bbox);
        assert_eq!(results.len(), 26, "Should find points 0-25");
    }
}
