import { randomUUID } from "node:crypto";

import { createStep } from "@mastra/core/workflows";
import type { ComponentType, PanelState, SystemComponentProps } from "@screenwright/types";
import { z } from "zod";

import { prismaClient } from "@/mastra/storage/prisma";
import { FT_GROUP_MODULE_ID, FT_PANEL_MODULE_ID, getComponentDefaultConfigByModuleId } from "@/mastra/tools/utils";

import { type Rect, type SolvedZone } from "../types";
import type { pickedComponentSchema } from "./pick-components-step";
import { zoneComponentsSchema } from "./pick-components-step";

/**
 * ⑤ 组装交付。**全程不调模型。**
 *
 * 逐个组件推 `data-node-conversion` 帧给前端，由前端建进画布、再由前端回写 agent 工作区
 * ——与 figmaToBI / codiaToBI 完全同一条路（`node-convert-to-bi-step.ts` 也是这么发的），
 * 前端侧的接收逻辑（`useFigmaToBI.addProcessedComponent`）本来就是通用的：按 `parentNodeId`
 * 分发到 根级 / 动态面板 / 分组，不含任何 figma 专有假设。
 *
 * ## 为什么不在这里直接 syncScreenData 写工作区
 *
 * 第一版是后端自己写盘的，eval 全绿——但那是**假绿**：eval 断言读工作区，而真实前端读的是
 * 流里的 chunk，接上去画布会是空的。更麻烦的是两边同时写会落出两套组件：前端拿到组件后
 * 不认后端给的 id，`getNewComponentOptions` 里明写着
 *
 *     const newComponentId = await buildComponent({...});   // 找后端接口要新 id
 *     } else if (attrs && attrs.id) { const { id: _id, ...rest } = attrs;  // 传来的 id 被剥掉
 *
 * 也就是说 **id 的唯一权威在前端那次 `buildComponent` 调用**。后端先写一份、前端再建一份，
 * 结果是同一批组件两套 id、两份文件。所以这里只发帧，落盘归前端。
 *
 * 由此推出两条约束，改动时别破坏：
 *
 * 1. **父子关系只能靠 `nodeId` / `parentNodeId` 关联，不能靠组件 id**——组件 id 到了前端就换了。
 * 2. **容器必须发成空的**（不预先把 children 塞进去），子组件随后各自带 `parentNodeId` 发出，
 *    由前端 `addToGroup` / `addToDynamicPanel` 挂进去。父帧必须排在子帧之前。
 *
 * 组件模板一律从 `Module` 表取（`javaScript` 字段），不自己造 —— 那里面带着组件菜单默认值、
 * dataRemark、事件槽位这些下游都要用的东西，自造的组件画布认不出来。
 */

/** 前端 `ConvertChunkDataType`（`useFigmaToBI.ts:25`）。字段名对不上前端会静默丢帧。 */
interface NodeConversionChunk {
  component: ComponentType;
  nodeId: string;
  parentNodeId: string | null;
  moduleId: number;
  stateIndex?: number;
}

const componentSchemaSafe = (component: unknown): ComponentType => component as ComponentType;

/** 深合并 option 覆盖：模型只给要改的键，其余保留模板默认值 */
const mergeOption = (base: unknown, patch: Record<string, unknown> | undefined): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...((base as Record<string, unknown> | undefined) ?? {}) };
  for (const [key, value] of Object.entries(patch ?? {})) {
    const prev = result[key];
    result[key] =
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      prev !== null &&
      typeof prev === "object" &&
      !Array.isArray(prev)
        ? mergeOption(prev, value as Record<string, unknown>)
        : value;
  }
  return result;
};

const applyRect = (component: ComponentType, rect: Rect): void => {
  component.left = Math.round(rect.left);
  component.top = Math.round(rect.top);
  component.component.width = Math.round(rect.width);
  component.component.height = Math.round(rect.height);
};

/** 建出来的组件与它的 moduleId：前端要靠 moduleId 回查组件菜单项，不能只发组件本身。 */
interface LoadedComponent {
  component: ComponentType;
  moduleId: number;
}

