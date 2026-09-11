# 3D 地图组件配置说明

## 概述

这是一个基于 Three.js 的 3D 地图渲染组件，支持 GeoJSON 数据格式，可以渲染全国、省份、城市等多层级地图。组件提供了丰富的配置选项，支持颜色填充、材质贴图、鼠标交互、悬停效果等功能。

## geojsonMapInstance 类

### 类简介

`geojsonMapInstance` 是地图渲染的核心类，负责管理整个 3D 场景的创建、更新和交互。

### 主要功能

1. **地图几何体创建**：从 GeoJSON 数据创建 3D 地图模型
2. **材质管理**：支持颜色填充和纹理贴图两种填充方式
3. **光照系统**：自动配置环境光、方向光和点光源
4. **相机控制**：支持自定义相机位置和角度
5. **鼠标交互**：支持拖拽、旋转、缩放等操作
6. **悬停效果**：支持区域悬停高亮、抬升动画
7. **文字标签**：支持在地图上显示区域名称
8. **增量更新**：根据配置变化智能更新，提升性能

### 核心方法

- `updateDraw(Dom, props)`: 全量更新地图渲染
- `updateMaterials(props)`: 增量更新材质和颜色
- `updateTextLabels(textStyle)`: 增量更新文字标签
- `updateGeometry(Dom, props)`: 增量更新地图几何体
- `updateCamera(Dom, camera, beta)`: 增量更新相机
- `updateLighting(light, regionHeight)`: 增量更新光照
- `updateControls(Dom, mouseControl)`: 增量更新控制器
- `updateScene(props)`: 增量更新场景
- `updateSceneControl(sceneControl)`: 增量更新场景控制
- `dispose()`: 清理所有资源

---

## 配置项说明

### 基础配置

#### `adcode`
- **类型**: `string`
- **默认值**: `"100000"` (全国)
- **说明**: 行政区划代码，用于指定要渲染的地图区域
- **示例**: 
  - `"100000"` - 全国
  - `"110000"` - 北京市
  - `"120000"` - 天津市

---

### 填充方式配置

#### `fillType`
- **类型**: `"color" | "picture"`
- **默认值**: `"color"`
- **说明**: 地图填充方式
  - `"color"`: 使用纯色填充
  - `"picture"`: 使用纹理贴图填充
- **推荐**: 根据设计需求选择

#### `areaColor`
- **类型**: `string`
- **默认值**: `"#171a24"`
- **说明**: 区域颜色（当 `fillType` 为 `"color"` 时使用）
- **格式**: 十六进制颜色值（如 `"#171a24"`）或 CSS 颜色名称
- **推荐**: 深色系，如 `"#171a24"`, `"#1a1a2e"`, `"#0f0f1e"`

#### `activeAreaColor`
- **类型**: `string`
- **默认值**: `"#FF00FF"`
- **说明**: 悬停时的区域颜色（当 `fillType` 为 `"color"` 时使用）
- **格式**: 十六进制颜色值
- **推荐**: 亮色系，与 `areaColor` 形成对比，如 `"#FF00FF"`, `"#00FFFF"`, `"#FFFF00"`

#### `picture`
- **类型**: `string | undefined`
- **默认值**: `undefined`
- **说明**: 材质图片 URL（当 `fillType` 为 `"picture"` 时使用）
- **格式**: 图片 URL 路径
- **推荐**: 使用高质量纹理图片，建议尺寸 512x512 或更大

#### `activePicture`
- **类型**: `string | undefined`
- **默认值**: `undefined`
- **说明**: 悬停时的材质图片 URL（当 `fillType` 为 `"picture"` 时使用）
- **格式**: 图片 URL 路径
- **推荐**: 与 `picture` 使用相同或相似的纹理，但可以更亮或更饱和

---

### 边框配置

#### `borderWidth`
- **类型**: `number`
- **默认值**: `0`
- **说明**: 边界宽度（各个区块、省份、市之间的边界宽度）
- **单位**: 像素
- **推荐区间**: `0` ~ `5`
  - `0`: 无边框
  - `1` ~ `2`: 细边框，适合大多数场景
  - `3` ~ `5`: 粗边框，适合强调边界

#### `borderColor`
- **类型**: `string`
- **默认值**: `"#ffffff"`
- **说明**: 边界颜色
- **格式**: 十六进制颜色值
- **推荐**: 与背景形成对比的颜色，如 `"#ffffff"`, `"#cccccc"`, `"#ff0000"`

#### `activeBorderColor`
- **类型**: `string`
- **默认值**: `"#ffffff"`
- **说明**: 悬停时的边界颜色
- **格式**: 十六进制颜色值
- **推荐**: 亮色系，如 `"#ffffff"`, `"#ffff00"`, `"#00ffff"`

---

### 文字标签配置

