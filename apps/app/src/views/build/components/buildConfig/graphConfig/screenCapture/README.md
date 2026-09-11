# screenCapture — 大屏分层截图

Screenwright 构建页 / 预览页截图子系统：扫描 `[data-id]` 模块 → 按内容类型分层采集 → 离屏 canvas 合成 PNG/JPEG。

> 控制台日志前缀：`[图层截图]`

---

## 文档索引

按你的目的选读，**不要**从一份超长文档里翻。

| 文档 | 适合谁 | 回答什么问题 |
|------|--------|--------------|
| **[01 目录与维护地图](./docs/01-structure.md)** | 改 bug、定位文件 | 代码在哪？出什么现象改哪个文件？各目录边界？ |
| **[02 调用链与核心策略](./docs/02-flow-and-strategies.md)** | 新人、评审架构 | 程序怎么跑？文件之间什么关系？策略如何分发？ |
| **[03 API / 配置 / 类型参考](./docs/03-api-reference.md)** | 开发、排障 | 每个参数、函数干什么？如何非破坏式修改？ |
| **[04 机制原理与引擎对比](./docs/04-principles-and-engines.md)** | 深入理解、选型 | 为什么分层？sanitize / 数据层是什么？html2canvas vs snapdom？ |

---

## 30 秒速览

```
captureEditorScreenShot / runLayerCompositeCapture
  → BiCaptureEntry.resolveScope（找 canvas）
  → Readiness 等待（字体/图/面板/图表/video）
  → ScreenCompositor.capture（composite 默认）
       → ModuleAnalyzer.scanAll（扫 [data-id]）
       → Video / Group / Special / Overlay / Image 分层采集
       → merge（按 zIndex 合成）
  → dataURL
```

**三种模式：** `simple`（整屏 snapdom）· `composite`（默认分层）· `panelStitch`（面板独立 + 底图）

---

## 最常改的文件

| 改什么 | 文件 |
|--------|------|
| 延迟、scale、开关 | `captureConfig.ts` |
| video 数据层抓帧 | `videoDataCapture.ts` |
| 面板/组栅格 | `container/containerRasterCapture.ts` |
| overlay / sanitize | `dom/domOverlayCapture.ts`、`dom/domCaptureSanitize.ts` |
| 策略注册顺序 | `capture/strategyWiring.ts` |
| 扫描与合成 | `captureStrategies.ts` |

完整现象 → 文件对照表见 [01-structure.md](./docs/01-structure.md#按现象定位文件)。

---

## 目录结构（简）

```
screenCapture/
├── layerCompositeCapture.ts    # 主调度入口
├── captureStrategies.ts        # 编排（扫描/面板/组/合成）
├── videoDataCapture.ts         # video 数据层抓帧
├── core/          biCaptureEntry、readiness
├── analysis/      树形分类、面板入口
├── capture/       单组件补丁、strategyWiring
├── dom/           sanitize、domOverlay
├── media/         video/chart/image/UE
├── container/     面板/组离屏栅格
└── strategies/    模块级策略工厂
```

---

## 维护说明

- 新增导出函数 / CFG 键：同步更新 [03-api-reference.md](./docs/03-api-reference.md)
- 新增策略或改调用顺序：同步更新 [02-flow-and-strategies.md](./docs/02-flow-and-strategies.md) 与 [04-principles-and-engines.md](./docs/04-principles-and-engines.md)
- 新增子目录：同步更新 [01-structure.md](./docs/01-structure.md)

重新从 monolith 拆分文档：将完整 README 存为 `README.full.md` 后执行 `node scripts/split-readme.mjs`。
