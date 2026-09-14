<template>
  <div class="xAxis-tab flex flex-center">
    <div
      :class="{ 'is-active': item.value === input }"
      class="xAxis-tab-item"
      v-for="item in tabsOptions"
      :key="item.value"
      @click="change(item.value)"
    >
      {{ item.label }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useVModel } from "@vueuse/core";

import { XAxisType } from "./type";
import { TypeAttrs } from "./useAttrsByReverse";
import type { xAxisTabProps } from "./xAxisTab";
import { xAxisTabEmits } from "./xAxisTab";

// type FtCollapseItemEmits = typeof FtCollapseItemEmits
const emit = defineEmits(xAxisTabEmits);
const props = withDefaults(defineProps<xAxisTabProps>(), {
  type: TypeAttrs.row
});
const input = useVModel(props, "modelValue", emit);

const options: Record<string, { label: string; value: XAxisType }[]> = {
  default: [
    {
      label: "X轴",
      value: XAxisType.X
    },
    {
      label: "Y轴",
      value: XAxisType.Y
    }
  ],
  doubleY: [
    {
      label: "X轴",
      value: XAxisType.X
    },
    {
      label: "左Y轴",
      value: XAxisType.Y_L
    },
    {
      label: "右Y轴",
      value: XAxisType.Y_R
    }
  ],
  doubleX: [
    {
      label: "左X轴",
      value: XAxisType.X_L
    },
    {
      label: "右X轴",
      value: XAxisType.X_R
    },
    {
      label: "Y轴",
      value: XAxisType.Y
    }
  ],
  coordinate: [
    {
      label: "角度轴",
      value: XAxisType.X
    },
    {
      label: "径向轴",
      value: XAxisType.Y
    }
  ]
};
const tabsOptions = ref<{ label: string; value: XAxisType }[]>([]);

const change = (value: XAxisType) => {
  input.value = value;
  emit("change", value);
};
onMounted(() => {
  let curType = "default";
  switch (props.type) {
    case TypeAttrs.row:
    case TypeAttrs.column:
      curType = "default";
      break;
    case TypeAttrs.column_l:
    case TypeAttrs.column_r:
      curType = "doubleY";
      break;
    case TypeAttrs.row_l:
    case TypeAttrs.row_r:
      curType = "doubleX";
      break;
    default:
      break;
  }

  tabsOptions.value = options[curType];
});
</script>
<style lang="scss">
.xAxis-tab {
  height: 30px;
  margin-top: 8px;
  margin-bottom: 16px;
  .xAxis-tab-item {
    font-size: 12px;
    line-height: 30px;
    height: 30px;
    text-align: center;
    box-sizing: border-box;
    font-weight: 500;
    position: relative;
    background-color: #383b47;
    width: 87px;
    cursor: pointer;
    &.is-active {
      color: #fff;
      background-image: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
    }
  }
}
</style>
