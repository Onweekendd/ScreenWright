import type { ComponentType, LargeScreeInfo, SystemComponentProps } from "@screenwright/types";
import { FolderEnum, PanelEnum } from "@screenwright/types";

import { renderSystemComponentType } from "../constants/panel";
import type { CallbackArguments } from "../events/CallbackArguments";
import { childLists, collectSubtree, collectSubtreeIds, findEntry } from "../selectors/componentContainers";
import {
  buildComponentMap,
  type ComponentMap,
  findTargetDynamicPanel,
  type FlatComponentMap,
  transformGroupData
} from "../selectors/componentTree";
import { assignComponentAttrs, calculateGroupDimensions, getMaxIndex } from "../selectors/geometry";
import type { EditorState } from "../state/EditorState";
import type { ComponentId, ComponentPlacement } from "../types/placement";
import type { EditorCoreState } from "../types/state";
import { BaseManager } from "./BaseManager";

/** 一个分组至少要有这么多成员才成立；不足就该解散（见 dissolveIfUnderfilled）。 */
const GROUP_MIN_MEMBERS = 2;

/**
 * 组件管理：负责组件树（layers）的读取/设置，以及各类组件映射（map）的派生。
 *
 * 派生方法均为纯计算（基于当前 layers 现算）；Vue 适配层用 computed 包裹以获得缓存与响应式。
 * 非 Vue 消费者可在 subscribe 回调中按需调用这些方法。
 */
export class ComponentManager extends BaseManager<EditorCoreState> {
  /**
   * 回调参数关系图。组件被删除时，它在关系图里的登记必须跟着消失，
   * 否则会留下一批指向已不存在组件的悬挂关系（见 delete）。
   */
  private readonly callbackArguments: CallbackArguments;

  constructor(editorState: EditorState<EditorCoreState>, callbackArguments: CallbackArguments) {
    super(editorState);
    this.callbackArguments = callbackArguments;
  }

  /** 获取组件树。 */
  getLayers(): ComponentType[] {
    return this.getState().layers;
  }

  /**
   * 用后端返回的原始大屏数据设置组件树。
   * 兼容三种情况：layers 为字符串数组（需解析）/ 已是对象数组 / 仅有 component 字段。
   */
  setLayers(detailInfo: LargeScreeInfo): void {
    let layers: ComponentType[];
    if (!detailInfo.layers) {
      layers = (detailInfo.component ?? []) as ComponentType[];
    } else if (typeof detailInfo.layers[0] === "string") {
      layers = transformGroupData((detailInfo.layers ?? detailInfo.component) as string[]);
    } else {
      layers = detailInfo.layers as ComponentType[];
    }
    this.setState({ layers });
  }

  /** 清空组件树。 */
  resetLayers(): void {
    this.setState({ layers: [] });
  }

  /**
   * 大屏组件映射：过滤掉终端交互（编码）面板。
   */
  getGlobalComponentMap(): FlatComponentMap {
    const componentMap: FlatComponentMap = new Map();
    buildComponentMap({
      componentList: this.getLayers().filter((item) => item.component?.prop !== PanelEnum.encodePanel),
      componentMap,
      parentDynamicPanelId: []
    });
    return componentMap;
  }

  /**
   * 终端交互（编码）组件映射：仅包含编码面板。
   */
  getEncodeComponentMap(): FlatComponentMap {
    const componentMap: FlatComponentMap = new Map();
    buildComponentMap({
      componentList: this.getLayers().filter((item) => item.component?.prop === PanelEnum.encodePanel),
      componentMap,
      parentDynamicPanelId: []
    });
    return componentMap;
  }

  /**
   * 所有组件映射：包含全部组件。
   */
  getAllComponentMap(): FlatComponentMap {
    const componentMap: FlatComponentMap = new Map();
    buildComponentMap({
      componentList: this.getLayers(),
      componentMap,
      parentDynamicPanelId: []
    });
    return componentMap;
  }

  /**
   * iframe 子组件映射：遍历 allComponentMap，找到有 quoteInfo.component 的 iframe 组件，展开其子组件。
   */
  getIframeComponentMap(): FlatComponentMap {
    const componentMap: FlatComponentMap = new Map();
    for (const component of this.getAllComponentMap().values()) {
      const subComponents = (component.option as { quoteInfo?: { component?: ComponentType[] } } | undefined)?.quoteInfo
        ?.component;
      if (Array.isArray(subComponents) && subComponents.length > 0) {
        buildComponentMap({
          componentList: subComponents,
          componentMap,
          parentDynamicPanelId: []
        });
      }
    }
    return componentMap;
  }

