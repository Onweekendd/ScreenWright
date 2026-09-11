---
name: sw-migrate-to-material
description: 将主包(apps/app)中已有的物料渲染组件及其编辑器配置面板，迁移到物料包(packages/material)，使其可被独立构建、复用并通过 @screenwright/material 导出。当用户说"把 xxx 组件搬到物料包"、"迁移 xxx 到 material"、"提取物料组件"、"xxx 组件物料化"时使用。已完成的迁移参考案例：图表(ScreenwrightEcharts)、文本(ScreenwrightText)、交互(ScreenwrightInteractive)。
---

# 物料组件迁移到 @screenwright/material

## 适用前提

仅迁移**渲染组件 + 编辑器配置面板**，不迁移业务流程代码（如 buildConfig 的目录结构、componentEntry 类型注册仍留在主包）。迁移单位通常是一整个"组件分类"（如全部图表、全部文本），不要只搬其中一两个枚举值——会导致同一分类的组件 Map 一部分来自 material、一部分来自本地，增加维护成本。

迁移分四块，必须全部完成才算闭环：**渲染组件** → **编辑器配置面板** → **类型/枚举** → **主包接线**。详细文件清单与代码模板见 [references/migration-checklist.md](references/migration-checklist.md)。

## 整体架构（已验证的事实）

```
packages/material/src/
├── components/<Category>/index.ts   导出 XxxMap: Record<Enum, Component>
├── editor-ui/<category>Component/   导出 XxxConfigComponent: Record<Enum, ConfigTab[]>
└── index.ts                         统一对外导出上述两者

apps/app/src/
├── components/MaterialRegistry.ts                                   合并所有 XxxMap
└── views/build/components/buildConfig/attrsRender/componentOption/  合并所有 XxxConfigComponent
```

主包侧**不要删除** `componentOption/<category>Component.ts` 这个聚合文件本身，而是把它改成纯转发：

```ts
// apps/app/.../componentOption/baseComponent.ts（图表已迁移后的真实写法）
import { ScreenwrightEchartsConfigComponent } from "@screenwright/material";
export { chartOptionType as optionType } from "@screenwright/material";
export const baseComponentOptions = ScreenwrightEchartsConfigComponent;
```

这样 `componentOption/index.ts` 里 `...baseComponentOptions` 的聚合逻辑完全不用动，降低改动面。`MaterialRegistry.ts` 同理：把本地 import 换成 `@screenwright/material` import，`getAllComponentMaps()` 里的 spread 逻辑不变。

## 迁移步骤

1. **物料组件迁移**（`packages/material/src/components/<Category>/`）
   把渲染用的 `.vue`/`.ts` 原样搬入，导出 `Record<Enum, Component>`。组件内部对 `@/` 的导入必须逐类替换为新源（vite.config.ts 中已配置 `@material` → `src`、`@editor` → `src/editor-ui`），**具体映射见下方「依赖处理速查」，先查表再批量替换**（用 perl/正则一次性改，几十个文件手工改不现实）。

2. **编辑器配置面板迁移**（`packages/material/src/editor-ui/<category>Component/`）
   按 Tab 类型分子目录（Global/Series/xAxis/Tooltip 等），导出 `optionType` enum、`ConfigTab` type、`XxxConfigComponent: Record<Enum, ConfigTab[]>`。**不要**沿用主包旧的 `ComponentOptions` 基类（`defineAsyncComponent` + 路径拼接动态 import），迁移后统一用静态 import + 普通对象，更简洁也避免相对路径拼接出错。面板里 `@/components/FtXxx` 这类 UI 组件（FtInputNumber/FtCollapseItem 等）真实实现都在 `ft-component` 包，改成 `from "@screenwright/ui/xxx"` 具名导入、**不要迁移**（详见速查表）。跨分类引用其他分类的面板子组件（如交互引用 text 的 ItemTextShadow）用 `@editor/textComponent/...` alias，**不要用 `../../`**（面板分布在不同深度目录，相对路径会错）。

3. **物料包导出**（`packages/material/src/index.ts`）
   新增两行 `export { XxxMap } from "./components/XxxCategory"` 和 `export { XxxConfigComponent, optionType as xxxOptionType } from "./editor-ui/xxxComponent"`。

4. **主包接线**（两处，零结构改动）
   - `apps/app/src/components/MaterialRegistry.ts`：把对应的本地 import 换成 `import { XxxMap } from "@screenwright/material"`。
   - `componentOption/<category>Component.ts`：改成上面展示的纯转发写法。

