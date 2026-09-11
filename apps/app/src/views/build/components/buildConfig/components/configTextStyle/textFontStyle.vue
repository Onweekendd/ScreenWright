<template>
  <div class="btn-wrapper flex" v-if="input">
    <div
      class="button flex flex-center"
      @click="handleBtnClick('fontWeight')"
      :class="{ btn_active: input.fontWeight === fontWeightEnum.active }"
    >
      <Icon type="iconfont-cuti" size="14" />
    </div>
    <div
      class="button flex flex-center"
      @click="handleBtnClick('fontStyle')"
      :class="{ btn_active: input.fontStyle === fontStyleEnum.active }"
    >
      <Icon type="iconfont-zitixieti" size="14" />
    </div>
    <slot name="append" />
  </div>
</template>
<script setup lang="ts">
import { useVModel } from "@vueuse/core";

import Icon from "@/components/Icon/index.vue";

import type { configTextStyleProps, StyleProps } from "./configTextStyle";
import { configTextStyleEmits } from "./configTextStyle";
import { fontStyleEnum, fontWeightEnum } from "./type";

const props = defineProps<configTextStyleProps>();

const emit = defineEmits(configTextStyleEmits);
const input = useVModel(props, "modelValue", emit);
const handleBtnClick = (key: keyof StyleProps) => {
  console.log("handleBtnClick", key);
  if (!input.value) {
    return;
  }
  const styleEnumType = key === "fontStyle" ? fontStyleEnum : fontWeightEnum;
  if (key === "fontStyle" || key === "fontWeight") {
    if (input.value[key] === "") {
      input.value[key] = styleEnumType.active;
    }
    input.value[key] = input.value[key] === styleEnumType.active ? styleEnumType.normal : styleEnumType.active;
  }
  handleChange(key);
};
const handleChange = (key: keyof StyleProps) => {
  if (!input.value) return;
  emit("change", key, input.value);
};
</script>
<style lang="scss" scoped>
.btn-wrapper {
  .button {
    margin-top: 6px;
    min-width: 25px;
    height: 25px;
    background: #181b24;
    border-radius: 4px 4px 4px 4px;
    opacity: 0.8;
    border: 1px solid #393b4a;
    font-size: 16px;
    font-family:
      Source Han Sans CN-Normal,
      Source Han Sans CN;
    font-weight: 400;
    color: #ffffff;
    text-align: center;
    cursor: pointer;
    &.btn_active {
      border-color: #642cff;
      color: #642cff;
    }
    &:nth-child(1) {
      margin-right: 12px;
    }
  }
}
</style>
