# echartstripBar (条形图) 配置说明

## dataChart 数据格式

```typescript
interface StripBarDataItem {
  seriesName: string;  // 系列标识（同名数据为一个系列）
  name: string;        // Y轴分类名称
  value: number;       // 条形长度值
  [key: string]: any;  // 其他业务字段
}

type dataChart = StripBarDataItem[];
```

**示例**：
```json
[
  { "seriesName": "2024年", "name": "部门A", "value": 2024 },
  { "seriesName": "2024年", "name": "部门B", "value": 2378 },
  { "seriesName": "2025年", "name": "部门A", "value": 1900 }
]
```

---

## option 完整字段参考

基于配置文件：`echartstripBarGlobal.vue` / `echartstripBarSeries.vue` / `echartstripBarxAxis.vue` / `echartstripBarTooltip.vue`

### 系列配置 (10字段)

| 字段 | 类型 | 说明 |
|------|------|------|
| `dataSeriesName` | string[] | 数据中的系列名列表 |
| `seriesTabsName` | {name,value}[] | 系列切换标签 |
| `seriesColor` | GradientColor[] | 系列颜色（支持渐变） |
| `seriesColorpicker` | string[] | 系列颜色预览值 |
| `seriesOpacity` | number[] | 系列不透明度 |
| `extremeShow` | boolean[] | 是否显示极值标记 |
| `extremeType` | string[] | 极值类型:"max"/"min" |
| `extremeColor` | GradientColor[] | 极值颜色 |
| `extremeColorpicker` | string[] | 极值颜色预览值 |
| `extremeOpacity` | number[] | 极值不透明度 |

### 全局配置

通过以下组件配置：

**条形样式** (ItemConfigStripStyle)：
| 字段 | 类型 | 说明 |
|------|------|------|
| `barGap` | number | 条形间距(%) |
| `barCategoryGap` | number | 分类间距(%) |
| `barBorderRadius` | string | 条形圆角 |
| `barBackgroundColor` | string | 条形背景颜色 |

**数值标签** (ItemConfigNumber)：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesLabelShow` | boolean | 是否显示数值标签 |
| `seriesLabelColor` | string | 标签颜色 |
| `seriesLabelFontSize` | number | 标签字号 |
| `seriesLabelFontFamily` | string | 标签字体 |
| `seriesLabelFontStyle` | string | 标签风格 |
| `seriesLabelFontWeight` | string | 标签粗细 |
| `seriesLabelOffsetX` | number | 标签X偏移 |
| `seriesLabelOffsetY` | number | 标签Y偏移 |

**其他全局配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `gridLeft` | number | 左边距(px) |
| `gridTop` | number | 上边距(px) |
| `gridRight` | number | 右边距(px) |
| `gridBottom` | number | 下边距(px) |
| `legendShow` | boolean | 是否显示图例 |
| `legendOrient` | string | 图例方向:"horizontal"/"vertical" |
| `legendOffsetX` | number | 图例X偏移 |
| `legendOffsetY` | number | 图例Y偏移 |
| `dataLoopInterval` | number | 数据轮播间隔(s) |
| `dataZoomShow` | boolean | 显示缩放条 |
| `dataZoomBottom` | number | 缩放条距离底部 |

### 坐标轴配置

通过 xAxisConfigTab 配置（type=column，纵向轴），包括轴标签、轴线、刻度、网格线等标准坐标轴字段。

### 提示框配置

引用 echartareaLineTooltip.vue（ItemBarToolTip），包括：
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `tooltipTriggerOn` | boolean | true | 是否启用 |
| `tooltipLoop` | boolean | false | 是否自动循环显示 |
| `tooltipLoopInterval` | number | 3 | 循环间隔(s) |
| 其他 | - | - | 通过 ItemZebra2Tooltip 和 ItemZebra2Pointer 公共组件配置 |

---

## 常用配置示例

### 基础条形图

```json
{
  "seriesColor": [{"colors": [{"color": "#3e43f4"}]}],
  "barGap": 30,
  "seriesLabelShow": true
}
```

### 带极值高亮

```json
{
  "extremeShow": [true],
  "extremeType": ["max"],
  "extremeColor": [{"colors": [{"color": "#ff0000"}]}],
  "seriesLabelShow": true
}
```

### 堆叠模式（多系列）

```json
{
  "barGap": 0,
  "barCategoryGap": 50,
  "seriesColor": [
    {"colors": [{"color": "#3e43f4"}]},
    {"colors": [{"color": "#3de3fb"}]}
  ],
  "legendShow": true
}
```
