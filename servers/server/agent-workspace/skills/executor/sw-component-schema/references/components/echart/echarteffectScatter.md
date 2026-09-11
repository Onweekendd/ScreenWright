# echarteffectScatter (Top10气泡图) 配置说明

## dataChart 数据格式

```typescript
interface EffectScatterDataItem {
  name: string;
  value: number[];  // [x坐标, y坐标, 气泡大小]
  [key: string]: any;
}

type dataChart = EffectScatterDataItem[];
```

**示例**：
```json
[
  { "name": "第一名", "value": [1, 100, 50] },
  { "name": "第二名", "value": [2, 85, 45] }
]
```

---

## option 完整字段参考

基于配置文件：`echarteffectScatterGlobal.vue` / `echarteffectScatterSeries.vue`

Top10气泡图使用 `graphOptions` 配置选项：**全局、系列**

### 全局配置

通过 `ItemConfigDistance` + `ItemecharteffectScatterDataMark` + `echarteffectScatterRipple` 配置：

**边距配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `gridLeft` | number | 左边距 |
| `gridTop` | number | 上边距 |
| `gridRight` | number | 右边距 |
| `gridBottom` | number | 下边距 |

**数据标记配置**（通过 ItemecharteffectScatterDataMark）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesSymbol` | string | 标记图形 |
| `seriesSymbolSize` | number | 标记大小 |

**波纹特效配置**（通过 echarteffectScatterRipple）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `rippleEffect` | object | 涟漪特效配置 |
| `rippleEffect.brushType` | string | 特效类型（stroke/fill） |
| `rippleEffect.scale` | number | 缩放比例 |
| `rippleEffect.period` | number | 特效周期(秒) |

### 系列配置

通过 `echarteffectScatterSeries.vue` 配置：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesList` | object[] | 节点列表 |
| `seriesList[].tabName` | string | 节点标签名 |
| `seriesList[].name` | string | 节点名称 |
| `seriesList[].translateX` | number | X位置(%) |
| `seriesList[].translateY` | number | Y位置(%) |
| `seriesList[].size` | number | 气泡大小 |
| `seriesList[].insideColor` | string | 径内颜色 |
| `seriesList[].outsideColor` | string | 径外颜色 |
| `seriesList[].showEffectOn` | string | 特效显示时机（render/emphasize） |
| `seriesLabelTop` | string | 排名标签 |
| `seriesLabelName` | string | 类目标签 |
| `seriesLabelValue` | string | 值标签 |

---

## 常用配置示例

### Top10气泡图

```json
{
  "seriesList": [
    {
      "tabName": "Top1",
      "name": "第一名",
      "translateX": 50,
      "translateY": 50,
      "size": 50,
      "insideColor": "#3e43f4",
      "outsideColor": "#3de3fb"
    }
  ],
  "rippleEffect": {
    "brushType": "stroke",
    "scale": 3,
    "period": 4
  }
}
```

### 自定义颜色气泡图

```json
{
  "rippleEffect": {
    "brushType": "fill",
    "scale": 4,
    "period": 3
  },
  "seriesSymbol": "circle",
  "seriesSymbolSize": 15
}
```