/**
 * 中文名 → moduleId。
 *
 * 名字来自向量库文档头部的 `**中文名**`，而 `Module.name` 是另一套数据，两边**不保证一一对应**：
 * `fttext` 的文档名是 `文本框/跑马灯/超链接`，Module 表里却是三行独立记录
 * （文本框 63 / 跑马灯 64 / 超链接 65），`findUnique` 一个都匹配不上。
 *
 * 后果不是「少个组件」这么轻：`title` 是每块屏都要的内容形态，而它选出来的就是 fttext，
 * 于是**只要有标题区就必然丢标题**——实测 d1 每一轮都得让 agent 事后手工补一个文本框，
 * 光这一项就是九步返工。108 份文档里目前只有这一份是斜杠拼接的，但按段回退是通用的，
 * 以后再出现同类命名也不用改这里。
 */
const findModule = async (componentName: string): Promise<{ moduleId: number; name: string } | null> => {
  // 整名优先，其次按 `/` 拆开逐段试——顺序即优先级，取第一个命中的
  const names = [componentName, ...componentName.split("/").map((s) => s.trim())].filter(
    (n, i, all) => n.length > 0 && all.indexOf(n) === i
  );

  const rows = await prismaClient.module.findMany({
    where: { name: { in: names } },
    select: { name: true, moduleId: true }
  });

  for (const name of names) {
    const hit = rows.find((r) => r.name === name);
    if (hit && hit.moduleId !== null) {
      // 回 `name` 而不是 `hit.name`：两者相等（就是靠它匹配上的），但 Module.name 在 schema 里可空
      return { moduleId: hit.moduleId, name };
    }
  }
  return null;
};

/** 按中文名取业务组件模板。 */
const loadBusinessComponent = async (
  picked: z.infer<typeof pickedComponentSchema>,
  rect: Rect
): Promise<LoadedComponent | null> => {
  // moduleId 取不到时下游会拿 undefined 去查库，静默返回 null，
  // 表现成「这块区莫名其妙没建出来」。在这里挡住并让调用方记一条 skipped
  const module = await findModule(picked.componentName);
  if (!module) {
    return null;
  }

  const template = await getComponentDefaultConfigByModuleId(module.moduleId);
  if (!template) {
    return null;
  }

  const component = componentSchemaSafe(template);
  // 用 Module 表里的真名，不用文档名——`文本框/跑马灯/超链接` 落进 name 会一路显示到图层树上
  component.name = module.name;
  applyRect(component, rect);

  if (picked.data.length > 0) {
    (component as unknown as Record<string, unknown>).data = picked.data;
  }
  if (picked.option) {
    (component as unknown as Record<string, unknown>).option = mergeOption(
      (component as unknown as Record<string, unknown>).option,
      picked.option
    );
  }

  return { component, moduleId: module.moduleId };
};

/** 动态面板的一个状态。字段照 `PanelState` 全铺，缺字段前端会读出 undefined 然后渲染空白。 */
const makePanelState = (name: string): PanelState => ({
  id: randomUUID(),
  title: name,
  name,
  config: [],
  backgroundColor: "rgba(0,0,0,0)",
  showBackgroundImage: false,
  backgroundImage: "",
  showScreenAdaptation: false,
  adaptationNorm: "default",
  adaptationType: 2
});

/**
 * 建一块区的容器，**内容为空**。
 *
 * 子组件不在这里挂进去：它们各自带 `parentNodeId` 单独发帧，由前端挂载（见文件头注释）。
 * 多状态面板只立状态骨架、config 全空，子组件随后带 `stateIndex` 落进对应状态——
 * 第一版所有子组件都进第 0 个状态：「日/月/年」要的是同一组件配不同数据，
 * 而数据从哪来这一步还不知道（只造 mock），先立骨架比复制三份假数据诚实。
 */
const buildContainer = async (zone: SolvedZone): Promise<LoadedComponent | null> => {
  const moduleId = zone.container === "sw-panel" ? FT_PANEL_MODULE_ID : FT_GROUP_MODULE_ID;
  const template = await getComponentDefaultConfigByModuleId(moduleId);
  if (!template) {
    return null;
  }

  const container = componentSchemaSafe(template);
  container.name = zone.role;
  applyRect(container, zone.rect);

  if (zone.container === "sw-panel") {
    (container as SystemComponentProps).panelData = (zone.states ?? ["状态1"]).map(makePanelState);
  } else {
    container.children = [];
    // 分组里子组件的 left/top 存的是**画布绝对坐标**，而 `isOuter` 正是渲染时的那个开关：
    //   Group.vue: left: item.left - (groupData.isOuter ? groupData.left : 0)
    // 为 false 时不减分组偏移，而分组容器本身已经绝对定位了，于是绝对坐标被再叠一次,
    // 表现成「分组位置对、里面的组件整体偏出一个分组左上角」。
    // Module 模板（moduleId 75）里默认是 false，产品自己导出的分组则一律 true——照产品来。
    container.isOuter = true;
  }

  return { component: container, moduleId };
};

