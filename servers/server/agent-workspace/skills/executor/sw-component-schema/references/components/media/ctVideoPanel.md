# ctVideoPanel (视频面板) 配置说明

## dataChart 数据格式

```typescript
interface VideoPanelDataItem {
  name: string;  // 视频标签
  url: string;   // 视频地址
}

type dataChart = VideoPanelDataItem[];
```

**示例**：
```json
[
  { "name": "video1", "url": "version-test/assets/defaultImg/video.mp4" },
  { "name": "video2", "url": "version-test/assets/defaultImg/video.mp4" },
  { "name": "video3", "url": "version-test/assets/defaultImg/video.mp4" }
]
```

---

## option 完整字段参考

总计 **96** 个配置字段，是媒体组件中字段最多的组件。

### 基础视频配置 (7字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `mixBlendMode` | string | "normal" | 混合模式 |
| `controler` | boolean | false | 是否显示控制器 |
| `autoPlay` | boolean | true | 是否自动播放 |
| `hkVideoPlayerMode` | number | 0 | 海康视频播放模式 |
| `loopPlay` | boolean | true | 是否循环播放 |
| `muted` | boolean | true | 是否静音 |
| `autoHidden` | boolean | false | 是否自动隐藏 |

### 滤镜配置 (16字段，8对开关+值)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `gaussianBlurShow` | boolean | false | 是否启用高斯模糊 |
| `gaussianBlur` | number | 5 | 高斯模糊值 |
| `brightnessShow` | boolean | false | 是否启用亮度调节 |
| `brightness` | number | 100 | 亮度值 |
| `contrastShow` | boolean | false | 是否启用对比度调节 |
| `contrast` | number | 100 | 对比度值 |
| `grayscaleShow` | boolean | false | 是否启用灰度 |
| `grayscale` | number | 50 | 灰度值 |
| `hueShow` | boolean | false | 是否启用色调调节 |
| `hue` | number | 180 | 色调值 |
| `invertShow` | boolean | false | 是否启用反色 |
| `invert` | number | 50 | 反色值 |
| `saturateShow` | boolean | false | 是否启用饱和度调节 |
| `saturate` | number | 100 | 饱和度值 |
| `sepiaShow` | boolean | false | 是否启用褐色调节 |
| `sepia` | number | 50 | 褐色值 |

### 阴影配置 (6字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `shadowShow` | boolean | false | 是否显示阴影 |
| `shadowColor` | string | "rgba(255,255,255,1)" | 阴影颜色 |
| `shadowX` | number | 0 | 阴影X偏移 |
| `shadowY` | number | 0 | 阴影Y偏移 |
| `shadowFuzzy` | number | 8 | 阴影模糊度 |
| `shadowExtension` | number | 0 | 阴影扩展 |

### 视频图标配置 (4字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showVideoBg` | boolean | true | 是否显示视频背景 |
| `showVideoIcon` | boolean | true | 是否显示视频图标 |
| `videoBg` | string | - | 视频背景图路径 |
| `videoIcon` | string | - | 视频图标路径 |

### 网格布局配置 (4字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `rows` | number | 3 | 行数 |
| `columns` | number | 1 | 列数 |
| `rowGap` | number | 0 | 行间距 |
| `columnGap` | number | 5 | 列间距 |

### 分页配置 (5字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showPage` | boolean | true | 是否显示分页 |
| `pageIcon` | string | - | 分页图标路径 |
| `pagerTime` | number | 10 | 分页切换时间（秒） |
| `autoPager` | boolean | false | 是否自动翻页 |
| `pagerAni` | string | "fading-ease-in" | 翻页动画类型 |

