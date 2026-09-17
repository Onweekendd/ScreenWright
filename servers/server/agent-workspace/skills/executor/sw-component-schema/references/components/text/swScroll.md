# swScroll (轮播表格) 配置说明

## dataChart 数据格式

```typescript
// 动态键值对记录，键由 option.columns[].key 定义
interface ScrollDataItem {
  [key: string]: string | number | boolean;
}

type dataChart = ScrollDataItem[];
```

**示例**（字段名只是示意，实际生成时要换成业务真实字段名）：
```json
[
  { "unit": "1号机组", "capacity": 350, "output": 588, "status": "运行" },
  { "unit": "2号机组", "capacity": 350, "output": 561, "status": "运行" }
]
```

---

## ⚠️ 列定义是唯一需要对齐的地方

新版结构里，一列的所有信息（字段名、表头文本、宽度、对齐方式）都在 `columns` 数组的**同一项**里，不再是多个并行数组靠下标对应。只需保证：

1. **`columns[].key` 必须等于 `data` 里真实存在的字段名**——不要照抄上面示例里的 `unit`/`capacity`，那只是占位符。
2. 有多少个业务字段要展示，就建多少项 `columns`；`data` 里出现但 `columns` 没覆盖到的字段，不会显示在表格里。
3. `columns[].width` **可以不填**——不填时该列按剩余空间等比自动分配，天然撑满容器宽度，不需要手算总宽度。只有明确需要固定像素宽度时才填这个字段。
4. 需要给某一列单独设置样式（颜色/背景/字号/对齐），用 `columnStyleOverrides`，**按 `key` 取值**（不是下标），例如 `columnStyleOverrides.status = { color: "#ffcc00" }`。没有特殊需求的列不用出现在这个对象里。

---

## option 完整字段参考

```typescript
interface SwScrollOption {
  refresh: boolean; // 是否启用刷新

  columns: Array<{
    key: string; // 对应 data 里的字段名
    title: string; // 表头显示文本
    width?: number; // 固定像素宽度；不填则按比例自动分配
    align?: "left" | "center" | "right"; // 不填则使用 rowStyle.align
  }>;

  header: {
    show?: boolean; // 默认 true
    height?: number; // 默认 40
    background?: string; // 默认 "rgba(0,138,255,0.3)"
    color?: string; // 默认 "#ffffff"
    fontSize?: number; // 默认 14
  };

  rowStyle: {
    height?: number; // 默认 40
    fontSize?: number; // 默认 14
    color?: string; // 默认 "#ffffff"
    background?: string; // 默认 "transparent"
    stripeBackground?: string; // 斑马纹背景色（偶数行），不填则不启用斑马纹
    align?: "left" | "center" | "right"; // 默认 "center"
  };

  // 按 key 覆盖某一列的样式，可选
  columnStyleOverrides?: Record<
    string, // 对应 columns[].key
    { color?: string; background?: string; fontSize?: number; align?: "left" | "center" | "right" }
  >;

  // 序号列，可选
  rowIndex?: {
    show?: boolean; // 默认 false
    title?: string; // 默认 "序号"
    width?: number; // 默认 50
    startFrom?: number; // 默认 1
  };

  // 轮播滚动设置，可选
  scroll?: {
    enabled?: boolean; // 默认 false，需要滚动效果时设为 true
    visibleRows?: number; // 默认 5，可视行数，必须明显小于 data 长度才会触发滚动
    speed?: number; // 默认 1，每行滚动耗时（秒）
  };
}
```

---

## 常用配置示例

### 基础表格（不滚动）
```json
{
  "refresh": true,
  "columns": [
    { "key": "unit", "title": "机组" },
    { "key": "capacity", "title": "容量(MW)", "width": 100 },
    { "key": "status", "title": "状态" }
  ]
}
```

### 带轮播滚动 + 斑马纹 + 序号列
```json
{
  "refresh": true,
  "columns": [
    { "key": "unit", "title": "机组" },
    { "key": "capacity", "title": "容量(MW)", "width": 100 },
    { "key": "status", "title": "状态" }
  ],
  "rowIndex": { "show": true },
  "rowStyle": { "stripeBackground": "rgba(0,138,255,0.1)" },
  "scroll": { "enabled": true, "visibleRows": 5, "speed": 1 }
}
```
数据行数要明显多于 `scroll.visibleRows`（比如数据 10 行、可视行数 5），否则不会触发滚动。

### 给某一列单独设置颜色
```json
{
  "columnStyleOverrides": {
    "status": { "color": "#ffcc00" }
  }
}
```
