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
    id: u32, // 添加 id 用于自定义比较
}

impl Rectangle {
    fn new(min_x: f64, min_y: f64, max_x: f64, max_y: f64, id: u32) -> Self {
        Rectangle {
            min_x,
            min_y,
            max_x,
            max_y,
            id,
        }
    }
}

impl HasBBox for Rectangle {
    fn bbox(&self) -> BBox {
        BBox::new(self.min_x, self.min_y, self.max_x, self.max_y)
    }
}

// ==================== 辅助函数 ====================

fn count_items<T: HasBBox>(tree: &RBush<T>) -> usize {
    tree.all().len()
}

// ==================== remove() 基础测试 ====================

#[cfg(test)]
mod remove_basic_tests {
    use super::*;

    #[test]
    fn test_remove_from_empty_tree() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let point = Point::new(1.0, 1.0);

        let removed = tree.remove(&point, None::<fn(&Point, &Point) -> bool>);
        assert!(!removed, "Should not remove from empty tree");
    }

    #[test]
    fn test_remove_single_item() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let point = Point::new(1.0, 1.0);

        tree.insert(point.clone(), 0);
        assert_eq!(count_items(&tree), 1);

        let removed = tree.remove(&point, None::<fn(&Point, &Point) -> bool>);
        assert!(removed, "Should successfully remove the item");
        assert_eq!(count_items(&tree), 0, "Tree should be empty after removal");
        assert!(tree.root.is_none(), "Root should be None after removing last item");
    }

    #[test]
    fn test_remove_one_of_many() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        for i in 0..10 {
            tree.insert(Point::new(i as f64, i as f64), 0);
        }

        let point_to_remove = Point::new(5.0, 5.0);
        let removed = tree.remove(&point_to_remove, None::<fn(&Point, &Point) -> bool>);

        assert!(removed, "Should successfully remove the item");
        assert_eq!(count_items(&tree), 9, "Should have 9 items left");

        // 验证确实被删除了
        let search_bbox = BBox::new(5.0, 5.0, 5.0, 5.0);
        let results = tree.search(&search_bbox);
        assert_eq!(results.len(), 0, "Removed item should not be found");
    }

    #[test]
    fn test_remove_nonexistent_item() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        for i in 0..5 {
            tree.insert(Point::new(i as f64, i as f64), 0);
        }

        let nonexistent = Point::new(100.0, 100.0);
        let removed = tree.remove(&nonexistent, None::<fn(&Point, &Point) -> bool>);

        assert!(!removed, "Should not remove nonexistent item");
        assert_eq!(count_items(&tree), 5, "Tree size should remain unchanged");
    }

    #[test]
    fn test_remove_duplicate_items() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let point = Point::new(1.0, 1.0);

        // 插入3个相同的点
        tree.insert(point.clone(), 0);
        tree.insert(point.clone(), 0);
        tree.insert(point.clone(), 0);
        assert_eq!(count_items(&tree), 3);

        // 删除一次只删除一个
        let removed = tree.remove(&point, None::<fn(&Point, &Point) -> bool>);
        assert!(removed, "Should remove one instance");
        assert_eq!(count_items(&tree), 2, "Should have 2 items left");
    }

    #[test]
    fn test_remove_with_custom_equals() {
        let mut tree: RBush<Rectangle> = RBush::new(9, 4);

        tree.insert(Rectangle::new(0.0, 0.0, 2.0, 2.0, 1), 0);
        tree.insert(Rectangle::new(0.0, 0.0, 2.0, 2.0, 2), 0); // 相同位置，不同 id
        tree.insert(Rectangle::new(3.0, 3.0, 5.0, 5.0, 3), 0);

        // 使用自定义比较函数（按 id 比较）
        let to_remove = Rectangle::new(0.0, 0.0, 2.0, 2.0, 1);
        let removed = tree.remove(&to_remove, Some(|a: &Rectangle, b: &Rectangle| a.id == b.id));

        assert!(removed, "Should remove item with id=1");
        assert_eq!(count_items(&tree), 2);

        // 验证删除的是正确的项
        let all_items = tree.all();
        assert!(all_items.iter().all(|r| r.id != 1), "Item with id=1 should be removed");
        assert!(all_items.iter().any(|r| r.id == 2), "Item with id=2 should remain");
    }
}

// ==================== remove() 分裂后测试 ====================

#[cfg(test)]
mod remove_after_split_tests {
    use super::*;

    #[test]
    fn test_remove_after_split() {
        let mut tree: RBush<Point> = RBush::new(4, 2);

        // 插入足够多的点触发分裂
        for i in 0..20 {
            tree.insert(Point::new(i as f64, i as f64), 0);
        }

        assert_eq!(count_items(&tree), 20);

        // 删除一些点
        for i in 0..5 {
            let point = Point::new(i as f64, i as f64);
            let removed = tree.remove(&point, None::<fn(&Point, &Point) -> bool>);
            assert!(removed, "Should remove point {}", i);
        }

        assert_eq!(count_items(&tree), 15, "Should have 15 items left");
    }

