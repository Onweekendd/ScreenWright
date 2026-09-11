# 迁移清单与代码模板

基于 ScreenwrightEcharts（图表）、ScreenwrightText（文本）两次真实迁移整理。新迁移其他分类（如 ScreenwrightIndicator、ScreenwrightMedia）时，按下面顺序逐项核对。

## 目录结构对照

```
迁移前（apps/app/src/components/<Category>/）
├── index.ts          导出 XxxMap: Record<Enum, Component>
├── index.vue          (如图表这种"单组件多类型"模式)
└── components/<sub>/  (如文本这种"一类型一组件"模式)

迁移后（packages/material/src/components/<Category>/）
└── 结构原样搬入，import 路径调整为相对路径或 @material/ alias
```

两种组件组织模式都存在，迁移时保持原模式不变：
- **单组件多类型**（图表）：所有枚举值指向同一个 `.vue`，组件内部根据 type 分支渲染。
- **一类型一组件**（文本）：每个枚举值对应独立的 `.vue` 文件。

## 1. 物料组件 index.ts 模板

```ts
// packages/material/src/components/<Category>/index.ts
import { XxxEnum } from "@screenwright/types";
import type { Component } from "vue";

import subComponentA from "./components/subComponentA/index.vue";
import subComponentB from "./components/subComponentB/index.vue";

export const XxxComponentMap: Record<XxxEnum, Component> = {
  [XxxEnum.SubA]: subComponentA,
  [XxxEnum.SubB]: subComponentB,
};
```

真实参考：`packages/material/src/components/ScreenwrightText/index.ts`、`packages/material/src/components/ScreenwrightEcharts/index.ts`。

## 2. 编辑器配置面板模板

```ts
// packages/material/src/editor-ui/xxxComponent/index.ts
import type { Component } from "vue";
import { XxxEnum } from "@screenwright/types";

import subAGlobal from "./xxxGlobal/subAGlobal.vue";
import subASeries from "./xxxSeries/subASeries.vue";

export enum optionType {
  global = "Global",
  series = "Series",
  // 按需新增 Tab 类型
}

export type ConfigTab = {
  label: string;
  value: optionType;
  component: Component;
};

export const XxxConfigComponent: Record<XxxEnum, ConfigTab[]> = {
  [XxxEnum.SubA]: [
    { label: "全局", value: optionType.global, component: subAGlobal },
    { label: "系列", value: optionType.series, component: subASeries },
  ],
};
```

子目录命名规则：`xxx<TabName>/`（如 `echartsGlobal/`、`textSeries/`），文件名为 `<componentName><TabName>.vue`（如 `echartbarGlobal.vue`）。这与旧的 `ComponentOptions` 基类约定的路径拼接规则（`importPath` + `OptionTypes` + 组件名）保持一致，方便对照旧代码搬迁，但**迁移后不再用动态 import，全部静态 import**。

真实参考：`packages/material/src/editor-ui/textComponent/index.ts`、`packages/material/src/editor-ui/chartComponent/index.ts`（604 行，36 个图表类型的完整范例）。

## 3. 物料包统一导出（packages/material/src/index.ts）

```ts
export { XxxComponentMap } from "./components/XxxCategory";
export {
  type ConfigTab,
  optionType as xxxOptionType,
  XxxConfigComponent,
} from "./editor-ui/xxxComponent/index";
```

注意每个分类的 `optionType` enum 是独立的（`chartOptionType`、文本的 `optionType` 等），导出时用 `as` 重命名避免冲突。

## 4. 主包接线

### 4a. MaterialRegistry.ts

```ts
// 改动前
import { XxxComponentMap } from "@/components/XxxCategory/index";
// 改动后
import { XxxComponentMap } from "@screenwright/material";
```

`getAllComponentMaps()` 方法体内的 `...XxxComponentMap` spread 不需要改。

### 4b. componentOption/<category>Component.ts

```ts
// 改动后整个文件只剩转发
import { XxxConfigComponent } from "@screenwright/material";
export { xxxOptionType as optionType } from "@screenwright/material";
export const xxxComponentOptions = XxxConfigComponent;
```

`componentOption/index.ts` 顶层聚合文件（`export const componentOption = { ...baseComponentOptions, ...textComponentOptions, ... }`）不需要任何改动——这正是这套转发模式的意义：迁移对调用方零感知。

## 5. 依赖注入（@screenwright/composables 端口，无 initMaterial 聚合层）

`initMaterial()` / `MaterialRuntimeImpls` **已整体删除**，不存在这个聚合注入层了。当前架构：

