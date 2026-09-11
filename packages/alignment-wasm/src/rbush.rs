use crate::rbush_utils::{
    calculate_all_distribution_margins_for_items, calculate_all_distribution_margins_for_nodes,
    calculate_distribution_bbox, calculate_distribution_bbox_from_nodes, choose_split_index,
    contains, evaluate_child, extend_bbox, find_item_index, find_mut_node_by_path,
    find_node_by_path, intersects, multi_select,
};
use crate::types::{Axis, BBox, HasBBox, RBush, RBushNode};

impl<T: HasBBox> RBush<T> {
    /**
     * 创建一个新的空的 RBush 树
     * @param max_entries 最大节点数
     * @param min_entries 最小节点数
     */
    pub fn new(max_entries: usize, min_entries: usize) -> Self {
        RBush {
            root: None,
            max_entries,
            min_entries,
        }
    }

    pub fn insert(&mut self, item: T, level: usize) -> bool {
        // 处理空树情况：直接创建根节点
        if self.root.is_none() {
            self.root = Some(Box::new(RBushNode {
                bbox: item.bbox(),
                children: vec![],
                items: vec![item],
                height: 1,
                leaf: true,
            }));
            return true;
        }

        // 找到最佳的插入的路径
        let insert_path = RBush::choose_subtree((item.bbox(), &self.root.as_ref().unwrap(), level));

        // 得到要插入的节点位置
        RBush::post_insert_adjust(self, item, &insert_path, level);
        true
    }

    /// 在完成节点插入后，统一处理：
    /// 1. 扩展目标节点及其父节点的 bbox；
    /// 2. 检查并处理节点溢出（分裂），必要时向上冒泡；
    /// 3. 对插入路径上的所有节点做最终的 bbox 校正。
    ///
    /// 典型调用点：在 `insert_node` 中完成实际插入（push 到 items 或 children）之后，
    /// 再调用本函数。
    ///
    /// 参数：
    /// - `bbox`：刚插入的数据项（或子树）的边界框。
    /// - `insert_path`：从根到插入点的路径索引数组，例如 [2, 0, 3]。
    /// - `level`：本次插入发生的目标层级（与 choose_subtree 中的 level 含义一致）。
    fn post_insert_adjust(&mut self, item: T, insert_path: &[usize], _level: usize) {
        // 保存插入项的 bbox，用于后续更新父节点
        let item_bbox = item.bbox();

        // 第一步：插入数据到目标叶子节点
        let insert_node = find_mut_node_by_path(self.root.as_mut().unwrap(), &insert_path);
        assert!(insert_node.leaf, "只能向叶子节点插入数据");
        insert_node.bbox = extend_bbox(&insert_node.bbox, &item_bbox);
        insert_node.items.push(item);

        // 第二步：向上更新所有父节点的 bbox
        // 要注意这一步要提前于分裂 因为我们是基于下标 分裂后下标将会改变
        // 确保插入路径上的所有节点的 bbox 都包含新插入的项
        self.adjust_parent_bboxes(&item_bbox, insert_path);

        // 第三步：从下到上检查并处理溢出
        // 由于 Rust 借用规则，我们需要逐层处理，每次重新获取引用
        let path_len = insert_path.len();

        // 从插入节点开始，向上检查溢出（包括插入节点本身）
        for level_from_leaf in 0..=path_len {
            let current_level = path_len - level_from_leaf;

            // 检查当前层级是否溢出
            let needs_split = if current_level == 0 {
                // 检查根节点
                let root = self.root.as_ref().unwrap();
                if root.leaf {
                    root.items.len() > self.max_entries
                } else {
                    root.children.len() > self.max_entries
                }
            } else {
                // 检查非根节点
                let node =
                    find_node_by_path(self.root.as_ref().unwrap(), &insert_path[..current_level]);
                if node.leaf {
                    node.items.len() > self.max_entries
                } else {
                    node.children.len() > self.max_entries
                }
            };

            if needs_split {
                if current_level == 0 {
                    // 根节点溢出，分裂根节点
                    self.split_root();
                    break; // 分裂根节点后，不需要继续向上
                } else {
                    // 非根节点溢出，从父节点中取出该节点，分裂后再添加回去
                    let min_entries = self.min_entries;

                    // 获取父节点
                    let parent = find_mut_node_by_path(
                        self.root.as_mut().unwrap(),
                        &insert_path[..current_level - 1],
                    );

                    // 从父节点中取出要分裂的节点
                    let node_index = insert_path[current_level - 1];
                    let node_to_split = parent.children.remove(node_index);

                    // 执行分裂，返回两个新节点
                    let (left_node, right_node) =
                        Self::split_node_static(node_to_split, min_entries);

                    // 将两个新节点添加回父节点（在原位置插入左节点，右节点插在后面）
                    parent.children.insert(node_index, left_node);
                    parent.children.insert(node_index + 1, right_node);

                    // 重新计算父节点的 bbox（基于所有子节点）
                    parent.bbox = calculate_distribution_bbox_from_nodes(
                        &parent.children.iter().collect::<Vec<_>>(),
                    );
                }
            }
        }
    }

