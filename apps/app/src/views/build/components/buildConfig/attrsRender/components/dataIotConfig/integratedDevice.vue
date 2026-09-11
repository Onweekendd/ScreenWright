<template>
  <div class="integrated-device">
    <!-- 集成设备 -->
    <el-form-item label="集成设备" v-show="iotConfig.iotAddress">
      <el-select
        popper-class="sw-select-dropdown"
        class="sw-select"
        :model-value="iotConfig.integratedControlId"
        placeholder="请选择集成设备"
        clearable
        filterable
        @update:model-value="onIntegratedDeviceChange"
      >
        <el-option v-for="item in integratedDeviceOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import type { IotConfig } from "@/views/build/components/buildRender/type";

interface Option {
  label: string;
  value: string | number;
  name: string;
  isEnabled: boolean;
}

// Props定义
interface Props {
  iotConfig: IotConfig;
  integratedDeviceOptions: Option[];
}

defineProps<Props>();

// 事件定义
interface Emits {
  (e: "update:integratedControlId", value: string): void;
  (e: "integratedDeviceChange"): void;
}

const emit = defineEmits<Emits>();

// 事件处理方法
const onIntegratedDeviceChange = (value: string) => {
  emit("update:integratedControlId", value);
  emit("integratedDeviceChange");
};
</script>