- `useBaseData`/`useActionEvent`/`useBaseFilter`/`useUpdateInstance`/`useDataFilter`/`useEvent`/`useEventHandling`/`useEncodeEvent`/`useEncodeCommunication`/`useCallbackArguments`/`useEditStore`/`useChildrenDrawer`/`useTargetData`/`minioUrl` 等已**整体下沉**到 `@screenwright/composables`，物料包直接 `import { useXxx } from "@screenwright/composables"` 共享同一份运行时状态，不需要任何注入。物料包这层通常只剩一句转发，如 `packages/material/src/useEvent.ts`：`export { useEvent } from "@screenwright/composables";`。
- 真正搬不动的 IO/业务边界，各自散落在 `packages/composables/src/ports/*.ts` 里的独立端口，一个能力一个 `initXxx(fn)`，互不聚合：

| 端口文件 | `initXxx` | 用途 |
|---|---|---|
| `filter/ports.ts` | `initFilterDataApi` | executeSql/queryAPIData/getCsvData 后端接口 |
| `ports/baseDataPort.ts` | `initBaseDataBehavior` | handleEncode、额外事件（蓝图编排） |
| `ports/eventPort.ts` | `initActionStrategyExecutor`/`initSendUE4Message`/`initStatusAnimationTrigger`/`initEditModeResolver`/`initEncodeCommunicationConfig` | 动作策略执行、UE4 消息、状态动画触发、编辑态/路由判断、终端通信配置 |
| `ports/persistencePort.ts` | `initDataFilterPersistence` | 保存图层、保存大屏配置 |
| `ports/uploadPort.ts` | `initUpload`/`initAssetsPicker` | 上传接口、素材选择器组件+结果适配 |

若迁移的组件用到列表外的主包能力（某个尚未下沉的 hook），先判断能不能整体下沉（大部分是纯逻辑，能下沉就直接搬进 `packages/composables/src/`，参照上面已下沉的 hook 写法）；只有搬不动的 IO 边界才新开端口：
1. 在对应（或新建）`packages/composables/src/ports/xxxPort.ts` 声明 `let impl` + `initXxx(fn)` + 消费处内联判断 `impl?.(...)`（不做统一注册表）。
2. `packages/composables/src/index.ts` 导出新增的 `initXxx`、类型。
3. 主包 `main.ts` 直接调一次 `initXxx(...)`（不经过任何聚合函数），实现通常是 `@/hooks/xxx` 或 `@/utils/xxx` 里现成的逻辑。
4. **弹窗/DOM 等依赖 Vue setup 期上下文的机制**（如 `getCurrentInstance()` 拿 `appContext`）不能整体当作端口传函数——回调执行时机是点击时而非 setup 期，会拿不到上下文。机制本身要留在 `@screenwright/composables` 内部持有（如 `useUpload()` 自己调用 `ft-component` 的 `useDialog()`），只把"渲染什么内容/怎么解析结果"这种纯数据通过端口注入，参照 `packages/composables/src/ports/uploadPort.ts`。

物料包的 package.json 中 `ft-component`、`echarts`、`element-plus`、`vue` 是 `peerDependencies`（由主包提供实例），不要把主包内部业务模块（如 `@/hooks`、`@/store`）加进物料包依赖——这类能力必须走 `@screenwright/composables` 下沉或端口注入，否则会产生循环依赖且物料包无法独立构建。

## 6. vite 构建相关事实

`packages/material/vite.config.ts` 关键配置：
- `formats: ["es"]`，单入口 `src/index.ts`。
- `resolve.alias`: `@material` → `src`，`@editor` → `src/editor-ui`。
- `rollupOptions.external` 包含 `vue`、`@screenwright/core`、`@screenwright/types`、`echarts`、`element-plus`、`ft-component` 等，新增第三方依赖时若不想被打包进 dist，要加到这里。
- `preserveModules: true` + `preserveModulesRoot: "src"`：保持源码目录结构输出，方便按需 tree-shaking。
- CSS 通过 `assetFileNames: "[name][extname]"` 统一产出为 `dist/style.css`。

## 7. 已知残留清理案例（反面教材）

迁移图表和文本后，以下残留代码**应删除但未删除**，新一轮迁移要避免重复这个问题：

- `apps/app/src/components/ScreenwrightEcharts/index.ts`：仍保留完整的旧 `ScreenwrightEchartsMap` 构建逻辑，import 本地 `./index.vue`，没有任何代码引用它（`MaterialRegistry.ts` 已切换到 `@screenwright/material`），属于纯死代码。
- `apps/app/src/components/ScreenwrightText/components/`：12 个子组件目录原样保留，`index.ts` 已经改成 `export { ScreenwrightTextComponent } from "@screenwright/material"` 转发，但旧实现文件没删。

迁移收尾前用 `grep -r "@/components/<Category>" apps/app/src` 确认零引用后，直接删除整个旧目录（仅保留必要的话可以删到只剩 `index.ts` 一行转发，但更推荐直接删除——components/MaterialRegistry.ts 已经不需要本地路径）。
