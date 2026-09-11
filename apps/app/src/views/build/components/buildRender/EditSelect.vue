<template>
  <div class="go-edit-select" v-if="aSelect && isBuild()" :style="positionStyle">
    <div class="select-background" />
    <div class="select-border" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { computed } from "vue";

import { useEditStore } from "./hooks/useEditStore";

const { editCanvas, mousePosition, editConfig, rightMenuShow, isBuild } = useEditStore();

const aSelect = computed(() => editCanvas.value.isSelect);
// 位置
const positionStyle = ref();

watch(
  () => mousePosition.value,
  (positionInfo) => {
    if (aSelect.value && rightMenuShow.value) {
      rightMenuShow.value = false;
    }
    if (!aSelect.value) return;
    // 这里的 x,y 是已经计算过的相对位移值
    const { startX, startY, x, y } = positionInfo;

    const attr = {
      zIndex: 99999,
      // left
      x: 0,
      // top
      y: 0,
      // 宽
      w: 0,
      // 高
      h: 0,
      // 偏移
      offsetX: 0,
      offsetY: 0
    };
    const scale = editConfig.value.scale || 0.6;
    // 处理位置
    if (x > startX && y > startY) {
      // 右下方向
      attr.x = startX;
      attr.y = startY;
      attr.w = Math.round((x - startX) / scale);
      attr.h = Math.round((y - startY) / scale);
    } else if (x > startX && y < startY) {
      // 右上方向
      attr.x = startX;
      attr.w = Math.round((x - startX) / scale);
      attr.h = Math.round((startY - y) / scale);
      attr.y = startY - attr.h;
    } else if (x < startX && y > startY) {
      // 左下方向
      attr.y = startY;
      attr.w = Math.round((startX - x) / scale);
      attr.h = Math.round((y - startY) / scale);
      attr.x = startX - attr.w;
    } else {
      // 左上方向
      attr.w = Math.round((startX - x) / scale);
      attr.h = Math.round((startY - y) / scale);
      attr.x = startX - attr.w;
      attr.y = startY - attr.h;
    }

    positionStyle.value = {
      left: attr.x + "px",
      top: attr.y + "px",
      width: attr.w + "px",
      height: attr.h + "px"
    };
  },
  {
    deep: true
  }
);
</script>

<style lang="scss" scoped>
.go-edit-select {
  position: absolute;
  .select-border,
  .select-background {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .select-border {
    left: 0;
    top: 0;
    opacity: 1;
    border-width: 1px;
    border-style: solid;
    border-color: #5e62fb;
  }
  .select-background {
    top: 2px;
    left: 2px;
    opacity: 0.08;
  }
}
</style>