  /**
   * 大屏 + iframe 引用组件合并映射：按组件 id 查找的统一入口，省去调用方手动 ?? iframeComponentMap。
   */
  getScreenWithIframeComponentMap(): FlatComponentMap {
    const componentMap: FlatComponentMap = new Map();
    for (const [id, component] of this.getAllComponentMap()) {
      componentMap.set(id, component);
    }
    for (const [id, component] of this.getIframeComponentMap()) {
      componentMap.set(id, component);
    }
    return componentMap;
  }

  /**
   * 大屏根（第一层）组件映射：只包含大屏根画布第一层组件（含分组 / 预设子组件），不下钻动态面板内部。
   * 用于组件动作 componentScope = current 且触发组件位于大屏根时的作用域查找。
   */
  getScreenRootComponentMap(): FlatComponentMap {
    const componentMap: FlatComponentMap = new Map();
    buildComponentMap({
      componentList: this.getLayers(),
      componentMap,
      parentDynamicPanelId: [],
      // 不下钻动态面板：面板内部组件属于面板各状态自己的作用域
      processPanel: false
    });
    return componentMap;
  }

  /**
   * 动态面板子组件映射：动态面板ID -> 该面板下所有子组件的 ComponentMap。
   */
  getPanelChildComponentMap(): Map<string, ComponentMap> {
    const resultMap = new Map<string, ComponentMap>();
    const allComponentMap = this.getAllComponentMap();

    for (const component of allComponentMap.values()) {
      if (renderSystemComponentType.includes(component.component?.prop as PanelEnum)) {
        const componentMap: ComponentMap = new Map();
        const panelComponent = component as unknown as SystemComponentProps;
        buildComponentMap({
          componentList: panelComponent.panelData.flatMap((item) => item.config || []),
          componentMap,
          parentDynamicPanelId: [Number(component.id)],
          rootComponentMap: allComponentMap
        });
        resultMap.set(`${component.id}`, componentMap);
      }
    }

    return resultMap;
  }

  /**
   * 动态面板子组件映射（按状态分组）：动态面板ID -> 状态ID -> ComponentMap。
   */
  getPanelChildComponentMapByStatus(): Map<string, Map<string, ComponentMap>> {
    const resultMap = new Map<string, Map<string, ComponentMap>>();
    const screenWithIframeComponentMap = this.getScreenWithIframeComponentMap();

    for (const component of screenWithIframeComponentMap.values()) {
      if (renderSystemComponentType.includes(component.component?.prop as PanelEnum)) {
        const panelComponent = component as unknown as SystemComponentProps;
        const statusMap = new Map<string, ComponentMap>();

        for (const panelState of panelComponent.panelData) {
          const componentMap: ComponentMap = new Map();
          buildComponentMap({
            componentList: panelState.config,
            componentMap,
            parentDynamicPanelId: [Number(component.id)],
            rootComponentMap: screenWithIframeComponentMap
          });
          statusMap.set(`${panelState.id}`, componentMap);
        }

        resultMap.set(`${component.id}`, statusMap);
      }
    }

    return resultMap;
  }

  /** 通过父级ID链查找目标动态面板。 */
  findTargetDynamicPanel(parentIds: number[]): ComponentType | null {
    return findTargetDynamicPanel({ data: this.getLayers(), parentIds });
  }

