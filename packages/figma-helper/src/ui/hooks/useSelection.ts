import { ref, computed, type Ref } from "vue";
import type { NodeInfo, UIMessage } from "../../types";

export function useSelection(onMessage: (handler: (msg: UIMessage) => void) => () => void) {
  const selectedNodes = ref<NodeInfo[]>([]);
  const singleSelected = computed(() => selectedNodes.value.length === 1);
  const isRootNode = computed(() => {
    if (selectedNodes.value.length !== 1) return false;
    return selectedNodes.value[0].name.endsWith("-exhibition");
  });

  onMessage((msg) => {
    if (msg.type === "selectionChange") {
      selectedNodes.value = msg.nodes;
    }
  });

  return { selectedNodes, singleSelected, isRootNode };
}
