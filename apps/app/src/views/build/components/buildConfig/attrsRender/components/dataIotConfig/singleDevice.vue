<template>
  <div class="single-device">
    <!-- 设备分组 -->
    <el-form-item label="设备分组">
      <el-select
        popper-class="sw-select-dropdown"
        class="sw-select"
        :model-value="iotConfig.deviceGroupId"
        placeholder="请选择设备分组"
        clearable
        @update:model-value="onDeviceGroupChange"
      >
        <el-option v-for="item in groupOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>

    <!-- 产品分类 -->
    <el-form-item label="产品分类">
      <el-select
        popper-class="sw-select-dropdown"
        class="sw-select"
        size="small"
        :model-value="iotConfig.productBrandId"
        placeholder="请选择产品分类"
        clearable
        @update:model-value="onProductBrandChange"
        filterable
      >
        <el-option v-for="item in productOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>

    <!-- 设备 -->
    <el-form-item label="设备" v-show="iotConfig.deviceGroupId && iotConfig.productBrandId">
      <el-select
        popper-class="sw-select-dropdown"
        class="sw-select"
        :model-value="iotConfig.deviceId"
        placeholder="请选择设备"
        clearable
        filterable
        @update:model-value="onDeviceChange"
      >
        <el-option v-for="item in deviceOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>

    <!-- 继电器路数选择器 -->
    <el-form-item
      label="继电器路数"
      v-if="selectDevice?.config && 'circuitName' in selectDevice.config && relayChannelOptions.length > 0"
    >
      <el-select
        popper-class="sw-select-dropdown"
        class="sw-select"
        :model-value="
          selectDevice?.config?.circuitName?.find((c) => c.circuitIndex === iotConfig.circuitIndex)?.circuit
        "
        placeholder="请选择继电器路数"
        clearable
        @update:model-value="onRelayChannelChange"
      >
        <el-option v-for="item in relayChannelOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>

    <!-- 状态选择器 -->
    <el-form-item label="设备状态" v-if="selectDevice?.config && iotConfig.operateCode === 'BUTTON'">
      <el-select
        popper-class="sw-select-dropdown"
        class="sw-select"
        :model-value="iotConfig.selectedStatus?.toString()"
        placeholder="请选择设备状态"
        clearable
        @update:model-value="onStatusChange"
      >
        <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import type { DeviceRecord } from "@screenwright/types";

import type { IotConfig } from "@/views/build/components/buildRender/type";

interface Option {
  label: string;
  value: string | number;
}

interface RelayChannelOption {
  label: string;
  value: number;
  circuitIndex: number;
}

interface StatusOption {
  label: string;
  value: string;
}

// Props定义
interface Props {
  iotConfig: IotConfig;
  groupOptions: Option[];
  productOptions: Option[];
  deviceOptions: Option[];
  selectDevice?: DeviceRecord | null;
  relayChannelOptions: RelayChannelOption[];
  statusOptions: StatusOption[];
}

defineProps<Props>();

// 事件定义
interface Emits {
  (e: "update:deviceGroupId", value: string): void;
  (e: "update:productBrandId", value: string): void;
  (e: "update:deviceId", value: string): void;
  (e: "groupOrProductChange"): void;
  (e: "deviceIdChange"): void;
  (e: "relayChannelChange", value: number): void;
  (e: "statusChange", value: string): void;
}

const emit = defineEmits<Emits>();

// 事件处理方法
const onDeviceGroupChange = (value: string) => {
  emit("update:deviceGroupId", value);
  emit("groupOrProductChange");
};

const onProductBrandChange = (value: string) => {
  emit("update:productBrandId", value);
  emit("groupOrProductChange");
};

const onDeviceChange = (value: string) => {
  emit("update:deviceId", value);
  emit("deviceIdChange");
};

const onRelayChannelChange = (value: number) => {
  emit("relayChannelChange", value);
};

const onStatusChange = (value: string) => {
  emit("statusChange", value);
};
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
