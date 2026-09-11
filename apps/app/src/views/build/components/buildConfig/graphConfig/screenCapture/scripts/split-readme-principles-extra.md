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