    /**
     * 在给定节点的子节点中，选择一条从该节点向下的"最优路径"（子树索引序列）
     * @param bbox 要插入项的边界框
     * @param node 当前评估的起始节点
     * @param level 目标层级（0 为当前层），当路径长度 - 1 == level 时停止向下
     * @returns 从当前节点开始到目标节点的子节点下标序列
     *
     * 逻辑说明：
     * - 从当前节点开始，逐层向下选择一个"代价最小"的子节点，直到：
     *   - 到达叶子节点，或
     *   - 路径长度 - 1 达到指定 level
     * - 对每个候选子节点，计算：
     *   - 原面积 child_area
     *   - 插入后扩张面积 enlarged_area
     *   - 扩张代价 enlargement = enlarged_area - child_area
     * - 选择策略：
     *   1) 优先选 enlargement 最小的子节点
     *   2) 如有并列，选 child_area 更小的子节点
     */
    fn choose_subtree(params: (BBox, &RBushNode<T>, usize)) -> Vec<usize> {
        let mut result = Vec::new();
        let (bbox, root_node, _level) = params;
        let mut current_node = root_node;

        // 一直递归到叶子节点
        while !current_node.leaf {
            let mut min_area = f64::INFINITY;
            let mut min_enlargement = f64::INFINITY;
            let mut target_node_index = 0;

            for (i, child) in current_node.children.iter().enumerate() {
                let (enlargement, child_area) = evaluate_child(&bbox, child.as_ref());

                if enlargement < min_enlargement {
                    min_enlargement = enlargement;
                    min_area = child_area;
                    target_node_index = i;
                } else if enlargement == min_enlargement {
                    if child_area < min_area {
                        min_area = child_area;
                        target_node_index = i;
                    }
                }
            }

            result.push(target_node_index);

            // 更新 current_node 指向选中的子节点
            current_node = current_node.children[target_node_index].as_ref();
        }

        result
    }

    /// 基于当前节点子项分布选择分裂轴（X 或 Y）。
    ///
    /// 对于叶子节点，分析 items 的分布；对于内部节点，分析 children 的分布。
    /// 分别按 X 和 Y 轴排序，计算所有可能分布的总边距，返回总边距更小的轴。
    fn choose_split_axis_for_adjust(
        node: &mut RBushNode<T>,
        child_min_len: usize,
        current_len: usize,
    ) -> Axis {
        if node.leaf {
            // 叶子节点：分析 items
            let split_for_x = calculate_all_distribution_margins_for_items(
                &node.items,
                child_min_len,
                current_len,
                |a: &T, b: &T| a.bbox().min_x.partial_cmp(&b.bbox().min_x).unwrap(),
                |item| item.bbox(),
            );

            let split_for_y = calculate_all_distribution_margins_for_items(
                &node.items,
                child_min_len,
                current_len,
                |a: &T, b: &T| a.bbox().min_y.partial_cmp(&b.bbox().min_y).unwrap(),
                |item| item.bbox(),
            );

            if split_for_x < split_for_y {
                Axis::X
            } else {
                Axis::Y
            }
        } else {
            // 内部节点：分析 children
            let compare_min_x = |a: &RBushNode<T>, b: &RBushNode<T>| {
                a.bbox.min_x.partial_cmp(&b.bbox.min_x).unwrap()
            };

            let compare_min_y = |a: &RBushNode<T>, b: &RBushNode<T>| {
                a.bbox.min_y.partial_cmp(&b.bbox.min_y).unwrap()
            };

            let children_refs: Vec<&Box<RBushNode<T>>> = node.children.iter().collect();

            let split_for_x = calculate_all_distribution_margins_for_nodes(
                &children_refs,
                child_min_len,
                current_len,
                compare_min_x,
            );

            let split_for_y = calculate_all_distribution_margins_for_nodes(
                &children_refs,
                child_min_len,
                current_len,
                compare_min_y,
            );

            if split_for_x < split_for_y {
                Axis::X
            } else {
                Axis::Y
            }
        }
    }

