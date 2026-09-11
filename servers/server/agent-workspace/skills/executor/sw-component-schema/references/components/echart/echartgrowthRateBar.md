# echartgrowthRateBar (增长率柱状图) 配置说明

## dataChart 数据格式

```typescript
interface GrowthRateBarDataItem {
  name: string;
  value: number;  // 支持正负值，如 15.5 或 -8.2
  [key: string]: any;
}

type dataChart = GrowthRateBarDataItem[];
```

**示例**：
```json
[
  { "name": "1月", "value": 15.5 },
  { "name": "2月", "value": -8.2 },
  { "name": "3月", "value": 22.3 }
]
```

---

## option 完整字段参考

基于配置文件：`echartgrowthRateBarGlobal.vue` / `echartgrowthRateBarSeries.vue` / `echartgrowthRateBarxAxis.vue`

增长率柱状图使用 `defaultOption.slice(0, 3)` 配置选项：**全局、坐标轴、系列**

该组件支持正负值显示，零轴自动对齐，适合展示增长率数据。

### 全局配置

通过 `ItemConfigDistance` + `ItemechartgrowthRateBarStyle` + `ItemConfigLegend` 配置：

**边距配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `gridLeft` | number | 左边距 |
| `gridTop` | number | 上边距 |
| `gridRight` | number | 右边距 |
| `gridBottom` | number | 下边距 |

**柱体样式配置**（通过 ItemechartgrowthRateBarStyle）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesWidth` | number | 柱体宽度 |

**图例配置**（通过 ItemConfigLegend）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `legendShow` | boolean | 图例显示 |
| `legendFontFamily` | string | 图例字体 |
| `legendFontStyle` | string | 图例样式 |
| `legendFontWeight` | string | 图例粗细 |
| `legendFontSize` | number | 图例字号 |
| `legendColor` | string | 图例颜色 |
| `legendItemGap` | number | 图例间距 |
| `legendOrient` | string | 图例方向 |

### 坐标轴配置

通过 `xAxisConfigTab` 组件配置 X/Y 轴（包含完整的 X 轴和 Y 轴配置字段）

### 系列配置

通过 `echartgrowthRateBarSeries.vue` 配置系列相关字段

---

## 常用配置示例

### 增长率柱状图

```json
{
  "seriesWidth": 20,
  "seriesColor": [
    {"colors": [{"color": "#3e43f4"}]},
    {"colors": [{"color": "#ff6b6b"}]}
  ]
}
```

### 带图例的增长率柱状图

```json
{
  "seriesWidth": 25,
  "legendShow": true,
  "legendItemGap": 10
}
```
