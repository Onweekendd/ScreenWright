# 机制原理与引擎对比

> **本文档回答：** 截图为什么这样设计？sanitize / 数据层 / 分层合成是什么意思？html2canvas 和 snapdom 怎么选？

[← 返回索引](../README.md) · 流程见 [调用链](./02-flow-and-strategies.md) · 参数见 [API 参考](./03-api-reference.md)

---

## 设计目标

Screenwright 大屏包含 **video、UE 流送、ECharts、面板多 status、3D 组件、跨域 minio 图** 等 html2canvas 无法一次搞定的内容。本方案采用：

1. **分层合成** — 各模块独立采集为 `CaptureLayer`，按 `zIndex` + `designRect` 贴回
2. **数据层优先** — video/面板坐标来自 `componentList`，不依赖 DOM scale 换算
3. **sanitize 流水线** — 截图前统一 patch media，截图后 restore
4. **策略链** — 新增组件类型通过 Factory 扩展，避免 monolith 膨胀

---

## 分层合成模型

```
┌─────────────────────────────────────────────┐
│  ScreenCompositor.merge                     │
│  离屏 canvas ← 按 zIndex 绘制各 CaptureLayer │
└─────────────────────────────────────────────┘
         ↑              ↑              ↑
    UE/video 层    UI overlay 层   panel/group 层
    (独立帧)       (html2canvas)    (data 栅格)
```

**CaptureLayer 关键字段：**

- `designRect` — 在大屏设计稿上的位置（优先 componentList）
- `zIndex` — 来自 `ComponentTreeCapture.buildZIndexMap`
- `kind` — 决定 merge 绘制方式（ue 铺满 / ui 全屏 / 其他精确贴图）

---

## sanitize 流水线（DOM 截图的心脏）

无论 html2canvas 还是 snapdom，**真实 DOM 截图前**都走：

```
buildSnapshotsAsync     → 预抓 chart/canvas/video/img/bg
applyLiveMediaPatches   → live DOM 上替换 video 帧、img src
applyLiveVideoSanitize  → video→img（跨域兜底）
applyLiveImgSanitize    → img→dataURL（防 canvas taint）
         ↓
   html2canvas / snapdom
         ↓
onClone / afterClone 链 → scale/UE/脏层/exclude/快照/3D/文本
         ↓
finally: restore 全部 stash
```

**启发：** 引擎只负责「把 DOM 画到 canvas」；**能不能画对**取决于 sanitize + onClone 补丁。

---

## Video 为何走数据层

live `<video>` 的问题：未播放黑帧、跨域 taint、多 video 串层。

**数据层路径**（`VideoDataCapture.captureVideoDataUrl`）：

1. componentList 配置 URL → 离屏 `getVideoBase64`
2. 无 URL → cover 封面
3. 无 cover → host 上 previewImg
4. 仍失败 → 回退 DOM video

面板/组内对每个子项单独 `hideSiblings` + 数据层抓帧，在离屏 canvas 按 **panelData 坐标** 绘制。

---

## 选型启发

| 需求 | 建议 |
|------|------|
| 快速封面预览 | simple + snapdom |
| 含 video/UE/面板的正式封面 | composite + 分层 |
| 单盒固定尺寸、透明底 | snapdom（面板层） |
| 整屏 + exclude 多 host | html2canvas（overlay 成熟） |
| 纯静态 img | 数据层 drawImage，不经 DOM 引擎 |

**不要**指望换一个引擎解决 video/跨域问题 — 必须走 sanitize + 数据层。


---

## 六、策略原理

### 6.1 Video 数据层抓帧

**入口：** `VideoDataCapture.captureVideoDataUrl(options)`

```
优先级：
1. componentList 配置 URL → captureFromConfiguredUrl（getVideoBase64 离屏）
2. cover 封面图 → loadCoverDataUrl
3. host 上 .previewImg → loadPreviewImgDataUrl
4. 失败 → 回退 VideoNormal.buildLayer（DOM video）
```

**VideoKind 路由（`videoRegistry.detectVideoKind`）：**

| VideoKind | DOM 特征 | 处理 |
|-----------|----------|------|
| `OPEN_VIDEO` | `.ft-open-video` | 数据层 captureVideoDataUrl |
| `FT_VIDEO` | `.ft-video` | VideoNormal.buildLayer |
| `PIXEL_STREAM` | UE 流送 | UeStreamCapture.buildLayer |
| `PLAIN` | 普通 `<video>` | VideoNormal.buildLayer |
| `OTHER` | 其他 | captureOtherVideoLayer |

### 6.2 Panel / Group 数据层栅格

**入口：** `buildRasterFromContainerData(ctx: ContainerRasterContext)`

对每个 child（按 zIndex 排序）：
- **video 子项：** `hideSiblings` → `VideoDataCapture.captureContainerChildVideo` → drawImage
- **其他子项：** `hideSiblings` → `capturePerComponent`（单个子项 dom 层）→ drawImage

坐标来自 componentList（非 DOM getBoundingClientRect），避免 scale 偏差。

### 6.3 DomOverlay sanitize 流水线

**入口：** `runDomCaptureSanitizePipeline(options)`

