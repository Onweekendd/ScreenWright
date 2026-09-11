import { type ComponentPlacement, extractComponentId, ScreenEditor } from "@screenwright/core";
import type { ComponentType, Filter, PanelState, ParsedLargeScreenInfo } from "@screenwright/types";
import path from "path";

import { getScreenDirPath, getWorkspaceBase } from "../screen-workspace";
import { findJsonFile } from "./fs-utils";
import { ScreenReader } from "./screen-read";
import { syncScreenData } from "./screen-sync";

/**
 * 「前端确认之后，由后端过 core 落盘」这条路的统一入口。
 *
 * 每个 apply* 都是同一副骨架：整屏读 → 交给 core 的管理器改 → 一次整屏回写。三点是刻意的：
 *
 * 1. **内存变更一律经 core**，不在这里伸手改 reader 上的数组。摘挂、parent 记账、分组包围盒重算
 *    这些语义前端也要用，写在这里就是各写一遍、迟早分叉——前后端跑同一个函数才是这套东西的意义；
 * 2. **写只有末尾这一次**。中途任何一步抛错，工作区一个字节都没动，不会留下改了一半的树；
 * 3. **落盘发生在这里而不是前端**。工作区因此只有一个写入者，返回给 agent 的路径也一定已经存在
 *    ——前端那侧的工作区回写是 debounce 且不 await 的，由它写就可能 resume 都回来了文件还没落地。
 *
 * 整屏写不波及无关文件，靠的是 readAndValidate 交出原始对象（zod 只校验不补全重排）
 * 与 writeIfChanged 的结构等价跳过，两条缺一不可。
 */
export const runScreenMutation = async <T>(
  screenKey: string,
  mutate: (editor: ScreenEditor, reader: ScreenReader) => T | Promise<T>,
  { write = true }: { write?: boolean } = {}
): Promise<T> => {
  const reader = new ScreenReader({ id: screenKey });
  const value = await mutate(ScreenEditor.create(reader), reader);

  if (write) {
    const screen = reader.toParsedLargeScreenInfo();
    screen.config = reconcileConfig(screen.config, screen.layers);
    syncScreenData({ id: screenKey, cacheTime: Date.now(), parsedLargeScreenInfo: screen });
  }

  return value;
};

/**
 * 让屏级 `config` 跟根层组件对齐。
 *
 * `config` 是**根层**组件的 id 顺序（图层面板的排序），它随前端整屏保存进来，此前后端这条路
 * 从来没重算过——于是解散分组之后 `layers` 里没有那个容器了，`config` 里还留着它的 id，
 * L0 的「config 引用无悬挂」当场就红。新建组件同理：树上有了，`config` 里没有。
 *
 * 放在 `runScreenMutation` 而不是逐个 apply* 里：创建 / 分组 / 解组 / 移动 / 删除 / 复制
 * 全都从这条路出去，收口一次就够，也不会有人新加一个 apply* 时忘了带上。
 *
 * 规则是**保序增删**：还在的按原顺序留下（顺带保留它原本是数字还是字符串的形态，历史数据两种都有），
 * 没了的剔除，新出现的按 layers 顺序补在后面。
 */
const reconcileConfig = (
  config: ParsedLargeScreenInfo["config"] | undefined,
  layers: ComponentType[]
): ParsedLargeScreenInfo["config"] => {
  const rootIds = layers.map((c) => c.id);
  const rootIdSet = new Set(rootIds);

  const kept = (config ?? []).filter((entry) => rootIdSet.has(extractComponentId(entry)));
  const keptIds = new Set(kept.map((entry) => extractComponentId(entry)));

  return [...kept, ...rootIds.filter((id) => !keptIds.has(id))];
};

/** 组件落盘后的位置，可直接喂给 read_file / edit_files */
export interface ComponentLocation {
  componentId: number;
  /** 工作区相对路径 */
  filePath: string;
}

/**
 * 落盘之后按 id 在 component/ 下扫出该组件的真实路径。
 *
 * **不自己拼**：文件名经 buildIdNameBase 做过白名单净化与长度截断（"销售额/占比统计图表面板一二三"
 * 落盘是 `9004_销售额占比统计图表面.json`），目录层级又随分组/面板状态变化。另拼一份规则迟早跟
 * 写入侧对不上，扫盘拿到的则一定是真的。
 */
