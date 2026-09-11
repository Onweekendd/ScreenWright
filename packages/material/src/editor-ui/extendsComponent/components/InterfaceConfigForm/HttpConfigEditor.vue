<template>
  <div class="http-config-editor">
    <div class="editors-container">
      <key-value-editor
        :title="headersTitle"
        :items="headers"
        @add-item="addHeaderItem"
        @remove-item="removeHeaderItem"
        @update-item="updateHeaderItem"
      />

      <key-value-editor
        :title="bodyTitle"
        :items="body"
        :show-tooltip="true"
        :tooltip-content="'返回格式类型 Array<{ code: number, message: string, timestamp: number, result: { signUrl: string }}> '"
        @add-item="addBodyItem"
        @remove-item="removeBodyItem"
        @update-item="updateBodyItem"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import KeyValueEditor from "./KeyValueEditor.vue";

/** @description 键值对类型 */
interface KeyValueItem {
  key: string;
  value: string;
}

/** @description HTTP配置类型 */
interface HttpConfig {
  headers: KeyValueItem[];
  body: KeyValueItem[];
}

/** @description 更新参数类型 */
interface UpdateParams {
  index: number;
  type: "key" | "value";
  value: string | number;
}

/** @description 组件属性定义 */
interface Props {
  /** @description 配置值 */
  modelValue: HttpConfig;
  /** @description 请求头标题 */
  headersTitle?: string;
  /** @description 请求体标题 */
  bodyTitle?: string;
}

/** @description 组件事件定义 */
interface Emits {
  (e: "update:modelValue", value: HttpConfig): void;
}

// 定义props和emits
const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    headers: [],
    body: []
  }),
  headersTitle: "请求头",
  bodyTitle: "请求体"
});

const emit = defineEmits<Emits>();

// 计算属性
const headers = computed(() => props.modelValue.headers || []);
const body = computed(() => props.modelValue.body || []);

// 方法定义
// 请求头相关方法
const addHeaderItem = (): void => {
  const headers = [...props.modelValue.headers, { key: "", value: "" }];
  emitUpdate({ headers });
};

const removeHeaderItem = (index: number): void => {
  const headers = [...props.modelValue.headers];
  headers.splice(index, 1);
  emitUpdate({ headers });
};

const updateHeaderItem = ({ index, type, value }: UpdateParams): void => {
  const headers = [...props.modelValue.headers];
  headers[index] = { ...headers[index], [type]: String(value) };
  emitUpdate({ headers });
};

// 请求体相关方法
const addBodyItem = (): void => {
  const body = [...props.modelValue.body, { key: "", value: "" }];
  emitUpdate({ body });
};

const removeBodyItem = (index: number): void => {
  const body = [...props.modelValue.body];
  body.splice(index, 1);
  emitUpdate({ body });
};

const updateBodyItem = ({ index, type, value }: UpdateParams): void => {
  const body = [...props.modelValue.body];
  body[index] = { ...body[index], [type]: String(value) };
  emitUpdate({ body });
};

// 更新配置
const emitUpdate = (partialUpdate: Partial<HttpConfig>): void => {
  const updatedConfig = {
    ...props.modelValue,
    ...partialUpdate
  };
  emit("update:modelValue", updatedConfig);
};
</script>

<style lang="scss" scoped>
.http-config-editor {
  .editors-container {
    display: flex;
    flex-direction: column;
    margin-top: 24px;
    gap: 12px;
  }
}
</style>
