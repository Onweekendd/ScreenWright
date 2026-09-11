# ftswiper (轮播图) 配置说明

## dataChart 数据格式

数据为空数组，所有内容通过 option 中的 imagesList 配置。

```typescript
type dataChart = never[];
```

**示例**：
```json
[]
```

---

## option 完整字段参考

总计 **16** 个顶层配置字段 + 图片列表 + 排列样式。

### 基础配置 (16字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | string | "card" | 轮播类型 |
| `interval` | number | 5000 | 轮播间隔（毫秒） |
| `opacity` | number | 1 | 第一层透明度 |
| `secondOpacity` | number | 1 | 第二层透明度 |
| `thirdOpacity` | number | 1 | 第三层透明度 |
| `indicator` | string | "none" | 指示器样式 |
| `direction` | string | "horizontal" | 轮播方向 |
| `autoplay` | boolean | false | 是否自动播放 |
| `arrow` | string | "never" | 箭头显示方式 |
| `arrowImg` | string | "" | 箭头图片路径 |
| `isRotate` | boolean | false | 是否旋转 |
| `showSwiper` | boolean | false | 是否显示轮播 |
| `objectFit` | string | "contain" | 图片适配方式 |
| `imageWidth` | number | 100 | 图片宽度 |
| `imageHeight` | number | 100 | 图片高度 |

### 图片列表 (imagesList，数组，每项24字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | string | "图片N" | 图片名称 |
| `value` | string | - | 图片路径 |
| `objectFit` | string | "contain" | 图片适配方式 |
| `borderImageWidth` | number | 100 | 图片宽度 |
| `borderImageHeight` | number | 100 | 图片高度 |
| `borderImageSize` | string | "contain" | 图片尺寸适配 |
| `content` | string | "" | 文字内容 |
| `fontColor` | string | "rgba(255,255,255,1)" | 文字颜色 |
| `fontSize` | number | 12 | 文字大小 |
| `letterSpacing` | number | 0 | 字间距 |
| `fontWeight` | boolean | false | 是否加粗 |
| `fontFamily` | string | "sans-serif" | 字体 |
| `fontStyle` | boolean | false | 是否斜体 |
| `textAlign` | string | "center" | 文字对齐 |
| `imgTranslateX` | number | 0 | 图片X偏移 |
| `imgTranslateY` | number | 0 | 图片Y偏移 |
| `textTranslateX` | number | 0 | 文字X偏移 |
| `textTranslateY` | number | 0 | 文字Y偏移 |
| `isTextShadow` | boolean | false | 是否显示文字阴影 |
| `opacity` | number | 100 | 透明度 |

### 文字阴影配置 (textShadow，嵌套在图片列表项中，5字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `color` | string | "rgba(255,255,255,1)" | 阴影颜色 |
| `x` | number | 0 | 阴影X偏移 |
| `y` | number | 0 | 阴影Y偏移 |
| `blur` | number | 0 | 阴影模糊度 |
| `extend` | number | 0 | 阴影扩展 |

### 层级排列样式 (picStyle，3层各5字段)

| 字段 | 类型 | 默认值(first/second/third) | 说明 |
|------|------|------|------|
| `firstStyle.translateX` | number | 0 | 第一层X轴平移 |
| `firstStyle.translateY` | number | 0 | 第一层Y轴平移 |
| `firstStyle.scaleX` | number | 1 | 第一层X轴缩放 |
| `firstStyle.scaleY` | number | 1 | 第一层Y轴缩放 |
| `firstStyle.showFont` | boolean | true | 第一层是否显示文字 |
| `secondStyle.translateX` | number | 120 | 第二层X轴平移 |
| `secondStyle.translateY` | number | 0 | 第二层Y轴平移 |
| `secondStyle.scaleX` | number | 0.7 | 第二层X轴缩放 |
| `secondStyle.scaleY` | number | 0.7 | 第二层Y轴缩放 |
| `secondStyle.showFont` | boolean | true | 第二层是否显示文字 |
| `thirdStyle.translateX` | number | 220 | 第三层X轴平移 |
| `thirdStyle.translateY` | number | 0 | 第三层Y轴平移 |
| `thirdStyle.scaleX` | number | 0.4 | 第三层X轴缩放 |
| `thirdStyle.scaleY` | number | 0.4 | 第三层Y轴缩放 |
| `thirdStyle.showFont` | boolean | true | 第三层是否显示文字 |

---

## 常用配置示例

### 基础自动轮播
```json
{
  "type": "card",
  "autoplay": true,
  "interval": 3000,
  "direction": "horizontal",
  "indicator": "none",
  "arrow": "hover"
}
```

### 三层叠加效果
```json
{
  "type": "card",
  "opacity": 1,
  "secondOpacity": 0.8,
  "thirdOpacity": 0.5,
  "picStyle": {
    "firstStyle": { "translateX": 0, "translateY": 0, "scaleX": 1, "scaleY": 1, "showFont": true },
    "secondStyle": { "translateX": 120, "translateY": 0, "scaleX": 0.7, "scaleY": 0.7, "showFont": false },
    "thirdStyle": { "translateX": 220, "translateY": 0, "scaleX": 0.4, "scaleY": 0.4, "showFont": false }
  }
}
```

### 图片带文字和阴影
```json
{
  "imagesList": [
    {
      "name": "图片1",
      "value": "version-test/assets/image1.png",
      "content": "标题文字",
      "fontColor": "rgba(255,255,255,1)",
      "fontSize": 16,
      "isTextShadow": true,
      "textShadow": { "color": "rgba(0,0,0,0.8)", "x": 2, "y": 2, "blur": 4, "extend": 0 }
    }
  ]
}
```
