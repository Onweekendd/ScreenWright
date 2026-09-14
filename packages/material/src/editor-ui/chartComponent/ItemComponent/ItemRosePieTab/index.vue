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
import { ref } from "vue";
import { useVModel } from "@vueuse/core";

const emit = defineEmits(["change", "update:modelValue"]);
const props = defineProps<{ modelValue: any }>();
const input = useVModel(props, "modelValue", emit);

const tabsOptions = ref([
  {
    label: "角度轴",
    value: "X"
  },
  {
    label: "径向轴",
    value: "Y"
  }
]);

const change = (value: string) => {
  input.value = value;
  emit("change", value);
};
</script>
<style lang="scss" scoped>
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