#### `textStyle`
- **类型**: `TextStyle`
- **默认值**: 见下方详细说明
- **说明**: 文字标签样式配置

##### `textStyle.fontFamily`
- **类型**: `string`
- **默认值**: `"Arial"`
- **说明**: 字体家族
- **推荐**: `"Arial"`, `"Microsoft YaHei"`, `"SimHei"`, `"PingFang SC"`

##### `textStyle.fontSize`
- **类型**: `number`
- **默认值**: `20` (实际渲染时会乘以 2，即 40px)
- **说明**: 字体大小（像素）
- **推荐区间**: `12` ~ `48`
  - `12` ~ `16`: 小字体，适合城市级别
  - `18` ~ `24`: 中等字体，适合省份级别
  - `28` ~ `48`: 大字体，适合强调显示

##### `textStyle.color`
- **类型**: `string`
- **默认值**: `"rgba(255, 255, 255, 1)"`
- **说明**: 文字颜色
- **格式**: CSS 颜色值（支持 rgba）
- **推荐**: 与背景形成对比的颜色，如 `"rgba(255, 255, 255, 1)"`, `"rgba(255, 255, 0, 1)"`

##### `textStyle.fontStyle`
- **类型**: `"normal" | "italic" | "oblique"`
- **默认值**: `"normal"`
- **说明**: 字体样式

##### `textStyle.fontWeight`
- **类型**: `"normal" | "bold" | "bolder" | "lighter" | number`
- **默认值**: `"normal"`
- **说明**: 字体粗细
- **推荐**: `"normal"` 或 `"bold"`

---

### 场景控制配置 (`sceneControl`)

#### `sceneControl.regionHeight`
- **类型**: `number | undefined`
- **默认值**: `undefined` (自动计算为地图尺寸的 1%)
- **说明**: 地图厚度（3D 抬升高度）
- **单位**: 
  - 如果值 `< 1`：表示地图尺寸的百分比（如 `0.01` 表示 1%）
  - 如果值 `>= 1`：表示绝对高度值
- **推荐区间**: `0.005` ~ `0.05` (即 0.5% ~ 5%)
  - `0.005` ~ `0.01`: 薄地图，适合精细展示
  - `0.01` ~ `0.02`: 中等厚度，适合大多数场景
  - `0.02` ~ `0.05`: 厚地图，适合强调立体感

#### `sceneControl.autoRotate`
- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 是否自动旋转地图
- **推荐**: 
  - `false`: 大多数场景
  - `true`: 展示场景，需要动态效果时

#### `sceneControl.rotateSpeed`
- **类型**: `number`
- **默认值**: `0.01`
- **说明**: 自动旋转速度（当 `autoRotate` 为 `true` 时，单位：弧度/帧）
- **推荐区间**: `0.005` ~ `0.02`
  - `0.005` ~ `0.01`: 慢速旋转
  - `0.01` ~ `0.015`: 中速旋转（推荐）
  - `0.015` ~ `0.02`: 快速旋转

#### `sceneControl.rotateDirection`
- **类型**: `number`
- **默认值**: `1`
- **说明**: 旋转方向
  - `1`: 顺时针
  - `-1`: 逆时针

#### `sceneControl.initialRotationAngle`
- **类型**: `number`
- **默认值**: `0`
- **说明**: 地图初始旋转角度（绕 Y 轴）
- **单位**: 度
- **范围**: `-360` ~ `360`
- **推荐**: `0`（正面显示）

#### `sceneControl.mapRotationAngle`
- **类型**: `number`
- **默认值**: `0`
- **说明**: 地图 Z 轴旋转角度，用于调整地图的朝向
- **单位**: 度
- **范围**: `-360` ~ `360`
- **推荐**: `0` ~ `360`，根据实际需求调整地图方向

---

### 相机配置 (`camera`)

#### `camera.distance`
- **类型**: `number`
- **默认值**: `30 * 0.05 = 1.5` (内部值)
- **说明**: 相机距离（外部配置值会乘以 0.05）
- **单位**: 相对单位（基于地图尺寸）
- **推荐区间**: `20` ~ `100` (外部配置值)
  - `20` ~ `40`: 近距离，适合查看细节
  - `40` ~ `60`: 中距离，适合大多数场景（推荐）
  - `60` ~ `100`: 远距离，适合查看全貌

#### `camera.verticalTiltAngle`
- **类型**: `number`
- **默认值**: `-20` (内部值，外部配置会乘以 -1)
- **说明**: 垂直倾斜角（俯仰角）
- **单位**: 度
- **范围**: `-360` ~ `360`
- **说明**: 
  - `0`: 水平视角
  - `-20` ~ `-30`: 轻微俯视（推荐）
  - `-45` ~ `-60`: 明显俯视
  - `90`: 垂直向下

