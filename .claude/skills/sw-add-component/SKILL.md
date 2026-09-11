---
name: sw-add-component
description: Screenwright 低代码平台添加新组件的完整工作流。当用户需要新增组件、创建渲染组件、注册物料、添加配置面板、注册事件/行为类型时使用。触发场景：(1) "添加一个新组件"，(2) "新增xxx组件"，(3) "创建xxx渲染组件"，(4) 任何涉及 screenwright 组件注册、物料注册、配置面板新增的工作。
---

# Screenwright 添加新组件工作流

## 步骤总览

```
1. 枚举定义 → 2. 渲染组件 → 3. 分类Map注册 → 4. componentEntry注册 → 5. 配置面板 → 6. 事件/行为注册(可选)
```

详细分类注册表见 [references/registry-map.md](references/registry-map.md)。

## 第 1 步：定义组件类型枚举

根据组件类别，在 `packages/types/src/types/componentProp/` 下对应文件中添加枚举值：

```ts
// packages/types/src/types/componentProp/interactive.ts
export enum InteractiveEnum {
  /** 新组件描述 */
  NewComponent = "new-component",  // 使用 kebab-case
}
```

在 `packages/types/src/types/componentProp/index.ts` 中确认 `AllComponentType` 联合类型已包含该枚举（通常已通过导入自动覆盖）。

## 第 2 步：创建渲染组件

在对应分类目录下创建组件文件夹：

```
apps/app/src/components/ScreenwrightInteractive/components/new-component/
├── index.vue           # 渲染组件（必须）
├── useNewComponent.ts  # composable 逻辑（推荐）
└── type.ts             # Option 类型定义（可选）
```

**`index.vue` 核心模板**：

```vue
<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import { interactiveEnum } from "@/components/componentEntry/type";
import type { ComponentType } from "@/views/build/components/buildRender/type";
import type { NewComponentOption } from "./type";
import { useNewComponent } from "./useNewComponent";

defineOptions({ name: "new-component" });

const props = defineProps<{
  element: ComponentType<interactiveEnum.NewComponent, NewComponentOption>;
}>();

const { option, dataChart, events, encodes, isBuild, handleClick, init, cleanup } = useNewComponent(props.element);

onMounted(() => init());
onBeforeUnmount(() => cleanup());
</script>
```

**`useNewComponent.ts` composable 核心模板**：

```ts
import { useActionEvent } from "@/hooks/eventHandling/useActionEvent";
import { useBaseData } from "@/hooks/useBaseData";
import type { ComponentType } from "@/views/build/components/buildRender/type";

export function useNewComponent(element: ComponentType<...>) {
  const { addEvent } = useActionEvent();
  const { option, dataChart, events, encodes, isBuild, id, handleEncode, handleEventAndCallbackEvent } = useBaseData(element);

  const init = () => {
    // 注册到全局事件系统，供策略类调用
    addEvent({
      [`${interactiveEnum.NewComponent}-${element.id}`]: {
        handleClick: (info) => { /* 外部控制逻辑 */ },
      }
    });
  };

  const cleanup = () => { /* 清理 */ };

  return { option, dataChart, events, encodes, isBuild, handleClick, init, cleanup, ... };
}
```

## 第 3 步：注册到分类 Map

在对应分类的 `index.ts` 中导入并注册：

```ts
// apps/app/src/components/ScreenwrightInteractive/index.ts
import newComponent from "./components/new-component/index.vue";

export const ScreenwrightInteractiveMap: Record<InteractiveEnum, Component> = {
  [InteractiveEnum.NewComponent]: newComponent,
  // ...
};
```

`MaterialRegistry.ts` 会自动合并所有分类 Map，**无需手动修改**。

## 第 4 步：componentEntry 类型注册

在 `apps/app/src/components/componentEntry/type.ts` 中：

```ts
// 1. 确认枚举已导入并重新导出
export { InteractiveEnum as interactiveEnum };

// 2. 在渲染数组中添加新枚举值
export const renderInteractiveComponentType: InteractiveEnum[] = [
  InteractiveEnum.NewComponent,  // ← 添加
  // ...
];
```

