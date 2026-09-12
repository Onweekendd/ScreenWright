// import { getScreenList } from "@/api/visual"
// import { addScreenData } from "@/api/dataSource"
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { createGlobalState } from "@vueuse/core";

import { ElLoading, ElMessage } from "element-plus";
import { debounce, flatten, orderBy } from "lodash-es";

import { addLayers } from "@/api/layer";
import { updateLayers } from "@/api/library";
import { useDialog } from "@/hooks/useDialog";
import type { MenuItem } from "@/layout/Siderbar/components/config/menuConfig";
import { useSiderTreeData } from "@/layout/Siderbar/components/siderTree/useSiderTreeData";
import type { DataModelReq } from "@/model/DataModel";
import type { ScreenItem, ScreenReq } from "@/model/Visual";
import { StockType } from "@/model/Visual";
import to from "@/utils/await-to-js";
import { configOpt } from "@/utils/configOptions";
import { uuid } from "@/utils/utils";
import { setVersionCode } from "@/utils/version";

import { generateLayersByFigma, generateLayersByPSD, getDataFromPSD, getModuleConfigById } from "./components/utils";
import defaultTemplate from "./defaultTemplate.vue";
import designImportForm from "./designImportForm.vue";
// import templateAddForm from "./templateAddForm.vue";
import { useModelApi } from "./useModelApi";
import { useTemplatePermissionMap } from "./useTemplatePermissonMap";

