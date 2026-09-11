import { ref } from "vue";
import type { PluginMessage, NodeInfo, UIMessage } from "../../types";

export type Mode = "append" | "replace";

export const SUFFIXES = [
  { label: "-panel", desc: "动态面板" },
  { label: "-merge", desc: "合并层（需为 FRAME）" },
  { label: "-status", desc: "状态容器" },
  { label: "-subtab", desc: "选项卡" },
  { label: "-image", desc: "图片" },
  { label: "-group", desc: "分组" },
  { label: "-exhibition", desc: "根节点" }
];

export function useNamingSuffix(
  postMessage: (msg: PluginMessage) => void,
  selectedNodes: { value: NodeInfo[] },
  showToast: (msg: string) => void
) {
  const mode = ref<Mode>("replace");

  function applySuffix(suffix: string) {
    if (selectedNodes.value.length === 0) {
      showToast("请先在 Figma 中选中节点");
      return;
    }
    postMessage({ type: "applySuffix", suffix, mode: mode.value });
  }

  /** 一键规范命名：对选中的顶层文件帧递归自动打后缀 */
  function autoNameStructure() {
    const node = selectedNodes.value[0];
    if (!node) {
      showToast("请先在 Figma 中选中顶层文件帧");
      return;
    }
    postMessage({ type: "autoNameStructure", nodeId: node.id });
  }

  return { mode, SUFFIXES, applySuffix, autoNameStructure };
}
