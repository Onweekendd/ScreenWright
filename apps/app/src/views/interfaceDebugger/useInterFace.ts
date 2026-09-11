import { ref, watch } from "vue";
import { useRoute } from "vue-router";

import { getInterfaceDebugger } from "@/api/interfaceDebugger";
import { useSiderTreeData } from "@/layout/Siderbar/components/siderTree/useSiderTreeData";
import type { InterfaceDebuggerReq, InterfaceItem } from "@/model/InterfaceDebugger";
import to from "@/utils/await-to-js";

import { useParams } from "./useParams";

export const useInterFace = () => {
  const { currentNode } = useSiderTreeData();
  const route = useRoute();
  const listData = ref<InterfaceItem[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const { params } = useParams();
  const handleSearch = (searchParams: InterfaceDebuggerReq) => {
    params.value.current = 1;
    params.value.size = 14;
    params.value = Object.assign(params.value, searchParams);
    getListData();
  };

  const getListData = async () => {
    loading.value = true;
    const [error, res] = await to(getInterfaceDebugger(params.value));
    if (error) {
      loading.value = false;
      return;
    }
    if (res && res.success) {
      listData.value = res.result.records;
      total.value = res.result.total;
    } else {
      listData.value = [];
      total.value = 0;
    }
    loading.value = false;
  };

  watch(
    () => currentNode.value,
    async (nVal) => {
      if (route.path !== "/interfaceDebugger") {
        return;
      }
      if (nVal) {
        if (nVal.id === "") {
          return;
        }
        params.value.current = 1;
        params.value.name = "";
        params.value.size = 14;
        params.value.time = 1;
        params.value.groupId = nVal.id;
        params.value.name = "";
        await getListData();
      }
    },
    {
      immediate: true
    }
  );

  return {
    total,
    params,
    loading,
    listData,
    handleSearch,
    getListData
  };
};