enum sortType {
  desc = "desc",
  asc = "asc"
}
export const useTemplateData = createGlobalState(() => {
  const { modelApi } = useModelApi();
  const { curMenuLabel, currentNode, treeData, refreshKey, getNodeById } = useSiderTreeData();
  const { dialog } = useDialog();
  const router = useRouter();
  const { permissionMap, setPermissionMap } = useTemplatePermissionMap();
  const loading = ref(false);
  const screenList = ref<ScreenItem[]>([]);
  const total = ref(0);
  // const { loading: importLoading } = useGlobalLoading()
  const currentNodeTotal = computed(() => {
    return currentNode.value?.count || 0;
  });
  const listRefreshKey = ref(0);

  const sortTypeOptions = ref([
    { label: "更新时间", value: "updatedTime", sortType: sortType.desc },
    { label: "创建时间", value: "createdTime", sortType: sortType.asc }
  ]);
  const optionsName = ref("更新时间");

  const params = ref<ScreenReq>({
    size: 9,
    current: 1,
    groupId: -2,
    name: "",
    stockType: StockType.news
  });
  const getTemplateListApi = async (data: ScreenReq) => {
    loading.value = true;
    const [error, res] = await to(modelApi.value.getScreenList(data));
    if (error) {
      loading.value = false;
    }
    loading.value = false;
    if (res && res.result) {
      screenList.value = setDataByStockType(res.result.records);
      setPermissionMap(screenList.value);
      total.value = res.result.total;
    }
    return res;
  };

  const setDataByStockType = (records: ScreenItem[]) => {
    const sortValue = sortTypeOptions.value.find((item) => item.label === optionsName.value)?.value;
    const sortType = sortTypeOptions.value.find((item) => item.label === optionsName.value)?.sortType;
    if (sortType && sortValue) {
      records = orderBy(records, [`${sortValue}`], [`${sortType}`]);
    }
    return records;
  };

  // 防抖函数
  const debouncedGetTemplateList = debounce(async (name: string) => {
    params.value.name = name;
    params.value.current = 1;
    await getTemplateListApi(params.value);
  }, 500);

  // 对数据进行排序
  const orderByProps = (props: string, sortType: sortType) => {
    optionsName.value = sortTypeOptions.value.find((item) => item.value === props)?.label || "";
    screenList.value = orderBy(screenList.value, [`${props}`], [`${sortType}`]);
  };
  const getSelectOptionsByNode = (node: MenuItem | null) => {
    if (!node) {
      return;
    }
    // 遍历treeData.value 找到 children.length>0的children
    const children = treeData.value
      .filter((item) => item.children && item.children.length > 0)
      .map((item) => item.children);
    const options = flatten(children);
    if (node.outsider) {
      options.unshift(node);
    }
    return options;
  };

  const getAddParams = (dataRes: { name: string; groupId: number }): DataModelReq => {
    const detail = {
      ...configOpt,
      name: dataRes.name,
      height: "1080",
      width: "1920"
    };
    const params: DataModelReq = {
      applicationCode: "BI",
      config: "[]",
      password: "",
      name: dataRes.name,
      groupId: dataRes.groupId ? (dataRes.groupId < 0 ? 0 : dataRes.groupId) : 0,
      detail: JSON.stringify(detail),
      type: 1
    };
    return params;
  };

  const handleAddTemplate = () => {
    const options = getSelectOptionsByNode(currentNode.value);
    if (!currentNode.value) {
      return;
    }

    dialog({
      DialogProps: {
        title: "创建新的项目",
        width: "1000px"
      },
      componentProps: {
        options: options as any,
        defaultFormData: {
          name: ""
        },
        defaultGroupId: currentNode.value.id
      },
      component: defaultTemplate,
      closeBefore: async (componentData, done) => {
        // componentData.setLoading(true);
        const dataRes = await componentData.validate();
        if (dataRes.success) {
          if (dataRes.type === 1) {
            // 模版
            const id = dataRes.result.id;
            setVersionCode("1");
            router.push({
              path: "build/" + id
            });
          } else if (dataRes.type === 0) {
            componentData.setLoading(true);
            const paramsReq = getAddParams(dataRes);
            const [error, res] = await to(modelApi.value.addScreenData(paramsReq));
            if (error) {
              ElMessage.error("新建失败");
            } else {
              if (res.success) {
                setVersionCode("1");
                ElMessage.success("新建成功");
                router.push({
                  path: "build/" + res.result.id
                });
              } else {
                ElMessage.error(res.message || "新建失败");
              }
            }
            componentData.setLoading(false);
          }
          done();
        }
      }
    });
  };

  const refreshList = async (isCurrentFresh = false) => {
    if (!isCurrentFresh) {
      params.value.current = 1;
    }
    await getTemplateListApi(params.value);
    // refreshKey.value++;
  };

  const handleImportDesign = async (params: any, done: () => void) => {
    const loadingInstance = ElLoading.service({
      lock: true,
      text: "",
      background: "rgba(0, 0, 0, 0.5)",
      spinner: ""
    });
    const { type, groupId, name, figma, file, fileName, link } = params || {};
    const isPsd = type === "psd";
    const url = isPsd ? URL.createObjectURL(file.raw) : "";
    const cData = isPsd ? await getDataFromPSD(url) : {};
    const generalFunc = isPsd ? generateLayersByPSD : generateLayersByFigma;
    const funcParams = isPsd ? cData : figma;
    const { option } = figma || {};
    if (!funcParams) {
      return false;
    }
    const displayForm = ref({
      name: "",
      status: false,
      type: 1,
      width: 0,
      height: 0,
      groupId: -1
    });
    displayForm.value.name = name;
    displayForm.value.status = false;
    displayForm.value.type = 1;
    displayForm.value.width = isPsd ? cData.width : option.width;
    displayForm.value.height = isPsd ? cData.height : option.height;
    displayForm.value.groupId = groupId || "";

    let renderCount = false;
    const paramsReq = getAddParams(params);
    const [error, res] = await to(modelApi.value.addScreenData(paramsReq));
    if (error) {
      ElMessage.error("新建大屏失败");
      return false;
    }
    const result = res.result;
    const panelConfig = await getModuleConfigById(69);
    const panelReuslt = await addLayers({
      moduleId: 69,
      largeId: result.id,
      status: false,
      isSaved: 1
    }).then((res) => res.result);
    Object.assign(panelConfig, {
      left: 0,
      top: 0,
      id: panelReuslt.id,
      zIndex: 0,
      cbArgs: [],
      name: isPsd ? fileName : option.name
    });
    panelConfig.component.width = isPsd ? cData.width : option.width;
    panelConfig.component.height = isPsd ? cData.height : option.height;
    const newPanelData = {
      id: uuid(),
      title: `状态${1}`,
      name: `状态${1}`,
      config: [],
      // 当前状态背景颜色
      backgroundColor: isPsd ? "" : option.backgroundColor,
      // 当前状态背景图片是否显示
      showBackgroundImage: false,
      // 当前状态背景图片
      backgroundImage: "",
      // 屏幕自适应
      showScreenAdaptation: false,
      adaptationNorm: "default",
      adaptationType: 2,
      accessUrl: link
    };
    panelConfig.panelData.push(newPanelData);
    await generalFunc(funcParams, result, async (config: any) => {
      if (renderCount) {
        return;
      }
      renderCount = true;
      panelConfig.panelData[0].config = config;
      await updateLayers({
        id: panelReuslt.id,
        moduleId: 69,
        status: false,
        minioIds: "[]",
        config: JSON.stringify(panelConfig)
      });
      loadingInstance.close();
      refreshList();
      done();
      ElMessage.success("导入成功");
    });
    return true;
  };

  // 打开设计图导入弹窗
  const handleDesignDialog = () => {
    const children = treeData.value
      .filter((item) => item.children && item.children.length > 0)
      .map((item) => item.children);
    const options = flatten(children);
    dialog({
      DialogProps: {
        title: "导入设计图",
        width: "40%"
      },
      componentProps: {
        options: options as any
      },
      component: designImportForm,
      async closeBefore(componentData, done) {
        const formData = componentData.formData;
        await handleImportDesign(formData, done);
      }
    });
  };

  watch(
    () => params.value.name,
    (nVal) => {
      if (nVal === null) {
        nVal = "";
      }
      debouncedGetTemplateList(nVal);
    }
  );
  watch(
    () => currentNode.value,
    async (nVal) => {
      if (nVal) {
        if (nVal.id === "") {
          return;
        }
        params.value.groupId = nVal.id;
        params.value.current = 1;
        params.value.name = "";
        await getTemplateListApi(params.value);
      }
    },
    {
      immediate: true
    }
  );

  return {
    screenList,
    permissionMap,
    total,
    params,
    loading,
    optionsName,
    sortTypeOptions,
    curMenuLabel,
    currentNodeTotal,
    refreshKey,
    currentNode,
    treeData,
    listRefreshKey,
    getSelectOptionsByNode,
    getNodeById,
    orderByProps,
    handleAddTemplate,
    refreshList,
    getTemplateListApi,
    handleDesignDialog
  };
});