    /// 选择非叶子节点的最佳分裂索引（便利方法）。
    fn choose_split_index_for_adjust(
        node: &RBushNode<T>,
        child_min_len: usize,
        _current_len: usize,
    ) -> usize {
        let children_refs: Vec<&Box<RBushNode<T>>> = node.children.iter().collect();
        choose_split_index(&children_refs, child_min_len, |child| child.bbox)
    }

    /// 选择叶子节点的最佳分裂索引（便利方法）。
    fn choose_split_index_for_leaf_items(items: &[T], min_entries: usize) -> usize {
        choose_split_index(items, min_entries, |item| item.bbox())
    }

    /**
     * 分裂根节点。将根节点的所有权取出，分裂后创建新的根节点。
     */
    fn split_root(&mut self) {
        // 取出根节点的所有权，避免 clone
        let old_root = self.root.take().expect("根节点不应为空");

        // 执行分裂，返回两个新节点
        let (left_node, right_node) = Self::split_node_static(old_root, self.min_entries);

        // 获取节点的高度
        let node_height = left_node.height;

        // 创建新的根节点，包含分裂后的两个节点
        let bbox = calculate_distribution_bbox_from_nodes(&vec![&left_node, &right_node]);
        self.root = Some(Box::new(RBushNode {
            children: vec![left_node, right_node],
            bbox,
            items: vec![],
            height: node_height + 1,
            leaf: false,
        }));
    }

    /**
     * 分裂节点（静态方法）。接受节点所有权，返回两个分裂后的节点。
     * 不修改输入节点，而是返回两个全新的节点。
     *
     * @param node 要分裂的节点（取得所有权）
     * @param min_entries 最小条目数
     * @returns (left_node, right_node) 分裂后的左右两个节点
     */
    fn split_node_static(
        mut node: Box<RBushNode<T>>,
        min_entries: usize,
    ) -> (Box<RBushNode<T>>, Box<RBushNode<T>>) {
        let current_len = if node.leaf {
            node.items.len()
        } else {
            node.children.len()
        };

        // 选择分裂轴
        let split_axis = RBush::choose_split_axis_for_adjust(&mut node, min_entries, current_len);

        // 根据轴排序并分裂
        match split_axis {
            Axis::X => Self::split_node_by_x_static(node, min_entries),
            Axis::Y => Self::split_node_by_y_static(node, min_entries),
        }
    }

    fn split_node_by_x_static(
        mut node: Box<RBushNode<T>>,
        min_entries: usize,
    ) -> (Box<RBushNode<T>>, Box<RBushNode<T>>) {
        if node.leaf {
            node.items
                .sort_by(|a, b| a.bbox().min_x.partial_cmp(&b.bbox().min_x).unwrap());
        } else {
            node.children
                .sort_by(|a, b| a.bbox.min_x.partial_cmp(&b.bbox.min_x).unwrap());
        }
        Self::do_split_static(node, min_entries)
    }

    fn split_node_by_y_static(
        mut node: Box<RBushNode<T>>,
        min_entries: usize,
    ) -> (Box<RBushNode<T>>, Box<RBushNode<T>>) {
        if node.leaf {
            node.items
                .sort_by(|a, b| a.bbox().min_y.partial_cmp(&b.bbox().min_y).unwrap());
        } else {
            node.children
                .sort_by(|a, b| a.bbox.min_y.partial_cmp(&b.bbox.min_y).unwrap());
        }
        Self::do_split_static(node, min_entries)
    }

    /// 执行节点分裂的通用逻辑（排序后，静态方法）
    /// 接受节点所有权，返回两个分裂后的节点
    fn do_split_static(
        node: Box<RBushNode<T>>,
        min_entries: usize,
    ) -> (Box<RBushNode<T>>, Box<RBushNode<T>>) {
        if node.leaf {
            Self::split_leaf_node(node, min_entries)
        } else {
            Self::split_internal_node(node, min_entries)
        }
    }

