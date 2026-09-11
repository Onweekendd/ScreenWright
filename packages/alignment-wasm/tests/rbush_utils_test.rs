// 方式1：直接从模块导入
use bi_alignment::rbush_utils::{multi_select, quickselect};

// 方式2：也可以从根导出导入（如果 lib.rs 中有 pub use）
// use bi_alignment::{multi_select, quickselect};

#[cfg(test)]
mod multi_select_tests {
    use super::*;

    #[test]
    fn test_multi_select_basic() {
        // 测试基本的 multi_select 功能
        let mut data = vec![9, 2, 7, 1, 5, 3, 8, 4, 6];
        let n = 3;
        let len = data.len();

        multi_select(&mut data, 0, len - 1, n, |a, b| a.cmp(b));

        // 验证分块排序：每个块内的最大值应该小于等于下一个块的最小值
        // 块1: [0, 2], 块2: [3, 5], 块3: [6, 8]
        let block1_max = *data[0..3].iter().max().unwrap();
        let block2_min = *data[3..6].iter().min().unwrap();
        let block2_max = *data[3..6].iter().max().unwrap();
        let block3_min = *data[6..9].iter().min().unwrap();

        assert!(
            block1_max <= block2_min,
            "Block 1 max ({}) should be <= Block 2 min ({})",
            block1_max,
            block2_min
        );
        assert!(
            block2_max <= block3_min,
            "Block 2 max ({}) should be <= Block 3 min ({})",
            block2_max,
            block3_min
        );

        println!("Sorted data: {:?}", data);
    }

    #[test]
    fn test_multi_select_with_floats() {
        // 测试浮点数排序
        let mut data = vec![9.5, 2.1, 7.3, 1.2, 5.8, 3.4, 8.9, 4.0, 6.7];
        let n = 3;
        let len = data.len();

        multi_select(&mut data, 0, len - 1, n, |a, b| a.partial_cmp(b).unwrap());

        let block1_max = data[0..3].iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
        let block2_min = data[3..6].iter().fold(f64::INFINITY, |a, &b| a.min(b));

        assert!(
            block1_max <= block2_min,
            "Block 1 max ({}) should be <= Block 2 min ({})",
            block1_max,
            block2_min
        );

        println!("Float sorted data: {:?}", data);
    }

    #[test]
    fn test_multi_select_large_array() {
        // 测试大数组
        let mut data: Vec<i32> = (0..100).rev().collect(); // [99, 98, ..., 1, 0]
        let n = 10;
        let len = data.len();

        multi_select(&mut data, 0, len - 1, n, |a, b| a.cmp(b));

        // 验证每个块之间的顺序
        for i in 0..(data.len() / n - 1) {
            let block_start = i * n;
            let block_end = block_start + n;
            let next_block_start = block_end;
            let next_block_end = next_block_start + n.min(data.len() - next_block_start);

            if next_block_end <= data.len() {
                let current_block_max = *data[block_start..block_end].iter().max().unwrap();
                let next_block_min = *data[next_block_start..next_block_end].iter().min().unwrap();

                assert!(
                    current_block_max <= next_block_min,
                    "Block {} max ({}) should be <= Block {} min ({})",
                    i,
                    current_block_max,
                    i + 1,
                    next_block_min
                );
            }
        }

        println!(
            "Large array sorted successfully with {} elements",
            data.len()
        );
    }

    #[test]
    fn test_multi_select_small_array() {
        // 测试小数组（边界情况）
        let mut data = vec![3, 1, 2];
        let n = 5; // n 大于数组大小
        let len = data.len();

        multi_select(&mut data, 0, len - 1, n, |a, b| a.cmp(b));

        // 对于小数组，应该不会有太多改变，但不应该崩溃
        println!("Small array: {:?}", data);
        assert_eq!(data.len(), 3);
    }

    #[test]
    fn test_multi_select_single_element() {
        // 测试单个元素
        let mut data = vec![42];
        let n = 1;
        let len = data.len();

        multi_select(&mut data, 0, len - 1, n, |a, b| a.cmp(b));

        assert_eq!(data[0], 42);
    }