    #[test]
    fn test_remove_updates_bbox() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        tree.insert(Point::new(0.0, 0.0), 0);
        tree.insert(Point::new(10.0, 10.0), 0);
        tree.insert(Point::new(5.0, 5.0), 0);

        // 删除边界点
        let removed = tree.remove(&Point::new(10.0, 10.0), None::<fn(&Point, &Point) -> bool>);
        assert!(removed);

        // 验证 bbox 已更新
        let root = tree.root.as_ref().unwrap();
        assert_eq!(root.bbox.max_x, 5.0, "BBox should be updated after removal");
        assert_eq!(root.bbox.max_y, 5.0, "BBox should be updated after removal");
    }

    #[test]
    fn test_remove_all_items_sequentially() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let points: Vec<Point> = (0..10).map(|i| Point::new(i as f64, i as f64)).collect();

        for point in &points {
            tree.insert(point.clone(), 0);
        }

        assert_eq!(count_items(&tree), 10);

        // 逐个删除所有点
        for point in &points {
            let removed = tree.remove(point, None::<fn(&Point, &Point) -> bool>);
            assert!(removed, "Should remove point {:?}", point);
        }

        assert_eq!(count_items(&tree), 0, "All items should be removed");
        assert!(tree.root.is_none(), "Tree should be empty");
    }

    #[test]
    fn test_remove_from_loaded_tree() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let points: Vec<Point> = (0..50).map(|i| Point::new(i as f64, i as f64)).collect();

        tree.load(points.clone());
        assert_eq!(count_items(&tree), 50);

        // 删除一些点
        for i in 0..10 {
            let point = Point::new(i as f64, i as f64);
            let removed = tree.remove(&point, None::<fn(&Point, &Point) -> bool>);
            assert!(removed, "Should remove point {}", i);
        }

        assert_eq!(count_items(&tree), 40, "Should have 40 items left");
    }
}

// ==================== update() 测试 ====================

#[cfg(test)]
mod update_tests {
    use super::*;

    #[test]
    fn test_update_single_item() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let old_point = Point::new(1.0, 1.0);
        let new_point = Point::new(5.0, 5.0);

        tree.insert(old_point.clone(), 0);

        let updated = tree.update(&old_point, new_point.clone(), None::<fn(&Point, &Point) -> bool>);
        assert!(updated, "Should successfully update the item");
        assert_eq!(count_items(&tree), 1, "Should still have 1 item");

        // 验证旧点不存在
        let old_search = tree.search(&BBox::new(1.0, 1.0, 1.0, 1.0));
        assert_eq!(old_search.len(), 0, "Old point should not be found");

        // 验证新点存在
        let new_search = tree.search(&BBox::new(5.0, 5.0, 5.0, 5.0));
        assert_eq!(new_search.len(), 1, "New point should be found");
        assert_eq!(new_search[0], new_point);
    }

    #[test]
    fn test_update_nonexistent_item() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        tree.insert(Point::new(1.0, 1.0), 0);

        let nonexistent = Point::new(100.0, 100.0);
        let new_point = Point::new(5.0, 5.0);

        let updated = tree.update(&nonexistent, new_point, None::<fn(&Point, &Point) -> bool>);
        assert!(!updated, "Should not update nonexistent item");
        assert_eq!(count_items(&tree), 1, "Tree size should remain unchanged");
    }

    #[test]
    fn test_update_with_custom_equals() {
        let mut tree: RBush<Rectangle> = RBush::new(9, 4);

        tree.insert(Rectangle::new(0.0, 0.0, 2.0, 2.0, 1), 0);
        tree.insert(Rectangle::new(3.0, 3.0, 5.0, 5.0, 2), 0);

        let old_rect = Rectangle::new(0.0, 0.0, 2.0, 2.0, 1);
        let new_rect = Rectangle::new(10.0, 10.0, 12.0, 12.0, 1); // 新位置，相同 id

        let updated = tree.update(
            &old_rect,
            new_rect.clone(),
            Some(|a: &Rectangle, b: &Rectangle| a.id == b.id),
        );

        assert!(updated, "Should update the rectangle");
        assert_eq!(count_items(&tree), 2);

        // 验证旧位置没有了
        let old_search = tree.search(&BBox::new(0.0, 0.0, 2.0, 2.0));
        assert_eq!(old_search.len(), 0, "Old position should be empty");

        // 验证新位置有了
        let new_search = tree.search(&BBox::new(10.0, 10.0, 12.0, 12.0));
        assert_eq!(new_search.len(), 1, "New position should have the rectangle");
        assert_eq!(new_search[0].id, 1);
    }

    #[test]
    fn test_update_multiple_items() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        for i in 0..10 {
            tree.insert(Point::new(i as f64, i as f64), 0);
        }

        // 更新多个点
        for i in 0..5 {
            let old_point = Point::new(i as f64, i as f64);
            let new_point = Point::new((i + 100) as f64, (i + 100) as f64);

            let updated = tree.update(&old_point, new_point, None::<fn(&Point, &Point) -> bool>);
            assert!(updated, "Should update point {}", i);
        }

        assert_eq!(count_items(&tree), 10, "Should still have 10 items");

        // 验证旧位置为空
        for i in 0..5 {
            let search = tree.search(&BBox::new(i as f64, i as f64, i as f64, i as f64));
            assert_eq!(search.len(), 0, "Old position {} should be empty", i);
        }

        // 验证新位置有数据
        for i in 0..5 {
            let new_pos = (i + 100) as f64;
            let search = tree.search(&BBox::new(new_pos, new_pos, new_pos, new_pos));
            assert_eq!(search.len(), 1, "New position {} should have data", i + 100);
        }
    }

    #[test]
    fn test_update_after_split() {
        let mut tree: RBush<Point> = RBush::new(4, 2);

        // 插入触发分裂
        for i in 0..20 {
            tree.insert(Point::new(i as f64, i as f64), 0);
        }

        // 更新一些点
        for i in 0..5 {
            let old_point = Point::new(i as f64, i as f64);
            let new_point = Point::new((i + 100) as f64, (i + 100) as f64);

            let updated = tree.update(&old_point, new_point, None::<fn(&Point, &Point) -> bool>);
            assert!(updated, "Should update point {}", i);
        }

        assert_eq!(count_items(&tree), 20, "Should maintain same item count");
    }
}

