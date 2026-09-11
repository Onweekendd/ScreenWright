# 目录与维护地图

> **本文档回答：** 代码在哪？出问题改哪个文件？各目录边界是什么？

[← 返回索引](../README.md)

---

## 一、架构与目录

```
screenCapture/
├── index.ts                         # 对外公共 API
├── captureEditorScreenShot.ts       # 构建页封面（simple / full）
├── promptEditorScreenShotMode.ts    # 弹窗选模式
├── layerCompositeCapture.ts         # ★ 分层截图主调度
├── captureStrategies.ts             # 编排中枢（ModuleAnalyzer / Panel / Group / ScreenCompositor）
├── captureConfig.ts                 # CFG 全局配置
├── captureUtils.ts                  # Utils / Geometry / 组件树 / 引擎封装
├── videoDataCapture.ts              # ★ 统一 video 数据层抓帧
├── corsMediaFallback.ts             # 跨域 media 兜底
├── transform3dCapture.ts            # 3D transform 冻结
├── types/                           # 对外 + 内部类型
├── core/                            # BI 入口、等待链
├── analysis/                        # 树形解析、面板入口
├── capture/                         # 单组件补丁、策略注册
├── dom/                             # sanitize、domOverlay
├── media/                           # video/chart/image/UE
├── container/                       # 面板/组 data 栅格
└── strategies/                      # 模块级策略工厂
```

### 模块职责速查

| 改什么 | 文件 |
|--------|------|
| 延迟、scale、背景色、开关 | `captureConfig.ts` |
| 坐标/zIndex、组件树、引擎 | `captureUtils.ts` |
| video 数据层抓帧 | `videoDataCapture.ts` |
| UE / 普通 video / 图表 / 纯图 | `media/*.ts` |
| 面板/组离屏栅格 | `container/containerRasterCapture.ts` |
| overlay sanitize | `dom/domCaptureSanitize.ts` |
| 整层/单组件 dom 截取 | `dom/domOverlayCapture.ts` |
| 单组件 media 补丁 | `capture/singleComponentCapture.ts` |
| 策略注册顺序 | `capture/strategyWiring.ts` |
| 扫描与合成主流程 | `captureStrategies.ts` |

---


---

## 按现象定位文件

| 现象 | 优先查看 | 次查 |
|------|----------|------|
| 截图时机不对 / 未加载完 | `core/readiness.ts`、`layerCompositeCapture.ts` | `captureConfig.ts`（delay） |
| 作用域 / canvas 找不到 | `core/biCaptureEntry.ts` | 入参 `canvas` / `mode` |
| video 黑帧 / 不对 | `videoDataCapture.ts` | `media/videoNormal.ts`、`corsMediaFallback.ts` |
| UE 流送异常 | `media/ueStreamCapture.ts` | overlay exclude 逻辑 |
| 面板串层 / 子项错位 | `container/containerRasterCapture.ts` | `captureStrategies.ts` → `PanelCapture` |
| 组内 video 格错误 | `container/containerRasterCapture.ts` | `videoDataCapture.ts` |
| 图表空白 | `media/chartCapture.ts` | `core/readiness.ts` waitReady |
| 纯图丢失 | `media/imageCapture.ts` | `corsMediaFallback.ts` |
| 文本 / 渐变错位 | `strategies/fontDomCapture.ts` | `dom/domOverlayCapture.ts` onClone 链 |
| 翻书 / 3D 组件错 | `strategies/specialComponentRegistry.ts` | `specialComponentStrategy.ts` |
| 整屏 overlay 空白 | `dom/domOverlayCapture.ts` | `dom/domCaptureSanitize.ts` |
| 跨域 img 污染 | `corsMediaFallback.ts` | `ImageCapture.applyCrossOriginOnLive` |
| zIndex / 坐标偏差 | `captureUtils.ts` → `Geometry` | `ComponentTreeCapture.buildZIndexMap` |
| 策略没走到预期 | `capture/strategyWiring.ts` | `strategies/captureStrategyFactory.ts` |
| 合成结果缺层 | `captureStrategies.ts` → `ScreenCompositor` | 控制台 `合成层` 日志 |
| 构建页封面 simple 模式 | `captureEditorScreenShot.ts` | 直接 snapdom，不经分层 |
| 配置项调整 | `captureConfig.ts` | — |

---

## 目录分层（依赖方向）

```
入口层     index / captureEditorScreenShot / layerCompositeCapture
    ↓
编排层     captureStrategies（ModuleAnalyzer / ScreenCompositor / Panel / Group）
    ↓
策略层     strategies/* + capture/strategyWiring
    ↓
采集层     media/*、dom/*、container/*、videoDataCapture
    ↓
基础设施   captureUtils、captureConfig、corsMediaFallback、transform3dCapture
```

**原则：** 上层只编排，不直接操作 DOM 细节；新增组件类型优先加 `strategies/` 策略，而非改 `ScreenCompositor`。

---

## 每个子目录做什么

| 目录 | 职责 | 不应放入 |
|------|------|----------|
| `core/` | BI DOM 入口、等待链 | 具体 media 采集 |
| `analysis/` | componentList 分类、面板入口解析 | html2canvas 调用 |
| `capture/` | 单组件补丁、Factory 注册 | 模块扫描 |
| `dom/` | sanitize、overlay 整层/单盒 | video 数据层逻辑 |
| `media/` | 按介质类型采集（video/chart/img/UE） | 面板栅格合成 |
| `container/` | 面板/组离屏 canvas 合成 | 顶层 merge |
| `strategies/` | 模块级策略 matches + capture | 底层引擎封装 |
| `types/` | 类型定义 | 业务逻辑 |

---

## 日志前缀

控制台过滤 `[图层截图]` 可跟踪全流程。详见 [API 参考 - 调试](./03-api-reference.md#调试指南)。
