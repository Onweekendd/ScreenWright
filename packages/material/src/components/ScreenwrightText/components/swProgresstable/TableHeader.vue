<template>
  <div class="ft-table-list-header flex flex-center" :style="theadStyle">
    <div
      v-for="(item, index) in headerList"
      :key="index"
      :class="`ft-table-list flex flex-center flex-column ${index === 0 ? 'custom-title' : 'custom-list light-border'}`"
      :style="tableListStyle(index)"
    >
      <div class="ft-table-header flex flex-center" :data-translate="item.name">
        <div class="header-icon" v-if="item.icon">
          <img :src="setMinioUrl(item.icon)" alt="" />
        </div>
        {{ item.name }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { setMinioUrl } from "@material/minioUrl";

import type { Option } from "../types";

const props = defineProps<{ option: Option; headerList: any[] }>();

const theadStyle = computed(() => {
  if (!props.option.headerShow) return { display: "none" };
  return {
    background:
      props.option?.backgroundType === "custom"
        ? `url(${setMinioUrl(props.option?.backgroundImage)})`
        : props.option?.headerBackground,
    height: `${props.option?.headerlineHeight}px`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundSize: "100% 100%"
  };
});

const tableListStyle = (index: number) => ({
  height: `${props.option.headerlineHeight}px`,
  fontSize: `${props.option.headerFontSize}px`,
  textAlign: props.option.headerTextAlign,
  fontFamily: props.option.headerFontFamily,
  letterSpacing: `${props.option.headerletterSpacing}px`,
  fontStyle: props.option.headerFontStyle,
  fontWeight: props.option.headerFontWeight,
  color: props.option.headerColor,
  paddingLeft: `${props.option.seriesYMarginLeft[getSpanIndex(index)]}px`,
  width: `${
    props.option.rowShow && index === 0 ? props.option.rowWidth : props.option.seriesYWidth[getSpanIndex(index)]
  }px`
});

const getSpanIndex = (index: number) => (props.option.rowShow ? index - 1 : index);
</script>

<style lang="scss" scoped>
.ft-table-list-header {
  width: fit-content !important;
  .ft-table-header {
    height: 100%;
    .header-icon {
      img {
        width: 40px;
        height: 36px;
      }
    }
  }
  .ft-table-list {
    position: relative;

    &.light-border {
      &::after {
        content: "";
        top: 0;
        left: 0;
        width: 100%;
        position: absolute;
        border-top: solid 0.25px rgba(0, 204, 255, 0.5);
        pointer-events: none;
      }
    }
    .ft-table-header {
      height: 100%;
      .header-icon {
        img {
          width: 40px;
          height: 36px;
        }
      }
    }

    &:nth-child(2n + 3) {
      box-shadow:
        inset -13px 0 13px -13px rgb(2 183 223 / 50%),
        inset 13px 0 13px -13px rgb(2 183 223 / 50%);
    }
  }
  .custom-title {
    // height: 36px;
    background: rgba(0, 187, 255, 0.14);
    background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHsAAAAsBAMAAAC3YtoDAAAAD1BMVEUAAAAAuf8Auf8Auf8Auf8K12HLAAAABXRSTlMAzMC+sal/wWMAAABCSURBVEjHYxAUFBRgIAeAdY5qp0C7iIsDedpdXEDaFRjIBqPaR7WPah/VPqp9VPuodpzahY0NyNNsbDzwrYuRqx0AL9wSRVRH7eAAAAAASUVORK5CYII=");
    background-repeat: no-repeat;
    background-size: 100% 100%;
    border-bottom: dashed 0.25px transparent;
    box-sizing: border-box;
    height: 96%;
  }
  .custom-list {
    //   height: 100%;
    //   flex: 1;
    border-bottom: dashed 0.25px rgba(0, 204, 255, 0.5);
  }
}
</style>
