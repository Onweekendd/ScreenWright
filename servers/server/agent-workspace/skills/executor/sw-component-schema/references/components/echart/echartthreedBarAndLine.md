# echartthreedBarAndLine (3D柱状折线图) 配置说明

## dataChart 数据格式

```typescript
interface ThreedBarAndLineDataItem {
  name: string;
  value: number;
  [key: string]: any;
}

type dataChart = ThreedBarAndLineDataItem[];
```

**示例**：
```json
[
  { "name": "1月", "value": 2024 },
  { "name": "2月", "value": 2378 }
]
```

---

## option 完整字段参考

基于配置文件：`echartthreedBarAndLineGlobal.vue` / `echartthreedBarAndLineTooltip.vue` / `echartthreedBarAndLinexAxis.vue`

3D柱状折线图使用 `echartthinBarOptions` 配置选项：**全局、坐标轴、提示框**

### 全局配置

通过 `ItemConfigDistance` + `ItemBarAndLineHighLight` + `ItemthreeDBarColor` + `ItemLineStyle` + `ItemConfigLegend` 配置：

**边距配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `gridLeft` | number | 左边距 |
| `gridTop` | number | 上边距 |
| `gridRight` | number | 右边距 |
| `gridBottom` | number | 下边距 |

**高亮配置**（通过 ItemBarAndLineHighLight）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `isHover` | boolean | 是否高亮 |
| `hoverColor` | string | 高亮颜色（通过 ItemHightLightStyle） |
| `seriesOpacity` | number | 不透明度 |

**3D柱体样式配置**（通过 ItemthreeDBarColor）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesWidth` | number | 柱体宽度 |
| `seriesColor` | GradientColor[] | 柱体颜色 |
| `seriesOpacity` | number | 不透明度 |
| `seriesTopColor` | string | 头部颜色 |
| `seriesBottomColor` | string | 底部颜色 |

**折线样式配置**（通过 ItemLineStyle）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesLineColor` | string | 折线颜色 |
| `seriesLineOpacity` | number | 折线不透明度 |
| `seriesLineWidth` | number | 折线粗细 |
| `seriesSmoothShow` | boolean | 曲线显示 |
| `seriesSmooth` | number | 曲线张力(0-1) |
| `seriesConnectNulls` | boolean | 空值连接 |

**图例配置**（通过 ItemConfigLegend）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `legendShow` | boolean | 图例显示 |
| `legendFontFamily` | string | 图例字体 |
| `legendFontStyle` | string | 图例样式 |
| `legendFontWeight` | string | 图例粗细 |
| `legendFontSize` | number | 图例字号 |
| `legendColor` | string | 图例颜色 |
| `legendOrient` | string | 图例方向 |

### 坐标轴配置

通过 `xAxisConfigTab` 组件配置 X/Y 轴（包含完整的 X 轴和 Y 轴配置字段）

### 提示框配置

通过 `echartthreedBarAndLineTooltip.vue` 配置提示框

---

## 常用配置示例

### 3D柱状折线图

```json
{
  "seriesWidth": 20,
  "seriesTopColor": "#4a90e2",
  "seriesBottomColor": "#1a3a5c",
  "seriesLineColor": "#ff9500",
  "seriesLineWidth": 2
}
```

### 曲线3D柱状折线图

```json
{
  "seriesSmoothShow": true,
  "seriesSmooth": 0.3,
  "seriesLineColor": "#3de3fb",
  "seriesWidth": 25
}
```

### 高亮3D柱状折线图

```json
{
  "isHover": true,
  "hoverColor": "#ff6b6b",
  "seriesOpacity": 0.8
}
```
