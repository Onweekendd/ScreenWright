# 图片墙 (ftPeriodictable) 配置说明

## dataChart 数据格式

图片墙组件无数据字段，data 为空数组。

```typescript
type dataChart = [];
```

---

## option 完整字段参考

### 图片列表配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `images` | Array\<{url: string}\> | 72个默认图片 | 图片列表，每项包含图片地址 |

### 布局配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `offsetX` | number | 0 | 整体水平偏移量 |
| `offsetY` | number | 0 | 整体垂直偏移量 |
| `rows` | number | 6 | 每行显示的图片数量 |
| `imageWidth` | number | 80 | 单张图片宽度(px) |
| `imageHeight` | number | 80 | 单张图片高度(px) |
| `rowSpace` | number | 180 | 行间距(px) |
| `columnSpace` | number | 140 | 列间距(px) |
| `duration` | number | 2000 | 动画切换间隔时间(ms) |

---

## 常用配置示例

### 基础图片墙（6列网格）

```json
{
  "rows": 6,
  "imageWidth": 80,
  "imageHeight": 80,
  "rowSpace": 180,
  "columnSpace": 140,
  "images": [
    { "url": "version-test/assets/defaultImg/default.png" },
    { "url": "version-test/assets/defaultImg/default.png" }
  ]
}
```

### 大图模式（4列大间距）

```json
{
  "rows": 4,
  "imageWidth": 150,
  "imageHeight": 150,
  "rowSpace": 200,
  "columnSpace": 200,
  "offsetX": 20,
  "offsetY": 20
}
```

### 密集排列（小图多列）

```json
{
  "rows": 10,
  "imageWidth": 50,
  "imageHeight": 50,
  "rowSpace": 100,
  "columnSpace": 80
}
```

### 替换实际图片

```json
{
  "images": [
    { "url": "/uploads/team/member1.jpg" },
    { "url": "/uploads/team/member2.jpg" },
    { "url": "/uploads/team/member3.jpg" },
    { "url": "/uploads/team/member4.jpg" },
    { "url": "/uploads/team/member5.jpg" },
    { "url": "/uploads/team/member6.jpg" }
  ],
  "rows": 3,
  "imageWidth": 120,
  "imageHeight": 120
}
```
