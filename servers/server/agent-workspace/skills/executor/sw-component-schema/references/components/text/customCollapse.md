# customCollapse (折叠面板) 配置说明

## dataChart 数据格式

数据由 option 中的 `seriesTabsList` 定义面板内容，而非 dataChart 字段。dataRemark 定义了 title、value、type 三个字段用于动态数据绑定。

```typescript
// 动态数据接口（如使用数据源）
interface CustomCollapseDataItem {
  title?: string;  // 标题
  value?: string;  // 数值
  type?: string;   // 类型
  [key: string]: string | number | undefined;
}
```

---

## option 完整字段参考

基于配置文件：customCollapseGlobal.vue / customCollapseDataList.vue

### 折叠模式配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | string | "accordion" | 折叠类型(accordion手风琴模式) |
| `accordionKeys` | string | "1,2,3" | 默认展开的面板key(逗号分隔) |

### 标题区域尺寸

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `titleHeight` | number | 53 | 标题区域高度(px) |
| `contentHeight` | number | 230 | 内容区域高度(px) |

### 容器配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `paddingTop` | number | 0 | 容器上内边距 |
| `paddingLeft` | number | 0 | 容器左内边距 |
| `backgroudSize` | string | "100% 100%" | 容器背景尺寸 |
| `backgroudImage` | string | "" | 容器背景图片 |

### 标题样式配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `titleBgSize` | string | "100% 100%" | 标题背景尺寸 |
| `titleBgImage` | string | collapse-title.png | 标题背景图片 |
| `fontColor` | string | "rgba(255,255,255,1)" | 标题字体颜色 |
| `fontSize` | number | 16 | 标题字号 |
| `letterSpacing` | number | 4 | 标题字间距 |
| `fontWeight` | boolean | false | 标题是否加粗 |
| `fontFamily` | string | "sans-serif" | 标题字体 |
| `fontStyle` | boolean | false | 标题是否斜体 |
| `textAlign` | string | "right" | 标题文字对齐(left/center/right) |
| `textTranslateX` | number | -60 | 标题文字X偏移 |
| `textTranslateY` | number | 0 | 标题文字Y偏移 |

### 标题阴影配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `isTextShadow` | boolean | false | 标题文字阴影开关 |
| `textShadow.color` | string | "rgba(255,255,255,1)" | 阴影颜色 |
| `textShadow.x` | number | 0 | 阴影X偏移 |
| `textShadow.y` | number | 0 | 阴影Y偏移 |
| `textShadow.blur` | number | 0 | 阴影模糊度 |
| `textShadow.extend` | number | 0 | 阴影扩展 |

### 内容图片配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `imageWidth` | number | 88 | 内容图片宽度(px) |
| `imageHeight` | number | 100 | 内容图片高度(px) |
| `translateX` | number | -18 | 图片X偏移 |
| `translateY` | number | -5 | 图片Y偏移 |
| `radiusTop` | number | 0 | 圆角上 |
| `radiusRight` | number | 5 | 圆角右 |
| `radiusBottom` | number | 0 | 圆角下 |
| `radiusLeft` | number | 0 | 圆角左 |

### 内容区域配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `contentBgSize` | string | "100% 100%" | 内容背景尺寸 |
| `contentBgImage` | string | collapse-content.png | 内容背景图片 |
| `paddingTop2` | number | 12 | 内容上内边距 |
| `paddingLeft2` | number | 12 | 内容左内边距 |

### 内容文字配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fontColor2` | string | "rgba(255,255,255,1)" | 内容字体颜色 |
| `fontSize2` | number | 20 | 内容字号 |
| `letterSpacing2` | number | 0 | 内容字间距 |
| `fontWeight2` | boolean | false | 内容是否加粗 |
| `fontFamily2` | string | "sans-serif" | 内容字体 |
| `fontStyle2` | boolean | false | 内容是否斜体 |
| `lineHeight2` | number | 40 | 内容行高 |

### 内容阴影配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `isTextShadow2` | boolean | false | 内容文字阴影开关 |
| `textShadow2.color` | string | "rgba(255,255,255,1)" | 阴影颜色 |
| `textShadow2.x` | number | 0 | 阴影X偏移 |
| `textShadow2.y` | number | 0 | 阴影Y偏移 |
| `textShadow2.blur` | number | 0 | 阴影模糊度 |
| `textShadow2.extend` | number | 0 | 阴影扩展 |

### 面板系列列表 (seriesTabsList)

每个面板项定义一段折叠内容：

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | string | - | 系列名称 |
| `type` | string | - | 内容类型(image/video/text) |
| `value` | string | - | 内容值(图片URL/视频URL/文本内容) |
| `imageSize` | string | "cover" | 图片适配模式(cover/contain/fill) |
| `title` | string | - | 面板标题 |

---

## 常用配置示例

### 三面板手风琴（图文混合）
```json
{
  "type": "accordion",
  "accordionKeys": "1",
  "seriesTabsList": [
    { "name": "系列1", "type": "image", "value": "/img/photo1.jpg", "title": "产品展示" },
    { "name": "系列2", "type": "text", "value": "这里是文字描述内容", "title": "产品说明" },
    { "name": "系列3", "type": "video", "value": "/video/demo.mp4", "title": "演示视频" }
  ]
}
```

### 自定义标题样式
```json
{
  "titleHeight": 60,
  "fontSize": 18,
  "fontColor": "rgba(0,168,255,1)",
  "letterSpacing": 6,
  "titleBgImage": "version-test/assets/custom-title-bg.png"
}
```