如果是 2D 组件，同时更新 `component2DType` 和 `component2DTypeList`。

## 第 5 步：创建配置面板

### 5a. 定义配置 Tab 选项

在对应类别的 `componentOption/*.ts` 中添加组件的 Tab 配置：

```ts
// apps/app/src/views/build/components/buildConfig/attrsRender/componentOption/interactiveComponent.ts

class InteractiveComponentOptions extends ComponentOptions<interactiveEnum> {
  constructor() {
    const defaultOptions: Record<string, SingleOption[]> = {
      default: [
        { label: "全局", value: OptionTypes.global },
        { label: "样式", value: OptionTypes.style }
      ],
      [interactiveEnum.NewComponent]: [    // ← 新增
        { label: "全局", value: OptionTypes.global },
        { label: "样式", value: OptionTypes.style },
        { label: "系列", value: OptionTypes.series }
      ],
    };
    const importPath = "InteractiveComponent/Interactive";
    super(OptionTypes, defaultOptions, renderInteractiveComponentType, importPath);
  }
}
```

### 5b. 创建配置组件 Vue 文件

路径由 `importPath` + `OptionTypes` 值决定。以交互组件为例：

```
apps/app/src/views/build/components/buildConfig/InteractiveComponent/
├── InteractiveGlobal/new-componentGlobal.vue   # 全局 Tab
├── InteractiveStyle/new-componentStyle.vue     # 样式 Tab
└── InteractiveSeries/new-componentSeries.vue   # 系列 Tab
```

**命名规则**: `{componentName}{OptionType}.vue`，其中 `componentName` 须与枚举值完全一致。

## 第 6 步：事件/行为注册（可选）

仅在需要新事件触发类型或新动作类型时执行。

### 6a. 新事件类型

文件: `packages/types/src/types/event.ts`

```ts
// 1. 添加枚举
export enum EventTypeEnum { NewEvent = "newEvent" }

// 2. 映射到支持的组件
export const Event2ComponentType = {
  [EventTypeEnum.NewEvent]: [InteractiveEnum.NewComponent],
};

// 3. 添加显示标签
export const EventList = [{ label: "新事件", value: EventTypeEnum.NewEvent }];

// 4. 添加到事件白名单
export const allowEventComponentList = [..., InteractiveEnum.NewComponent];
```

### 6b. 新行为类型

文件: `packages/types/src/types/action.ts`

```ts
// 1. 添加枚举
export enum ActionTypeEnum { NewAction = "newAction" }

// 2. 映射到支持的组件
export const Action2ComponentType = {
  [ActionTypeEnum.NewAction]: [InteractiveEnum.NewComponent],
};

// 3. 添加显示标签
export const ActionList = [{ label: "新行为", value: ActionTypeEnum.NewAction }];
```

### 6c. 实现行为策略

文件: `apps/app/src/hooks/eventHandling/actionStrategies.ts`

```ts
class NewActionStrategy extends ActionStrategy<ActionExecutionParams> {
  async execute(params: ActionExecutionParams): Promise<void> {
    const { eventList, componentIds, info } = params;
    // 通过 eventList 获取目标组件注册的方法
    const key = `${componentProp}-${componentIds[0]}`;
    eventList[key]?.handleXxx(info);
  }
}

// 在 ActionStrategyFactory 中注册
static strategies = {
  [ActionTypeEnum.NewAction]: new NewActionStrategy(),
};
```

### 6d. 新增行为事件类型声明

文件: `apps/app/src/hooks/eventHandling/actionEventType/index.ts`

添加新组件的事件接口定义，key 格式为 `` `${ComponentProp}-${componentId}` ``。

## 注意事项

- 组件初始数据在数据库中，前端不维护默认配置
- Option 类型可选，定义在同目录 `type.ts` 中
- 配置面板通过 `importPath` 路径约定动态加载
- 为已有组件添加事件/行为支持，只需在 `Event2ComponentType` 或 `Action2ComponentType` 中追加枚举值
