# echartdoubleValueLine (特殊型折线图) 配置说明

## dataChart 数据格式

```typescript
interface DoubleValueLineDataItem {
  name: string;
  value: number;
  [key: string]: any;
}

type dataChart = DoubleValueLineDataItem[];
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

基于配置文件：`echartdoubleValueLineGlobal.vue` / `echartdoubleValueLineSeries.vue` / `echartdoubleValueLinexAxis.vue`

特殊型折线图使用 `defaultOption.slice(0, 3)` 配置选项：**全局、坐标轴、系列**

### 全局配置

通过 `ItemConfigDistance` 配置：

**边距配置**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `gridLeft` | number | 左边距 |
| `gridTop` | number | 上边距 |
| `gridRight` | number | 右边距 |
| `gridBottom` | number | 下边距 |

### 坐标轴配置

通过 `xAxisConfigTab` 组件配置 X/Y 轴（包含完整的 X 轴和 Y 轴配置字段）

### 系列配置

通过 `echartdoubleValueLineSeries.vue` 配置折线系列相关字段

---

## 常用配置示例

### 标准特殊折线图

```json
{
  "seriesWidth": 2,
  "seriesColor": [{"colors": [{"color": "#3e43f4"}]}]
}
```