    /// 分裂叶子节点
    fn split_leaf_node(
        mut node: Box<RBushNode<T>>,
        min_entries: usize,
    ) -> (Box<RBushNode<T>>, Box<RBushNode<T>>) {
        // 选择最佳分裂索引（最小化重叠和总面积）
        let split_index = Self::choose_split_index_for_leaf_items(&node.items, min_entries);

        // 分裂 items
        let right_items = node.items.split_off(split_index);
        let left_items = node.items;

        // 确保分裂后两边都不为空
        assert!(
            !left_items.is_empty(),
            "Split resulted in empty left partition (split_index={})",
            split_index
        );
        assert!(
            !right_items.is_empty(),
            "Split resulted in empty right partition (split_index={})",
            split_index
        );

        // 计算左节点的 bbox
        let left_bbox = left_items
            .iter()
            .map(|item| item.bbox())
            .fold(left_items[0].bbox(), |acc, bbox| extend_bbox(&acc, &bbox));

        // 计算右节点的 bbox
        let right_bbox = right_items
            .iter()
            .map(|item| item.bbox())
            .fold(right_items[0].bbox(), |acc, bbox| extend_bbox(&acc, &bbox));

        // 创建左节点
        let left_node = Box::new(RBushNode {
            children: vec![],
            bbox: left_bbox,
            items: left_items,
            height: node.height,
            leaf: true,
        });

        // 创建右节点
        let right_node = Box::new(RBushNode {
            children: vec![],
            bbox: right_bbox,
            items: right_items,
            height: node.height,
            leaf: true,
        });

        (left_node, right_node)
    }

    /// 分裂内部节点（非叶子节点）
    fn split_internal_node(
        mut node: Box<RBushNode<T>>,
        min_entries: usize,
    ) -> (Box<RBushNode<T>>, Box<RBushNode<T>>) {
        // 选择最佳分裂索引（最小化重叠和总面积）
        let split_index =
            RBush::<T>::choose_split_index_for_adjust(&node, min_entries, node.children.len());

        // 分裂 children
        let right_children = node.children.split_off(split_index);
        let left_children = node.children;

        // 计算左节点的 bbox
        let left_bbox =
            calculate_distribution_bbox_from_nodes(&left_children.iter().collect::<Vec<_>>());

        // 计算右节点的 bbox
        let right_bbox =
            calculate_distribution_bbox_from_nodes(&right_children.iter().collect::<Vec<_>>());

        // 创建左节点
        let left_node = Box::new(RBushNode {
            children: left_children,
            bbox: left_bbox,
            items: vec![],
            height: node.height,
            leaf: false,
        });

        // 创建右节点
        let right_node = Box::new(RBushNode {
            children: right_children,
            bbox: right_bbox,
            items: vec![],
            height: node.height,
            leaf: false,
        });

        (left_node, right_node)
    }

    /// 调整插入路径上所有父节点的 bbox，从插入节点的父节点向上到根节点。
    ///
    /// # 参数
    /// - `bbox`: 新插入数据项的边界框
    /// - `insert_path`: 从根到插入节点的路径索引数组，例如 [2, 0, 3]
    ///
    /// # 示例路径遍历
    /// 假设 insert_path = [2, 0, 3]，树结构为：
    /// ```text
    /// root (路径: [])
    ///  └─ children[2] (路径: [2])
    ///      └─ children[0] (路径: [2, 0])
    ///          └─ children[3] (路径: [2, 0, 3]) ← 插入节点
    /// ```
    ///
    /// 遍历顺序（从父节点到根节点）：
    /// 1. insert_path[..2] = [2, 0] → 父节点
    /// 2. insert_path[..1] = [2] → 祖父节点
    /// 3. insert_path[..0] = [] → 根节点
    fn adjust_parent_bboxes(&mut self, bbox: &BBox, insert_path: &[usize]) {
        // 从父节点开始向上遍历（跳过插入节点本身，因为它已在插入时更新）
        for i in (0..insert_path.len()).rev() {
            if i == 0 {
                // 根节点特殊处理
                if let Some(root) = self.root.as_mut() {
                    root.bbox = extend_bbox(&root.bbox, bbox);
                }
            } else {
                // 其他父节点
                let node = find_mut_node_by_path(self.root.as_mut().unwrap(), &insert_path[..i]);
                node.bbox = extend_bbox(&node.bbox, bbox);
            }
        }
    }

