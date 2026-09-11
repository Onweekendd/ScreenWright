# 组件分类注册速查表

## 枚举定义文件 (`packages/types/src/types/componentProp/`)

| 文件 | 枚举 | 组件类别 |
|------|------|---------|
| `interactive.ts` | `InteractiveEnum` | 交互组件（选项卡、选择器、搜索等） |
| `echart.ts` | `BarEchartEnum` 等 | ECharts 图表组件 |
| `text.ts` | `TextEnum` | 文本组件 |
| `media.ts` | `MediaEnum` | 媒体组件（视频、图片、轮播） |
| `indicator.ts` | `IndicatorEnum` | 指标组件 |
| `scene.ts` | `SceneEnum` | 场景组件（3D、地图） |
| `three-component.ts` | `ThreeComponentEnum` | 3D 子组件 |
| `exhibit.ts` | `ExhibitEnum` | 展示组件 |
| `equipment.ts` | `EquipmentEnum` | 设备组件 |
| `panel.ts` | `PanelEnum` | 面板组件 |
| `third-party.ts` | `ThirdPartEnum` | 三方组件 |
| `extends.ts` | `ExtendsEnum` | 扩展组件 |

聚合入口: `index.ts` → 导出 `AllComponentType` 联合类型和 `allComponentType` 数组。

## 组件 Map 注册文件 (`apps/app/src/components/`)

| Map 变量 | 目录 | 作用 |
|----------|------|------|
| `ScreenwrightInteractiveMap` | `ScreenwrightInteractive/` | 交互组件 |
| `ScreenwrightEchartsMap` | `ScreenwrightEcharts/` | 图表组件 |
| `ScreenwrightTextComponentMap` | `ScreenwrightText/` | 文本组件 |
| `ScreenwrightMediaMap` | `ScreenwrightMedia/` | 媒体组件 |
| `ScreenwrightIndicatorMap` | `ScreenwrightIndicator/` | 指标组件 |
| `ScreenwrightSceneComponentMap` | `ScreenwrightSceneComponent/` | 场景组件 |
| `ScreenwrightExhibitComponentMap` | `ScreenwrightExhibitComponent/` | 展示组件 |
| `ScreenwrightEquipmentComponentMap` | `ScreenwrightEquipmentComponent/` | 设备组件 |
| `ScreenwrightExtendsComponentMap` | `ScreenwrightExtendsComponent/` | 扩展组件 |
| `ScreenwrightThirdPartComponentMap` | `ScreenwrightThirdPartComponent/` | 三方组件 |
| `SystemComponentMap` | `SystemComponent/` | 系统组件 |

## componentEntry 类型注册 (`apps/app/src/components/componentEntry/type.ts`)

每个类别需在此文件中：
1. 导入枚举并以别名重新导出（如 `export { InteractiveEnum as interactiveEnum }`）
2. 创建渲染数组（如 `renderInteractiveComponentType: InteractiveEnum[] = [...]`）
3. 如果是 2D 组件，添加到 `component2DType` 和 `component2DTypeList`

## 配置选项注册文件 (`apps/app/src/views/build/components/buildConfig/attrsRender/componentOption/`)

| 文件 | 组件类别 |
|------|---------|
| `interactiveComponent.ts` | 交互组件 |
| `baseComponent.ts` | 图表组件 |
| `textComponent.ts` | 文本组件 |
| `mediaComponent.ts` | 媒体组件 |
| `indicatorComponent.ts` | 指标组件 |
| `sceneComponent.ts` | 场景组件 |
| `exhibitComponent.ts` | 展示组件 |
| `equipmentComponent.ts` | 设备组件 |
| `extendsComponent.ts` | 扩展组件 |
| `thirdPartComponent.ts` | 三方组件 |
| `systemComponent.ts` | 系统组件 |

聚合入口: `index.ts` → 合并所有 `componentOption`。

## importPath 与配置组件路径约定

`ComponentOptions` 基类通过 `importPath` 构建动态 import 路径：

```
importPath = "InteractiveComponent/Interactive"
                                    ↓ 分割为 preFixPath 和 appendFixPath
最终路径 = `../../${preFixPath}/${appendFixPath}${preFix}/${componentName}${preFix}.vue`
```

示例（交互组件 `subtabs` + `Style` tab）：
- `importPath = "InteractiveComponent/Interactive"`
- `preFix = "Style"`
- 最终路径: `../../InteractiveComponent/InteractiveStyle/subtabsStyle.vue`

各类别 importPath：

| 类别 | importPath |
|------|-----------|
| 交互 | `"InteractiveComponent/Interactive"` |
| 展示 | `"ExhibitComponent/Exhibit"` |
| 图表 | `"BaseComponent/Base"` |
| 文本 | `"TextComponent/Text"` |
| 媒体 | `"MediaComponent/Media"` |
| 指标 | `"IndicatorComponent/Indicator"` |
| 设备 | `"EquipmentComponent/Equipment"` |
| 场景 | `"SceneComponent/Scene"` |
| 扩展 | `"ExtendsComponent/Extends"` |
| 三方 | `"ThirdPartComponent/ThirdPart"` |
| 系统 | `"SystemComponent/System"` |

## 配置组件目录 (`apps/app/src/views/build/components/buildConfig/`)

每个类别的配置组件存放在对应目录下，命名规则为 `{componentName}{OptionType}.vue`：

交互组件示例（`InteractiveComponent/Interactive*`）：
- `InteractiveGlobal/subtabsGlobal.vue`
- `InteractiveStyle/subtabsStyle.vue`
- `InteractiveSeries/subtabsSeries.vue`

## useBaseData 提供的核心接口

```ts
const { option, dataChart, events, encodes, isBuild, id, handleEncode, handleEventAndCallbackEvent } = useBaseData(element);
```

| 导出项 | 类型 | 用途 |
|--------|------|------|
| `option` | `Ref<Option>` | 组件配置（来自数据库） |
| `dataChart` | `Ref<any[]>` | 组件数据（双向绑定） |
| `events` | `Ref<Event[]>` | 绑定的事件列表 |
| `encodes` | `Ref<Encode[]>` | 绑定的编码列表 |
| `isBuild` | `{ value: boolean }` | 是否为编辑模式 |
| `id` | `Ref<string>` | 组件实例 ID |
| `handleEncode` | `(throwValue) => void` | 发出终端编码事件（节流） |
| `handleEventAndCallbackEvent` | `(params) => void` | 抛出事件和回调 |
| `width` / `height` | `Ref<number>` | 组件宽高 |

## useActionEvent 全局事件注册

```ts
const { addEvent } = useActionEvent();

// 在 init() 中注册，key 格式为 `${EnumValue}-${elementId}`
addEvent({
  [`${InteractiveEnum.Subtabs}-${element.id}`]: {
    handleClick: (info, options) => { /* ... */ }
  }
});
```

策略类通过 `eventList[key]` 获取并调用注册的方法。
