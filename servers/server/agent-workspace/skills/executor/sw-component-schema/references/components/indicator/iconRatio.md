# 图标占比图 (iconRatio) 配置说明

## dataChart 数据格式

```typescript
interface IconRatioDataItem {
  name: string;        // 图标标识键值（与iconList中的iconKeyValue匹配）
  value: number;       // 占比值（0-1之间小数或任意数值）
}

type dataChart = IconRatioDataItem[];
```

**示例**：
```json
[
  { "name": "men", "value": 0.57 },
  { "name": "women", "value": 0.43 }
]
```

---

## option 完整字段参考

### globalConfig 全局配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `globalConfig.decimalPlace` | number | 2 | 小数位数 |
| `globalConfig.positionX` | number | 0 | X轴位置偏移 |
| `globalConfig.positionY` | number | 0 | Y轴位置偏移 |
| `globalConfig.colNum` | number | 2 | 列数 |
| `globalConfig.rowNum` | number | 1 | 行数 |

### iconList 图标列表

每项对应一个数据系列，iconKeyValue 需与数据中的 name 字段匹配：

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `iconKeyValue` | string | - | 图标对应的键值 |
| `iconFontFamily` | string | "Alibaba-PuHuiTi-Regular" | 图标字体名称 |
| `iconFontSize` | number | 32 | 图标字体大小 |
| `iconFontStyle` | string | "normal" | 图标字体样式 |
| `iconFontWeight` | string | "normal" | 图标字体粗细 |
| `iconLetterSpacing` | number | 0 | 图标字间距 |
| `iconColor` | string | "rgba(74,144,226,1)" | 图标颜色 |
| `iconLineHeight` | number | 32 | 图标行高 |
| `iconImgSrc` | string | - | 图标图片地址 |
| `iconImgWidth` | number | 100 | 图标图片宽度 |
| `iconImgHeight` | number | 100 | 图标图片高度 |
| `iconTranslateX` | number | 0 | 图标X轴偏移 |
| `iconTranslateY` | number | 0 | 图标Y轴偏移 |
| `iconTabsName` | string | - | 图标标签页名称 |

---

## 常用配置示例

### 默认男女比例图

```json
{
  "globalConfig": {
    "decimalPlace": 2,
    "positionX": 0,
    "positionY": 0,
    "colNum": 2,
    "rowNum": 1
  },
  "iconList": [
    {
      "iconKeyValue": "men",
      "iconImgSrc": "version-test/assets/defaultImg/nan.png",
      "iconColor": "rgba(74, 144, 226, 1)",
      "iconFontSize": 32,
      "iconTabsName": "系列1"
    },
    {
      "iconKeyValue": "women",
      "iconImgSrc": "version-test/assets/defaultImg/nv.png",
      "iconColor": "rgba(74, 144, 226, 1)",
      "iconFontSize": 32,
      "iconTabsName": "系列2"
    }
  ]
}
```

### 自定义布局（4列1行）

```json
{
  "globalConfig": {
    "decimalPlace": 0,
    "colNum": 4,
    "rowNum": 1,
    "positionX": 10,
    "positionY": 5
  }
}
```

### 自定义图标颜色和大小

```json
{
  "iconList": [
    {
      "iconKeyValue": "men",
      "iconColor": "rgba(30, 120, 255, 1)",
      "iconFontSize": 40,
      "iconLineHeight": 40
    },
    {
      "iconKeyValue": "women",
      "iconColor": "rgba(255, 100, 150, 1)",
      "iconFontSize": 40,
      "iconLineHeight": 40
    }
  ]
}
```