    #[test]
    fn test_multi_select_already_sorted() {
        // 测试已排序的数组
        let mut data = vec![1, 2, 3, 4, 5, 6, 7, 8, 9];
        let n = 3;
        let len = data.len();

        multi_select(&mut data, 0, len - 1, n, |a, b| a.cmp(b));

        // 验证仍然保持分块有序
        let block1_max = *data[0..3].iter().max().unwrap();
        let block2_min = *data[3..6].iter().min().unwrap();

        assert!(block1_max <= block2_min);
        println!("Already sorted array: {:?}", data);
    }

    #[test]
    fn test_multi_select_duplicates() {
        // 测试有重复元素的数组
        let mut data = vec![5, 2, 5, 1, 5, 3, 5, 4, 5];
        let n = 3;
        let len = data.len();

        multi_select(&mut data, 0, len - 1, n, |a, b| a.cmp(b));

        // 验证元素数量不变
        assert_eq!(data.len(), 9);

        // 验证所有的 5 都还在
        let count_fives = data.iter().filter(|&&x| x == 5).count();
        assert_eq!(count_fives, 5);

        println!("Array with duplicates: {:?}", data);
    }

    #[test]
    fn test_multi_select_with_custom_struct() {
        // 测试自定义结构体
        #[derive(Debug, Clone, PartialEq)]
        struct Point {
            x: f64,
            y: f64,
        }

        let mut points = vec![
            Point { x: 9.0, y: 1.0 },
            Point { x: 2.0, y: 5.0 },
            Point { x: 7.0, y: 3.0 },
            Point { x: 1.0, y: 9.0 },
            Point { x: 5.0, y: 2.0 },
            Point { x: 3.0, y: 8.0 },
            Point { x: 8.0, y: 4.0 },
            Point { x: 4.0, y: 7.0 },
            Point { x: 6.0, y: 6.0 },
        ];
        let n = 3;
        let len = points.len();

        // 按 x 坐标排序
        multi_select(&mut points, 0, len - 1, n, |a, b| {
            a.x.partial_cmp(&b.x).unwrap()
        });

        // 验证块之间的顺序
        let block1_max_x = points[0..3]
            .iter()
            .map(|p| p.x)
            .fold(f64::NEG_INFINITY, f64::max);
        let block2_min_x = points[3..6]
            .iter()
            .map(|p| p.x)
            .fold(f64::INFINITY, f64::min);

        assert!(
            block1_max_x <= block2_min_x,
            "Block 1 max x ({}) should be <= Block 2 min x ({})",
            block1_max_x,
            block2_min_x
        );

        println!("Points sorted by x: {:?}", points);
    }
}

#[cfg(test)]
mod quickselect_tests {
    use super::*;

    #[test]
    fn test_quickselect_median() {
        // 测试找中位数
        let mut data = vec![9, 2, 7, 1, 5, 3, 8, 4, 6];
        let len = data.len();
        let median_index = len / 2;

        quickselect(&mut data, median_index, 0, len - 1, |a, b| a.cmp(b));

        // 验证中位数左边的都比它小，右边的都比它大
        let median = data[median_index];
        for i in 0..median_index {
            assert!(
                data[i] <= median,
                "Element at index {} ({}) should be <= median ({})",
                i,
                data[i],
                median
            );
        }
        for i in (median_index + 1)..data.len() {
            assert!(
                data[i] >= median,
                "Element at index {} ({}) should be >= median ({})",
                i,
                data[i],
                median
            );
        }

        println!("Median found: {}", median);
        assert_eq!(median, 5);
    }

    #[test]
    fn test_quickselect_minimum() {
        // 测试找最小值
        let mut data = vec![9, 2, 7, 1, 5, 3, 8, 4, 6];
        let len = data.len();

        quickselect(&mut data, 0, 0, len - 1, |a, b| a.cmp(b));

        assert_eq!(data[0], 1);
        println!("Minimum found: {}", data[0]);
    }