### 视频项文字配置 (20字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `textTranslateX` | number | 0 | 文字X偏移 |
| `textTranslateY` | number | 0 | 文字Y偏移 |
| `backgroundColor` | string | "rgba(15,22,34,0.6)" | 背景颜色 |
| `backgroundImage` | string | "" | 背景图片路径 |
| `backgroundImageType` | string | "100% 100%" | 背景图片适配方式 |
| `backgroundType` | string | "color" | 背景类型 |
| `titleBgType` | string | "color" | 标题背景类型 |
| `titleBgColor` | string | "rgba(15,22,34,0.6)" | 标题背景颜色 |
| `titleBgImage` | string | "" | 标题背景图片路径 |
| `titleBgImageType` | string | "100% 100%" | 标题背景图片适配方式 |
| `fontSize` | number | 20 | 字号 |
| `fontWeight` | boolean | false | 是否加粗 |
| `fontStyle` | boolean | false | 是否斜体 |
| `fontFamily` | string | "sans-serif" | 字体 |
| `fontColor` | string | "rgba(255,255,255,1)" | 文字颜色 |
| `isTextShadow` | boolean | false | 是否显示文字阴影 |
| `textShadow` | object | - | 文字阴影配置（见下表） |
| `textPosition` | string | "top" | 文字位置 |
| `textAlign` | string | "left" | 文字对齐 |

#### 文字阴影配置 (textShadow，5字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `x` | number | 0 | 阴影X偏移 |
| `y` | number | 0 | 阴影Y偏移 |
| `blur` | number | 0 | 阴影模糊度 |
| `color` | string | "rgba(255,255,255,1)" | 阴影颜色 |
| `extend` | number | 0 | 阴影扩展 |

### 图标与内边距 (3字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `iconWidth` | number | 60 | 图标宽度 |
| `iconHeight` | number | 50 | 图标高度 |
| `padding` | number[] | [0,0,0,0] | 内边距 [上, 右, 下, 左] |

### 视频适配与边框配置 (5字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `objectFit` | string | "cover" | 视频适配方式 |
| `borderBgImage` | string | - | 边框背景图路径 |
| `borderBgSize` | string | "100% 100%" | 边框背景图大小 |
| `videoBoxWidth` | number | 98 | 视频框宽度（百分比） |
| `videoBoxHeight` | number | 98 | 视频框高度（百分比） |

### 分页器样式配置 (15字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `pagerIconWidth` | number | 44 | 分页图标宽度 |
| `pagerIconHeight` | number | 24 | 分页图标高度 |
| `pagerHeight` | number | 40 | 分页器高度 |
| `pagerfontSize` | number | 20 | 分页器字号（未选中） |
| `pagerfontWeight` | boolean | false | 分页器是否加粗（未选中） |
| `pagerfontStyle` | boolean | false | 分页器是否斜体（未选中） |
| `pagerfontFamily` | string | "sans-serif" | 分页器字体（未选中） |
| `pagerfontColor` | string | "rgba(255,255,255,1)" | 分页器颜色（未选中） |
| `pagerletterSpacing` | number | 0 | 分页器字间距（未选中） |
| `pagerfontSize2` | number | 16 | 分页器字号（选中） |
| `pagerfontWeight2` | boolean | false | 分页器是否加粗（选中） |
| `pagerfontStyle2` | boolean | false | 分页器是否斜体（选中） |
| `pagerfontFamily2` | string | "sans-serif" | 分页器字体（选中） |
| `pagerfontColor2` | string | "rgba(37,255,251,1)" | 分页器颜色（选中） |
| `pagerletterSpacing2` | number | 0 | 分页器字间距（选中） |

---

## 常用配置示例

### 3x1 视频监控布局
```json
{
  "rows": 3,
  "columns": 1,
  "rowGap": 0,
  "columnGap": 5,
  "autoPlay": true,
  "loopPlay": true,
  "muted": true,
  "controler": false
}
```

### 2x2 网格带分页
```json
{
  "rows": 2,
  "columns": 2,
  "showPage": true,
  "autoPager": true,
  "pagerTime": 10,
  "pagerAni": "fading-ease-in"
}
```

### 自定义视频项样式
```json
{
  "backgroundColor": "rgba(15,22,34,0.8)",
  "backgroundType": "color",
  "fontSize": 18,
  "fontColor": "rgba(255,255,255,1)",
  "textPosition": "top",
  "textAlign": "left",
  "objectFit": "cover",
  "borderBgImage": "version-test/assets/defaultImg/video-border.png"
}
```
