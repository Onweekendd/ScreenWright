import { computed, ref, toRaw } from "vue";

import { iotApiService } from "@screenwright/composables";
import type { DeviceControlConfigList, DeviceGroup, DeviceRecord, ProductItem } from "@screenwright/types";
import { ElMessage } from "element-plus";

import { getDataSocketList } from "@/api/dataSource";
import type { DbItem } from "@/model/DataModel";
import to from "@/utils/await-to-js";
import { useUpdateInstance } from "@/views/build/components/buildConfig/useUpdateInstance";
import { EquipmentEnumType } from "@/views/build/components/buildRender/core/EquipmentComponent/type";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import type { IotConfig } from "@/views/build/components/buildRender/type";

/**
 * IoT配置相关逻辑的hook
 */
export function useIotConfig() {
  const { update } = useUpdateInstance({
    history: false
  });

  const { selectTargetData } = useEditStore();

  // IoT配置的计算属性
  const iotConfig = computed<IotConfig>({
    get: () => {
      return selectTargetData.value[0].iotConfig || ({} as IotConfig);
    },
    set: (value) => {
      selectTargetData.value[0].iotConfig = value;
    }
  });

  // 操作代码的计算属性
  const operateCode = computed(() => {
    return iotConfig.value.operateCode;
  });

  // 原始数据状态
  const deviceAddressRawData = ref<DbItem[]>([]);
  const groupRawData = ref<DeviceGroup[]>([]);
  const productRawData = ref<ProductItem[]>([]);
  const deviceRawData = ref<Array<DeviceRecord>>([]);
  const integratedDeviceRawData = ref<Array<DeviceControlConfigList>>([]);

  // 当前选中的设备
  const selectDevice = computed(() => {
    if (!deviceId.value || deviceRawData.value.length === 0) {
      return null;
    }
    return deviceRawData.value.find((device) => `${device.id}` === `${deviceId.value}`);
  });

  // 继电器路数选项
  const relayChannelOptions = computed(() => {
    if (!selectDevice.value?.config?.circuitName) {
      return [];
    }
    return selectDevice.value.config.circuitName.map((circuit) => ({
      label: `路数${circuit.circuit}`,
      value: circuit.circuit,
      circuitIndex: circuit.circuitIndex
    }));
  });

  // 状态选择选项
  const statusOptions = computed(() => {
    const options = [
      { label: "开", value: "1", id: "on" },
      { label: "关", value: "0", id: "off" }
    ];

    // 如果设备支持急停，添加急停选项
    if (selectDevice.value?.config?.stopSupport === "Y") {
      options.push({ label: "急停", value: "10", id: "stop" });
    }

    return options;
  });

  // 设备地址选项
  const deviceAddressOptions = computed(() => {
    return deviceAddressRawData.value.map((item) => ({
      ...item,
      label: item.name,
      value: isGeneralComponent.value ? item.id : `Address-${item.id}`
    }));
  });

  // 设备分组选项
  const groupOptions = computed(() => {
    return groupRawData.value.map((group) => ({
      ...group,
      label: group.groupName,
      value: isGeneralComponent.value ? group.id : `Group-${group.id}`
    }));
  });

  // 产品选项
  const productOptions = computed(() => {
    return productRawData.value.map((product) => ({
      ...product,
      label: product.productName,
      value: isGeneralComponent.value ? product.id : `Product-${product.id}`
    }));
  });

  // 设备选项
  const deviceOptions = computed(() => {
    return deviceRawData.value.map((item) => ({
      ...item,
      label: item.deviceName,
      value: isGeneralComponent.value ? item.id : `Device-${item.id}`
    }));
  });

  // 集成设备选项
  const integratedDeviceOptions = computed(() => {
    return integratedDeviceRawData.value.map((item) => ({
      ...item,
      label: item.name,
      value: item.id
    }));
  });

  // 基础URL的计算属性
  const baseUrl = computed(() => {
    if (!addressId.value || deviceAddressRawData.value.length === 0) {
      return "";
    }

    const dataSource = deviceAddressRawData.value.find((v) => `${v.id}` === `${addressId.value}`);
    if (dataSource && "desIp" in dataSource) {
      const ip = dataSource.desIp;
      const port = dataSource.desPort;
      const res = `http://${ip}:${port}`;

      iotApiService.setBaseUrl(res);
      return res;
    }
    return "";
  });

  // 解析后的ID值计算属性
  const addressId = computed(() => {
    if (!iotConfig.value.iotAddress) {
      return null;
    }
    return isGeneralComponent.value ? iotConfig.value.iotAddress : iotConfig.value.iotAddress.split("-")[1];
  });

  const deviceGroupId = computed(() => {
    if (!isGeneralComponent.value && !iotConfig.value.deviceGroupId) {
      return null;
    }
    return isGeneralComponent.value ? iotConfig.value.groupId : iotConfig.value.deviceGroupId?.split("-")[1];
  });

  const productBrandId = computed(() => {
    if (!iotConfig.value.productBrandId) {
      return null;
    }
    return isGeneralComponent.value ? iotConfig.value.productBrandId : iotConfig.value.productBrandId.split("-")[1];
  });

  const deviceId = computed(() => {
    if (!iotConfig.value.deviceId) {
      return null;
    }
    return isGeneralComponent.value ? iotConfig.value.deviceId : iotConfig.value.deviceId.split("-")[1];
  });

  const isGeneralComponent = computed(() => {
    return selectTargetData.value[0].component.prop === EquipmentEnumType.IotGeneralEquipment;
  });

  // 查询参数
  const params = ref({
    current: 1,
    groupId: -2,
    name: "",
    size: 100,
    status: -1
  });

  // 获取设备地址原始数据
  const getDeviceAddressRawData = async () => {
    const [error, res] = await to(getDataSocketList(params.value));
    if (error || !res) {
      return;
    }
    deviceAddressRawData.value = res.result.records;
  };

  // 获取设备分组和产品分类数据
  const getGroupAndCategoryRawData = async () => {
    if (!baseUrl.value) {
      return;
    }

    try {
      const {
        data: { result }
      } = await iotApiService.deviceGroupList();
      groupRawData.value = result;

      if (!operateCode.value) {
        return;
      }
      const {
        data: { result: categoryList }
      } = await iotApiService.getProductByOperateCode(operateCode.value);
      productRawData.value = categoryList;
    } catch (error: any) {
      console.error("获取列表数据失败", error);
      ElMessage.error("获取列表数据失败");
    }
  };

  const onDeviceTypeChange = (value: "single" | "integrated") => {
    update();
    if (value === "integrated") {
      getIntegratedDeviceRawData();
    }
  };

  // 获取设备数据
  const getDeviceRawData = async () => {
    if (!isGeneralComponent.value && (!deviceGroupId.value || !productBrandId.value || !baseUrl.value)) {
      return;
    }

    if (isGeneralComponent.value && !iotConfig.value.productCode) {
      return;
    }

    try {
      const {
        data: {
          result: { records: deviceList }
        }
      } = await iotApiService.deviceDefaultPage({
        selectObj: getSelectObject()
      });

      deviceRawData.value = deviceList;
    } catch (error: any) {
      console.error("获取列表数据失败", error);
      ElMessage.error("获取列表数据失败");
    }
  };

  const getSelectObject = () => {
    if (!isGeneralComponent.value) {
      return {
        groupId: Number(deviceGroupId.value),
        productId: Number(productBrandId.value)
      };
    }
    return {
      groupId: Number(deviceGroupId.value),
      productCode: iotConfig.value.productCode
    };
  };

  // 获取集成设备数据
  const getIntegratedDeviceRawData = async () => {
    if (!baseUrl.value) {
      return;
    }

    try {
      const {
        data: {
          result: { records: integratedDeviceList }
        }
      } = await iotApiService.integratedControlDefaultPage({
        current: 1,
        orderColumns: [],
        pageSize: 1000,
        selectObj: {}
      });

      integratedDeviceRawData.value = integratedDeviceList;
    } catch (error: any) {
      console.error("获取集成设备数据失败", error);
      ElMessage.error("获取集成设备数据失败");
    }
  };

  // IoT地址变更处理
  const onIotAddressChange = async () => {
    await getGroupAndCategoryRawData();
    console.error("iotConfig.value", iotConfig.value, deviceAddressRawData.value);
    const dataSource = deviceAddressRawData.value.find((v) => `${v.id}` === `${addressId.value}`);
    if (dataSource) {
      selectTargetData.value[0].dataSource = toRaw(dataSource);
    }
    update();
  };

  // 分组或产品变更处理
  const onGroupOrProductChange = async () => {
    await getDeviceRawData();
    update();
  };

  // 设备ID变更处理
  const onDeviceIdChange = () => {
    update();
  };

  // 集成设备变更处理
  const onIntegratedDeviceChange = () => {
    update();
  };

  // 继电器路数变更处理
  const onRelayChannelChange = (channelValue: number) => {
    // 查找对应的电路信息
    const circuitInfo = selectDevice.value?.config?.circuitName?.find((circuit) => circuit.circuit === channelValue);
    if (circuitInfo) {
      iotConfig.value.circuitIndex = circuitInfo.circuitIndex;
    }
    update();
  };

  // 状态选择变更处理
  const onStatusChange = (statusValue: string) => {
    iotConfig.value.selectedStatus = Number(statusValue);
    update();
  };

  // 初始化数据
  const initializeData = async () => {
    await getDeviceAddressRawData();
    await getGroupAndCategoryRawData();
    await getDeviceRawData();
    await getIntegratedDeviceRawData();
  };

  return {
    // 状态
    iotConfig,
    operateCode,
    deviceAddressRawData,
    groupRawData,
    productRawData,
    deviceRawData,
    integratedDeviceRawData,

    // 计算属性
    deviceAddressOptions,
    groupOptions,
    productOptions,
    deviceOptions,
    integratedDeviceOptions,
    selectDevice,
    relayChannelOptions,
    statusOptions,
    baseUrl,
    isGeneralComponent,

    // 解析后的ID值
    addressId,
    deviceGroupId,
    productBrandId,
    deviceId,

    // 方法
    getDeviceAddressRawData,
    getGroupAndCategoryRawData,
    getDeviceRawData,
    getIntegratedDeviceRawData,
    onIotAddressChange,
    onGroupOrProductChange,
    onDeviceIdChange,
    onIntegratedDeviceChange,
    onRelayChannelChange,
    onStatusChange,
    initializeData,
    update,
    onDeviceTypeChange
  };
}
