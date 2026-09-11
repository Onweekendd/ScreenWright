# 字符云 (echartwordcloud) 配置说明

## dataChart 数据格式

```typescript
interface WordcloudDataItem {
  name: string;        // 文本/类目名称
  value: number;       // 权重值
}

type dataChart = WordcloudDataItem[];
```

**示例**：
```json
[
  { "name": "汽车", "value": 928 },
  { "name": "视频", "value": 906 },
  { "name": "电视", "value": 825 },
  { "name": "音乐", "value": 5999 }
]
```

---

## option 完整字段参考

### 位置配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `left` | number | 0 | 左边距 |
| `top` | number | 0 | 上边距 |

### 字体配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fontFamily` | string | "siayuan-normal" | 字体名称 |

### 字号范围

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `sizeRangeMax` | number | 60 | 最大字号 |
| `sizeRangeMin` | number | 8 | 最小字号 |

### 旋转配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `rotationRangeMax` | number | 90 | 最大旋转角度 |
| `rotationRangeMin` | number | -90 | 最小旋转角度 |
| `rotationStep` | number | 45 | 旋转步长 |

### 网格与形状

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `gridSize` | number | 8 | 网格大小（词间距） |
| `shape` | string | "square" | 云形状：circle/square/cardioid/diamond/triangle/star 等 |

### 遮罩图片

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `maskImageShow` | boolean | false | 是否启用遮罩图片 |
| `maskImage` | string | "" | 遮罩图片地址 |

### 其他配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `keepAspect` | boolean | true | 是否保持遮罩图片宽高比 |
| `drawOutOfBound` | boolean | true | 是否允许绘制超出边界 |

---

## 常用配置示例

### 默认正方形字符云

```json
{
  "left": 0,
  "top": 0,
  "fontFamily": "siayuan-normal",
  "sizeRangeMax": 60,
  "sizeRangeMin": 8,
  "rotationRangeMax": 90,
  "rotationRangeMin": -90,
  "rotationStep": 45,
  "gridSize": 8,
  "shape": "square"
}
```

### 圆形字符云（不旋转）

```json
{
  "shape": "circle",
  "rotationRangeMax": 0,
  "rotationRangeMin": 0,
  "rotationStep": 0,
  "sizeRangeMax": 80,
  "sizeRangeMin": 12,
  "gridSize": 10
}
```

### 使用遮罩图片

```json
{
  "maskImageShow": true,
  "maskImage": "path/to/mask.png",
  "keepAspect": true,
  "drawOutOfBound": false,
  "shape": "circle"
}
```
