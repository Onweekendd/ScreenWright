<template>
  <el-form-item label="设备地址">
    <el-select
      popper-class="sw-select-dropdown"
      class="sw-select"
      v-model="iotConfig.iotAddress"
      placeholder="请选择设备地址"
      clearable
      @change="onIotAddressChange"
    >
      <el-option v-for="item in deviceAddressOptions" :key="item.value" :label="item.name" :value="item.value" />
    </el-select>
  </el-form-item>
  <el-form-item label="设备类型" v-show="iotConfig.iotAddress">
    <el-select
      popper-class="sw-select-dropdown"
      class="sw-select"
      v-model="iotConfig.deviceType"
      placeholder="请选择设备类型"
      @change="onDeviceTypeChange"
    >
      <el-option label="单设备" value="single" />
      <el-option label="集成设备" value="integrated" />
    </el-select>
  </el-form-item>

  <!-- 单设备选择组件 -->
  <singleDevice
    v-if="iotConfig.deviceType === 'single' && iotConfig.iotAddress"
    :iot-config="iotConfig"
    :group-options="groupOptions"
    :product-options="productOptions"
    :device-options="deviceOptions"
    :select-device="selectDevice"
    :relay-channel-options="relayChannelOptions"
    :status-options="statusOptions"
    @update:device-group-id="(value) => (iotConfig.deviceGroupId = value)"
    @update:product-brand-id="
      (value) => {
        iotConfig.productBrandId = value;
        iotConfig.productCategoryId = value;
      }
    "
    @update:device-id="(value) => (iotConfig.deviceId = value)"
    @group-or-product-change="onGroupOrProductChange"
    @device-id-change="onDeviceIdChange"
    @relay-channel-change="onRelayChannelChange"
    @status-change="onStatusChange"
  />

  <!-- 集成设备选择组件 -->
  <integratedDevice
    v-if="iotConfig.deviceType === 'integrated'"
    :iot-config="iotConfig"
    :integrated-device-options="integratedDeviceOptions"
    @update:integrated-control-id="(value) => (iotConfig.integratedControlId = value)"
    @integrated-device-change="onIntegratedDeviceChange"
  />
</template>

<script setup lang="ts">
import { onMounted } from "vue";

import integratedDevice from "./integratedDevice.vue";
import singleDevice from "./singleDevice.vue";
import { useIotConfig } from "./useIotConfig";

// 使用IoT配置hook
const {
  iotConfig,
  deviceAddressOptions,
  groupOptions,
  productOptions,
  deviceOptions,
  integratedDeviceOptions,
  selectDevice,
  relayChannelOptions,
  statusOptions,
  onIotAddressChange,
  onGroupOrProductChange,
  onDeviceIdChange,
  onIntegratedDeviceChange,
  onRelayChannelChange,
  onStatusChange,
  initializeData,
  onDeviceTypeChange
} = useIotConfig();

// 组件挂载时初始化数据
onMounted(async () => {
  await initializeData();
});
</script>

<style lang="scss" scoped>
.response-wrapper {
  width: 314px;
  height: 260px;
  position: relative;
}
</style>
