## 非破坏式修改指南

### 1. RestoreFn 模式

凡修改 live DOM（style、visibility、video src、crossOrigin），必须：

1. 修改前 stash 原值
2. 返回 `RestoreFn`
3. 在 `try/finally` 的 `finally` 中调用 restore

参考：`DomOverlayCapture.prepareWrapper`、`runDomCaptureSanitizePipeline` 返回的 `session.restore`。

### 2. 新增组件类型

推荐顺序：

1. 在 `strategies/` 增加 `matches + capture` 或扩展现有 registry
2. 在 `capture/strategyWiring.ts` 注册到 `CaptureStrategyFactory`（注意优先级）
3. 若需 clone 补丁，扩 `singleComponentCapture` 或 `media/*`
4. **不要**直接在 `ScreenCompositor.capture` 写 if-else

### 3. 新增 media 类型（chart/video/img 类）

- 采集：`collectSnapshots(root, snapshots, mark)`
- clone 补丁：`applySnapshotsOnClone(clonedDoc, snapshots)`
- 接入：`singleComponentCapture.applyMediaPatchesOnClone`

### 4. 修改 CFG

- 改 `captureConfig.ts` 即可，全局生效
- 注意 `layerScale` 影响所有 html2canvas/snapdom/栅格 canvas
- `useExtractImageLayers` 改变 overlay exclude 行为，需回归 composite 全屏

### 5. 修改策略优先级

只改 `strategyWiring.ts` 中 `CaptureStrategyFactory.register([...])` 数组顺序。排在前面的 `matches` 先命中。

### 6. 循环依赖

- `ImageCapture` ↔ `DomOverlayCapture`：`ImageCaptureCore` + `bindImageCaptureDomDeps`
- `DomOverlayCapture` ↔ `PanelCapture`：`panelCaptureRef` 延迟注入

### 7. 类型扩展

- 对外类型：`types/index.ts`
- 内部类型：`types/captureInternal.ts`
- 新增 `CaptureLayer.kind` 时同步改 `ScreenCompositor.merge` 绘制分支