5. **依赖注入检查**（仅当组件依赖主包能力时）
   `initMaterial()` 已废弃删除，不存在这一层了。物料包**不能反向 import 主包任何模块**（包括 `@/hooks`、`ft-component` 之外的主包内部代码），但绝大多数主包 hook（`useBaseData`/`useEvent`/`useDataFilter`/`useEditStore` 等）本身已经整体下沉到 `@screenwright/composables`，物料包直接 `import { useXxx } from "@screenwright/composables"` 即可共享同一份运行时状态，不需要注入。只有真正的 IO/业务边界（后端接口、UE4/终端通信、动作策略执行、状态动画触发等）才通过 `@screenwright/composables` 自己的端口（`packages/composables/src/ports/*.ts` 的 `initXxx(fn)`）注入，由主包 `main.ts` 直接调用 `initXxx(...)`。检查组件用到的能力是否已有对应端口；没有则参照下方「重依赖主包能力：端口注入模式」新增。

6. **类型枚举确认**
   `AllComponentType`（`packages/types/src/types/componentProp/index.ts`）通常已经包含目标枚举（因为渲染功能早就存在），迁移本身一般不需要新增枚举值——只是改变了实现的物理位置。

7. **清理残留**（迁移类问题最容易翻车的环节）
   迁移完成后，**必须删除**主包 `apps/app/src/components/<Category>/` 下的旧实现代码，不要只留一个转发 `index.ts`。已发生过的真实问题：图表迁移后 `apps/app/src/components/ScreenwrightEcharts/index.ts` 仍保留着完整的旧 `ScreenwrightEchartsMap` 构建逻辑（只是没人 import 它），文本迁移后 `apps/app/src/components/ScreenwrightText/components/` 整个子组件目录原样留着。这些死代码会让人误以为还在维护两份实现。清理前用 Grep 确认全局没有 `@/components/<Category>` 的残留引用，再删除整个目录。

8. **CSS 与构建验证**
   - dev 模式直连 material 源码，scoped 样式由 Vue SFC 自动注入，无需额外处理。
   - prod 需要确认 `apps/app/src/main.ts` 中 `await import("@screenwright/material/dist/style.css")` 仍在，且 `packages/material` 执行 `vite build` 能正常产出 `dist/style.css`（rollup 配置里 `assetFileNames: "[name][extname]"`）。
   - 跑一次物料包构建（`pnpm --filter @screenwright/material build`）和主包类型检查，确认无报错。

## 依赖处理速查（真实迁移经验）

物料组件的 `.vue`/`.ts` 从主包搬进物料包后，内部对 `@/` 的引用必须逐类替换。下表是经 chart/text/交互三轮迁移验证的映射，**先查此表再动手**：

| 原 `@/` 来源 | 替换为 | 说明 |
|---|---|---|
| `@/views/.../constants` 的 `EventTypeEnum` | `@screenwright/types` | 枚举已下沉 |
| `@/views/.../buildRender/type` 的 `ComponentType` | `@screenwright/types` | 类型已下沉 |
| `@/components/componentEntry/type` 的 `interactiveEnum`/各分类 `xxxEnum` | `@screenwright/types` 取 `XxxEnum`（必要时 `as xxxEnum` 保留别名） | 主包 componentEntry/type 只是从 @screenwright/types 重导出的别名 |
| `@/utils/utils` 的 `sleep`/`lineargradientHandle`/`uuid`/`setPx`/`getPartialGradientCSS`/`extractComponentId` 等纯函数 | `@screenwright/core` | 纯函数优先下沉 core（见下） |
| `@/utils/websocket` 的 `Websocketconfig` | `@screenwright/composables` | |
| `@/hooks/useBaseData`、`@/utils/config` 的 `setMinioUrl` | `@screenwright/composables` 的 `useBaseData`、`minioUrl` 工具 | 已整体下沉，直接 import，不再需要注入 |
| `@/components/FtInputNumber`/`FtCollapseItem`/`FtInput`/`FtRadio`/`FtSingleColorPicker`/`FtColorPicker`/`FtSlider`/`FtCoordinateTabs` 等 UI 组件 | `from "@screenwright/ui/xxx"` 具名导入 | **真实实现都在 workspace 包 `ft-component`（`packages/ui`），主包 `@/components/FtXxx` 只是转发壳，不要迁移**；原默认导入 → 具名 `{ FtXxx }`，模板内组件名不变 |
| `@/components/ScreenwrightColorPicker`/`ScreenwrightSeriesTabs` | `from "@screenwright/ui"` 主入口具名 | 同上，ft-component main.ts 导出 |
| `@/components/Icon`、`@/components/FtUpload` | `@editor/base/Icon`、`@editor/base/FtUpload` | 物料包 base 自有实现（ft-component 无） |
| `@/views/.../textComponent/...`、`@/views/.../chartComponent/...` 等跨分类子组件 | `@editor/textComponent/...`、`@editor/chartComponent/...`（用 `@editor` alias，**不要用 `../../`**） | 相对路径在面板的不同目录深度会错；`@editor` 任何深度都对 |
| `@/<category>Component/...` 自身分类内部引用 | 相对路径 `./xxx` | 同分类内改相对 |

