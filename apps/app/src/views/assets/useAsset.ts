import { computed, nextTick, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { createGlobalState } from "@vueuse/core";

import { ElMessage } from "element-plus";

import { getVisualAssetDetailList, systemMaterialPage } from "@/api/assets";
import { useSiderTreeData } from "@/layout/Siderbar/components/siderTree/useSiderTreeData";
import type { assetItem, assetItemReq } from "@/model/Assets";
import to from "@/utils/await-to-js";

import { FileTypeEnum } from "../build/components/buildTabs/assetsEditFrom/type";
import { getFileType } from "./emum";

type typeTransformProps = Omit<assetItemReq, "resourceType"> & { resourceType: string[] };

export const useAsset = createGlobalState(() => {
  const { currentNode, treeData } = useSiderTreeData();
  const route = useRoute();
  const defaultTime = ref(1);
  const tableData = ref<assetItem[]>([]);
  const total = ref(0);
  const fileType = computed(() => {
    return getFileType(currentNode, treeData);
  });
  const sortTypeOptions = ref([
    { label: "按修改时间排序", value: 1 },
    { label: "按新建时间排序", value: 2 }
  ]);
  const params = ref<typeTransformProps>({
    resourceType: [],
    current: 1,
    size: 20,
    name: "",
    time: defaultTime.value,
    fileType: FileTypeEnum.personalPageAssets,
    groupId: 0,
    largeId: ""
  });
  const optionsName = computed(() => {
    return sortTypeOptions.value.find((item) => item.value === params.value.time)?.label;
  });
  // 获取普通列表数据
  const getVisualAssetDetailListApi = async () => {
    const transformParams: assetItemReq = {
      ...params.value,
      resourceType: ""
    };
    if (Array.isArray(params.value.resourceType)) {
      transformParams.resourceType = params.value.resourceType.join(",");
      transformParams.fileType = fileType.value;
    }
    const pageApi = fileType.value === FileTypeEnum.systemMaterial ? systemMaterialPage : getVisualAssetDetailList;
    const [error, res] = await to(pageApi(transformParams));
    if (error) {
      ElMessage.error(error.message);
      return;
    }
    if (res && res.result) {
      tableData.value = res.result.records;
      total.value = res.result.total;
    }
  };
  // 获取列表数据
  const getAssetsListData = async () => {
    tableData.value = [];
    await nextTick();
    if (!currentNode.value) {
      return;
    }
    // 有子分组的中间节点只负责展开，不直接请求列表。
    if (currentNode.value && currentNode.value.pid && currentNode.value.children && currentNode.value.children.length) {
      return;
    }
    getVisualAssetDetailListApi();
  };

  const handleSearch = () => {
    params.value.current = 1;
    getAssetsListData();
  };

  watch(
    () => currentNode.value,
    async (nVal) => {
      if (route.path !== "/assets") {
        return;
      }
      if (nVal) {
        if (nVal.id === "") {
          return;
        }

        params.value.current = 1;
        params.value.name = "";
        params.value.groupId = nVal.pid ? nVal.id : (nVal.groupId ?? 0);
        params.value.resourceType = [];
        getAssetsListData();
      }
    },
    {
      immediate: true
    }
  );
  return {
    params,
    total,
    fileType,
    optionsName,
    sortTypeOptions,
    tableData,
    currentNode,
    getFileType,
    getAssetsListData,
    handleSearch
  };
});
