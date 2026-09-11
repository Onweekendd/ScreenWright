<template>
  <el-form-item v-bind="formItemProps">
    <slot />
  </el-form-item>
</template>

<script setup lang="ts">
import { computed, useAttrs } from "vue";

import type { FormItemProps } from "element-plus";

interface Props extends Partial<FormItemProps> {
  isLocked?: boolean;
  properties?: string[];
}

const props = withDefaults(defineProps<Props>(), { isLocked: false, properties: () => [] });
const attrs = useAttrs();

const formItemProps = computed(() => {
  const { isLocked: _isLocked, properties: _properties, ...rest } = props;
  return { ...rest, ...attrs };
});
</script>
