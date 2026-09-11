/** editor 捕获计划：顶层 componentList 节点 + 分类 */
import { CaptureNodeKind, ComponentTreeCapture, findHostByComponentId, Utils } from "../captureUtils";
import type { CaptureComponentItem, CapturePlanNode, ComponentList } from "../types/captureInternal";
import { CaptureNodeClassifier } from "./captureNodeClassifier";
import { PanelEntryResolver } from "./panelEntryResolver";

export const CaptureTreeWalker = {
  /** 是否 panelData 内子项（editor 顶层不应单独截） */
  isPanelInnerItem(item: CaptureComponentItem, componentList: ComponentList) {
    if (!item || item.id == null) {
      return false;
    }
    let inner = false;
    ComponentTreeCapture.walkComponents(componentList, (panel) => {
      if (inner || !ComponentTreeCapture.isPanelComponent(panel)) {
        return;
      }
      ComponentTreeCapture.getActivePanelConfigs(panel)
        .flat()
        .forEach((child) => {
          if (child && String(child.id) === String(item.id)) {
            inner = true;
          }
        });
    });
    return inner;
  },

  /** editor 顶层 componentList 节点（性能：不 deep scan 全 DOM） */
  listEditorTopLevelItems(componentList: ComponentList) {
    if (!Array.isArray(componentList)) {
      return [];
    }
    return componentList.filter((item) => item && !this.isPanelInnerItem(item, componentList));
  },

  /** 构建 editor 捕获计划（分类 + 面板入口，供 panelStitch 使用） */
  buildEditorCapturePlan(editor: HTMLElement, componentList: ComponentList, viewWrapper: HTMLElement) {
    const tops = this.listEditorTopLevelItems(componentList);
    const plan: CapturePlanNode[] = [];

    for (const item of tops) {
      if (item.id == null) {
        continue;
      }
      const host = findHostByComponentId(viewWrapper, item.id);
      if (!host) {
        Utils.log("warn", "捕获计划 DOM 缺失", item.id, item.component?.prop);
        continue;
      }
      const kind = CaptureNodeClassifier.classify(item, host);
      const node: CapturePlanNode = {
        id: String(item.id),
        kind,
        prop: item.component?.prop,
        zIndex: Number(item.zIndex) || 0
      };

      if (CaptureNodeClassifier.isPanelKind(kind)) {
        node.contentRoot = !!PanelEntryResolver.getContentRoot(host, kind, item.component?.prop ?? "");
        node.innerCount = ComponentTreeCapture.getActivePanelConfigs(item).flat().length;
      } else if (kind === CaptureNodeKind.GROUP) {
        node.childIds = (item.children || []).map((c) => String(c.id));
      }

      plan.push(node);
    }

    Utils.log(
      "info",
      "editor 捕获计划",
      plan.map((p) => p.id + ":" + p.kind + (p.innerCount != null ? "(" + p.innerCount + ")" : ""))
    );
    return plan;
  }
};