**纯工具函数：优先下沉 `@screenwright/core`**　渲染组件常依赖主包 `utils/utils.ts` 的纯函数（无 UI/业务依赖）。先 grep 确认 `@screenwright/core` 是否已有（`sleep`/`lineargradientHandle`/`extractComponentId` 等已下沉）；没有则在 `packages/core/src/utils/` 新增（参照 `sleep.ts`），`core/index.ts` 导出，主包 `utils.ts` 把本体改成 `export { xxx } from "@screenwright/core"` 再导出，保持主包调用方零改动。注意：re-export `export { xxx } from "@screenwright/core"` **不引入本地绑定**——若 `utils.ts` 内部其他函数也调用它，需 `import { xxx } from "@screenwright/core"; export { xxx };`。

**重依赖主包能力：先判断能不能整体下沉，不能才开端口**　物料组件依赖的主包 hook（`useBaseData`/`useEvent`/`useEventHandling`/`useEncodeEvent`/`useEncodeCommunication`/`useDataFilter`/`useEditStore` 等）逐字段审计后发现，大部分逻辑其实是框架无关的纯编排，真正卡点只是极少数"后端 HTTP 请求/DOM/window.location/第三方策略实现"这类 IO 边界。优先把整个 hook 搬进 `packages/composables/src/`（物料包和主包共享同一份 `@screenwright/composables` 单例，天然共享状态，不需要注入），只把搬不动的 IO 边界收窄成一个函数，通过 `packages/composables/src/ports/xxxPort.ts` 新增 `let impl` + `initXxx(fn)` + 消费处 `impl?.(...)` 的端口，主包 `main.ts` 直接调用 `initXxx(...)` 完成接线（**没有 `initMaterial` 这一层聚合**，每个端口独立初始化）。物料包这边则只剩一句转发：`packages/material/src/useEvent.ts` 现在就是 `export { useEvent } from "@screenwright/composables";`。若组件的依赖机制本身要求 Vue setup 期同步调用（如弹窗渲染用 `getCurrentInstance()` 拿 `appContext`，放进点击回调里会拿不到），机制本身（如 `useDialog()`）也要下沉到 `@screenwright/composables` 自己持有，只把"渲染什么内容/怎么解析结果"这种纯数据通过端口注入，不要把机制本身当端口传——参照 `packages/composables/src/ports/uploadPort.ts` 的 `useUpload()`。

**第三方 UMD 库：用 namespace export**　组件内部用到的第三方 UMD 库（如 `recorder-core.js`，`module.exports = X`）若要经 `@screenwright/material` 导出，**不要用 default import**（rollup 会报 "default is not exported"），用 `export * as recorderCore from "./.../recorder-core.js"`（namespace）。消费方 `import { recorderCore } from "@screenwright/material"; const X = recorderCore.default || window.X`。主包原来若用 `import * as X from "..."`，改源后保持同样的 `.default || window.X` 取值即可。

**base 下可能有重复 ft-component 的死代码**　`packages/material/src/editor-ui/base/` 下历史迁移可能残留与 `ft-component` 同名的不完整复制（如 `ScreenwrightColorPicker` 缺 `xncolorpicker.js`、`ScreenwrightSeriesTabs`），平时无人引用而潜伏。一旦新分类迁移触发对它的引用，build 会因缺依赖失败。**遇到 base 组件 build 报缺依赖，先查 `packages/ui/main.ts` 是否有同名导出**，有则删 base 版、引用改 `ft-component`，不要去补缺失文件。

**vite external 必须覆盖所有 echarts 扩展**　图表类组件依赖 `echarts-gl`/`echarts-liquidfill`/`echarts-wordcloud` 等扩展，`packages/material/vite.config.ts` 的 `rollupOptions.external` 必须列全，否则 build 报 "Could not resolve ... most likely unintended"。新增图表类型后若 build 报此类，把缺的扩展加进 external（并同步 `package.json` 的 peerDependencies/devDependencies）。

## 验证清单

- [ ] `packages/material/src/index.ts` 导出新增的 Map 和 ConfigComponent
- [ ] `MaterialRegistry.ts::getAllComponentMaps()` 能取到迁移后的组件（`getComponent(type)` 返回非 undefined）
- [ ] 编辑器中该分类组件的配置面板 Tab 正常显示且可编辑
- [ ] 画布渲染该分类组件无报错（尤其是依赖注入的能力，如上传、事件）
- [ ] 主包 `apps/app/src/components/<Category>/` 旧目录已完全删除，无残留 import
- [ ] `editor-ui/base/` 下与 ft-component 重复的死代码已清理（build 无缺依赖报错）
- [ ] 物料包内**完全无** `@/` 残留（grep `@/` 应为空，注释除外）
- [ ] `pnpm --filter @screenwright/material build` 与主包 `vue-tsc` 不引入新错误（既有错误与迁移无关）
