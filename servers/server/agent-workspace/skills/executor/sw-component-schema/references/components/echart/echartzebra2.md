# echartzebra2 (斑马柱状图2) 配置说明

## dataChart 数据格式

```typescript
interface Zebra2DataItem {
  name: string;
  value: number;
  [key: string]: any;
}

type dataChart = Zebra2DataItem[];
```

**示例**：
```json
[
  { "name": "产品A", "value": 2024 },
  { "name": "产品B", "value": 2378 }
]
```

---

## option 完整字段参考

基于配置文件：`echartzebra2Global.vue` / `echartzebra2Series.vue` / `echartzebra2xAxis.vue` / `echartzebra2Tooltip.vue`

斑马柱状图2使用 `defaultOption` 配置选项：**全局、坐标轴、系列、提示框**

### 全局配置

通过 `ItemConfigDistance` + `ItemIsSort` + `ItemIsHighLight` + `ItemBarStyle` 配置：

**边距配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `gridLeft` | number | 左边距 |
| `gridTop` | number | 上边距 |
| `gridRight` | number | 右边距 |
| `gridBottom` | number | 下边距 |

**排序和高亮配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `isSort` | boolean | 是否排序 |
| `isHover` | boolean | 是否高亮 |
| `hoverColor` | string | 高亮颜色 |
| `seriesOpacity` | number | 透明度 |

**柱体样式配置**（通过 ItemBarStyle）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesWidth` | number | 柱体宽度 |
| `seriesColor` | GradientColor[] | 柱体颜色 |
| `seriesOpacity` | number | 不透明度 |

### 坐标轴配置

通过 `xAxisConfigTab` 组件配置 X/Y 轴（包含完整的 X 轴和 Y 轴配置字段）

### 系列配置

通过 `echartzebra2Series.vue` 配置斑马纹系列

### 提示框配置

通过 `echartzebra2Tooltip.vue` 配置提示框

---

## 常用配置示例

### 斑马柱状图2

```json
{
  "isSort": true,
  "seriesWidth": 30,
  "seriesColor": [{"colors": [{"color": "#3e43f4"}]}]
}
```
