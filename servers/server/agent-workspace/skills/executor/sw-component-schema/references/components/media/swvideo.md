# 视频 (swvideo) 配置说明

## dataChart 数据格式

```typescript
interface FtvideoDataItem {
  cover: string;  // 视频封面
  value: string;  // 视频地址
}

type dataChart = FtvideoDataItem[];
```

**示例**：
```json
[
  { "cover": "", "value": "version-test/assets/defaultImg/video.mp4" }
]
```

---

## option 完整字段参考

基于配置文件：swvideoGlobal.vue

### 基础配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `cover` | string | "" | 视频封面地址 |
| `url` | string | "version-test/assets/defaultImg/video.mp4" | 视频地址 |
| `delayPlayTime` | number | 0 | 延迟播放时间(毫秒) |
| `pointerEvents` | boolean | false | 是否响应鼠标事件 |
| `mixBlendMode` | string | "normal" | 混合模式(normal/multiply/screen等) |
| `isBuildPlay` | boolean | true | 是否构建后播放 |
| `opacity` | number | 1 | 透明度(0-1) |

### 播放控制

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `controler` | boolean | false | 是否显示播放控件 |
| `autoPlay` | boolean | true | 是否自动播放 |
| `loopPlay` | boolean | true | 是否循环播放 |
| `muted` | boolean | true | 是否静音 |
| `autoHiden` | boolean | false | 是否自动隐藏控件 |
| `playbackRate` | number | 1 | 播放速率 |

### 旋转配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `rotateShow` | boolean | false | 旋转效果开关 |
| `rotateX` | number | 0 | X轴旋转角度 |
| `rotateY` | number | 0 | Y轴旋转角度 |
| `rotateZ` | number | 0 | Z轴旋转角度 |

### 滤镜效果

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `gaussianBlurShow` | boolean | false | 高斯模糊开关 |
| `gaussianBlur` | number | 5 | 高斯模糊程度 |
| `brightnessShow` | boolean | false | 亮度调整开关 |
| `brightness` | number | 100 | 亮度值 |
| `contrastShow` | boolean | false | 对比度调整开关 |
| `contrast` | number | 100 | 对比度值 |
| `grayscaleShow` | boolean | false | 灰度调整开关 |
| `grayscale` | number | 50 | 灰度值 |
| `hueShow` | boolean | false | 色相调整开关 |
| `hue` | number | 180 | 色相值 |
| `invertShow` | boolean | false | 反色调整开关 |
| `invert` | number | 50 | 反色值 |
| `saturateShow` | boolean | false | 饱和度调整开关 |
| `saturate` | number | 100 | 饱和度值 |
| `sepiaShow` | boolean | false | 褐色调整开关 |
| `sepia` | number | 50 | 褐色值 |

### 阴影配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `shadowShow` | boolean | false | 阴影开关 |
| `shadowColor` | string | "rgba(255, 255, 255, 1)" | 阴影颜色 |
| `shadowX` | number | 0 | 阴影X偏移 |
| `shadowY` | number | 0 | 阴影Y偏移 |
| `shadowFuzzy` | number | 8 | 阴影模糊度 |
| `shadowExtension` | number | 0 | 阴影扩展 |

### 背景滤镜

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `backdropFilter` | boolean | false | 背景滤镜开关 |
| `backdropFilterBlur` | number | 4 | 背景模糊程度 |
| `backdropFilterSaturate` | number | 100 | 背景饱和度 |

---

## 常用配置示例

### 自动播放循环视频
```json
{
  "url": "video.mp4",
  "autoPlay": true,
  "loopPlay": true,
  "muted": true,
  "controler": false,
  "opacity": 1
}
```

### 带滤镜效果的视频
```json
{
  "url": "video.mp4",
  "brightnessShow": true,
  "brightness": 120,
  "contrastShow": true,
  "contrast": 110,
  "gaussianBlurShow": true,
  "gaussianBlur": 3
}
```