  // ── 写入 API ────────────────────────────────────────────────────────────────
  //
  // 三条约定，改动这一段之前先读：
  //
  // 1. **就地变更，绝不替换数组或节点引用。** 前端的 allComponentMap 存的是节点引用、
  //    Vue 绑定也跟着引用走；换引用会让画布静默停止更新，而且不报错。
  //    reactive 的代理挂在对象上不在函数上，所以就地改照样触发响应式——core 不需要知道 Vue 存在。
  //
  // 2. **断言目标状态，不是命令式动作。** remove 是"断言它不在树上"而非"执行一次删除"，
  //    upsert 是"断言它在这里且长这样"而非"插入"。连续应用两次结果相同，这是幂等的唯一来源，
  //    也是同一份回执可以被重复 resume 的前提。
  //
  // 3. **不生成组件 id，不做上下文判断。** 真实 id 只能由业务接口分配，core 拿到的必须是已带
  //    真实 id 的节点；"该不该做"（选区、当前面板、权限）由调用方判断后以参数传入。
  //    唯一例外是动态面板状态 id，它本来就是前端 uuid 生成、不经服务端，见 PanelManager。
  //
  // 4. **派生值由这里算，传进来的一律不采信。** 分组包围盒由成员位置唯一决定（见 reflowGroup），
  //    调用方给的那份只可能是旧的。判据不是"这算不算渲染"，而是"这个数值是不是由树结构唯一
  //    决定的"——是，就归 core；否则前后端各存一份，重演出来结构对、数字错，看着像是对的。

  /**
   * 反查一个子组件数组挂在树的什么位置。
   *
   * UI 层的「当前画布」就是这样一个数组——大屏根级时它是 layers 本身，面板编辑态时它是某个
   * 状态的 config。用引用反查而不是靠路由/面板 hook 判断，好处是动态面板、编码面板、特殊面板
   * 三种编辑器一视同仁，将来再多一种也不用改。
   *
   * @returns undefined 表示它就是 layers 本身（大屏根级）；null 表示这个数组不属于本树
   */
  placementOfList(list: ComponentType[]): ComponentPlacement | null | undefined {
    const layers = this.getLayers();
    if (list === layers) {
      return undefined;
    }

    const walk = (items: ComponentType[]): ComponentPlacement | null => {
      for (const component of items) {
        if (component.children === list) {
          return { parentId: component.id, parentType: "group" };
        }
        const panelData = (component as SystemComponentProps).panelData;
        if (Array.isArray(panelData)) {
          for (const state of panelData) {
            if (state?.config === list) {
              return { parentId: component.id, parentType: "dynamicPanel", stateId: `${state.id}` };
            }
          }
        }
        for (const childList of childLists(component)) {
          const found = walk(childList);
          if (found) {
            return found;
          }
        }
      }
      return null;
    };

    return walk(layers);
  }

  /** 按 id 查找组件（含分组子组件与各面板状态内的组件）；找不到返回 null。 */
  find(id: ComponentId): ComponentType | null {
    return findEntry(this.getLayers(), id)?.component ?? null;
  }

  /**
   * 把节点从树上摘走，**不动它的回调关系**。
   *
   * 这是「组件换了个位置」的原语，不是「组件没了」。刻意保持 private：
   * 对外它是个陷阱——想删组件的人第一反应就是找 remove，选中了会静默把关系图漏掉，
   * 而这类漏掉不报错。对外只暴露对应真实动作的 delete / move / group / ungroup / upsert。
   *
   * @param touched 摘除前若它挂在某个分组下，把那个分组的 id 记进来——成员少一个，
   *                分组的包围盒就得跟着收紧，而 parent 字段在摘完之后就会被清掉，只能此刻取。
   * @returns 被摘下的节点；本来就不在树上时返回 null（no-op，断言式操作要幂等）
   */
  private remove(id: ComponentId, touched?: Set<ComponentId>): ComponentType | null {
    const entry = findEntry(this.getLayers(), id);
    if (!entry) {
      return null;
    }
    if (touched && entry.component.parent !== undefined && entry.component.parent !== null) {
      touched.add(entry.component.parent);
    }
    entry.list.splice(entry.index, 1);
    return entry.component;
  }

  /**
   * 删除组件：摘下树，并把它**整棵子树**在回调关系图里的登记一并清掉。
   *
   * 与内部的 remove 的区别是「组件还在不在」——remove 只是把节点从某处摘走（group 把成员
   * 拉进新分组节点走的就是它），组件本身和它的回调关系都还要用；delete 是这个组件不复存在了。
   * 两者必须分开：成组也要摘节点，那时清关系会让所有被成组的组件静默失去回调。
   *
   * @returns 被删掉的节点；本来就不在树上时返回 null（此时不清任何关系，
   *   需要对一个已脱离树的组件清关系请直接用 releaseCallbackRelations）
   */
  delete(id: ComponentId): ComponentType | null {
    const touched = new Set<ComponentId>();
    const removed = this.remove(id, touched);
    if (!removed) {
      return null;
    }
    this.releaseCallbackRelations(removed);
    this.reflowGroups(touched);
    return removed;
  }

