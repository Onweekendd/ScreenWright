<template>
  <div class="sw-radio">
    <el-radio-group
      v-bind="omitProps"
      v-model="input"
      @change="handleChange"
      class="flex"
      :class="[!direction || direction === 'column' ? 'flex-column' : 'flex-row']"
      size="small"
    >
      <el-radio v-for="item in option" :key="item.value" :value="item.value" :disabled="item.disabled">
        {{ item.label }}
      </el-radio>
    </el-radio-group>
  </div>
</template>

<script lang="ts" setup>
import type { FtRadioProps } from "./SwRadio";
import { FtRadioEmits } from "./SwRadio";
import { useSwRadio } from "./useSwRadio";
defineOptions({
  name: "SwRadio",
  inheritAttrs: true
});
const emit = defineEmits(FtRadioEmits);
const props = defineProps<FtRadioProps>();
const { input, omitProps, handleChange } = useSwRadio(props, emit);
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include radio-style();
.sw-radio {
  .flex-column {
    :deep(.el-radio) {
      margin-right: 0 !important;
      width: 100%;
    }
  }
  :deep(.el-radio) {
    --el-radio-text-color: #b4b7c1;
  }
}
</style>
