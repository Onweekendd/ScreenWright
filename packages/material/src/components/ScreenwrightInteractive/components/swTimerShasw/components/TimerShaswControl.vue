<template>
  <div class="step-control">
    <Icon
      :style="{
        fontSize: `${iconSize}px`,
        left: `${iconLeft}px`
      }"
      class="control-btn"
      @click="onControlClick('control')"
      :type="playStatus ? 'VideoPause' : 'VideoPlay'"
    />
    <Icon
      class="arrow-left el-icon-arrow-left"
      :style="{ left: `${arrowLeft}px` }"
      @click="onControlClick('prev')"
      type="ArrowLeft"
    />
    <Icon
      class="arrow-right el-icon-arrow-right"
      :style="{ right: `${arrowRight}px` }"
      @click="onControlClick('next')"
      type="ArrowRight"
    />
  </div>
</template>

<script setup lang="ts">
import Icon from "@editor/base/Icon/index.vue";

defineOptions({
  name: "TimerShaftControl"
});

// Props
defineProps<{
  playStatus: boolean;
  iconSize: number;
  iconLeft: number;
  arrowLeft: number;
  arrowRight: number;
}>();

// Emits
const emit = defineEmits<{
  (e: "controlClick", type: "prev" | "next" | "control"): void;
}>();

// 控制按钮点击
const onControlClick = (type: "prev" | "next" | "control") => {
  emit("controlClick", type);
};
</script>

<style lang="scss" scoped>
.step-control {
  width: 100%;
  position: absolute;
  top: 30%;
  left: 0;
  & > i {
    cursor: pointer;
    padding: 0 1px;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    &:hover {
      color: rgba(var(--ActiveColor), 1);
      transform: translateY(-50%) scale(1.2);
    }
  }
}
</style>