  /**
   * 把组件及其整棵子树从回调关系图里注销（既作为抛出方也作为接收方）。
   *
   * 按**组件对象**而不是 id 工作，所以对已经脱离树的节点同样有效——删除流程里有几条
   * 「组件已判定删除、但树上摘不到」的出口（父分组先没了之类），只能靠这个入口补上。
   * 幂等：重复调用只是再过滤一遍同一批 id。
   */
  releaseCallbackRelations(component: ComponentType): void {
    for (const item of collectSubtree(component)) {
      this.callbackArguments.removeComponentFromCallbacks(item);
    }
  }

  /**
   * 断言分组的包围盒与它当前的成员一致。
   *
   * 包围盒（left/top + component.width/height）是**派生值**：它由成员位置唯一决定，
   * 不是可独立编辑的属性。所以凡是改动 children 的入口——group / delete / move / upsert
   * ——都在内部调它收口，调用方不必也不该再手写一遍。前后端各算一份必然漂移，
   * 而且漂移了不报错：组件都在、只有分组框位置尺寸不对，比结构错难查得多。
   *
   * **只对分组生效**，按 prop 判定（与 resolveContainer 同口径）。动态面板同样装着子组件，
   * 但它的尺寸是用户设的属性、不由内容决定，跟着内容算会把用户设的面板大小冲掉。
   * 这也是本方法不按「有没有 children」判断的原因——那是遍历用的口径，不是这里的。
   *
   * 成员为空时归零（全 0），与 app 侧 calculateGroupDimensions 同行为。
   * 分组不支持嵌套（成组时就挡掉了含分组的选区），故不向上冒泡。
   */
  reflowGroup(group: ComponentType): void {
    if (group.component?.prop !== FolderEnum.group || !Array.isArray(group.children)) {
      return;
    }
    assignComponentAttrs(group, calculateGroupDimensions(group.children));
  }

  /** 按 id 重算这批分组的包围盒；已不在树上、或根本不是分组的静默跳过。 */
  private reflowGroups(ids: Iterable<ComponentId>): void {
    for (const id of ids) {
      const group = this.find(id);
      if (group) {
        this.reflowGroup(group);
      }
    }
  }

  /**
   * 断言容器的成员就是这一串、且按这个顺序叠放。
   *
   * 图层树（以及任何"拖出一个新次序"的 UI）交出来的就是一个有序数组，本方法把它翻译成树里的
   * 两件事：**成员集合**与**叠放次序**。次序落在 zIndex 上而不是数组下标上——画布与图层树
   * 都按 zIndex 降序渲染，下标不决定谁盖住谁。数组第 0 项在最上层，故
   * `zIndex = members.length - index`（与前端 buildTreeData 的降序排列同口径）。
   *
   * 成员原本在别处（从画布拖进分组）不影响本方法：它们会出现在目标容器里；旧位置由调用方
   * 对那一侧再断言一次——图层树正是这么用的，一次拖拽会分别给出源列表与目标列表。
   *
   * @param placement 省略表示大屏根级
   */
  reorder(members: ComponentType[], placement?: ComponentPlacement): void {
    const container = this.resolveContainer(placement);

    members.forEach((member, index) => {
      member.zIndex = members.length - index;
      this.applyParentField(member, placement);
    });
    // 就地换内容，不换数组引用（约定①）
    container.splice(0, container.length, ...members);

    if (placement?.parentType === "group") {
      this.reflowGroups([placement.parentId]);
    }
  }

  /**
   * 断言分组成立：成员少于 {@link GROUP_MIN_MEMBERS} 个的分组不成立，就地解散。
   *
   * 「分组至少要有两个成员」是这套编辑器一直在守的规则——删成员删到只剩一个会自动解散、
   * 从图层树把成员拖走到只剩一个也会。但它此前分散写在两处 UI 里、实现还不一样
   * （一处连空分组也摘掉、另一处把空分组留在画布上）。后端重演一次删除必须同样解散，
   * 否则两边的树就此分叉，所以规则本身归 core。
   *
   * 仅剩的那个成员**继承分组的 zIndex**：ungroup 只保住数组下标，而画布与图层树都按 zIndex
   * 降序渲染，不继承的话它会跳到分组原来位置以外的地方去。
   *
   * 只做树上的事。持久化、动画注册表清理这些副作用由调用方按返回值决定做不做。
   *
   * @returns 被提升的成员（0 或 1 个）；分组仍然成立、不在树上、或压根不是分组时返回 null
   */
  dissolveIfUnderfilled(groupId: ComponentId): ComponentType[] | null {
    const group = this.find(groupId);
    if (!group || group.component?.prop !== FolderEnum.group) {
      return null;
    }

    const members = group.children ?? [];
    if (members.length >= GROUP_MIN_MEMBERS) {
      return null;
    }

    for (const member of members) {
      member.zIndex = group.zIndex;
    }
    return this.ungroup(groupId);
  }

