# ftProgress (进度条表格) 配置说明

## dataChart 数据格式

```typescript
// 动态键值对记录，键由 column 配置定义，数值列通常为 0~1 之间的小数
interface ProgressDataItem {
  [key: string]: string | number;
}

type dataChart = ProgressDataItem[];
```

**示例**：
```json
[
  { "地区": "深圳", "小学": 0.089, "初中": 0.441, "高中（含中专）": 0.239, "大学及以上（含大专）": 0.176 },
  { "地区": "广州", "小学": 0.156, "初中": 0.356, "高中（含中专）": 0.232, "大学及以上（含大专）": 0.196 }
]
```

---

## option 完整字段参考

总计 **110+ 个配置字段**，与 ftScroll 轮播表格共享大部分结构，额外增加进度条相关字段。

### 基础配置 (14字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `refresh` | boolean | true | 数据更新时重绘 |
| `columnShow` | boolean | true | 是否显示列 |
| `columnViews` | boolean | true | 列视图开关 |
| `animationShow` | boolean | true | 启用动画效果 |
| `cursorShow` | boolean | true | 显示光标 |
| `align` | string | "center" | 整体对齐方式 |
| `header` | boolean | false | 显示表头 |
| `scroll` | boolean | true | 启用滚动 |
| `scrollTime` | number | 2 | 滚动间隔时间 |
| `fontSize` | number | 15 | 默认字号 |
| `count` | number | 5 | 可视行数 |
| `lineMarginBottom` | number | 10 | 行底部间距 |
| `index` | boolean | true | 显示序号 |
| `scrollCount` | number | 1 | 每次滚动行数 |

注意：与 ftScroll 相比，本组件没有 `textStyleShow`、`scrollTimeType`、`scrollSingleTime` 字段。

### 表头配置 (14字段)

| 字段 | 类型 | 说明 |
|------|------|------|
| `headerHeight` | number | 表头高度 |
| `headerFontSize` | number | 表头字号 |
| `headerFontFamily` | string | 表头字体 |
| `headerlineHeight` | number | 表头行高 |
| `backgroundType` | string | 背景类型 |
| `backgroundImage` | string | 背景图片 |
| `headerletterSpacing` | number | 表头字间距 |
| `headerFontStyle` | string | 表头风格 |
| `headerFontWeight` | string | 表头粗细 |
| `headerBackground` | string | 表头背景色 |
| `headerColor` | string | 表头文字颜色 |
| `headerShow` | boolean | 是否显示表头 |
| `headerTextAlign` | string | 表头对齐 |

注意：与 ftScroll 相比，本组件没有 `borderShow`、`activeKeys` 字段。

### 列定义

| 字段 | 类型 | 说明 |
|------|------|------|
| `column` | {name:string, alias:string, icon?:string}[] | 列定义数组 |

### 进度条特有配置 (2字段，均为数组)

| 字段 | 类型 | 说明 |
|------|------|------|
| `percentageShow` | boolean[] | 是否显示百分比(按列) |
| `decimalSave` | number[] | 小数位保留位数(按列) |

### 其余配置组

其余配置组（选中、阴影、行序号、主体、行样式X轴、列样式Y轴、列图片、后缀、状态图标、样式指定）与 ftScroll 结构完全一致，字段名和类型相同。详见 ftScroll 配置说明。

注意：与 ftScroll 相比，本组件没有 `progressYConfig` 和 `globalScrollYTrack*`/`globalScrollYThumb*` 滚动条字段。

---

## 常用配置示例

### 基础进度条表格
```json
{
  "scroll": true,
  "scrollTime": 2,
  "count": 5,
  "percentageShow": [false, true, true, true, true],
  "decimalSave": [1, 1, 1, 1, 1],
  "suffixContent": ["/单位", "%", "%", "%", "%"]
}
```

### 自定义百分比列
```json
{
  "percentageShow": [false, true, true],
  "decimalSave": [0, 2, 2],
  "suffixShow": [false, true, true]
}
```
