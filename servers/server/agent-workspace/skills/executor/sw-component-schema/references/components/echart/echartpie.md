# echartpie (饼图) 配置说明

## dataChart 数据格式

```typescript
interface PieDataItem {
  name: string;        // 扇区分类名称
  value: number;       // 扇区数值
  [key: string]: any;  // 其他业务字段
}

type dataChart = PieDataItem[];
```

**示例**：
```json
[
  { "name": "产品A", "value": 2024 },
  { "name": "产品B", "value": 2378 },
  { "name": "产品C", "value": 1423 },
  { "name": "产品D", "value": 1532 }
]
```

---

## option 完整字段参考

基于配置文件：`echartpieGlobal.vue` / `echartpieSeries.vue`

### 系列配置 (20+字段)

| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesName` | string[] | 图例显示的系列名 |
| `seriesColor` | GradientColor[] | 扇区颜色列表 |
| `seriesColorpicker` | string[] | 扇区颜色预览值 |
| `seriesOpacity` | number[] | 扇区不透明度 |
| `seriesOrder` | string | 排序方式:"default"/"asc"/"desc" |
| `seriesLabelShow` | boolean | 是否显示数值标签 |
| `seriesLabelColor` | string | 标签颜色 |
| `seriesLabelFontSize` | number | 标签字号 |
| `seriesLabelFontFamily` | string | 标签字体 |
| `seriesLabelFontStyle` | string | 标签风格 |
| `seriesLabelFontWeight` | string | 标签粗细 |
| `seriesLabelPosition` | string | 标签位置:"inside"/"outside" |
| `seriesLabelFormatter` | string | 标签格式化模板 |
| `seriesBorderColor` | string | 扇区边框颜色 |
| `seriesBorderWidth` | number | 扇区边框宽度 |
| `seriesBorderRadius` | number[] | 扇区圆角 |
| `seriesEmphasisColor` | string[] | 强调色（鼠标悬停） |
| `seriesEmphasisOpacity` | number | 强调不透明度 |
| `seriesGap` | number | 扇区间距(px) |
| `seriesItemStyle` | object | 扇区样式对象 |

### 全局配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `gridLeft` | number | 左边距(px) |
| `gridTop` | number | 上边距(px) |
| `gridRight` | number | 右边距(px) |
| `gridBottom` | number | 下边距(px) |
| `centerX` | string/number | 饼图圆心X位置 |
| `centerY` | string/number | 饼图圆心Y位置 |
| `radius` | string/number | 饼图外半径 |
| `innerRadius` | string/number | 饼图内半径（环形饼） |
| `legendShow` | boolean | 是否显示图例 |
| `legendOrient` | string | 图例方向:"horizontal"/"vertical" |
| `legendOffsetX` | number | 图例X偏移 |
| `legendOffsetY` | number | 图例Y偏移 |
| `tooltipTriggerOn` | boolean | 是否启用提示框 |
| `tooltipFormatter` | string | 提示框格式化模板 |
| `animationDuration` | number | 动画时长(ms) |
| `animationEasing` | string | 动画缓动类型 |

---

## 常用配置示例

### 标准饼图（带外部标签）

```json
{
  "seriesLabelShow": true,
  "seriesLabelPosition": "outside",
  "seriesLabelFontSize": 12,
  "seriesColor": [
    {"colors": [{"color": "#3e43f4"}]},
    {"colors": [{"color": "#3de3fb"}]},
    {"colors": [{"color": "#ff9500"}]}
  ]
}
```

### 从大到小排序

```json
{
  "seriesOrder": "desc",
  "seriesLabelShow": true,
  "seriesLabelFormatter": "{b}: {c} ({d}%)"
}
```

### 简洁模式（内部标签）

```json
{
  "seriesLabelShow": true,
  "seriesLabelPosition": "inside",
  "seriesLabelColor": "#ffffff",
  "legendShow": false
}
```

### 环形样式

```json
{
  "innerRadius": "40%",
  "radius": "70%",
  "seriesGap": 2
}
```