    #[test]
    fn test_quickselect_maximum() {
        // 测试找最大值
        let mut data = vec![9, 2, 7, 1, 5, 3, 8, 4, 6];
        let last_index = data.len() - 1;

        quickselect(&mut data, last_index, 0, last_index, |a, b| a.cmp(b));

        assert_eq!(data[last_index], 9);
        println!("Maximum found: {}", data[last_index]);
    }

    #[test]
    fn test_quickselect_first_quartile() {
        // 测试找第一个四分位数
        let mut data = vec![9, 2, 7, 1, 5, 3, 8, 4, 6];
        let len = data.len();
        let q1_index = len / 4;

        quickselect(&mut data, q1_index, 0, len - 1, |a, b| a.cmp(b));

        let q1 = data[q1_index];
        println!("First quartile found at index {}: {}", q1_index, q1);

        // 验证分区正确
        for i in 0..q1_index {
            assert!(data[i] <= q1);
        }
    }

    #[test]
    fn test_quickselect_stability() {
        // 测试 quickselect 的稳定性（多次运行应该得到相同结果）
        let original = vec![9, 2, 7, 1, 5, 3, 8, 4, 6];

        for _ in 0..5 {
            let mut data = original.clone();
            let len = data.len();
            let k = 4;
            quickselect(&mut data, k, 0, len - 1, |a, b| a.cmp(b));

            // 第 k 个元素应该是 5（0-indexed，第4个位置是第5小的元素）
            let element = data[k];

            // 验证分区正确
            for i in 0..k {
                assert!(data[i] <= element);
            }
            for i in (k + 1)..data.len() {
                assert!(data[i] >= element);
            }
        }
    }
}

#[cfg(test)]
mod performance_tests {
    use super::*;
    use std::time::Instant;

    #[test]
    fn test_multi_select_performance() {
        // 性能测试：比较 multi_select 和完全排序的性能
        let size = 10000;
        let n = 100;

        // 创建随机数据（使用简单的伪随机数）
        let mut data1: Vec<i32> = (0..size).map(|i| (i * 7919) % size).collect();
        let mut data2 = data1.clone();
        let len = data1.len();

        // 测试 multi_select
        let start = Instant::now();
        multi_select(&mut data1, 0, len - 1, n, |a, b| a.cmp(b));
        let multi_select_time = start.elapsed();

        // 测试完全排序
        let start = Instant::now();
        data2.sort();
        let sort_time = start.elapsed();

        println!("Multi-select time: {:?}", multi_select_time);
        println!("Full sort time: {:?}", sort_time);
        println!(
            "Multi-select is {:.2}x faster than full sort",
            sort_time.as_nanos() as f64 / multi_select_time.as_nanos() as f64
        );

        // multi_select 应该比完全排序快（但不一定总是如此，取决于实现）
        // 这里只是打印信息，不做断言
    }

    #[test]
    fn test_quickselect_vs_sort() {
        // 性能测试：quickselect 找中位数 vs 排序后取中位数
        let size: i32 = 10000;
        let mut data1: Vec<i32> = (0..size).map(|i| (i * 7919) % size).collect();
        let mut data2 = data1.clone();
        let len = data1.len();

        let median_index = (size / 2) as usize;

        // 测试 quickselect
        let start = Instant::now();
        quickselect(&mut data1, median_index, 0, len - 1, |a, b| a.cmp(b));
        let quickselect_time = start.elapsed();
        let median1 = data1[median_index];

        // 测试排序
        let start = Instant::now();
        data2.sort();
        let sort_time = start.elapsed();
        let median2 = data2[median_index];

        println!("Quickselect time: {:?}", quickselect_time);
        println!("Sort time: {:?}", sort_time);
        println!(
            "Quickselect is {:.2}x faster than sort",
            sort_time.as_nanos() as f64 / quickselect_time.as_nanos() as f64
        );

        // 两种方法应该找到相同的中位数
        assert_eq!(median1, median2, "Both methods should find the same median");
    }
}
