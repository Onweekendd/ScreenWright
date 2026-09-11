/**
 * AgentBI 系统上下文构建器
 *
 * 参考 Claude Code 的 System Reminders 机制：
 * 1. 先将编辑器当前状态收集到结构化 attachObject
 * 2. 再序列化为 XML 包裹的字符串作为 system role 消息注入
 *
 * 注入时机：每次 processAgentStream 发送前，保证 AI 无需额外工具调用
 * 即可感知选中组件、@提及组件、当前页面位置、当前页面组件列表。
 */
import type { ComponentType } from "@screenwright/types";

import router from "@/router";
import { buildScreenWorkspaceDir } from "@/utils/screenWorkspace";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import { useLargeScreenInfo } from "../../../useLargeScreenInfo";
import { useEditStore } from "../../buildRender/hooks/useEditStore";
import { usePanelData } from "../../panelEditor/usePanelData";
import { buildComponentPath } from "../componentPath";

// ── AttachObject 类型定义（对标 Claude Code ATTACHMENT_OBJECT）────────────

interface PageInfo {
  type: "screen" | "panel";
  /** 动态面板名称（仅 panel 时存在） */
  panelName?: string;
  /** 当前激活状态名称（仅 panel 时存在） */
  stateName?: string;
  /** 面板组件 ID（仅 panel 时存在） */
  panelId?: string;
  /** 激活状态 ID（仅 panel 时存在） */
  stateId?: string;
  /** 从根到当前面板的层级路径 */
  hierarchy?: Array<{ id: number; name: string }>;
}

/** 轻量组件摘要（用于选中、@提及、页面列表） */
interface ComponentSummary {
  id: number;
  name: string;
  prop: string;
  title: string;
  /** 全路径链路：namePath|idPath，与 @提及的 component-rf 同构，用于 agent 精确定位组件及 workspace 文件 */
  rf?: string;
}

export interface EditorContextAttachObject {
  currentPage: PageInfo;
  selectedComponents: ComponentSummary[];
  mentionedComponents: ComponentSummary[];
  /** 当前页面/状态下的所有组件（轻量：id / name / type） */
  pageComponents: ComponentSummary[];
  screenId?: number;
  versionCode?: string;
}

// ── Composable ────────────────────────────────────────────────────────────

export const useAgentBISystemContext = () => {
  const { navInfo } = useLargeScreenInfo();
  const { componentList, isDynamicPanel, selectTargetData } = useEditStore();
  const { allComponentMap } = useGlobalComponentData();
  const { activeStatusId, panelInfo } = usePanelData();

  /**
   * 收集编辑器当前状态，返回结构化 attachObject
   */
  const buildAttachObject = (mentionedComponents: ComponentType[]): EditorContextAttachObject => {
    const inPanel = isDynamicPanel();

    let currentPage: PageInfo;
    const largeScreenId = navInfo.value.id;
    const versionCode = navInfo.value.versionCode;

    if (inPanel) {
      // 不用 useRoute()：createAgentBISession 可能在事件回调(setup外)被调用，那时 useRoute() 返回 undefined 会抛错；
      // 改读全局 router 实例的 currentRoute，任何时机都能拿到当前路由。
      const panelId = router.currentRoute.value.params.cid as string;
      const panelComponent = allComponentMap.value.get(panelId);
      const panelName = panelComponent?.name ?? panelId;
      const activeState = panelInfo.value.config?.panelData?.find((s) => s.id === activeStatusId.value);
      const stateName = activeState?.name ?? activeStatusId.value ?? "未知状态";
      const hierarchy = buildHierarchy(Number(panelId), allComponentMap.value);

      currentPage = {
        hierarchy,
        panelId,
        panelName,
        stateId: activeStatusId.value ?? undefined,
        stateName,
        type: "panel"
      };
    } else {
      currentPage = { type: "screen" };
    }

    const pageComponents: ComponentSummary[] = componentList.value.map((c) => ({
      id: c.id,
      name: c.name,
      prop: c.component.prop,
      title: c.title
    }));

    const withRf = (comp: ComponentType): ComponentSummary => toComponentSummary(comp, allComponentMap.value);

    return {
      currentPage,
      mentionedComponents: mentionedComponents.map(withRf),
      pageComponents,
      screenId: largeScreenId,
      selectedComponents: selectTargetData.value.map(withRf),
      versionCode
    };
  };

  /**
   * 将 attachObject 序列化为 XML 包裹的 system context 字符串
   *
   * 格式参考 Claude Code system-reminder 机制，使用 <editor-context> 根标签
   * 内部各区域用独立 XML 子标签隔离，便于 AI 精确定位信息。
   */
  const buildSystemContext = (mentionedComponents: ComponentType[]): string => {
    const obj = buildAttachObject(mentionedComponents);

    const sections = [
      buildScreenInfoXml(obj.screenId, obj.versionCode),
      buildCurrentPageXml(obj.currentPage),
      buildSelectedComponentsXml(obj.selectedComponents),
      buildPageComponentsXml(obj.pageComponents)
    ].filter(Boolean);

    return `<editor-context>\n${sections.join("\n\n")}\n</editor-context>`;
  };

  return { buildAttachObject, buildSystemContext };
};