export const workspacePathOf = (screenKey: string, componentId: number): string | null => {
  const absPath = findJsonFile(path.join(getScreenDirPath(screenKey), "component"), `${componentId}.json`);
  return absPath ? path.relative(getWorkspaceBase(), absPath).replace(/\\/g, "/") : null;
};

/** 批量推路径，扫不到的（正常不该发生）直接略过，不拿一条假路径糊弄 agent */
const locateAll = (screenKey: string, componentIds: Iterable<number>): ComponentLocation[] => {
  const located: ComponentLocation[] = [];
  for (const componentId of componentIds) {
    const filePath = workspacePathOf(screenKey, componentId);
    if (filePath) {
      located.push({ componentId, filePath });
    }
  }
  return located;
};

export interface ComponentCreateOutcome {
  /** core 树上的那一份（parent 记账、分组包围盒都已重算） */
  component: ComponentType;
  /** 落盘后该组件 json 的工作区相对路径 */
  filePath: string;
}

/**
 * 把前端刚建好的组件放进内存树、整屏落盘，并返回它在工作区里的真实路径。
 *
 * 与 applyComponentEdit 正好相反：那条路刻意「只管改不管建」（id 不在树上就返回 null，免得顶层
 * 冒出一个谁都没建过的组件）；这里是**唯一允许插入的入口**，所以放哪儿必须由调用方明确给出
 * placement——「该放哪」是上下文判断，core 不猜（约定③）。
 *
 * 组件本身必须是**前端建好的那一份**，不能是后端自己的模板盖个 id 上去：前端的
 * buildComponentInstance 会套组件菜单的默认值、跑一遍位置尺寸分配，落在画布上的跟后端发过去的
 * template 不是同一个东西，拿 template 回写工作区就跟画布分叉了。真实 id 同理只能由业务接口分配。
 *
 * @param screenKey 大屏目录标识 "{screenId}_{versionCode}"
 * @param component 前端建好的组件，带业务接口分配的真实 id
 * @param placement 挂载位置；省略表示大屏根级
 * @returns null 表示落盘后没能在 component/ 下找到它（正常不该发生）
 * @throws core 的容器定位失败时抛（目标分组不存在、不是分组、动态面板没有该状态……）
 */
export const applyComponentCreate = async (
  screenKey: string,
  component: ComponentType,
  placement?: ComponentPlacement
): Promise<ComponentCreateOutcome | null> => {
  // 容器定位、状态兜底、parent 记账、分组包围盒重算都在这一句里，前端建组件走的是同一个函数
  await runScreenMutation(screenKey, (editor) => editor.component.upsert(component, placement));

  const filePath = workspacePathOf(screenKey, component.id);
  return filePath ? { component, filePath } : null;
};

/**
 * 把若干组件挪到另一个容器（分组 / 动态面板状态 / 根级）下。
 *
 * 组件不重建、id 不变，只是挂载位置变了，所以返回的是**新路径**：整屏写入器发现某个 id 的旧路径
 * 与新路径不同就会清掉旧位置（见 ScreenSyncWriter.writeComponents），磁盘上不会新旧并存。
 *
 * @param target 省略表示移动到大屏根级
 * @throws 组件不在树上、目标容器不存在或类型不对时由 core 抛
 */
export const applyComponentMove = async (
  screenKey: string,
  componentIds: number[],
  target?: ComponentPlacement
): Promise<ComponentLocation[]> => {
  await runScreenMutation(screenKey, (editor) => editor.component.move(componentIds, target));
  return locateAll(screenKey, componentIds);
};

/**
 * 把前端刚建好的分组节点放进树，并把成员收进它的 children。
 *
 * 分组容器和普通组件一样要由业务接口分配真实 id，所以节点本身只能是**前端建好的那一份**。
 * 成员的摘挂、parent 记账、包围盒重算归 core：groupNode.children 若已装配好（前端通常如此）
 * 就直接采用，成员在原位置的旧副本由 upsert 的「先摘再放」带走。
 *
 * @param placement 分组自身挂在哪；省略表示大屏根级
 * @returns null 表示落盘后没能在 component/ 下找到这个分组（正常不该发生）
 * @throws 成员不在树上、或目标容器定位失败时由 core 抛
 */