// ==================== 搜索与删除集成测试 ====================

#[cfg(test)]
mod search_remove_integration_tests {
    use super::*;

    #[test]
    fn test_search_after_remove() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        // 插入网格点
        for i in 0..10 {
            for j in 0..10 {
                tree.insert(Point::new(i as f64, j as f64), 0);
            }
        }

        // 删除一个区域的点
        for i in 0..5 {
            for j in 0..5 {
                let point = Point::new(i as f64, j as f64);
                tree.remove(&point, None::<fn(&Point, &Point) -> bool>);
            }
        }

        // 搜索已删除的区域
        let search_deleted = tree.search(&BBox::new(0.0, 0.0, 4.0, 4.0));
        assert_eq!(search_deleted.len(), 0, "Deleted region should be empty");

        // 搜索未删除的区域
        let search_remaining = tree.search(&BBox::new(5.0, 5.0, 9.0, 9.0));
        assert_eq!(search_remaining.len(), 25, "Remaining region should have 25 points");
    }

    #[test]
    fn test_collides_after_remove() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        tree.insert(Point::new(5.0, 5.0), 0);
        tree.insert(Point::new(10.0, 10.0), 0);

        let bbox = BBox::new(4.0, 4.0, 6.0, 6.0);
        assert!(tree.collides(&bbox), "Should collide before removal");

        // 删除碰撞的点
        tree.remove(&Point::new(5.0, 5.0), None::<fn(&Point, &Point) -> bool>);

        assert!(!tree.collides(&bbox), "Should not collide after removal");
    }

    #[test]
    fn test_remove_and_reinsert() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        let point = Point::new(5.0, 5.0);
        tree.insert(point.clone(), 0);

        // 删除
        let removed = tree.remove(&point, None::<fn(&Point, &Point) -> bool>);
        assert!(removed);
        assert_eq!(count_items(&tree), 0);

        // 重新插入
        tree.insert(point.clone(), 0);
        assert_eq!(count_items(&tree), 1);

        // 验证可以找到
        let search = tree.search(&BBox::new(5.0, 5.0, 5.0, 5.0));
        assert_eq!(search.len(), 1);
        assert_eq!(search[0], point);
    }
}

// ==================== 边界条件测试 ====================

#[cfg(test)]
mod edge_case_tests {
    use super::*;

    #[test]
    fn test_remove_with_negative_coordinates() {
        let mut tree: RBush<Point> = RBush::new(9, 4);

        tree.insert(Point::new(-5.0, -5.0), 0);
        tree.insert(Point::new(0.0, 0.0), 0);
        tree.insert(Point::new(5.0, 5.0), 0);

        let removed = tree.remove(&Point::new(-5.0, -5.0), None::<fn(&Point, &Point) -> bool>);
        assert!(removed);
        assert_eq!(count_items(&tree), 2);
    }

    #[test]
    fn test_update_to_same_position() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let point = Point::new(5.0, 5.0);

        tree.insert(point.clone(), 0);

        // 更新到相同位置（实际上是删除再插入）
        let updated = tree.update(&point, point.clone(), None::<fn(&Point, &Point) -> bool>);
        assert!(updated);
        assert_eq!(count_items(&tree), 1);
    }

    #[test]
    fn test_remove_from_large_tree() {
        let mut tree: RBush<Point> = RBush::new(9, 4);
        let points: Vec<Point> = (0..1000).map(|i| Point::new(i as f64, i as f64)).collect();

        tree.load(points.clone());
        assert_eq!(count_items(&tree), 1000);

        // 删除100个点
        for i in 0..100 {
            let point = Point::new(i as f64, i as f64);
            let removed = tree.remove(&point, None::<fn(&Point, &Point) -> bool>);
            assert!(removed, "Should remove point {}", i);
        }

        assert_eq!(count_items(&tree), 900, "Should have 900 items left");
    }
}
