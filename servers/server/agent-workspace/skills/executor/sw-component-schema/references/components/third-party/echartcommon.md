# Echarts通用型 (echartcommon) 配置说明

## dataChart 数据格式

```typescript
interface EchartcommonSeriesItem {
  name: string;       // 系列名称
  data: number[];     // 系列数据值数组
}

interface EchartcommonDataItem {
  categories: string[];              // 类目数组
  series: EchartcommonSeriesItem[];  // 系列数据数组
}

type dataChart = EchartcommonDataItem[];
```

**示例**：
```json
[
  {
    "categories": ["Mon", "Tue", "Wed", "Thu", "Fri"],
    "series": [
      { "name": "系列一", "data": [10, 30, 20, 40, 50] },
      { "name": "系列二", "data": [10, 30, 20, 40, 50] }
    ]
  }
]
```

---

## option 完整字段参考

### 配置代码

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `echartFormatter` | string | "" | Echarts配置替换代码，用于输出完整的 ECharts option 配置对象。接收 data 参数，返回 option 对象。可自由使用 ECharts 的所有 API |

---

## 常用配置示例

### 默认柱线混合图配置

```json
{
  "echartFormatter": "(data)=>{\n  let option = {\n    tooltip: { trigger: 'axis' },\n    legend: { data: ['系列一', '系列二'] },\n    xAxis: [{ type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }],\n    yAxis: [{ type: 'value' }, { type: 'value' }],\n    series: [\n      { name: '系列一', type: 'bar', data: [10, 30, 20, 40, 50] },\n      { name: '系列二', type: 'line', yAxisIndex: 1, data: [10, 30, 20, 40, 50] }\n    ]\n  }\n  return option\n}"
}
```
