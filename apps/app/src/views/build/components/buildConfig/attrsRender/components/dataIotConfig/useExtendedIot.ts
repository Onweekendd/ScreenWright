import { computed, ref } from "vue";

import { iotApiService } from "@screenwright/composables";
import type { DeviceOperateAttribute, DeviceOperateItem, ProductCategory, ProductItem } from "@screenwright/types";
import { ElMessage } from "element-plus";

import type { IotConfig } from "@/views/build/components/buildRender/type";

import { useIotConfig } from "./useIotConfig";

/**
 * 扩展的IoT配置逻辑的hook
 * 处理产品分类、操作等额外逻辑
 */
export function useExtendedIot() {
  const { update, iotConfig, baseUrl, getDeviceRawData, ...rest } = useIotConfig();

  // 原始数据
  const categoryRawData = ref<ProductCategory[]>([]);
  const belongRawData = ref<ProductItem[]>([]);
  const operateRawData = ref<DeviceOperateItem[]>([]);
  const customAttributeList = ref<DeviceOperateAttribute[]>([]);

  // 计算属性 - 产品分类选项
  const categoryOptions = computed(() => {
    return categoryRawData.value.map((item) => ({
      ...item,
      label: item.categoryName,
      value: item.id
    }));
  });

  // 计算属性 - 所属产品选项
  const belongOptions = computed(() => {
    return belongRawData.value.map((item) => ({
      ...item,
      label: item.productName,
      code: item.code,
      value: item.code
    }));
  });

  // 计算属性 - 操作选项
  const operateOptions = computed(() => {
    return operateRawData.value.map((item) => ({
      ...item,
      id: item.code,
      label: item.description,
      value: item.code
    }));
  });

  // 获取产品分类列表
  const getProductCategories = async () => {
    if (!baseUrl.value) {
      return;
    }

    try {
      const {
        data: { result }
      } = await iotApiService.listByProductCategory();
      // 注意：这里返回的是 ProductItem[]，需要转换为 ProductCategory[]
      // 或者根据实际API返回类型调整类型定义
      categoryRawData.value = result;
    } catch (error) {
      ElMessage.error("获取产品分类失败");
    }
  };

  // 根据分类ID获取所属产品
  const renderBelongOptions = async () => {
    if (!iotConfig.value.productCategoryId || !baseUrl.value) {
      return;
    }

    try {
      const dataList = await iotApiService
        .listByCategoryId(Number(iotConfig.value.productCategoryId))
        .then((res) => res.data.result || []);
      belongRawData.value = dataList;
    } catch (error) {
      ElMessage.error("获取所属产品失败");
    }
  };

  // 根据设备ID获取操作列表
  const listDeviceOperateByDeviceId = async (isOperate = false) => {
    if (!iotConfig.value.deviceId || !baseUrl.value) {
      return;
    }

    try {
      const {
        data: { result }
      } = await iotApiService.listDeviceOperateByDeviceId(Number(iotConfig.value.deviceId));
      operateRawData.value = result;

      if (isOperate) {
        const operateInfo = operateRawData.value.find((item) => item.code === iotConfig.value.operateCode);
        if (operateInfo) {
          customAttributeList.value = [...operateInfo.attributes];
        }
      }
    } catch (error) {
      ElMessage.error("获取操作列表失败");
    }
  };

  // 重置配置字段
  const resetIotConfig = (fields: Array<keyof IotConfig>) => {
    fields.forEach((item) => {
      iotConfig.value[item] = undefined as never;
    });
  };

  // 更新自定义属性列表
  const updateCustomAttributeList = (attributes: any[]) => {
    customAttributeList.value = [...attributes];

    if (!iotConfig.value.params) {
      iotConfig.value.params = {};
    }

    // 设置默认值
    attributes.forEach((item: any) => {
      iotConfig.value.params![item.attributeName] = item.defaultValue;
    });
  };

  // 事件函数（on*）
  const onCategoryChange = () => {
    renderBelongOptions();
    resetIotConfig(["deviceId", "productCode", "operateCode", "operateDescription"]);
    update();
  };

  const onBelongChange = () => {
    resetIotConfig(["deviceId", "operateCode", "operateDescription"]);
    getDeviceRawData();
    update();
  };

  const onDeviceChange = () => {
    listDeviceOperateByDeviceId();
    resetIotConfig(["operateCode", "operateDescription"]);
    update();
  };

  const onOperateChange = (value: string) => {
    const operateInfo = operateRawData.value.find((item) => item.code === value);
    if (operateInfo) {
      iotConfig.value.operateDescription = operateInfo.description;
      updateCustomAttributeList(operateInfo.attributes);
      update();
    }
  };

  // 加载所有选项数据
  const loadAllOptions = async () => {
    await getProductCategories();

    if (iotConfig.value.productCategoryId) {
      await renderBelongOptions();
    }

    if (iotConfig.value.deviceId) {
      await listDeviceOperateByDeviceId(true);
    }
  };

  const initializeData = async () => {
    await rest.initializeData();
    await loadAllOptions();
  };

  const onIotAddressChange = () => {
    rest.onIotAddressChange();
    getProductCategories();
  };

  return {
    // 状态
    iotConfig,
    categoryOptions,
    belongOptions,
    operateOptions,
    customAttributeList,
    baseUrl,

    // 原始数据
    categoryRawData,
    belongRawData,
    operateRawData,
    ...rest,

    // 方法
    onIotAddressChange,
    getProductCategories,
    renderBelongOptions,
    listDeviceOperateByDeviceId,
    resetIotConfig,
    updateCustomAttributeList,
    loadAllOptions,
    initializeData,
    // 事件处理（on*）
    onCategoryChange,
    onBelongChange,
    onDeviceChange,
    onOperateChange,

    // 工具
    update
  };
}
