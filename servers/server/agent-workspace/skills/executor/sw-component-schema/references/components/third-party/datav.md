# datav (datav) 配置说明

## dataChart 数据格式

```typescript
interface DatavSeriesItem {
  name: string;       // 系列名称
  data: number[];     // 系列数据值数组
}

interface DatavDataItem {
  categories: string[];      // 类目数组
  series: DatavSeriesItem[]; // 系列数据数组
}

type dataChart = DatavDataItem[];
```

**示例**：
```json
[
  {
    "categories": ["苹果", "三星", "小米", "oppo", "vivo"],
    "series": [
      { "name": "手机品牌", "data": [1000879, 3400879, 2300879, 5400879, 3400879] }
    ]
  }
]
```

---

## option 完整字段参考

### 组件标识

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `is` | string | "dv-water-level-pond" | DataV组件名称标识，如 dv-water-level-pond、dv-border-box 等 |

### 配置代码

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `echartFormatter` | string | "" | DataV配置替换代码，用于输出 config 或 option 等配置对象。接收 data 参数，返回配置对象 |

---

## 常用配置示例

### 默认水位图配置

```json
{
  "is": "dv-water-level-pond",
  "echartFormatter": "(data)=>{\n  return {\n    config: {\n      data: [66]\n    }\n  }\n}"
}
```
