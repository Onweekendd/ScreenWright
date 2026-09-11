<template>
  <div class="terminal-control" v-if="isBuild.value">
    <div class="panel-text">
      <div class="tipInfo">终端交互</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useBaseData } from "@/hooks/useBaseData";
import type { ComponentType } from "@/views/build/components/buildRender/type";

const props = defineProps<{
  element: ComponentType;
}>();

const { isBuild } = useBaseData(props.element);
</script>
<style lang="scss" scoped>
.terminal-control {
  .panel-text {
    .tipInfo {
      color: #fff;
      text-align: center;
      line-height: 200px;
      font-family:
        Source Han Sans CN-Regular,
        Source Han Sans CN;
    }
  }
}
</style>
