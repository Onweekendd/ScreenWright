import type { ComponentType, SystemComponentProps } from "@screenwright/types";

/**
 * 组件的全路径链路
 *
 * - namePath：中文全路径，面板名/状态名/.../组件名
 * - idPath：ID 全路径，"{面板id}_{面板名}"/"{状态id}_{状态名}"/.../"{组件id}_{组件名}"，
 *   每段格式与 workspace 磁盘文件/目录命名风格一致（磁盘侧有额外的文件名安全字符过滤/截断，不保证逐字节相同）
 *
 * 两者一一对应，用于让 agent 在 system context / @提及 中识别组件含义；
 * 精确定位仍需取 idPath 最后一段 `_` 前的数字 id，按 id 查询（如 getComponentDetail），不要凭 idPath 拼接磁盘路径。
 */
export interface ComponentPath {
  namePath: string;
  idPath: string;
}

/**
 * 文件名净化白名单 + 单段长度上限。
 * **必须与后端 buildIdNameBase（servers/server .../tools/file/utils.ts 的 UNSAFE_FILENAME_CHARS / MAX_NAME_LEN）逐字一致**，
 * 否则 name（含弯引号/标点/空格或超长正文）在磁盘被净化/截断、而 idPath 段保留原样，两者对不上，
 * agent 按 idPath 拼出的磁盘路径会 File not found。白名单只保留「文字/数字/连字符」，顺带去掉会破坏 idPath/rf 分段的 "/" "|" 与 "_"。
 */
const UNSAFE_FILENAME_CHARS = /[^\p{L}\p{N}-]/gu;
const MAX_SEGMENT_NAME_LEN = 10;

const sanitizeSegmentPart = (s: string): string =>
  (s ?? "").replace(UNSAFE_FILENAME_CHARS, "").trim().slice(0, MAX_SEGMENT_NAME_LEN);

/**
 * 生成 idPath 单段："{id}_{name}"，与 workspace 磁盘文件/目录命名风格保持一致（含安全字符过滤与 MAX_SEGMENT_NAME_LEN 字截断）。
 * 调用方对组件段传 `name ?? title`，故 name 为空时退回组件类型（如"柱状图"）；状态段无类型概念，直接传状态名。
 * 段为空时自动省略，最差退化为纯 id。
 */
function buildIdNameSegment(id: number | string, name: string): string {
  return [`${id}`, sanitizeSegmentPart(name)].filter(Boolean).join("_");
}

interface PanelStateInfo {
  panel: ComponentType;
  state: { name: string; id: string };
}

/**
 * 在全局 Map 中扫描所有动态面板，找到状态 config 中直接包含 targetId 的那个面板/状态
 *
 * 不依赖 buildComponentMap 写入的 parentDynamicPanelId（该字段由多个独立的 computed 共享同一组件对象、
 * 互相 Object.assign 覆盖写入，遍历顺序不同会导致结果不稳定），而是直接按 targetId 现场查找，确保结果稳定。
 */
function findContainingPanelState(
  targetId: number,
  allComponentMap: Map<string, ComponentType>
): PanelStateInfo | null {
  for (const comp of allComponentMap.values()) {
    const panelData = (comp as SystemComponentProps).panelData;
    if (!panelData) {
      continue;
    }
    for (const state of panelData) {
      if (state.config?.some((c) => c?.id === targetId)) {
        return { panel: comp, state: { id: state.id, name: state.name } };
      }
    }
  }
  return null;
}

/**
 * 根据组件及全局组件 Map，构建组件的全路径链路（namePath / idPath）
 *
 * idPath 的每一段（"{id}_{name}" 形式）对应 workspace `component/` 下的一层目录：
 * - 动态面板成对出现 `面板id_面板名/状态id_状态名`（支持面板嵌套面板，逐层向上查找）
 * - 中间段为分组 id_分组名（沿 parent 字段逐层向上查找，支持分组嵌套分组）
 * - 最后一段为组件自身 id_组件名
 */
export function buildComponentPath(
  component: ComponentType,
  allComponentMap: Map<string, ComponentType>
): ComponentPath {
  const nameParts: string[] = [];
  const idParts: string[] = [];

  /** 沿 parent 字段逐层向上收集分组链（支持任意层嵌套，最外层在前） */
  const groupChain: ComponentType[] = [];
  let cursor: ComponentType | undefined = component;
  const visitedGroupIds = new Set<string>();
  while (cursor?.parent != null && !visitedGroupIds.has(`${cursor.parent}`)) {
    visitedGroupIds.add(`${cursor.parent}`);
    const groupComp = allComponentMap.get(`${cursor.parent}`);
    if (!groupComp) {
      break;
    }
    groupChain.unshift(groupComp);
    cursor = groupComp;
  }

  /** 分组链最外层（或组件自身，若无分组）即是要拿去匹配面板状态的 id */
  let searchId = groupChain.length > 0 ? groupChain[0].id : component.id;

  /** 逐层向上查找所在的动态面板/状态（支持面板嵌套面板） */
  const panelChain: PanelStateInfo[] = [];
  const visitedPanelIds = new Set<string>();
  for (;;) {
    const found = findContainingPanelState(searchId, allComponentMap);
    if (!found || visitedPanelIds.has(`${found.panel.id}`)) {
      break;
    }
    visitedPanelIds.add(`${found.panel.id}`);
    panelChain.unshift(found);
    searchId = found.panel.id;
  }

  for (const { panel, state } of panelChain) {
    nameParts.push(panel.name, state.name);
    idParts.push(buildIdNameSegment(panel.id, panel.name ?? panel.title), buildIdNameSegment(state.id, state.name));
  }

  for (const groupComp of groupChain) {
    nameParts.push(groupComp.name);
    idParts.push(buildIdNameSegment(groupComp.id, groupComp.name ?? groupComp.title));
  }

  nameParts.push(component.name);
  idParts.push(buildIdNameSegment(component.id, component.name ?? component.title));

  return {
    idPath: idParts.join("/"),
    namePath: nameParts.join("/")
  };
}