```
1. deps.buildSnapshotsAsync(root, componentList)
2. deps.applyLiveMediaPatches(root, snapshots)  → restoreLiveFrames
3. [可选] CorsMediaFallback.applyLiveVideoSanitize
4. [可选] CorsMediaFallback.applyLiveImgSanitize
→ return { snapshots, restore: 合并全部 restore 函数 }
```

**onClone / afterClone 链：**
1. `BiCaptureEntry.patchScaledWrapperInClone` — 取消 scale
2. `UeStreamCapture.hideInClone` — 隐藏 UE
3. `EditorChrome.hideInClone` — 隐藏编辑脏层
4. `hideHostsInClone(excludeIds)` — 隐藏已独立截取的 host
5. `SingleComponentCapture.applyMediaPatchesOnClone` — 快照贴回
6. `Transform3DCapture.patchInClone` — 3D 样式同步
7. `FontDomCapture.flattenInClone` — 文本 flatten

### 6.4 纯图抽取

`ImageCaptureCore.buildLayersForDescriptor`：
1. 可见 `<img>` → canvas.drawImage
2. 无 img → li/div background-image
3. 无 → box background-image
4. 仍失败 → `captureHostViaDom`（单盒 html2canvas）

### 6.5 特殊组件

`SPECIAL_COMPONENT_MARKERS` 注册表（翻书、3D 列表、轮播、立方体等）。html2canvas 无法正确还原的 DOM，优先 snapdom/html2canvas 单独栅格为独立层，成功后从 overlay exclude。

---


---

## 八、Snapdom vs html2canvas

### 8.1 在本项目中的分工

| 场景 | 引擎 | 调用位置 |
|------|------|----------|
| simple 模式整屏 | snapdom | `captureEditorScreenShot` |
| single 策略整屏 | snapdom | `DomOverlayCapture.captureOnce` |
| composite overlay 整层 | **html2canvas** | `DomOverlayCapture.captureOverlay` |
| 单模块 dom 层 | **html2canvas** | `DomOverlayCapture.capturePerComponent` |
| panelStitch 底图 | **html2canvas** | `captureBaseExcludingPanels` |
| 面板独立层 | **snapdom** | `PanelCapture.snapdomPanelHost` |
| 纯图 dom 回退 | **html2canvas** | `ImageCapture.captureHostViaDom` |
| 整屏回退 | **html2canvas** | `captureFallback` / `captureOnceHtml2Canvas` |

### 8.2 原理对比

| 维度 | html2canvas | snapdom |
|------|-------------|---------|
| 原理 | 递归克隆 DOM，自行计算样式绘制到 canvas | 现代 DOM 快照引擎，插件化 pipeline |
| 字体 | 依赖页面已加载字体 | `embedFonts: true`，嵌入较好 |
| 跨域 img | 需 CORS + `useCORS: true` | 同样受限，靠 sanitize 预处理 |
| video/canvas | 无法直接绘制，必须 live patch 或数据层 | 同上 |
| 复杂 CSS | transform/blend/部分 CSS 不完整 | 还原度通常更好 |
| 性能 | 大 DOM 较慢；overlay 只调一次 | 单盒截取快；`fast: true` 整屏更快 |
| 钩子 | `onclone(doc, element)` — 绘制前 | `afterClone(cloneRoot, liveElement)` — clone 后 |
| 封装 | `Html2CanvasCapture.toCanvas` | `SnapdomCapture.toCanvas` |

### 8.3 共同前置 pipeline

无论哪种引擎，截图前都必须：

1. `runDomCaptureSanitizePipeline` — snapshots + live media patch + CORS sanitize
2. `BiCaptureEntry.patchScaledWrapperInClone` — 取消大屏 scale transform
3. `SingleComponentCapture.applyMediaPatchesOnClone` — chart/video/img/svg 贴回 clone
4. `Transform3DCapture.patchInClone` + `FontDomCapture.flattenInClone`

缺少任一步，常见后果：空白 canvas、video 黑帧、文字错位、跨域 taint。

---


---

## 九、后续优化方向

### 9.1 架构拆解（进行中）

| 待提取 | 目标文件 | 约行数 |
|--------|----------|--------|
| `ModuleAnalyzer` | `analysis/moduleAnalyzer.ts` | ~220 |
| `PanelCapture` | `container/panelCapture.ts` | ~430 |
| `GroupCapture` | `container/groupCapture.ts` | ~140 |
| `ScreenCompositor` | `core/screenCompositor.ts` | ~350 |
| 去掉 `@ts-nocheck` | 各模块 typed 化 | — |

### 9.2 功能

- 评估 `useExtractImageLayers: true` 默认开启的质量/性能影响
- video/group/panel 层 `Promise.all` 限并发并行采集
- 增量截图：缓存未变 layer
- WebWorker + OffscreenCanvas 合成
- 截图 AbortSignal 可取消

### 9.3 质量

- video 数据层超时/重试统一（组内多 video 格）
- `isCanvasMostlyBlank` 阈值可配置
- 特殊组件 registry 配置化
- 预览页 vs 构建页自动化对比测试

### 9.4 引擎

- 评估 overlay 从 html2canvas 迁移 snapdom 的可行性
- static 内容组件探索更轻量 capture 路径

---


---

*机制文档与代码同步至 captureStrategies 拆解后架构。*