#### `camera.horizontalRotationAngle`
- **类型**: `number`
- **默认值**: `0`
- **说明**: 水平旋转角（方位角）
- **单位**: 度
- **范围**: `-360` ~ `360`
- **说明**: 
  - `0`: 正前方（推荐）
  - `90`: 右侧
  - `180`: 正后方
  - `-90`: 左侧

---

### 光照配置 (`light`)

#### `light.ambientIntensity`
- **类型**: `number | undefined`
- **默认值**: `2.0` (在 geojsonMapInstance 中设置)
- **说明**: 环境光强度
- **推荐区间**: `1.0` ~ `3.0`
  - `1.0` ~ `1.5`: 较暗，适合深色场景
  - `1.5` ~ `2.5`: 中等亮度（推荐）
  - `2.5` ~ `3.0`: 较亮，适合材质贴图

#### `light.ambientColor`
- **类型**: `string | number | undefined`
- **默认值**: `#fff8e1` (太阳光色值，在 geojsonMapInstance 中设置)
- **说明**: 环境光颜色
- **格式**: 十六进制颜色值（如 `"#fff8e1"`）或数字（如 `0xfff8e1`）
- **推荐**: 
  - `#fff8e1`: 太阳光色值（暖白色，推荐）
  - `#ffffff`: 纯白色
  - `#e8f4f8`: 冷白色

#### `light.directionalIntensity`
- **类型**: `number | undefined`
- **默认值**: `3.0` (在 geojsonMapInstance 中设置)
- **说明**: 方向光强度
- **推荐区间**: `2.0` ~ `4.0`
  - `2.0` ~ `2.5`: 较暗
  - `2.5` ~ `3.5`: 中等亮度（推荐）
  - `3.5` ~ `4.0`: 较亮，适合材质贴图

#### `light.directionalColor`
- **类型**: `string | number | undefined`
- **默认值**: `#fff8e1` (太阳光色值，在 geojsonMapInstance 中设置)
- **说明**: 方向光颜色
- **格式**: 十六进制颜色值或数字
- **推荐**: 与 `ambientColor` 相同或相似，保持光照一致性
- **注意**: `directionalPosition` 已废弃，方向光位置会自动根据地图尺寸计算

---

### 鼠标控制配置 (`mouseControl`)

#### `mouseControl.zoomSpeed`
- **类型**: `number`
- **默认值**: `25`
- **说明**: 滚轮缩放速度
- **范围**: `0` ~ `100`
- **推荐区间**: `15` ~ `40`
  - `15` ~ `20`: 慢速缩放
  - `20` ~ `30`: 中速缩放（推荐）
  - `30` ~ `40`: 快速缩放

#### `mouseControl.panSpeed`
- **类型**: `number`
- **默认值**: `10`
- **说明**: 左键平移速度
- **范围**: `0` ~ `100`
- **推荐区间**: `5` ~ `20`
  - `5` ~ `10`: 慢速平移（推荐）
  - `10` ~ `15`: 中速平移
  - `15` ~ `20`: 快速平移

#### `mouseControl.rotateSpeed`
- **类型**: `number`
- **默认值**: `25`
- **说明**: 右键旋转速度
- **范围**: `0` ~ `100`
- **推荐区间**: `15` ~ `40`
  - `15` ~ `20`: 慢速旋转
  - `20` ~ `30`: 中速旋转（推荐）
  - `30` ~ `40`: 快速旋转

---

### 悬停抬升配置 (`hoverLift`)

#### `hoverLift.height`
- **类型**: `number`
- **默认值**: `0.01`
- **说明**: 悬停时抬升高度（相对于地图尺寸的倍数）
- **单位**: 地图尺寸的倍数（如 `0.01` 表示地图尺寸的 1%）
- **推荐区间**: `0.005` ~ `0.05`
  - `0.005` ~ `0.01`: 轻微抬升（推荐）
  - `0.01` ~ `0.02`: 中等抬升
  - `0.02` ~ `0.05`: 明显抬升

#### `hoverLift.duration`
- **类型**: `number`
- **默认值**: `300`
- **说明**: 抬升动画时长
- **单位**: 毫秒
- **推荐区间**: `200` ~ `500`
  - `200` ~ `300`: 快速动画（推荐）
  - `300` ~ `400`: 中等速度
  - `400` ~ `500`: 慢速动画

---

### 场景配置

#### `backgroundColor`
- **类型**: `string | number`
- **默认值**: `0x000000` (黑色)
- **说明**: 场景背景颜色
- **格式**: 十六进制颜色值（如 `"#000000"`）或数字（如 `0x000000`）
- **推荐**: 
  - `0x000000`: 黑色（推荐，适合大多数场景）
  - `0x1a1a2e`: 深蓝色
  - `0x0f0f1e`: 深紫色

