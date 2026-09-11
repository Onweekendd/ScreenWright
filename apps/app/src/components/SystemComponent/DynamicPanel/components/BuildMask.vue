<!-- 构建模式遮罩层组件 -->
<template>
  <div class="panel">
    <div v-show="showTip" class="tipInfo">
      <slot>{{ tipText }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";

interface Props {
  /** 提示文本内容 */
  tipText?: string;

  id: number;
}

const props = withDefaults(defineProps<Props>(), {
  isBuild: false,
  tipText: "双击进入动态面板",
  id: 0
});

const { targetChart } = useEditStore();

const showTip = computed(() => {
  return targetChart.value.hoverId === props.id;
});
</script>

<style lang="scss" scoped>
.panel {
  width: 100%;
  height: 100%;
  padding: 0;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(114, 40, 211, 0.1);

  .tipInfo {
    z-index: 2;
    display: block;
    color: #fff;
    font-family:
      Source Han Sans CN-Regular,
      Source Han Sans CN;
  }
}
</style>