    /// 加载数据到树中
    /// 只调用一次 不要重复调用
    pub fn load(&mut self, mut data: Vec<T>) {
        if data.is_empty() {
            return;
        }

        if data.len() < self.min_entries {
            for item in data.into_iter() {
                self.insert(item, 0);
            }
            return;
        }

        // 使用 OMT 算法递归构建树
        let data_len = data.len();
        let node = self.build_tree(&mut data, 0, data_len - 1, 0);

        // TODO: 处理与现有树的合并
        // 暂时直接替换根节点
        self.root = Some(node);
    }

    /// 重新构建树
    /// 可调用多次 每次返回一颗新树
    /// 注意：会清空原有树
    pub fn rebuild_tree(&mut self, mut data: Vec<T>) {
        if data.is_empty() {
            return;
        }

        // 使用 OMT 算法递归构建树
        let data_len = data.len();
        let node = self.build_tree(&mut data, 0, data_len - 1, 0);

        // TODO: 处理与现有树的合并
        // 暂时直接替换根节点
        self.root = Some(node);
    }

    fn build_tree(
        &mut self,
        data: &mut [T],
        start_index: usize,
        end_index: usize,
        height: usize,
    ) -> Box<RBushNode<T>> {
        let item_count = end_index - start_index + 1;
        let mut node_capacity = self.max_entries;
        let mut actual_height = height;

        // 如果数据量足够少，直接创建叶子节点
        if item_count <= node_capacity {
            let leaf_node = Box::new(RBushNode {
                children: vec![],
                bbox: calculate_distribution_bbox(
                    &data[start_index..=end_index]
                        .iter()
                        .map(|item| item.bbox())
                        .collect::<Vec<_>>(),
                ),
                items: data[start_index..=end_index].to_vec(),
                height: height as u32,
                leaf: true,
            });
            return leaf_node;
        }

        if actual_height == 0 {
            // 计算树的目标高度：log_M(N)，即 M 的几次方能容纳 N 个数据
            actual_height = (item_count as f64).log(node_capacity as f64).ceil() as usize;

            // 优化根节点的子节点数量，最大化存储利用率
            node_capacity = ((item_count as f64)
                / (node_capacity as f64).powi((actual_height - 1) as i32))
            .ceil() as usize;
        }

        let mut current_node = Box::new(RBushNode {
            children: vec![],
            bbox: calculate_distribution_bbox(
                &data[start_index..=end_index]
                    .iter()
                    .map(|item| item.bbox())
                    .collect::<Vec<_>>(),
            ),
            items: vec![],
            height: actual_height as u32,
            leaf: false,
        });

        // 将数据切分成 M 个尽量方正的"瓦片"

        // 每个瓦片（小方块）包含的数据量
        let items_per_tile = (item_count as f64 / node_capacity as f64).ceil() as usize;

        // 每个竖条包含的数据量（竖条 = sqrt(M) 个瓦片）
        let items_per_strip = items_per_tile * (node_capacity as f64).sqrt().ceil() as usize;

        // 第一步：按 X 轴排序，切成若干竖条
        multi_select(data, start_index, end_index, items_per_strip, |a, b| {
            // 比较 min_x 坐标
            a.bbox().min_x.partial_cmp(&b.bbox().min_x).unwrap()
        });

        // 按照 X 轴分成若干竖条，遍历每个竖条
        let mut strip_start = start_index;
        while strip_start <= end_index {
            let strip_end = (strip_start + items_per_strip - 1).min(end_index);

            // 第二步：每个竖条内按 Y 轴排序，切成若干瓦片
            multi_select(data, strip_start, strip_end, items_per_tile, |a, b| {
                // 比较 min_y 坐标
                a.bbox().min_y.partial_cmp(&b.bbox().min_y).unwrap()
            });

            // 在竖条内按瓦片遍历
            let mut tile_start = strip_start;
            while tile_start <= strip_end {
                let tile_end = (tile_start + items_per_tile - 1).min(strip_end);

                // 递归构建每个瓦片对应的子树
                let child_node = self.build_tree(data, tile_start, tile_end, actual_height - 1);
                current_node.children.push(child_node);

                tile_start += items_per_tile;
            }

            strip_start += items_per_strip;
        }

        current_node
    }

    // ==================== 搜索方法 ====================

