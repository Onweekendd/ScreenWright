import type { ComputedRef } from "vue";
import { computed, nextTick, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { createGlobalState } from "@vueuse/core";

import type { ElTree } from "element-plus";
import { assign, cloneDeep } from "lodash-es";

import { getDataUrl } from "@/api/dataSource";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";
import type { ListItem } from "@/model/DataModel";
import to from "@/utils/await-to-js";
import { uuid } from "@/utils/utils";

import { menuConfig, type MenuItem } from "../config/menuConfig";
import type { GroupURLConfig } from "../config/urlConfig";
import { getGroupURL, URLKeys } from "../config/urlConfig";
import { convertPathToName } from "./utils";

// 创建全局状态管理
export const useSiderTreeData = createGlobalState(() => {
  const route = useRoute();
  const treeData = ref<MenuItem[]>([]);
  const elTreeRef = ref<InstanceType<typeof ElTree>>();
  const isLoad = ref(false);

  const currentNode = ref<MenuItem | null>(null);
  const refreshKey = ref(1);
  const defaultExpandedKeys = ref<Array<number | string>>([]);
  const treeDataMap = ref<Record<string, any>>({});
  const { loading } = useGlobalLoading();
  // 计算当前菜单项的标签
  const curMenuLabel = computed(() => {
    return currentNode.value?.label;
  });

  const isShowSide = computed(() => {
    const whiteRouteList = ["/pluginLibrary"];
    return !whiteRouteList.includes(route.path);
  });

  /**
   * 计算当前菜单项，排除 team 键
   */
  const curMenu: ComputedRef<Exclude<URLKeys, URLKeys.team>> = computed(() => {
    const menu = convertPathToName(route.path);

    if (menu === URLKeys.team) {
      throw new Error("Invalid menu key: team");
    }
    return menu as Exclude<URLKeys, URLKeys.team>;
  });

  /**
   * 获取数据的基本路径和数据路径
   * @param type - 请求类型，默认为 "get"
   * @returns 包含 dataBase 和 dataPath 的对象
   */
  const getDataBasePath = (type: keyof GroupURLConfig = "get") => {
    if (!curMenu.value) {
      return null;
    }
    return {
      dataBase: getGroupURL.base[curMenu.value as Exclude<URLKeys, URLKeys.team>],
      dataPath: getGroupURL[type][curMenu.value as Exclude<URLKeys, URLKeys.team>]
    };
  };

  /**
   * 深度优先遍历树数据
   * @param data - 列表项数据
   * @returns 转换后的菜单项数组
   */
  const dfsTreeData = (data: ListItem[]) => {
    const treeData = cloneDeep(data);
    const res: MenuItem[] = [];
    const dfs = (treeData: ListItem[]) => {
      if (!treeData) {
        return;
      }
      let zIndex = 1;
      for (let i = 0; i < treeData.length; i++) {
        const cur = treeData[i];
        treeDataMap.value[cur.id] = cur;
        const targetRes: MenuItem = assign(cur, {
          showInput: false,
          label: cur.name,
          icon: "folder-close",
          children: dfsTreeData(cur.projectDataGroupDetails || []),
          outsider: false,
          add: false,
          zIndex: zIndex++,
          uuid: uuid(6)
        });
        res.push(targetRes);
        if (cur.projectDataGroupDetails && cur.projectDataGroupDetails.length > 0) {
          dfs(cur.projectDataGroupDetails);
        }
      }
    };
    dfs(treeData);
    return res;
  };

  const handleAssetsData = (result: Record<string, any>, defaultMenu: any) => {
    // 处理分组数据的通用函数
    const processGroup = (group: any) => ({
      ...group,
      list: dfsTreeData(group.list)
    });
    const pageGroups = processGroup(result.pageGroups);
    const systemGroups = processGroup(result.systemGroups);
    // 处理defaultMenu某一项的通用函数
    const processMenuItem = (index: number, group: any) => {
      defaultMenu[index].count = "";
      defaultMenu[index].children = [
        ...group.list.map((it: any) => {
          return {
            ...it,
            count: it.count,
            pid: defaultMenu[index].id,
            icon: "folder-close"
          };
        }),
        {
          ...defaultMenu[index].children[0],
          count: group.unCount,
          icon: "folder-close"
        }
      ];
    };
    processMenuItem(0, pageGroups);
    defaultMenu[1].count = systemGroups.allCount;
    defaultMenu[1].children = systemGroups.list.map((it: any) => ({
      ...it,
      count: it.count,
      pid: defaultMenu[1].id,
      icon: "folder-close",
      outsider: true,
      add: false,
      uuid: uuid(6),
      isNotMore: true
    }));
  };

  /**
   * 获取树数据
   */
  const getTreeData = async (isCheckedFirst = true) => {
    const paths = getDataBasePath("get");
    if (paths && paths.dataBase && paths.dataPath) {
      const { dataBase, dataPath } = paths;
      if (!dataBase || !dataPath) {
        return;
      }
      loading.value = true;

      const [err, res] = await to(
        getDataUrl({
          options: {
            base: dataBase,
            path: dataPath,
            type: "get"
          }
        })
      );
      if (err) {
        loading.value = false;
        throw new Error("获取树数据失败");
      }
      if (res && res.success) {
        loading.value = false;
        const resData = dfsTreeData(res.result.list);
        const defaultMenu = cloneDeep(menuConfig[curMenu.value]);
        if (curMenu.value === "assets") {
          handleAssetsData(res.result, defaultMenu);
          treeData.value = defaultMenu;
        } else {
          defaultMenu[1].children = resData;
          defaultMenu[0].count = res.result.allCount;
          defaultMenu[1].count = res.result.groupedCount;
          defaultMenu[2].count = res.result.unCount || res.result.unGroupedCount;
          treeData.value = defaultMenu;
        }
      }
      if (isCheckedFirst) {
        if (treeData.value && treeData.value.length > 0) {
          if (treeData.value[0].uuid) {
            await setTreeChecked(treeData.value[0].uuid);
          }
          await setCurrentNode();
        }
      }
    }
    loading.value = false;
    isLoad.value = true;
  };

  /**
   * 设置第一个节点为选中项
   */
  const setFirstNode = async () => {
    await nextTick();
    if (!currentNode.value) {
      return;
    }
    if (currentNode.value.uuid === treeData.value[0].uuid) {
      return;
    }
    if (treeData.value[0].uuid) {
      setTreeChecked(treeData.value[0].uuid);
    }
    setCurrentNode();
  };

  /**
   * 根据 ID 删除节点
   * @param id - 节点 ID
   */
  const deleteNodeById = async (id: string) => {
    // 删除 treeData 中的节点
    const deleteNode = (data: MenuItem[], id: string) => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].uuid === id) {
          data.splice(i, 1);
          return;
        }
        if (data[i].children && data[i].children.length > 0) {
          deleteNode(data[i].children, id);
        }
      }
    };
    deleteNode(treeData.value, id);
  };

  /**
   * 设置树的选中项
   * @param id - 选中项的 ID
   */
  const setTreeChecked = async (id: string | number) => {
    await nextTick();
    elTreeRef.value?.setCurrentKey(id);
  };

  /**
   * 设置当前节点
   */
  const setCurrentNode = async () => {
    currentNode.value = null;
    await nextTick();
    const node = elTreeRef.value?.getCurrentNode();
    if (node) {
      handleNodeClick(node as MenuItem);
    }
  };

  /**
   * 根据 ID 获取节点
   * @param id - 节点 ID
   * @returns 节点
   */
  const getNodeById = (id: number | string) => {
    return elTreeRef.value?.getNode(id);
  };

  /**
   * 处理节点点击事件
   * @param node - 节点
   */
  const handleNodeClick = (node: MenuItem) => {
    currentNode.value = node;
  };

  /**
   * 设置默认展开的节点
   * @param keys - 节点 ID
   */
  const setDefaultExpandedKeys = (keys: number | string) => {
    defaultExpandedKeys.value = [];
    defaultExpandedKeys.value = [keys];
  };

  watch(
    () => route.path,
    () => {
      getTreeData();
    }
  );

  return {
    name: curMenu,
    curMenuLabel,
    treeData,
    elTreeRef,
    currentNode,
    refreshKey,
    defaultExpandedKeys,
    isLoad,
    isShowSide,
    treeDataMap,
    getNodeById,
    setCurrentNode,
    getTreeData,
    setDefaultExpandedKeys,
    setTreeChecked,
    deleteNodeById,
    setFirstNode,
    handleNodeClick
  };
});
