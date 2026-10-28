import type { ComponentType } from "@screenwright/types";

import type { DiskComponent } from "./screen-read";
import { type ScreenTree, ScreenTreeSet } from "./screen-tree-set";

/**
 * core 会重算的派生字段：位置在节点上、宽高在 component 上，与 core 的 assignComponentAttrs 同口径。
 * 目前 applyUpdate 唯一会派生的就是分组包围盒（见 ComponentManager.reflowGroup）。这里只用来判断
 * "core 有没有改掉 agent 写的值"，从而给 agent 一句提示；落盘统一交给整屏回写。
 */
interface DerivedBox {
  left: unknown;
  top: unknown;
  width: unknown;
  height: unknown;
}

const boxOf = (component: ComponentType): DerivedBox => ({
  left: component.left,
  top: component.top,
  width: component.component.width,
  height: component.component.height
});

const sameBox = (a: DerivedBox, b: DerivedBox) =>
  a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height;

export interface ComponentEditOutcome {
  /**
   * core 树上的那一份组件：子树已内联（children / panelData[].config 是真实对象而非 basename）、
   * vue-part 的 .vue 已还原进 option、派生值已重算。直接推给前端即可。
   */
  component: ComponentType;
  /**
   * core 重算派生值时留下的说明，回给 agent。没有重算则为 undefined。
   *
   * 必须带出去：agent 看不见 core，它写进文件的分组尺寸被按成员覆盖之后，
   * 如果结果消息里只说「编辑成功」，它会以为自己写的值生效了，然后反复改同一个字段。
   */
  notice?: string;
}

/**
 * 把 agent 改出来的组件内容合进内存中的整屏树，让 core 重算派生值。只改树，不落盘。
 *
 * **入参是编辑后的文本或内联组件，不是磁盘上的状态**——被调用时那次编辑还没落盘，也不该先落盘。
 * 工作区只有一条写入路径（调用方最后那次整屏回写），因此不存在「文件已经改了、树还没改」的中间态：
 * 返回 null 或抛错时，工作区都原封不动，不会留下半截编辑。
 *
 * 把编辑后的那个组件内联成内存形态后 applyUpdate 到树上——core 顺带重算由树结构唯一决定的派生值
 * （分组包围盒，见 ComponentManager.applyUpdate → reflowGroup）。这条规则前端改属性面板时跑的
 * 是同一份函数，后端不跑的话 AI 挪完成员分组框就是旧的，工作区与画布一起错。
 *
 * 文本形态的内联（子树、vue-part 源码）读的是磁盘：同一棵树上先前的编辑若碰过这个组件的子树，
 * 这里会把它冲回盘上的旧版。共用一棵树的调用方要先用 ScreenTreeSet.claim 排除这种叠加。
 *
 * @returns null 表示组件不在树上
 */
export const editComponentInTree = (
  tree: ScreenTree,
  absPath: string,
  editedContent: string | ComponentType
): ComponentEditOutcome | null => {
  const { reader, editor } = tree;

  // 原始 JSON.parse，不走 schema：schema 会给可选字段补默认值，那些值会一路写进工作区，
  // 把跟这次编辑无关的字段也改掉（与 readAndValidate 返回原始对象是同一个理由）。
  let editedId: number;
  let component: ComponentType;
  if (typeof editedContent === "string") {
    const edited = JSON.parse(editedContent) as DiskComponent;
    editedId = edited.id;
    component = reader.inflateComponent(edited, absPath);
  } else {
    editedId = editedContent.id;
    component = editedContent;
  }

  const existing = editor.component.find(editedId);
  if (!existing) {
    return null;
  }

  // 父分组要在 applyUpdate 之前拿：applyUpdate 会就地改它的包围盒
  const parentId = existing.parent;
  const parent = parentId === undefined || parentId === null ? null : (editor.component.find(parentId) ?? null);
  const parentBoxBefore = parent ? boxOf(parent) : null;

  // 比较基准是 **agent 写进去的值**，不是树上的旧值：要判断的是「core 有没有否决这次编辑」
  const selfBoxBefore = boxOf(component);

  // 与前端流更新走同一份 core 规则：原地合并、数组替换、关系同步和派生值重算。
  const update = editor.component.applyUpdate(component, { strategy: "replace" });
  if (!update) {
    return null;
  }
  const updatedComponent = update.component;

  const notices: string[] = [];

  // 组件自己的包围盒被 core 改了：只有分组会这样——它的尺寸是成员位置的函数，不是可编辑属性
  if (!sameBox(selfBoxBefore, boxOf(updatedComponent))) {
    notices.push(`分组 ${editedId} 的位置与尺寸由成员位置决定，已按成员重算覆盖`);
  }

  // 成员位置变了，父分组的包围盒跟着收紧/撑开。前端会自己再跑一遍同一个 core 函数，
  // 所以这里只管把结果写进工作区，不往协议里塞（约定④）。
  if (parent && parentBoxBefore && !sameBox(parentBoxBefore, boxOf(parent))) {
    notices.push(`父分组 ${parent.id} 的包围盒已随之重算`);
  }

  return notices.length > 0
    ? { component: updatedComponent, notice: notices.join("；") }
    : { component: updatedComponent };
};

/**
 * 单个组件编辑：整屏读 → {@link editComponentInTree} → 整屏落盘。
 *
 * 整屏写（{@link ScreenTreeSet.flush}）与前端整屏保存是同一个写入器，父组件的轻量子引用和
 * `_callback_flows` / `_event_flows` 这些同样由树结构派生、过去只有前端保存才刷新的索引，
 * 这时才跟得上。整屏写不会波及无关文件，前提有两条，缺一不可：
 * 1. ScreenReader.readAndValidate 交出的是**原始对象**，zod 只做校验不做补全重排；
 * 2. fs-utils 的 writeIfChanged 按 key 顺序无关的结构等价跳过写入。
 *
 * 返回的组件取自 core 的树，**天然是内联好的完整对象**，直接推给前端即可。
 * 只管「改」不管「建」：id 不在树上时返回 null，不会顺手把它挂到根画布去。
 *
 * @param absPath 被编辑的组件 json 的绝对路径（只用来定位大屏与伴生文件，不从它读内容）
 * @param editedContent agent 编辑后的组件 json 文本，或已经内联好伴生源码的组件对象，尚未落盘
 * @returns null 表示 core 接不上这次编辑（路径不在工作区、或 id 不在树上）
 */
export const applyComponentEdit = async (
  absPath: string,
  editedContent: string | ComponentType
): Promise<ComponentEditOutcome | null> => {
  const trees = new ScreenTreeSet();
  const tree = trees.open(absPath);
  if (!tree) {
    return null;
  }
  const outcome = editComponentInTree(tree, absPath, editedContent);
  if (outcome) {
    trees.markDirty(tree);
    trees.flush();
  }
  return outcome;
};

/*
 * 「前端确认之后由后端过 core 落盘」的那批入口不在这里，都在 ./screen-mutation.ts：
 * 创建、移动、成组、解组、删除、面板状态、过滤器。本文件只管**改**已有组件的内容。
 */
