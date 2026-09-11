# echartthreePie (3D饼图) 配置说明

## dataChart 数据格式

```typescript
interface ThreePieDataItem {
  name: string;        // 扇区分类名称
  value: number;       // 扇区数值
  [key: string]: any;  // 其他业务字段
}

type dataChart = ThreePieDataItem[];
```

**示例**：
```json
[
  { "name": "产品A", "value": 2024 },
  { "name": "产品B", "value": 2378 },
  { "name": "产品C", "value": 1423 }
]
```

---

## option 完整字段参考

基于配置文件：`echartthreePieGlobal.vue` / `echartthreePieSeries.vue`（引用 echartthreeQuartersPieSeries.vue） / `echartthreePieAttrs.vue`

3D饼图使用 `pieOptions.slice(0, 3)` 配置选项：**全局、饼图属性、系列**

### 系列配置 (5+字段)

通过 echartthreeQuartersPieSeries 配置：

| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesOrder` | string | 排序方式:"default"/"desc"/"asc" |
| `seriesTabsName` | {name,value}[] | 系列切换标签 |
| `seriesColor` | GradientColor[] | 扇区颜色列表（支持渐变） |
| `seriesColorpicker` | string[] | 颜色预览值 |
| `seriesOpacity` | number[] | 不透明度 |

**其他系列字段**（通过 ItemSeries 通用组件）：数值标签、边框样式等

### 全局配置

**边距配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `gridLeft` | number | 左边距(px) |
| `gridTop` | number | 上边距(px) |
| `gridRight` | number | 右边距(px) |
| `gridBottom` | number | 下边距(px) |

**环形图属性**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `radius` | string/number | 外半径 |
| `innerRadius` | string/number | 内半径 |
| `centerX` | string/number | 圆心X位置 |
| `centerY` | string/number | 圆心Y位置 |

**3D属性**（通过 echartthreePieAttrs）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `depth` | number | 3D厚度 |
| `rotateAngle` | number | 旋转角度 |
| `rotateDirection` | string | 旋转方向 |

### 图例配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `legendShow` | boolean | 是否显示图例 |
| `legendOrient` | string | 图例方向 |
| `legendOffsetX` | number | 图例X偏移 |
| `legendOffsetY` | number | 图例Y偏移 |

---

## 常用配置示例

### 标准3D饼图

```json
{
  "seriesOrder": "desc",
  "seriesColor": [
    {"colors": [{"color": "#3e43f4"}]},
    {"colors": [{"color": "#3de3fb"}]},
    {"colors": [{"color": "#ff9500"}]}
  ],
  "depth": 20,
  "rotateAngle": 30
}
```

### 自动排序3D饼图

```json
{
  "seriesOrder": "desc",
  "legendShow": true,
  "radius": ["0%", "70%"],
  "depth": 25
}
```
