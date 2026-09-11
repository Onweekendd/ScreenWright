<template>
  <div class="pdfjs-viewer" :style="viewerBackground">
    <div class="page-box" :style="pageStyle" v-show="option.showPage">
      <Icon
        type="iconfont-xiajiantou"
        :class="['iconfont-xiajiantou', 'jiantou', current == 1 ? 'not-Allow' : '']"
        @click.stop="changePage('prev')"
      />
      <Icon
        type="'iconfont-shangjiantou"
        :class="['iconfont-shangjiantou', 'jiantou', current == total ? 'not-Allow' : '']"
        @click.stop="changePage('next')"
      />

      <span> <el-input-number v-model="current" :controls="false" /> / {{ total }} </span>
    </div>
    <div v-show="option.showAll" ref="viewerAll" :style="viewBoxStyle" class="viewer-box-content" />
    <div v-show="!option.showAll" ref="viewer" :style="viewBoxStyle" class="viewer-box-content">
      <canvas ref="pdfCanvas" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

import Icon from "@editor/base/Icon/index.vue";
import { useActionEvent } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";

import { usePdfViewer } from "./usePdfViewer";

const { addEvent } = useActionEvent();

const props = defineProps<{
  element: ComponentType;
}>();

const {
  current,
  total,
  option,
  pageStyle,
  viewerBackground,
  viewBoxStyle,
  viewerAll,
  viewer,
  pdfCanvas,
  changePage,
  handlePageChange
} = usePdfViewer(props.element);

onMounted(() => {
  addEvent({
    [`${props.element.component.prop}-${props.element.id}`]: {
      handlePrevClick: () => changePage("prev"),
      handleNextClick: () => changePage("next"),
      handlePageChange: (currentPage: number) => handlePageChange(currentPage)
    }
  } as any);
});
</script>

<style lang="scss" scoped>
.pdfjs-viewer {
  color: #fff;
  position: relative;
  overflow: hidden;
  .viewer-box-content {
    &::-webkit-scrollbar {
      width: 0;
      height: 0;
    }
  }
  .page-box {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: fit-content;
    text-align: center;
    color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    & > .jiantou {
      margin: 0 5px;
      cursor: pointer;
      &.not-Allow {
        cursor: not-allowed;
        opacity: 0.5;
      }
    }
    .line {
      color: #393b4a;
    }
  }
}
</style>

<style lang="scss" scoped>
:deep(.el-input),
:deep(.el-input-number) {
  width: 50px;
  font-size: inherit;
  :deep(.el-input__inner) {
    height: fit-content;
    color: inherit !important;
    text-align: center;
    padding: 0 5px !important;
    background: transparent !important;
  }
}
</style>
