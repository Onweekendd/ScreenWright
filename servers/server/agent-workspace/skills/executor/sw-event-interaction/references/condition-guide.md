# 条件配置指南

## 事件数据来源

事件触发时，组件会将当前操作项的数据对象作为 payload 抛出，条件判断即对该对象进行匹配。

数据来源取决于组件的 `dataType` 字段：
- `dataType: 0` → 抛出 `data[]` 中被操作的那一项（静态数据）
- `dataType` 非 0 → 抛出 `dataSource` 接口返回数据中被操作的那一项

> `dataFormatter` 已废弃，忽略该字段。

**推断可用字段**：读取组件 JSON 的 `dataRemark[]` 或直接查看 `data[]` 中的字段名，即可知道条件可以匹配哪些字段。

例：`subtabs` 组件点击第一项时抛出 `{ "label": "Tab A", "value": 1 }`，可用字段为 `label`、`value`。

## 条件配置原则

**优先使用字段条件（`type: "field"`）**，仅当字段条件无法满足需求时才使用自定义条件。

```
// 字段条件（优先）
{ type: "field", field: "value", compare: "==", expected: "1" }
→ 等价于：data["value"] == "1"

// 自定义条件（兜底）
{ type: "custom", code: "return data.value === 1 && data.label !== ''" }
→ 执行：function filter(data) { return data.value === 1 && data.label !== '' }
→ data 入参即为事件抛出的对象，需返回 boolean
```

**选择依据**：
- 单字段比较 → 用 `type: "field"`
- 多字段组合逻辑 / 复杂运算 / 字符串处理 → 用 `type: "custom"`
