<template>
  <div class="http-method-selector">
    <div class="radio-group-container">
      <el-radio-group v-model="selectedMethod" size="small" @change="onChange">
        <el-radio v-for="method in methods" :key="method" :label="method">{{ method }}</el-radio>
      </el-radio-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

/** @description HTTP方法类型 */
type HttpMethod = "POST" | "PUT" | "GET" | "DELETE";

/** @description 组件属性定义 */
interface Props {
  /** @description 当前选中的方法 */
  modelValue: string;
  /** @description 可选的HTTP方法列表 */
  methods?: HttpMethod[];
}

/** @description 组件事件定义 */
interface Emits {
  (e: "update:modelValue", value: string): void;
  (e: "change", value: string): void;
}

// 定义props和emits
const props = withDefaults(defineProps<Props>(), {
  methods: () => ["POST", "PUT", "GET", "DELETE"]
});

const emit = defineEmits<Emits>();

// 计算属性
const selectedMethod = computed({
  get: () => props.modelValue,
  set: (value: string) => emit("update:modelValue", value)
});

// 方法定义
const onChange = (value: string | number | boolean | undefined): void => {
  if (typeof value === "string") {
    emit("change", value);
  }
};
</script>

<style lang="scss" scoped>
.http-method-selector {
  .radio-group-container {
    flex: 1;
  }
}
</style>