export const assembleScreenInputSchema = z.object({
  screenId: z.string(),
  zones: z.array(z.custom<SolvedZone>()),
  zoneComponents: z.array(zoneComponentsSchema)
});

export const assembleScreenOutputSchema = z.object({
  screenId: z.string(),
  zoneCount: z.number(),
  componentCount: z.number(),
  /** 没能落地的部分，逐条说明原因。单块区失败不拖垮整块屏 */
  skipped: z.array(z.string())
});

export const assembleScreenStep = createStep({
  id: "assemble-screen",
  description: "把已求解的分区与选定的组件逐个推给前端建进画布",
  inputSchema: assembleScreenInputSchema,
  outputSchema: assembleScreenOutputSchema,
  execute: async ({ inputData, writer }) => {
    const { screenId, zones, zoneComponents } = inputData;
    const pickedByZone = new Map(zoneComponents.map((z) => [z.zoneIndex, z]));
    const skipped: string[] = [];
    let zoneCount = 0;
    let componentCount = 0;

    const emit = async (chunk: NodeConversionChunk): Promise<void> => {
      await writer.custom({
        type: "data-node-conversion",
        // 与 figma 那条一致地 structuredClone：帧发出后组件对象还会被后续逻辑读，
        // 直接传引用会让「发出去的那一帧」跟着后面的改动漂
        data: { ...chunk, component: structuredClone(chunk.component) }
      });
    };

    for (const [index, zone] of zones.entries()) {
      const result = pickedByZone.get(index);
      if (!result?.success || result.picked.length === 0) {
        skipped.push(`区「${zone.role}」：${result?.error ?? "没有选出任何组件"}`);
        continue;
      }

      const rectByContentId = new Map(zone.items.map((i) => [i.contentId, i.rect]));

      // 先把这块区的子组件全建出来再发帧：一个都建不出来时整块区（含容器）都不该发，
      // 否则画布上会留下一个空容器
      const children: LoadedComponent[] = [];
      for (const picked of result.picked) {
        const rect = rectByContentId.get(picked.contentId);
        if (!rect) {
          skipped.push(`区「${zone.role}」的内容项 ${picked.contentId}：求解结果里没有它的位置`);
          continue;
        }
        const loaded = await loadBusinessComponent(picked, rect);
        if (!loaded) {
          skipped.push(`区「${zone.role}」：组件「${picked.componentName}」在 Module 表里没有可用模板`);
          continue;
        }
        children.push(loaded);
      }

      if (children.length === 0) {
        skipped.push(`区「${zone.role}」：所有组件都没能建出来，跳过该容器`);
        continue;
      }

      const container = await buildContainer(zone);
      if (!container) {
        skipped.push(`区「${zone.role}」：容器模板（${zone.container}）取不到`);
        continue;
      }

      // 父帧必须先发：前端按 parentNodeId 在已建成的组件里找父级，找不到就当顶层组件塞进根级
      const zoneNodeId = `zone-${index}`;
      await emit({
        component: container.component,
        nodeId: zoneNodeId,
        parentNodeId: null,
        moduleId: container.moduleId
      });
      zoneCount += 1;

      for (const [childIndex, child] of children.entries()) {
        await emit({
          component: child.component,
          nodeId: `${zoneNodeId}-${childIndex}`,
          parentNodeId: zoneNodeId,
          moduleId: child.moduleId,
          // 分组不认 stateIndex，多发无害；动态面板缺它就不会切状态，子组件会落进当前状态
          ...(zone.container === "sw-panel" ? { stateIndex: 0 } : {})
        });
        componentCount += 1;
      }
    }

    return { screenId, zoneCount, componentCount, skipped };
  }
});
