<template>
  <div class="interface-config-form">
    <el-row :gutter="20" class="url-section">
      <el-col :span="24">
        <config-item label="接口地址">
          <el-input
            v-model="configValue.apiUrl"
            size="small"
            placeholder="请输入接口地址"
            @change="updateApiUrl"
            clearable
          />
        </config-item>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="method-section">
      <el-col :span="24">
        <config-item label="请求方式">
          <http-method-selector v-model="configValue.method" :methods="['POST', 'GET']" @change="updateMethod" />
        </config-item>
      </el-col>
    </el-row>

    <http-config-editor v-model="httpConfig" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import ConfigItem from "./ConfigItem.vue";
import HttpConfigEditor from "./HttpConfigEditor.vue";
import HttpMethodSelector from "./HttpMethodSelector.vue";

/** @description 键值对类型 */
interface KeyValueItem {
  key: string;
  value: string;
}

/** @description 导出配置类型 */
interface ExportConfig {
  apiUrl: string;
  method: "POST" | "GET";
  headers: KeyValueItem[];
  body: KeyValueItem[];
}

/** @description 组件属性定义 */
interface Props {
  /** @description 配置值 */
  modelValue: ExportConfig;
}

/** @description 组件事件定义 */
interface Emits {
  (e: "update:modelValue", value: ExportConfig): void;
}

// 定义props和emits
const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 计算属性
const configValue = computed({
  get: () => props.modelValue,
  set: (val: ExportConfig) => emit("update:modelValue", val)
});

const httpConfig = computed({
  get: () => ({
    headers: props.modelValue.headers || [],
    body: props.modelValue.body || []
  }),
  set: (val: { headers: KeyValueItem[]; body: KeyValueItem[] }) => {
    const updatedConfig = {
      ...props.modelValue,
      headers: val.headers,
      body: val.body
    };
    emit("update:modelValue", updatedConfig);
  }
});

// 方法定义
/**
 * 更新API URL
 * @param value - 新的URL值
 */
const updateApiUrl = (value: string): void => {
  const updatedConfig = { ...props.modelValue, apiUrl: value };
  emit("update:modelValue", updatedConfig);
};

/**
 * 更新请求方式
 * @param value - 新的请求方式
 */
const updateMethod = (value: string): void => {
  const updatedConfig = { ...props.modelValue, method: value as "POST" | "GET" };
  emit("update:modelValue", updatedConfig);
};
</script>

<style lang="scss" scoped>
.interface-config-form {
  .url-section,
  .method-section {
    margin-bottom: 20px;
  }
}
</style>