// ── 模块内部工具函数 ───────────────────────────────────────────────────────

function toComponentSummary(comp: ComponentType, allComponentMap: Map<string, ComponentType>): ComponentSummary {
  const { namePath, idPath } = buildComponentPath(comp, allComponentMap);
  return {
    id: comp.id,
    name: comp.name,
    prop: comp.component?.prop ?? "",
    rf: `${namePath}|${idPath}`,
    title: comp.title ?? ""
  };
}

function formatComponentXml(comp: ComponentSummary): string {
  const rfAttr = comp.rf ? ` rf="${comp.rf}"` : "";
  return `  <component id="${comp.id}" name="${comp.name}" prop="${comp.prop}" title="${comp.title}"${rfAttr} />`;
}

function buildScreenInfoXml(screenId?: number, versionCode?: string): string {
  if (screenId == null) {
    return "";
  }
  return `<screen-info>\n大屏ID: ${screenId}，版本号: ${versionCode ?? ""}，Workspace目录: ${buildScreenWorkspaceDir(screenId, versionCode ?? "")}\n</screen-info>`;
}

function buildCurrentPageXml(page: PageInfo): string {
  if (page.type === "panel") {
    const hierarchyStr =
      page.hierarchy && page.hierarchy.length > 0
        ? `大屏根 > ${page.hierarchy.map((h) => `「${h.name}」`).join(" > ")} > 状态「${page.stateName}」`
        : undefined;

    return (
      `<current-page>` +
      `\n类型: 动态面板` +
      `\n面板名称: 「${page.panelName}」` +
      `\n当前状态: 「${page.stateName}」` +
      `\n面板ID: ${page.panelId}，状态ID: ${page.stateId ?? ""}` +
      (hierarchyStr ? `\n层级路径: ${hierarchyStr}` : "") +
      `\n</current-page>`
    );
  }
  return `<current-page>\n类型: 大屏根画布\n</current-page>`;
}

function buildSelectedComponentsXml(components: ComponentSummary[]): string {
  if (components.length === 0) {
    return `<selected-components>无</selected-components>`;
  }
  const inner = components.map(formatComponentXml).join("\n");
  return `<selected-components>\n${inner}\n</selected-components>`;
}

function buildPageComponentsXml(components: ComponentSummary[]): string {
  if (components.length === 0) {
    return "";
  }
  const inner = components.map(formatComponentXml).join("\n");
  return `<page-components>\n${inner}\n</page-components>`;
}

function buildHierarchy(
  panelId: number,
  componentMap: Map<string, ComponentType & { parentDynamicPanelId: number[] }>
): Array<{ id: number; name: string }> {
  const comp = componentMap.get(`${panelId}`);
  if (!comp) {
    return [];
  }

  const hierarchy = (comp.parentDynamicPanelId ?? [])
    .map((id) => {
      const parent = componentMap.get(`${id}`);
      return parent ? { id, name: parent.name } : null;
    })
    .filter(Boolean) as Array<{ id: number; name: string }>;

  hierarchy.push({ id: panelId, name: comp.name });
  return hierarchy;
}
