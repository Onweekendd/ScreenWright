# h5player (ftH5player) 配置说明

## dataChart 数据格式

```typescript
interface FtH5playerDataItem {
  value: string;  // 视频流地址
}

type dataChart = FtH5playerDataItem[];
```

**示例**：
```json
[
  { "value": "ws://222.75.96.94:559/openUrl/mvPxVGE" }
]
```

---

## option 完整字段参考

基于配置文件：ftH5playerGlobal.vue

### 边框配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `borderSelect` | string | "#FFCC00" | 选中边框颜色 |
| `borderWidth` | number | 1 | 边框宽度 |
| `border` | string | "#343434" | 边框颜色 |

### 背景配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `background` | string | "#000000" | 背景颜色 |

### 分屏配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `splitNum` | number | 1 | 分屏数量 |

---

## 常用配置示例

### 基础视频流播放
```json
{
  "borderSelect": "#FFCC00",
  "borderWidth": 1,
  "border": "#343434",
  "background": "#000000",
  "splitNum": 1
}
```

### 四分屏监控
```json
{
  "borderSelect": "#FFCC00",
  "borderWidth": 2,
  "border": "#555555",
  "background": "#000000",
  "splitNum": 4
}
```
