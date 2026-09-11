# echartbothWayStripBar (双向条形图) 配置说明

## dataChart 数据格式

```typescript
interface BothWayStripBarDataItem {
  seriesName: string;  // 系列标识（左/右侧数据）
  name: string;        // Y轴分类名称
  value: number;       // 条形长度值
  [key: string]: any;  // 其他业务字段
}

type dataChart = BothWayStripBarDataItem[];
```

**示例**：
```json
[
  { "seriesName": "收入", "name": "部门A", "value": 1500 },
  { "seriesName": "收入", "name": "部门B", "value": 2300 },
  { "seriesName": "支出", "name": "部门A", "value": 800 },
  { "seriesName": "支出", "name": "部门B", "value": 1200 }
]
```

---

## option 完整字段参考

基于配置文件：`echartbothWayStripBarGlobal.vue` / `echartbothWayStripBarSeries.vue` / `echartbothWayStripBarxAxis.vue`

### 系列配置

通过 Series 配置面板，包括：
| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesTabsName` | {name,value}[] | 系列切换标签 |
| `seriesLabelShow` | boolean[] | 是否显示数值标签 |
| 数值标签 | - | 通过 ConfigNumericalLabel 配置（type=none），包括标签颜色、字体、偏移等 |
| 极值高亮 | - | 通过 ItemBarextremeShow 配置，包括极值显示、类型、颜色 |
| 整体布局 | - | 通过 ItemechartbothWayStripBarGrid 配置，控制边距和位置 |

### 全局配置

通过以下组件配置：

**边距配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `gridTop` | number | 上边距(%) |
| `gridBottom` | number | 下边距(%) |

**条形样式** (ItemConfigStripStyle)：
| 字段 | 类型 | 说明 |
|------|------|------|
| `barGap` | number | 条形间距(%) |
| `barCategoryGap` | number | 分类间距(%) |

**其他全局配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `legendShow` | boolean | 是否显示图例 |
| `legendOrient` | string | 图例方向:"horizontal"/"vertical" |
| `dataLoopInterval` | number | 数据轮播间隔(s) |

### 坐标轴配置

通过 xAxis/ItemBothWayBarX 配置，支持左右X轴和Y轴切换：
| 字段 | 类型 | 说明 |
|------|------|------|
| `active` | string | 当前激活的轴类型："X_L"(左X轴) / "X_R"(右X轴) / "Y"(Y轴) |
| 轴显示 | - | 通过 ItemBothWayStripBarxAxisShow 控制 |
| X轴配置 | - | 通过 ItemBothWayBarX 配置（轴标签、轴线、刻度、网格线等） |
| Y轴配置 | - | 通过 xAxisConfig 配置（type=column） |

---

## 常用配置示例

### 基础双向条形图

```json
{
  "gridTop": 10,
  "gridBottom": 10,
  "barGap": 30,
  "legendShow": true
}
```

### 带数值标签

```json
{
  "seriesLabelShow": [true, true]
}
```

### 自定义轴方向

```json
{
  "active": "X_L",
  "xAxisShow": true,
  "yAxisShow": false
}
```