    /// 返回与给定边界框相交的所有数据项
    ///
    /// # 参数
    /// - `bbox`: 搜索的边界框
    ///
    /// # 返回
    /// 与搜索框相交的所有项的数组
    pub fn search(&self, bbox: &BBox) -> Vec<T> {
        let mut result = Vec::new();

        if self.root.is_none() {
            return result;
        }

        let root = self.root.as_ref().unwrap();

        // 如果根节点都不相交，直接返回
        if !intersects(bbox, &root.bbox) {
            return result;
        }

        // 使用栈进行深度优先搜索
        let mut nodes_to_search: Vec<&RBushNode<T>> = vec![root.as_ref()];

        while let Some(node) = nodes_to_search.pop() {
            for child in &node.children {
                let child_node = child.as_ref();
                let child_bbox = &child_node.bbox;

                if intersects(bbox, child_bbox) {
                    if node.leaf {
                        // 叶子节点的 children 实际上是数据项，需要检查 items
                        // 但这里 children 是 RBushNode，所以应该检查 items
                    } else if contains(bbox, child_bbox) {
                        // 如果子节点完全被搜索框包含，直接收集所有项
                        Self::collect_all_items(child_node, &mut result);
                    } else {
                        // 部分相交，需要继续深入
                        nodes_to_search.push(child_node);
                    }
                }
            }

            // 如果是叶子节点，检查所有 items
            if node.leaf {
                for item in &node.items {
                    if intersects(bbox, &item.bbox()) {
                        result.push(item.clone());
                    }
                }
            }
        }

        result
    }

    /// 检查是否有任何项与给定边界框相交
    ///
    /// # 参数
    /// - `bbox`: 要检查的边界框
    ///
    /// # 返回
    /// 如果有任何项相交则返回 true，否则返回 false
    pub fn collides(&self, bbox: &BBox) -> bool {
        if self.root.is_none() {
            return false;
        }

        let root = self.root.as_ref().unwrap();

        if !intersects(bbox, &root.bbox) {
            return false;
        }

        let mut nodes_to_search: Vec<&RBushNode<T>> = vec![root.as_ref()];

        while let Some(node) = nodes_to_search.pop() {
            for child in &node.children {
                let child_node = child.as_ref();
                let child_bbox = &child_node.bbox;

                if intersects(bbox, child_bbox) {
                    if node.leaf {
                        // 叶子节点，需要检查 items
                    } else if contains(bbox, child_bbox) {
                        // 完全包含，一定有碰撞
                        return true;
                    } else {
                        nodes_to_search.push(child_node);
                    }
                }
            }

            // 如果是叶子节点，检查所有 items
            if node.leaf {
                for item in &node.items {
                    if intersects(bbox, &item.bbox()) {
                        return true;
                    }
                }
            }
        }

        false
    }

    /// 返回树中的所有数据项
    ///
    /// # 返回
    /// 树中所有项的数组
    pub fn all(&self) -> Vec<T> {
        if self.root.is_none() {
            return Vec::new();
        }

        let mut result = Vec::new();
        Self::collect_all_items(self.root.as_ref().unwrap().as_ref(), &mut result);
        result
    }

    // ==================== 辅助方法 ====================

    /// 递归收集节点及其所有子节点中的所有项
    fn collect_all_items(node: &RBushNode<T>, result: &mut Vec<T>) {
        if node.leaf {
            result.extend(node.items.iter().cloned());
        } else {
            for child in &node.children {
                Self::collect_all_items(child.as_ref(), result);
            }
        }
    }

    // ==================== 删除和更新方法 ====================

