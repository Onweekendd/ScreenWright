<template>
  <div class="sw-grid-button">
    <div class="gridBox">
      <span
        :class="{
          gridBox_item: true,
          gridBox_item_active: index === activeIdx
        }"
        v-for="(item, index) in gridArray"
        :key="index"
        @click="handleGrid(item, index)"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from "vue"
import { useVModel } from "@vueuse/core"
import { FtGridButtonProps, FtGridButtonEmits } from "./SwGridButton"
import { isEqual } from "lodash-es"
interface arrayProps {
  top?: string | number
  left?: string | number
  right?: string | number
  bottom?: string | number
}
const activeIdx = ref(1)
const gridArray: Array<arrayProps> = [
  {
    top: 0,
    left: 0
  },
  {
    top: 0,
    left: "center"
  },
  {
    top: 0,
    right: 0
  },
  {
    top: "center",
    left: 0
  },
  {
    top: "center",
    left: "center"
  },
  {
    top: "center",
    right: 0
  },
  {
    bottom: 0,
    left: 0
  },
  {
    bottom: 0,
    left: "center"
  },
  {
    bottom: 0,
    right: 0
  }
]
const props = defineProps<FtGridButtonProps>()
const emit = defineEmits(FtGridButtonEmits)
const input = useVModel(props, "modelValue", emit)
const setActiveIdx = (val: arrayProps) => {
  activeIdx.value = gridArray.findIndex((item) => {
    return isEqual(item, val)
  })
}
watch(
  () => props.modelValue,
  (nVal) => {
    setActiveIdx(nVal)
  },
  {
    immediate: true
  }
)

const handleGrid = (item: any, index: number) => {
  input.value = item
  activeIdx.value = index
  emit("change", input.value)
}
</script>
<style lang="scss" scoped>
.sw-grid-button {
  position: relative;
  width: 64px;
  height: 46px;
  .gridBox {
    position: relative;
    width: 100%;
    height: 100%;
    background:
      linear-gradient(
        to top right,
        rgba(57, 59, 54, 0) 0%,
        rgba(57, 59, 54, 0) calc(50% - 1.5px),
        rgba(57, 59, 54, 0.3) 50%,
        rgba(57, 59, 54, 0) calc(50% + 1.5px),
        rgba(57, 59, 54, 0) 100%
      ),
      linear-gradient(
        to bottom right,
        rgba(57, 59, 54, 0) 0%,
        rgba(57, 59, 54, 0) calc(50% - 1.5px),
        rgba(57, 59, 54, 0.3) 50%,
        rgba(57, 59, 54, 0) calc(50% + 1.5px),
        rgba(57, 59, 54, 0) 100%
      );
    &::before {
      position: absolute;
      content: "";
      top: 4px;
      left: 4px px;
      bottom: 4px;
      right: 4px;
      border: 1px solid rgba(83, 84, 92, 0.5);
    }
    .gridBox_item {
      position: absolute;
      width: 8px;
      height: 8px;
      left: 0;
      top: 0;
      border: 1px solid #393b4a;
      background: #181b24;
      cursor: pointer;
      display: block;
      &:nth-child(1) {
        top: 0;
        left: 0;
      }
      &:nth-child(2) {
        top: 0;
        left: 50%;
        transform: translate(-50%, 0);
      }
      &:nth-child(3) {
        top: 0;
        right: 0;
        left: auto;
      }
      &:nth-child(4) {
        top: 50%;
        left: 0;
        transform: translate(0, -50%);
      }
      &:nth-child(5) {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
      &:nth-child(6) {
        top: 50%;
        right: 0;
        left: auto;
        transform: translate(0, -50%);
      }
      &:nth-child(7) {
        bottom: 0;
        left: 0;
        top: auto;
      }
      &:nth-child(8) {
        bottom: 0;
        left: 50%;
        top: auto;
        transform: translate(-50%, 0);
      }
      &:nth-child(9) {
        bottom: 0;
        right: 0;
        top: auto;
        left: auto;
      }
    }
    .gridBox_item_active {
      border: 1px solid;
      -o-border-image: linear-gradient(180deg, rgb(139, 88, 231), rgb(100, 44, 255)) 1 1;
      border-image: -webkit-gradient(linear, left top, left bottom, from(rgb(139, 88, 231)), to(rgb(100, 44, 255))) 1 1;
      border-image: linear-gradient(180deg, rgb(139, 88, 231), rgb(100, 44, 255)) 1 1;
    }
  }
}
</style>
