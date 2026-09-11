# ft-open-video (开场视频) 配置说明

## dataChart 数据格式

```typescript
interface OpenVideoDataItem {
  cover: string;  // 视频封面
  value: string;  // 视频地址
}

type dataChart = OpenVideoDataItem[];
```

**示例**：
```json
[
  { "cover": "version-test/assets/cover.png", "value": "version-test/assets/video.mp4" }
]
```

---

## option 完整字段参考

总计 **68** 个配置字段。

### 基础视频配置 (12字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `cover` | string | "" | 视频封面路径 |
| `url` | string | - | 视频地址 |
| `openDelayLoading` | boolean | false | 是否开启延迟加载 |
| `delayLoadingTime` | number | 2 | 延迟加载时间（秒） |
| `delayPlayTime` | number | 0 | 延迟播放时间 |
| `pointerEvents` | boolean | false | 是否启用指针事件 |
| `mixBlendMode` | string | "normal" | 混合模式 |
| `controler` | boolean | false | 是否显示控制器 |
| `isBuildPlay` | boolean | true | 是否构建播放 |
| `autoPlay` | boolean | true | 是否自动播放 |
| `loopPlay` | boolean | false | 是否循环播放 |
| `muted` | boolean | true | 是否静音 |
| `autoHidden` | boolean | true | 是否自动隐藏 |

### 旋转配置 (4字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `rotateShow` | boolean | false | 是否启用旋转 |
| `rotateX` | number | 0 | X轴旋转角度 |
| `rotateY` | number | 0 | Y轴旋转角度 |
| `rotateZ` | number | 0 | Z轴旋转角度 |

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

### 按钮配置 (22字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `buttonType` | string | "text" | 按钮类型（text/image） |
| `buttonContent` | string | "进入系统" | 按钮文字内容 |
| `buttonWidth` | number | 145 | 按钮宽度 |
| `buttonHeight` | number | 40 | 按钮高度 |
| `buttonTranslateX` | number | 0 | 按钮X偏移 |
| `buttonTranslateY` | number | 0 | 按钮Y偏移 |
| `buttonImageType` | string | "100% 100%" | 按钮背景图适配方式 |
| `buttonImage` | string | - | 按钮背景图片路径 |
| `buttonIconType` | string | "100% 100%" | 按钮图标适配方式 |
| `buttonIcon` | string | - | 按钮图标路径 |
| `buttonIconWidth` | number | 104 | 按钮图标宽度 |
| `buttonIconHeight` | number | 20 | 按钮图标高度 |
| `buttonFontSize` | number | 16 | 按钮字号 |
| `buttonFontWeight` | boolean | false | 按钮文字是否加粗 |
| `buttonFontStyle` | boolean | false | 按钮文字是否斜体 |
| `buttonFontFamily` | string | "sans-serif" | 按钮字体 |
| `buttonFontColor` | string | "rgba(255,255,255,1)" | 按钮文字颜色 |
| `buttonLetterSpacing` | number | 2 | 按钮文字字间距 |
| `buttonTextTranslateX` | number | 0 | 按钮文字X偏移 |
| `buttonTextTranslateY` | number | 0 | 按钮文字Y偏移 |
| `isButtonTextShadow` | boolean | false | 是否启用按钮文字阴影 |
| `buttonTextShadow` | object | - | 按钮文字阴影配置（见下表） |

#### 按钮文字阴影配置 (buttonTextShadow，5字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `x` | number | 0 | 阴影X偏移 |
| `y` | number | 0 | 阴影Y偏移 |
| `blur` | number | 0 | 阴影模糊度 |
| `color` | string | "rgba(255,255,255,1)" | 阴影颜色 |
| `extend` | number | 0 | 阴影扩展 |

---

## 常用配置示例

### 基础开场视频
```json
{
  "cover": "",
  "url": "version-test/assets/openingVideo.mp4",
  "autoPlay": true,
  "loopPlay": false,
  "muted": true,
  "autoHidden": true,
  "controler": false
}
```

### 带按钮的开场视频
```json
{
  "url": "version-test/assets/openingVideo.mp4",
  "buttonType": "text",
  "buttonContent": "进入系统",
  "buttonWidth": 200,
  "buttonHeight": 50,
  "buttonFontSize": 18,
  "buttonFontColor": "rgba(255,255,255,1)",
  "buttonLetterSpacing": 4,
  "buttonTranslateY": 50
}
```

### 视频滤镜效果
```json
{
  "gaussianBlurShow": true,
  "gaussianBlur": 3,
  "brightnessShow": true,
  "brightness": 120,
  "saturateShow": true,
  "saturate": 130
}
```