    /// 从树中删除指定的项
    ///
    /// # 参数
    /// - `item`: 要删除的项
    /// - `equals_fn`: 可选的自定义相等性函数，用于比较项。如果为 None，使用 PartialEq
    ///
    /// # 返回
    /// 如果成功删除返回 true，否则返回 false
    pub fn remove<F>(&mut self, item: &T, equals_fn: Option<F>) -> bool
    where
        T: PartialEq,
        F: Fn(&T, &T) -> bool,
    {
        if self.root.is_none() {
            return false;
        }

        let item_bbox = item.bbox();
        let mut path: Vec<(*mut RBushNode<T>, usize)> = Vec::new();
        let mut current_node_ptr = self.root.as_mut().unwrap().as_mut() as *mut RBushNode<T>;

        // 深度优先遍历查找项
        let mut child_index = 0;
        let mut going_up = false;

        loop {
            let current_node = unsafe { &mut *current_node_ptr };

            // 如果是叶子节点，查找并删除项
            if current_node.leaf {
                let index = find_item_index(item, &current_node.items, equals_fn.as_ref());

                if index != usize::MAX {
                    // 找到了，删除项
                    current_node.items.remove(index);
                    path.push((current_node_ptr, 0));

                    // 压缩树
                    self.condense_tree(&mut path);
                    return true;
                }
            }

            // 如果不是向上回溯，且不是叶子节点，且当前节点包含目标 bbox
            if !going_up && !current_node.leaf && contains(&current_node.bbox, &item_bbox) {
                // 向下遍历
                path.push((current_node_ptr, child_index));
                child_index = 0;

                if !current_node.children.is_empty() {
                    current_node_ptr = current_node.children[0].as_mut() as *mut RBushNode<T>;
                    going_up = false;
                    continue;
                }
            }

            // 尝试访问兄弟节点
            if !path.is_empty() {
                let path_last_idx = path.len() - 1;
                let (parent_ptr, last_child_index) = path[path_last_idx];
                let parent = unsafe { &mut *parent_ptr };
                child_index = last_child_index + 1;

                if child_index < parent.children.len() {
                    // 有兄弟节点，访问它
                    path[path_last_idx] = (parent_ptr, child_index);
                    current_node_ptr = parent.children[child_index].as_mut() as *mut RBushNode<T>;
                    child_index = 0;
                    going_up = false;
                    continue;
                } else {
                    // 没有兄弟节点，向上回溯
                    path.pop();
                    going_up = true;
                    continue;
                }
            }

            // 没有找到
            break;
        }

        false
    }

    /// 更新树中的项（先删除后插入）
    ///
    /// # 参数
    /// - `old_item`: 要替换的旧项
    /// - `new_item`: 新项
    /// - `equals_fn`: 可选的自定义相等性函数
    ///
    /// # 返回
    /// 如果成功更新返回 true，否则返回 false
    pub fn update<F>(&mut self, old_item: &T, new_item: T, equals_fn: Option<F>) -> bool
    where
        T: PartialEq,
        F: Fn(&T, &T) -> bool,
    {
        if self.remove(old_item, equals_fn) {
            self.insert(new_item, 0);
            true
        } else {
            false
        }
    }

    /// 压缩树：删除空节点并更新 bbox
    fn condense_tree(&mut self, path: &mut Vec<(*mut RBushNode<T>, usize)>) {
        // 从叶子节点向上遍历
        let mut i = path.len();
        while i > 0 {
            i -= 1;
            let (node_ptr, _) = path[i];
            let node = unsafe { &mut *node_ptr };

            // 检查节点是否为空
            let is_empty = if node.leaf {
                node.items.is_empty()
            } else {
                node.children.is_empty()
            };

            if is_empty {
                if i > 0 {
                    // 非根节点，从父节点中删除
                    let (parent_ptr, _child_idx) = path[i - 1];
                    let parent = unsafe { &mut *parent_ptr };

                    // 找到当前节点在父节点中的索引
                    let mut actual_index = None;
                    for (idx, child) in parent.children.iter().enumerate() {
                        if child.as_ref() as *const RBushNode<T> == node as *const RBushNode<T> {
                            actual_index = Some(idx);
                            break;
                        }
                    }

                    if let Some(idx) = actual_index {
                        parent.children.remove(idx);
                    }
                } else {
                    // 根节点为空，清空树
                    self.root = None;
                    return;
                }
            } else {
                // 重新计算 bbox
                Self::recalculate_bbox(node);
            }
        }
    }

    /// 重新计算节点的 bbox（基于其子节点或数据项）
    fn recalculate_bbox(node: &mut RBushNode<T>) {
        if node.leaf {
            if node.items.is_empty() {
                node.bbox = BBox::new(0.0, 0.0, 0.0, 0.0);
            } else {
                let first_bbox = node.items[0].bbox();
                node.bbox = node
                    .items
                    .iter()
                    .map(|item| item.bbox())
                    .fold(first_bbox, |acc, bbox| extend_bbox(&acc, &bbox));
            }
        } else {
            if node.children.is_empty() {
                node.bbox = BBox::new(0.0, 0.0, 0.0, 0.0);
            } else {
                let first_bbox = node.children[0].bbox;
                node.bbox = node
                    .children
                    .iter()
                    .map(|child| child.bbox)
                    .fold(first_bbox, |acc, bbox| extend_bbox(&acc, &bbox));
            }
        }
    }
}
