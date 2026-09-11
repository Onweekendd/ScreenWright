## CurvedTrackList 弧形轨道组件说明

该目录下提供一个基于 Three.js 的 **单条弧形图片轨道组件**，轨道整体居中在画布中，可通过 props 灵活配置弧形形状及交互。

### 组件列表

- `index.vue`：对外暴露的包装组件，负责透传配置。
- `threeContent.vue`：内部 Three.js 实现，真正负责渲染弧形轨道。

### 可用配置（props）

以下 props 同时在 `index.vue` 和 `threeContent.vue` 中定义，外部只需要使用 `CurvedTrackList`（即 `index.vue`）即可。

- **images?: string[]**
  - 图片 URL 列表。
  - 不传时使用内部默认的 `IMAGE_LIST`。

- **imageSize?: [number, number]**
  - 单个图片在 Three.js 世界坐标中的尺寸，格式为 `[width, height]`。
  - 默认值：`[1.8, 0.6]`。

- **gap?: number**
  - 相邻图片沿轨道方向的间距。
  - 默认值：`0.1`。

- **curveDirection?: 1 | -1**
  - 弧形方向：
    - `1`：轨道向相机“外凸”（默认）。
    - `-1`：轨道向相机“内凹”。

- **curveStrength?: number**
  - 弧形弧度强度，绝对值越大弯曲越明显。
  - 默认值：`1.2`。
  - 实际生效值为 `curveStrength * curveDirection`。

- **curveFrequency?: number**
  - 弧形频率，控制弯曲曲线的“周期感”。
  - 默认值：`0.3`。

- **wheelDirection?: 1 | -1**
  - 滚轮方向：
    - `1`：鼠标向下滚动，图片向下移动。
    - `-1`：鼠标向下滚动，图片向上移动（默认）。

- **wheelFactor?: number**
  - 滚轮速度系数，影响一次滚动产生的滚动速度大小。
  - 默认值：`0.5`。

### 使用示例

```vue
<template>
  <CurvedTrackList
    :images="imageUrls"
    :image-size="[2.0, 0.8]"
    :gap="0.2"
    :curve-direction="-1"
    :curve-strength="1.5"
    :curve-frequency="0.4"
    :wheel-direction="-1"
    :wheel-factor="0.6"
  />
</template>

<script setup lang="ts">
import CurvedTrackList from "./CurvedTrackList/index.vue";

const imageUrls = [
  "/assets/img1.png",
  "/assets/img2.png",
  "/assets/img3.png"
];
</script>
```

> 注意：组件会自动根据外层容器大小调整画布尺寸，确保整条弧形轨道始终居中显示在当前画布中。


