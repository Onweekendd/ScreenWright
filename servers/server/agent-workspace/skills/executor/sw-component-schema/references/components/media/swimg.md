# 图片 (swimg) 配置说明

## dataChart 数据格式

```typescript
interface FtimgDataItem {
  value: string;  // 图片地址
}

type dataChart = FtimgDataItem[];
```

**示例**：
```json
[
  { "value": "version-test/assets/defaultImg/default.png" }
]
```

---

## option 完整字段参考

基于配置文件：swimgGlobal.vue

### 基础配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `cover` | string | "" | 图片封面地址 |
| `url` | string | "version-test/assets/defaultImg/default.png" | 图片地址 |
| `duration` | string | "1000" | 过渡动画时长(毫秒) |
| `pointerEvents` | boolean | false | 是否响应鼠标事件 |
| `opacity` | number | 1 | 透明度(0-1) |
| `mixBlendMode` | string | "normal" | 混合模式(normal/multiply/screen等) |

### 旋转配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `rotateShow` | boolean | false | 旋转效果开关 |
| `rotateX` | number | 0 | X轴旋转角度 |
| `rotateY` | number | 0 | Y轴旋转角度 |
| `rotateZ` | number | 0 | Z轴旋转角度 |

### 动画配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `animationShow` | boolean | false | 动画开关 |
| `animationLoop` | boolean | true | 是否循环动画 |
| `animationSpeed` | `"constant" \| "slow-fast-slow" \| "start-slow" \| "end-slow"` | "constant" | 动画速度模式（匀速/慢快慢/低速开始/低速结束） |
| `animationSpeedNum` | number | 1 | 动画速度数值 |
| `animationTime` | number | 3 | 动画时长(秒) |
| `animationDelayed` | number | 0 | 动画延迟(秒) |
| `animationInterval` | number | 0 | 动画间隔(秒) |
| `animationType` | `"default" \| "opacity" \| "zoom" \| "clockwise" \| "counterclockwise" \| "backAndForth" \| "upOrDown" \| "customize"` | "opacity" | 动画类型（默认/透明度/缩放/顺时针旋转/逆时针旋转/回旋转/上下平移/自定义） |

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

### 图片预览

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `openReview` | boolean | false | 是否开启图片预览 |
| `reviewImageWidth` | number | 50 | 预览图片宽度 |

### 背景滤镜

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `backdropFilter` | boolean | false | 背景滤镜开关 |
| `backdropFilterBlur` | number | 4 | 背景模糊程度 |
| `backdropFilterSaturate` | number | 100 | 背景饱和度 |

---

## 常用配置示例

### 基础图片展示
```json
{
  "url": "image.png",
  "opacity": 1,
  "pointerEvents": false,
  "mixBlendMode": "normal"
}
```

### 带入场动画的图片
```json
{
  "url": "logo.png",
  "animationShow": true,
  "animationLoop": true,
  "animationType": "opacity",
  "animationTime": 3,
  "animationDelayed": 0,
  "animationSpeed": "constant",
  "animationSpeedNum": 1
}
```

### 带滤镜效果的图片
```json
{
  "url": "photo.png",
  "brightnessShow": true,
  "brightness": 120,
  "contrastShow": true,
  "contrast": 110,
  "shadowShow": true,
  "shadowColor": "rgba(0,0,0,0.5)",
  "shadowX": 2,
  "shadowY": 2,
  "shadowFuzzy": 10
}
```