  /**
   * 断言：该组件存在、内容为 component、位置在 placement。
   *
   * - 不传 placement：已存在则**原地整节点替换**（edit_files 推组件更新走这条），不存在则落到根级。
   * - 传 placement：先把这棵子树里的每个 id 从树上任何位置摘掉，再挂到目标容器下。
   *   "先摘再放"让 group 只需要一次调用——新分组节点的 children 里已经含成员，
   *   成员在根级的旧副本会被这次清扫带走，不需要调用方再逐个删。
   *
   * **不重算 zIndex**，与 move 相反。upsert 收的是完整节点：后端从回执拿到的 zIndex 就是
   * 前端画布上的真实值，重算等于把它覆盖掉。需要"顶到最上层"语义时用 move。
   *
   * **但重算分组包围盒**——传进来的那份和 zIndex 不同，它不是谁编辑出来的值，
   * 而是成员位置的函数（见 reflowGroup）：component 自己是分组时算它自己，
   * 落进/离开某个分组时算那个分组。
   */
  upsert(component: ComponentType, placement?: ComponentPlacement): void {
    const layers = this.getLayers();
    // 摘除时经过的分组：成员少了，它们的包围盒要收紧
    const touched = new Set<ComponentId>();

    if (!placement) {
      const entry = findEntry(layers, component.id);
      if (entry) {
        entry.list[entry.index] = component;
        this.reflowGroup(component);
        if (component.parent !== undefined && component.parent !== null) {
          touched.add(component.parent);
        }
        this.reflowGroups(touched);
        return;
      }
    }

    for (const id of collectSubtreeIds(component)) {
      this.remove(id, touched);
    }
    this.applyParentField(component, placement);
    const container = this.resolveContainer(placement);
    container.push(component);
    if (placement?.parentType === "group") {
      touched.add(placement.parentId);
    }
    // 它自己若是分组，包围盒同样由 children 定——调用方传进来的那份一律不采信
    this.reflowGroup(component);
    this.reflowGroups(touched);
  }

  /**
   * 断言这些组件都挂在 target 下，且位于该容器的最上层。
   *
   * **注意它不是通用的「搬运」，而是「搬进去并顶到最上层」**：真正发生搬迁时把 zIndex 顶到
   * `getMaxIndex(目标容器) + 1`，与前端 moveComponents 的三个分支（根级 / 分组 / 面板状态）
   * 逐一对齐——少了这一步，前端换用 core 之后组件移过去不再置顶，且不报错。
   *
   * 反过来说，「整体搬迁、内部相对层级不变」的场景（成组、转动态面板）用不了它：
   * 那些地方成员之间的叠放次序是要保留的（前端靠 zIndex 降序排 children），
   * 走这里会被压平成遍历顺序。这类场景目前都是「先装配好容器节点、再整体 upsert」，
   * 由 upsert 的先摘再放把成员旧副本带走，不经过本方法。
   *
   * 已经在目标容器里的**原样不动**：这条守卫同时也是幂等的来源。
   * `getMaxIndex(list) + 1` 在组件已在 list 里时是自增的，没有守卫，重复应用同一份回执
   * 会让 zIndex 一路涨上去。
   *
   * @param target 省略表示移动到大屏根级
   */
  move(ids: ComponentId[], target?: ComponentPlacement): void {
    const layers = this.getLayers();
    const container = this.resolveContainer(target);

    const touched = new Set<ComponentId>();

    for (const id of ids) {
      const entry = findEntry(layers, id);
      if (!entry) {
        throw new Error(`move：组件 ${id} 不在树上`);
      }
      if (entry.list === container) {
        continue;
      }
      if (entry.component.parent !== undefined && entry.component.parent !== null) {
        touched.add(entry.component.parent);
      }
      entry.list.splice(entry.index, 1);
      this.applyParentField(entry.component, target);
      // 必须先摘出旧位置、且在 push 之前算：否则 max 会把它自己算进去
      entry.component.zIndex = getMaxIndex(container) + 1;
      container.push(entry.component);
    }

    if (target?.parentType === "group") {
      touched.add(target.parentId);
    }
    // 搬出的那一头要收紧、搬入的那一头要撑开，两边都得算
    this.reflowGroups(touched);
  }

