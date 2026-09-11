<template>
  <div class="sw-coordinate-tabs xAxis-tab flex flex-center">
    <div
      :class="{ 'is-active': item.value === input }"
      class="xAxis-tab-item"
      v-for="item in option"
      :key="item.value"
      @click="change(item.value)"
    >
      {{ item.label }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { useVModel } from "@vueuse/core"
interface Props {
  modelValue: string
  option: Array<{ label: string; value: string }>
}
const emit = defineEmits(["change", "update:modelValue"])
const props = defineProps<Props>()
const input = useVModel(props, "modelValue", emit)

const change = (value: string) => {
  input.value = value
  emit("change", value)
}
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
    color: #fff;
    &.is-active {
      color: #fff;
      background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
    }
  }
}
</style>
