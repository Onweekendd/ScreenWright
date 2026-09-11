import type { ComponentType, PanelState, SystemComponentProps } from "@screenwright/types";
import { FolderEnum, PanelEnum } from "@screenwright/types";

import { syncScreenData } from "@/mastra/services/bi-data-sync";
import { ScreenReader } from "@/mastra/services/bi-data-sync/screen-read";

import { allocateComponentId } from "./fake-frontend";

/**
 * `data-node-conversion` 帧的接收端——假前端的另一半。
 *
 * `fake-frontend.ts` 应答的是 suspend（工具主动问前端），这里接的是工作流**单向推**的组件帧：
 * figmaToBI / codiaToBI / requirementToBI 三条工作流都走这条路，前端侧对应
 * `useFigmaToBI.addProcessedComponent` + 随后的工作区回写（`syncWorkspace` 默认为 true）。
 *
 * **不接这一层的话，断言看到的是一块空屏。**这三条工作流不写工作区、也不 suspend，
 * 组件全在流里；驱动只处理 suspend 帧就等于把交付路径整段跳过了。
 *
 * 两处刻意与真前端保持一致，因为它们各自对应一类真实缺陷：
 *
 * 1. **组件 id 一律重新分配**，不认帧里带的那个。真前端就是这么做的
 *    （`getNewComponentOptions` 里 `buildComponent()` 要新 id、并把传来的 `id` 显式剥掉）。
 *    照搬帧里的 id 会让「工作流用组件 id 串父子关系」这种写法在 eval 里蒙混过关，
 *    到了生产才炸——父子只能靠 `nodeId` / `parentNodeId` 关联。
 * 2. **同一个 nodeId 重复到达直接跳过**。流重放 / resume / 工作流重试都会让帧到两次，
 *    真前端有这条幂等守卫，少了它 eval 里会落出两份内容相同、id 不同的组件。
 *
 * ## 这一层的能力边界（踩过一次，别忘）
 *
 * 本模块只镜像 `addProcessedComponent` 的**分发逻辑**（按 parentNodeId 挑一条路），
 * 不镜像各条路**函数体内部**的前置条件。真出过事：`addToGroup` 开头有一句
 * `if (!isDynamicPanel()) return null`——它只支持「动态面板里的分组」，而
 * requirementToBIWorkflow 的 ft-folder 建在大屏根级，于是真前端把 7 个叶子组件
 * 全部静默丢弃，画布上只剩 6 个 0×0 的空分组。而 eval 这一侧照样把它们挂进了
 * `parent.children`，d1/d2 一路全绿。
 *
 * 结论不是「把那些前置条件也抄过来」——抄了也只是抄当时那一版。**假前端天然比真前端宽容，
 * 这一层的绿灯只能证明「数据形状对」，证明不了「真前端收得下」**。涉及交付路径的改动，
 * eval 之外还得在真编辑器里点一次。
 */

interface NodeConversionData {
  component: ComponentType | null;
  nodeId: string;
  parentNodeId: string | null;
  moduleId: number;
  stateIndex?: number;
}

const panelStatesOf = (component: ComponentType): PanelState[] | null => {
  const panelData = (component as SystemComponentProps).panelData;
  return Array.isArray(panelData) ? panelData : null;
};

export interface NodeConversionApplier {
  apply: (data: NodeConversionData) => void;
  /** 收尾兜底：异常/超时路径下把已收到的组件补写一次 */
  flush: () => void;
  /** 落地了几个组件，报告里用来跟工作流自报的 componentCount 对账 */
  readonly count: number;
}

export const createNodeConversionApplier = (screenKey: string): NodeConversionApplier => {
  const converted = new Map<string, ComponentType>();
  const roots: ComponentType[] = [];

  /**
   * 整屏回写。**每收到一帧就写一次**，不能攒到最后。
   *
   * 真前端是逐个组件写的（`updateComponentLayers` 默认 `syncWorkspace: true`），
   * 所以工作流返回时组件已经在工作区里，agent 接着 `read_file` 看到的是建好的屏。
   * 第一版图省事只在流结束时写一次，结果 agent 在工作流返回后读到一块空屏，
   * 以为工作流没生效，开始用 `edit_files` 手工补 dataRemark——44 轮、2797k token、跑到超时。
   * 断言反而是绿的（收尾那次写补齐了），**红的地方和错的地方隔了整整一轮**。
   */
  const writeBack = (): void => {
    if (roots.length === 0) {
      return;
    }
    // 读回当前屏再改 layers，而不是凭空造一份 ParsedLargeScreenInfo——detail（画布尺寸、
    // 水印、适配策略…）和各类元信息有二十多个字段，自己拼一份必然漏，漏了的按 undefined 渲染
    const screen = new ScreenReader({ id: screenKey }).read();
    screen.layers = roots;
    // 屏级 config 是顶层组件 id 的数组，L0 不变量「config 引用无悬挂」查的就是它
    screen.config = roots.map((c) => c.id);
    syncScreenData({ id: screenKey, cacheTime: Date.now(), parsedLargeScreenInfo: screen });
  };

  const apply = (data: NodeConversionData): void => {
    const { component, nodeId, parentNodeId, stateIndex } = data;
    if (!component || converted.has(nodeId)) {
      return;
    }

    const created = structuredClone(component);
    created.id = allocateComponentId();

    const parent = parentNodeId ? converted.get(parentNodeId) : undefined;
    if (!parent) {
      roots.push(created);
      converted.set(nodeId, created);
      writeBack();
      return;
    }

    const states = panelStatesOf(parent);
    if (parent.component.prop === PanelEnum.dynamicPanel && states) {
      // 真前端在状态不存在时会补建一个（`addToDynamicPanel` → `addPanelStatus`），
      // 这里同样不能直接丢——丢了表现成「面板建出来了但里面是空的」
      const index = stateIndex ?? 0;
      const state = states[index];
      if (state) {
        state.config.push(created);
      } else {
        roots.push(created);
      }
    } else if (parent.component.prop === FolderEnum.group) {
      parent.children = [...(parent.children ?? []), created];
    } else {
      // 父级既不是分组也不是动态面板：真前端这里返回 null（组件丢弃）。
      // eval 里落到根级并不等价，但比静默丢弃更容易在断言里看出问题
      roots.push(created);
    }

    converted.set(nodeId, created);
    writeBack();
  };

  return {
    apply,
    flush: writeBack,
    get count() {
      return converted.size;
    }
  };
};