  /**
   * 断言分组存在，且这些成员在它的 children 里。
   *
   * @param groupNode 前端已分配真实 id 的分组节点。它的 children 若已填好就直接采用
   *                  （前端通常已经装配完毕）；为空时才从树上把 memberIds 摘进来。
   * @param placement 分组自身挂在哪；省略表示大屏根级
   */
  group(groupNode: ComponentType, memberIds: ComponentId[], placement?: ComponentPlacement): void {
    // 成员可能是从别的分组里拉出来的，那个分组的包围盒要跟着收紧
    const touched = new Set<ComponentId>();
    const hasChildren = Array.isArray(groupNode.children) && groupNode.children.length > 0;
    if (!hasChildren) {
      const members: ComponentType[] = [];
      for (const id of memberIds) {
        const member = this.remove(id, touched);
        if (!member) {
          throw new Error(`group：成员 ${id} 不在树上`);
        }
        members.push(member);
      }
      groupNode.children = members;
    }
    for (const child of groupNode.children ?? []) {
      child.parent = groupNode.id;
    }
    // 新分组自己的包围盒由 upsert 里的 reflowGroup 统一算，这里不必也不该先算一遍
    this.upsert(groupNode, placement);
    this.reflowGroups(touched);
  }

  /**
   * 断言该分组不再存在，其子组件提升到分组原来所在的那一层、原来的位置。
   *
   * 子组件的 left/top 存的就是与分组同一套坐标（calculateGroupDimensions 直接拿 element.left
   * 求包围盒），所以提升不需要换算坐标；分组自身的包围盒本就是派生值，随分组一起消失。
   *
   * @returns 被提升的子组件；分组本来就不存在时返回空数组（no-op）
   */
  ungroup(groupId: ComponentId): ComponentType[] {
    const entry = findEntry(this.getLayers(), groupId);
    if (!entry) {
      return [];
    }
    const children = entry.component.children ?? [];
    for (const child of children) {
      delete child.parent;
    }
    entry.list.splice(entry.index, 1, ...children);
    return children;
  }

  /**
   * parent 字段的记账：只有挂在分组下的组件才有 parent，
   * 根级与动态面板状态内的组件都不带（与前端 moveComponents 同口径）。
   */
  private applyParentField(component: ComponentType, placement?: ComponentPlacement): void {
    if (placement?.parentType === "group") {
      component.parent = placement.parentId;
    } else {
      delete component.parent;
    }
  }

  /** 把 placement 解析成真正存放子组件的那个数组；目标不存在就报错，不静默兜底。 */
  private resolveContainer(placement?: ComponentPlacement): ComponentType[] {
    if (!placement) {
      return this.getLayers();
    }

    const parent = this.find(placement.parentId);
    if (!parent) {
      throw new Error(`目标容器 ${placement.parentId} 不在树上`);
    }

    if (placement.parentType === "group") {
      // 必须真的是分组：否则会给一个叶子组件凭空挂上 children，落盘后变成一个谁都不认识的容器
      if (parent.component?.prop !== FolderEnum.group) {
        throw new Error(`组件 ${placement.parentId} 不是分组`);
      }
      if (!Array.isArray(parent.children)) {
        parent.children = [];
      }
      return parent.children;
    }

    const panelData = (parent as SystemComponentProps).panelData;
    if (!Array.isArray(panelData) || panelData.length === 0) {
      throw new Error(`目标动态面板 ${placement.parentId} 没有任何状态`);
    }
    const state = placement.stateId ? panelData.find((item) => `${item.id}` === `${placement.stateId}`) : panelData[0];
    if (!state) {
      throw new Error(`动态面板 ${placement.parentId} 上找不到状态 ${placement.stateId}`);
    }
    if (!Array.isArray(state.config)) {
      state.config = [];
    }
    return state.config;
  }
}
