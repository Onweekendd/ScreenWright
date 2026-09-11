# 360全景容器v1 (photo-sphere-viewer)

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| value | string | 全景图片路径 |

## option 字段说明

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| muted | boolean | true | 是否静音 |
| initLoad | boolean | false | 是否初始化加载 |
| cover | string | "" | 封面图片路径 |
| minFov | number | 30 | 最小视场角 |
| maxFov | number | 90 | 最大视场角 |
| defaultZoomLvl | number | 50 | 默认缩放级别 |
| fisheye | boolean | false | 是否启用鱼眼效果 |
| defaultYaw | number | 0 | 默认水平偏转角 |
| defaultPitch | number | 0 | 默认垂直俯仰角 |
| loadingImg | string | (默认图片) | 加载中图片路径 |
| loadingTxt | string | "" | 加载中提示文字 |
| mousewheel | boolean | true | 是否启用鼠标滚轮缩放 |
| mousemove | boolean | true | 是否启用鼠标拖拽旋转 |
| keyboard | string | "fullscreen" | 键盘控制模式 |
| mousewheelCtrlKey | boolean | false | 鼠标滚轮是否需要Ctrl键 |
| touchmoveTwoFingers | boolean | false | 是否需要双指触摸旋转 |
| sphereCorrection.pan | number | 0 | 水平校正角度 |
| sphereCorrection.tilt | number | 0 | 倾斜校正角度 |
| sphereCorrection.roll | number | 0 | 滚动校正角度 |
| moveSpeed | number | 1 | 移动速度 |
| zoomSpeed | number | 1 | 缩放速度 |
| moveInertia | number | 0.8 | 移动惯性系数 |
| withCredentials | boolean | false | 是否携带凭证 |
| canvasBackground | string | "transparent" | 画布背景色 |
| rendererParameters.alpha | boolean | true | 是否启用透明 |
| rendererParameters.antialias | boolean | true | 是否启用抗锯齿 |
| showNavbar | boolean | true | 是否显示导航栏 |
| navbarList | string[] | ["zoom","gallery","autorotate","caption","fullscreen"] | 导航栏按钮列表 |
| autostart | boolean | true | 是否自动开始自动旋转 |
| autostartDelay | number | 1000 | 自动旋转延迟(毫秒) |
| autostartOnIdle | boolean | false | 空闲时是否自动旋转 |
| autorotateSpeed | number | 2 | 自动旋转速度 |
| autorotatePitch | number | 0 | 自动旋转俯仰角 |
| showMarkers | boolean | true | 是否显示标记点 |
| showGallery | boolean | true | 是否显示图库 |
| visibleOnLoad | boolean | false | 加载时是否可见 |
| thumbnailSize.width | number | 50 | 缩略图宽度 |
| thumbnailSize.height | number | 50 | 缩略图高度 |
| galleryItems | array | [...] | 图库图片列表(id/name/panorama/thumbnail/caption/markers) |