#### `fog`
- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 是否启用雾效
- **推荐**: 
  - `false`: 大多数场景
  - `true`: 需要深度感时

#### `fogColor`
- **类型**: `string | number`
- **默认值**: `0x000000` (黑色)
- **说明**: 雾效颜色（当 `fog` 为 `true` 时生效）
- **格式**: 十六进制颜色值或数字
- **推荐**: 与 `backgroundColor` 相同或相似

---

## 配置示例

### 基础配置示例

```typescript
{
  adcode: "100000", // 全国地图
  fillType: "color",
  areaColor: "#171a24",
  activeAreaColor: "#FF00FF",
  borderWidth: 1,
  borderColor: "#ffffff",
  activeBorderColor: "#ffff00"
}
```

### 材质贴图配置示例

```typescript
{
  adcode: "100000",
  fillType: "picture",
  picture: "https://example.com/texture.jpg",
  activePicture: "https://example.com/texture-bright.jpg",
  borderWidth: 1,
  borderColor: "#ffffff"
}
```

### 完整配置示例

```typescript
{
  adcode: "100000",
  fillType: "color",
  areaColor: "#171a24",
  activeAreaColor: "#FF00FF",
  borderWidth: 1,
  borderColor: "#ffffff",
  activeBorderColor: "#ffff00",
  textStyle: {
    fontFamily: "Arial",
    fontSize: 20,
    color: "rgba(255, 255, 255, 1)",
    fontStyle: "normal",
    fontWeight: "normal"
  },
  sceneControl: {
    regionHeight: 0.01, // 地图尺寸的 1%
    autoRotate: false,
    rotateSpeed: 0.01,
    initialRotationAngle: 0,
    mapRotationAngle: 0
  },
  camera: {
    distance: 50, // 外部值，内部会乘以 0.05
    verticalTiltAngle: 20, // 外部值，内部会乘以 -1
    horizontalRotationAngle: 0
  },
  light: {
    ambientIntensity: 2.0,
    ambientColor: "#fff8e1", // 太阳光色值
    directionalIntensity: 3.0,
    directionalColor: "#fff8e1" // 太阳光色值
  },
  mouseControl: {
    zoomSpeed: 25,
    panSpeed: 10,
    rotateSpeed: 25
  },
  hoverLift: {
    height: 0.01,
    duration: 300
  },
  backgroundColor: 0x000000,
  fog: false,
  fogColor: 0x000000
}
```

---

## 性能优化

### 增量更新机制

组件实现了智能的增量更新机制，根据配置变化自动选择更新策略：

1. **材质更新** (`materials`): 当颜色、贴图、边框等材质相关配置变化时
2. **文字更新** (`textStyle`): 当文字样式配置变化时
3. **几何体更新** (`geometry`): 当地图区域代码或厚度变化时（需要全量更新）
4. **相机更新** (`camera`): 当相机配置变化时
5. **光照更新** (`lighting`): 当光照配置变化时
6. **控制器更新** (`controls`): 当鼠标控制速度变化时
7. **场景更新** (`scene`): 当背景色或雾效变化时（需要全量更新）
8. **场景控制更新** (`sceneControl`): 当旋转相关配置变化时

### 更新优先级

更新策略按优先级执行（数字越小优先级越高）：
1. materials (优先级 1)
2. textStyle (优先级 2)
3. geometry (优先级 3)
4. camera (优先级 4)
5. lighting (优先级 5)
6. controls (优先级 6)
7. scene (优先级 7)
8. sceneControl (优先级 8)

---

## 注意事项

1. **材质贴图**: 当 `fillType` 为 `"picture"` 时，确保 `picture` 和 `activePicture` URL 可访问
2. **光照强度**: 材质贴图需要更强的光照，建议 `ambientIntensity >= 2.0`，`directionalIntensity >= 3.0`
3. **地图厚度**: `regionHeight` 值过大会导致地图过厚，建议使用 `0.005` ~ `0.05` 范围
4. **相机距离**: 距离过近可能导致地图超出视野，距离过远可能导致地图过小
5. **文字标签**: 文字标签默认隐藏，鼠标悬停时显示
6. **方向光位置**: 方向光位置会自动根据地图尺寸计算，无需手动配置
7. **增量更新**: 多个关键配置同时变化时，会自动触发全量更新以确保正确性

---

## 技术栈

- **Three.js**: 3D 渲染引擎
- **Vue 3**: 前端框架
- **TypeScript**: 类型支持
- **GeoJSON**: 地理数据格式
- **Proj4**: 坐标投影转换

---

## 更新日志

### 最新更新
- ✅ 实现增量更新机制，提升性能
- ✅ 添加材质贴图支持
- ✅ 添加悬停抬升动画
- ✅ 自动计算方向光位置
- ✅ 支持太阳光色值作为默认光照颜色
- ✅ 优化材质贴图亮度显示

