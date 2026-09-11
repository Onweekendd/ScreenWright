import { ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import type { InterfaceDebuggerReq } from "@/model/InterfaceDebugger";

export const useParams = createGlobalState(() => {
  const params = ref<InterfaceDebuggerReq>({
    size: 14,
    current: 1,
    groupId: -2,
    name: "",
    time: 1
  });
  return {
    params
  };
});
