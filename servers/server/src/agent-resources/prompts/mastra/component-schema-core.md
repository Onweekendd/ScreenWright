# 组件基础结构（常驻）

这是所有大屏组件共用的基础字段，创建和编辑时直接遵循。字段定义以
`packages/types/src/schemas/component.ts` 为准；各类型的 `option` / `data` 格式仍按需查
`sw-component-schema` 的 `references/components/<族>/<prop>.md`，不要凭通用字段名猜专属配置。

## 字段位置与含义

| 字段路径                                          | 类型                   | 用途                                                                               |
| ------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------- |
| `id`                                              | number                 | 实例 ID，创建时由平台分配，不放进 overrides；编辑时保留                            |
| `name`                                            | string                 | 实例名、图层名；给组件起名改这里                                                   |
| `title`                                           | string                 | 模板的组件类型标识；保留模板值，不作为实例名或文字内容修改                         |
| `left` / `top`                                    | number                 | 位置，在组件顶层                                                                   |
| `component.width` / `component.height`            | number                 | 尺寸，在 component 子对象里；顶层没有 width / height                               |
| `component.prop` / `component.name`               | string                 | 类型元信息，沿用模板，不用来给实例起名                                             |
| `zIndex`                                          | number                 | 叠放层级，大的在上，在组件顶层                                                     |
| `display` / `isLock`                              | boolean / 可选 boolean | 是否显示 / 是否锁定，在组件顶层                                                    |
| `unitPavenType`                                   | 可选 `"percent"`       | 缺省按像素；percent 时位置和尺寸均按相对大屏或父容器的百分比解释                   |
| `option`                                          | 类型专属配置           | 字体、颜色、样式等，具体字段查该组件文档                                           |
| `data`                                            | 类型专属数据           | 静态内容或渲染数据，结构查该组件文档；不要直接套用用户原始数据字段                 |
| `dataType` / `dataSource`                         | number / object        | 数据类型与数据源配置；静态数据是 dataType: 0，接口接入按数据流工作流用专用工具配置 |
| `events` / `cbArgs` / `listenArgs` / `openFilter` | 事件、回调、过滤器配置 | 写在组件顶层，配置流程遵循 BI 领域基本功                                           |

读现有组件前先判断单位：`unitPavenType: "percent"` 且宽高为 100 表示铺满容器，不能当作 100×100 像素。
文字内容放哪里取决于该组件的 `option` / `data` 定义，不能用顶层 `title` 代替。

## 创建时 overrides 的形状

`createComponentTool` 根据 `componentName` 读取完整模板。只覆盖明确需要的字段，不手写整份组件 JSON。
例如创建一张 1920×1080 的图片组件：

```json
{
  "screenId": "5_1",
  "componentName": "图片",
  "overrides": {
    "name": "效果图底图",
    "left": 0,
    "top": 0,
    "zIndex": 0,
    "component": { "width": 1920, "height": 1080 }
  }
}
```

图片地址需按图片组件的 data 格式另行填入。对象逐层深合并，所以上例保留模板里的 component.prop / name；
数组整体替换。传了 components 数组时，各项分别带 componentName / overrides / placement，顶层不再带它们；
可选字段的 null 按未传处理。根级创建省略 placement，嵌套创建用 placement 指定容器。

## 编辑与层级

编辑前读取实际组件 JSON，保留 ID 和类型元信息；已有模板里没有的配置字段先查文档。
分组、动态面板的 children / panelData / parent 等是层级数据：读取时遵循工作区的引用格式，
创建、复制、移动、分组、解组和加面板状态用对应专用工具，交由工具维护 ID、父子关系和挂载位置。
