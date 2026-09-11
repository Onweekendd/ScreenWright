import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { createGlobalState } from "@vueuse/core";

import { ElMessage } from "element-plus";
import { assign } from "lodash-es";

import { getDataApiList, getDataDbList, getDataLocalList, getDataSocketList } from "@/api/dataSource";
import { useSiderTreeData } from "@/layout/Siderbar/components/siderTree/useSiderTreeData";
import type { DbItem } from "@/model/DataModel";
import { to } from "@/utils/await-to-js";

import { Table_Label } from "./fild";
import type { ApiFunction } from "./type";
import { DataSourceType, statusReflectionType } from "./type";

export const useSourceList = createGlobalState(() => {
  const { currentNode } = useSiderTreeData();
  const route = useRoute();
  const menuActive = ref<DataSourceType>(DataSourceType.LOCAL);
  const statusReflection: { [key: string]: statusReflectionType } = {
    all: statusReflectionType.all,
    grouped: statusReflectionType.grouped,
    ungrouped: statusReflectionType.ungrouped
  };
  const tableData = ref<DbItem[]>([]);
  const total = ref(0);
  const params = ref({
    current: 1,
    size: 10,
    groupId: -2,
    name: "",
    status: -2
  });
  const name = ref("");
  const loading = ref(false);

  const groupId = computed(() => {
    return currentNode.value?.id;
  });

  const currentColumn = computed(() => {
    return Table_Label(menuActive.value);
  });

  const apiMap = new Map<DataSourceType, ApiFunction>([
    [DataSourceType.LOCAL, getDataLocalList],
    [DataSourceType.DB, getDataDbList],
    [DataSourceType.API, getDataApiList],
    [DataSourceType.TCPUDP, getDataSocketList]
  ]);
  const getMenuApi = computed(() => {
    const currentMenu = menuActive.value;
    return apiMap.get(currentMenu);
  });

  // 开源单机版无菜单级权限：数据源类型页签直接写死，不再依赖后端菜单树的子节点。
  // 后端只回落了 本地文件 / 数据库 / API 三类（见 data-source.route.ts）。
  const tabsList = computed(() => [
    { name: "本地文件", value: DataSourceType.LOCAL },
    { name: "数据库", value: DataSourceType.DB },
    { name: "API", value: DataSourceType.API }
  ]);

  const actionList = ref([
    { name: "下载", value: "download", icon: "download", type: ["local"] },
    { name: "预览", value: "preview", icon: "view", type: ["local", "api"] },
    { name: "编辑", value: "edit", icon: "iconfont-bianji", type: ["local", "db", "api", "tcpudp"] },
    { name: "删除", value: "delete", icon: "iconfont-shanchu1", type: ["local", "db", "api", "tcpudp"] }
  ]);

  const eventBtns = computed(() => {
    return actionList.value.filter((v) => v.type.includes(menuActive.value));
  });

  const createParams = () => {
    const statusName = currentNode.value?.name;
    const outsider = currentNode.value?.outsider;
    const addParams = {
      groupId: groupId.value,
      name: name.value,
      status: !outsider || !statusName ? null : statusReflection[statusName]
    };
    const apiParams = assign({}, params.value, addParams);
    return apiParams;
  };

  const getTableListData = async () => {
    loading.value = true;
    const currentApi = getMenuApi.value;
    const apiParams = createParams();

    if (!currentApi) {
      ElMessage.error("获取数据失败");
      loading.value = false;
      return;
    }
    const [error, res] = await to(currentApi(apiParams));
    if (error) {
      ElMessage.error(error.message || "获取数据失败");
      loading.value = false;
      return;
    }
    if (res && res.success) {
      tableData.value = res.result.records;
      total.value = res.result.total;
      if (menuActive.value === DataSourceType.DB) {
        tableData.value = tableData.value.map((item: DbItem) => {
          const config = item.config ? JSON.parse(item.config) : {};
          return {
            ...item,
            ...config
          };
        });
      }
    }
    loading.value = false;
  };
  const menuClick = (item: any) => {
    menuActive.value = item.value;
    name.value = "";
    params.value.current = 1;
    getTableListData();
  };

  watch(
    () => currentNode.value,
    async (nVal) => {
      if (route.path !== "/source") {
        return;
      }
      if (nVal) {
        if (nVal.id === "") {
          return;
        }
        params.value.current = 1;
        params.value.name = "";
        menuActive.value = DataSourceType.LOCAL;
        await getTableListData();
      }
    },
    {
      immediate: true
    }
  );

  return {
    currentColumn,
    actionList,
    tableData,
    params,
    total,
    loading,
    name,
    tabsList,
    menuActive,
    eventBtns,
    menuClick,
    getTableListData
  };
});