export const applyComponentGroup = async (
  screenKey: string,
  groupNode: ComponentType,
  memberIds: Array<number | string>,
  placement?: ComponentPlacement
): Promise<ComponentCreateOutcome | null> => {
  await runScreenMutation(screenKey, (editor) => editor.component.group(groupNode, memberIds, placement));

  const filePath = workspacePathOf(screenKey, groupNode.id);
  return filePath ? { component: groupNode, filePath } : null;
};

/**
 * 解散若干分组，子组件提升到分组原来所在的那一层。
 *
 * 分组容器**随之消失**（core 的 ungroup 把它整个摘掉），孤儿文件与其子目录由整屏写入器的
 * pruneOrphans 清掉。返回被提升子组件的新路径——它们的目录层级变了，旧路径已经失效。
 */
export const applyComponentUngroup = async (screenKey: string, groupIds: Array<number | string>) => {
  const promotedIds = await runScreenMutation(screenKey, (editor) =>
    groupIds.flatMap((groupId) => editor.component.ungroup(groupId).map((child) => child.id))
  );
  return locateAll(screenKey, promotedIds);
};

/**
 * 删除组件及其整棵子树。
 *
 * 删之前先让过滤器把这个组件摘干净（bindComponent / 回调关系），顺序与前端 deleteOne 一致——
 * 那一步要靠组件对象反查，摘完树就问不出来了。回调关系图的注销在 core 的 delete 里一并完成。
 *
 * @returns false 表示它本来就不在树上（此时仍会整屏回写一次，把可能存在的孤儿文件清掉）
 */
export const applyComponentDelete = async (screenKey: string, componentId: number | string): Promise<boolean> =>
  runScreenMutation(screenKey, async (editor) => {
    const component = editor.component.find(componentId);
    if (component) {
      await editor.dataFilter.updateFilterOnComponentDeleted(component);
    }
    return editor.component.delete(componentId) !== null;
  });

/**
 * 给动态面板追加一个状态。
 *
 * 状态本身是**前端建好的那一份**——不是因为 id 要业务接口分配（状态 id 是本地 uuid），
 * 而是因为画布上已经用这个 id 建好了，后端另生成一个就跟画布对不上。前后端造状态用的
 * 是 core 里同一个 createPanelState。
 *
 * @throws 面板不在树上、或那个组件根本没有 panelData 时由 core 抛
 */
export const applyPanelStateAdd = async (screenKey: string, panelId: string, state: PanelState): Promise<void> => {
  await runScreenMutation(screenKey, (editor) => editor.panel.addState(panelId, state));
};

/**
 * 保存过滤器，并把绑定关系同步到它绑的每个组件上。
 *
 * 两条路共用这一份：create_data_filter 前端确认后落盘，以及 edit_files 编辑
 * dataFilterArr/*.json（见 screen-file-edit 的 runDataFilterEdit）。后者还要先「只算不写」
 * 地预览一次，所以 write 是参数——**别为了预览再抄一份函数体出来**，两份迟早分叉。
 *
 * @param originalName 编辑前的名字；与 filter.name 不同即为改名，core 会先把旧名摘干净
 * @param write false 表示只算不写：把结果推给前端确认，工作区一个字节都不动
 * @returns 已写进树的那一份（core 会就地改 notSaved / id）
 */
export const applyFilterSave = async (
  screenKey: string,
  filter: Filter,
  originalName?: string,
  { write = true }: { write?: boolean } = {}
): Promise<Filter> =>
  runScreenMutation(
    screenKey,
    async (editor) => {
      // 拷一份再交给 core：core 会就地改它，而同一个入参在预览与提交里各用一次
      const saved = await editor.dataFilter.saveFilterWithBindings(structuredClone(filter), originalName);
      return saved.filter;
    },
    { write }
  );

/**
 * 删除过滤器，并解除它在各组件上的绑定（listenArgs、回调关系）。
 *
 * 磁盘上的 {name}.json / {name}.js 由整屏写入器的 pruneStaleFiles 清掉——**不在这里 unlink**：
 * 单独删文件就成了第二个写入者，且一旦前端那侧失败，文件没了树还在，下次整屏回写又给写回来。
 *
 * @returns false 表示这个名字本来就不存在（core 报的原因见其 error）
 */
export const applyFilterDelete = async (screenKey: string, filterName: string): Promise<boolean> =>
  runScreenMutation(screenKey, async (editor) => (await editor.dataFilter.deleteFilter(filterName)).success);
