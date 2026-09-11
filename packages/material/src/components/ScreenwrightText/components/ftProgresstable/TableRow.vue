<template>
  <div
    :class="`ft-table-row flex flex-align-center row-item ${id}`"
    :id="`ft-table-row-${rowData.id}`"
    :data-index="rowData._idx"
    @click="handleClick"
    @mouseenter="emits('clear-scroll', '')"
    @mouseleave="emits('start-scroll', '')"
    :style="rowStyle"
  >
    <div
      v-for="(item, index) in headerList"
      :class="[
        `ft-table-item ft-table-list flex flex-center flex-column  ${
          index === 0 ? 'custom-title' : 'custom-list DIN-Bold'
        }`,
        item.alias === 'rowId' ? `serial-item ${id}` : option.seriesYOverFlow[getSpanIndex(index)]
      ]"
      :key="index"
      :style="getItemStyle(item, index)"
    >
      <template v-if="option.seriesYContentType[getSpanIndex(index)] === 'statusImg'">
        <!-- Status Image Content -->
        <img
          v-if="option.statusConfigValue[getSpanIndex(index)].indexOf(rowData[item.alias]) > -1"
          :style="getStatusImgStyle(item, index)"
          :src="getStatusImgSrc(item, index)"
          alt=""
        />
      </template>
      <template v-else-if="option.seriesYContentType[getSpanIndex(index)] === 'image'">
        <!-- Image Content -->
        <img :src="setMinioUrl(rowData[item.alias])" :style="getImageStyle(index)" alt="" />
      </template>
      <PartsMarquee
        v-else-if="option.seriesYOverFlow[getSpanIndex(index)] === 'carousel'"
        :key="`${rowData.id}${index}`"
        :content="`${handleFormat(rowData[item.alias], index)}`"
        :power="25"
        direction="left"
        :uuid="`${rowData.id}${index}`"
      >
        <el-progress
          v-if="index > 0"
          class="ft-table-progress"
          :percentage="handleFormat(rowData[item.alias], index)"
        />
      </PartsMarquee>
      <template v-else>
        <!-- Default Content -->
        <span
          :data-translate="
            option.seriesYContentType[getSpanIndex(index)] === 'number'
              ? handleNumberFormat(rowData[item.alias], index)
              : rowData[item.alias]
          "
        >
          {{
            option.seriesYContentType[getSpanIndex(index)] === "number"
              ? handleNumberFormat(rowData[item.alias], index)
              : rowData[item.alias]
          }}
          <span
            v-if="option.seriesYContentType[getSpanIndex(index)] === 'number' && option.suffixShow[getSpanIndex(index)]"
            :style="getSuffixStyle(index)"
            :data-translate="option.suffixContent[getSpanIndex(index)]"
          >
            {{ option.suffixContent[getSpanIndex(index)] }}
          </span>
        </span>
        <el-progress
          v-if="option.rowShow ? index > 1 : index > 0"
          class="ft-table-progress"
          :percentage="handleFormat(rowData[item.alias], index)"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComponentType } from "@screenwright/types";
import { computed } from "vue";

import { lineargradientHandle } from "@screenwright/core";
import { setMinioUrl } from "@material/minioUrl";
import { useBaseData } from "@screenwright/composables";

import PartsMarquee from "../PartsMarquee/index.vue";
import type { ProgressTableRow } from "../types";

interface Props {
  rowData: ProgressTableRow;
  headerList: any[];
  index: number;
  element: ComponentType;
}

const props = defineProps<Props>();
const emits = defineEmits<{
  (e: "row-click", payload: { index: number; params: any }): void;
  (e: "clear-scroll", payload: string): void;
  (e: "start-scroll", payload: string): void;
}>();

const { option, component, id } = useBaseData(props.element);

const getSpanIndex = (index: number) => {
  // 实现useSpanIndex逻辑
  return option.value.rowShow ? index - 1 : index;
};

function formatNumberWithCommas(num: number): string {
  // 将数字转为字符串
  const str = num.toString();

  // 处理整数部分
  const parts = str.split(".");
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? "." + parts[1] : "";

  // 使用正则表达式添加逗号
  // 匹配三个数字一组的情况，且后面还有数字
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return integerPart + decimalPart;
}
const handleNumberFormat = (num: number, index: number): string => {
  let result: number | string = num;
  const spanIndex = getSpanIndex(index);

  if (option.value.percentageShow[spanIndex]) {
    result = Number((result > 1 ? result : result * 100).toFixed(option.value.decimalSave[index] || 0));
  }

  if (option.value.thousandSplit[spanIndex]) {
    result = formatNumberWithCommas(Number(result));
  } else {
    result = Number(result).toFixed(option.value.decimalSave[index] || 0);
  }

  return result.toString();
};
const handleFormat = (num: number, index: number) => {
  let result: number | string = num;
  const spanIndex = getSpanIndex(index);
  if (option.value.percentageShow[spanIndex]) {
    result = Number((result > 1 ? result : result * 100).toFixed(option.value.decimalSave[index] || 0));
  }
  if (isNaN(Number(result))) {
    return 0;
  }
  return Number(result) > 100 ? 100 : Number(result) < 0 ? 0 : Number(result);
};

const rowStyle = computed(() => {
  const count = option.value.count || 1;
  return {
    minHeight: `calc(100% / ${option.value.count})`,
    background: getBackground(),
    border: getBorder(),
    textAlign: option.value.seriesYTextAlign[props.index % option.value.seriesXTabsName.length],
    transform: `translate(${option.value.seriesXOffsetX[props.index % option.value.seriesXTabsName.length]}px)`,
    borderRadius: `${option.value.seriesXRadius[props.index % option.value.seriesXTabsName.length]}%`,
    height: `${Math.floor(
      (component.value.height -
        (option.value.headerlineHeight || 0) -
        (option.value.lineMarginBottom || 0) * (count - 1)) /
        count
    )}px`,
    lineHeight: `${Math.floor(
      (component.value.height -
        (option.value.headerlineHeight || 0) -
        (option.value.lineMarginBottom || 0) * (count - 1)) /
        count
    )}px`,
    marginBottom: `${option.value.lineMarginBottom}px`
  };
});

const getBackground = () => {
  if (option.value.seriesXbackgroundType[props.rowData.id % option.value.seriesXTabsName.length] === "color") {
    return option.value.seriesXBackground[props.rowData.id % option.value.seriesXTabsName.length];
  } else {
    return `url(${setMinioUrl(
      option.value.seriesXbackgroundImage[props.rowData.id % option.value.seriesXTabsName.length]
    )})`;
  }
};

const getBorder = () => {
  return `${option.value.seriesXBorderWidth[props.rowData.id % option.value.seriesXTabsName.length]}px solid ${
    option.value.seriesXBorderColor[props.rowData.id % option.value.seriesXTabsName.length]
  }`;
};

// unit 加个默认值 ‘’
const getKeyValueIndex = (index: number, value: any, name: string, unit = "") => {
  let result = -1;
  if (option.value.styleAssignKeyValue[index]?.length > 0)
    result = option.value.styleAssignKeyValue[index].indexOf(value);
  return result > -1
    ? option.value[`styleAssign${name}`]?.[index]
      ? option.value[`styleAssign${name}`][index][result] + unit
      : ""
    : option.value[`seriesY${name}`]
      ? option.value[`seriesY${name}`][index] + unit
      : "";
};

const getItemStyle = (item: any, index: number) => {
  const spanIndex = getSpanIndex(index);
  return {
    width: `${option.value.seriesYWidth[spanIndex]}px`,
    paddingLeft: `${option.value.seriesYMarginLeft[spanIndex]}px`,
    transform: `translate3d(${option.value.seriesYOffsetX[spanIndex]}px, ${option.value.seriesYOffsetY[spanIndex]}px, 0px)`,
    textAlign: option.value.seriesYTextAlign[spanIndex],
    fontSize: getKeyValueIndex(Number(spanIndex), props.rowData[item.alias], "FontSize", "px"),
    fontFamily: getKeyValueIndex(spanIndex, props.rowData[item.alias], "FontFamily"),
    letterSpacing: getKeyValueIndex(spanIndex, props.rowData[item.alias], "letterSpacing", "px"),
    fontStyle: getKeyValueIndex(spanIndex, props.rowData[item.alias], "FontStyle"),
    fontWeight: getKeyValueIndex(spanIndex, props.rowData[item.alias], "FontWeight"),
    color: getKeyValueIndex(spanIndex, props.rowData[item.alias], "Color"),
    lineHeight: "100%"
  };
};

const getStatusImgStyle = (item: any, index: number) => {
  const spanIndex = getSpanIndex(index);
  const valueIndex = option.value.statusConfigValue[spanIndex].indexOf(props.rowData[item.alias]);

  return {
    width: `${option.value.statusConfigWidth[spanIndex][valueIndex]}px`,
    height: `${option.value.statusConfigHeight[spanIndex][valueIndex]}px`
  };
};

const getStatusImgSrc = (item: any, index: number) => {
  const spanIndex = getSpanIndex(index);
  const valueIndex = option.value.statusConfigValue[spanIndex].indexOf(props.rowData[item.alias]);

  return setMinioUrl(option.value.statusConfigImg[spanIndex][valueIndex]);
};

const getImageStyle = (index: number) => {
  const spanIndex = getSpanIndex(index);

  return {
    width: `${option.value.imageWidth[spanIndex]}px`,
    height: `${option.value.imageHeight[spanIndex]}px`,
    "-webkit-mask-image": option.value.maskImage[spanIndex] ? `url(${option.value.maskImage[spanIndex]}})` : "",
    "-webkit-mask-size": "cover"
  };
};

const getSuffixStyle = (index: number) => {
  const spanIndex = getSpanIndex(index);

  return {
    display: "inline-block",
    fontSize: `${option.value.suffixFontSize[spanIndex]}px`,
    fontFamily: option.value.suffixFontFamily[spanIndex],
    letterSpacing: `${option.value.suffixletterSpacing[spanIndex]}px`,
    fontStyle: option.value.suffixFontStyle[spanIndex],
    fontWeight: option.value.suffixFontWeight[spanIndex],
    color: option.value.suffixColor[spanIndex],
    transform: `translate3d(${option.value.suffixOffsetX[spanIndex]}px,${option.value.suffixOffsetY[spanIndex]}px,0px)`
  };
};

const setStyle = (dom: HTMLElement) => {
  console.log([...Array.from(dom.childNodes)], "[...dom.childNodes]");
  if (!dom) {
    return;
  }
  dom.classList.add("active");
  const childNodes = [...Array.from(dom.childNodes)];
  childNodes.forEach((span) => {
    if (span instanceof HTMLElement) {
      span.style.fontWeight = option.value.selectedFontWeight;
      span.style.fontStyle = option.value.selectedFontStyle;
      span.style.color = option.value.selectedColor;
      span.style.fontFamily = option.value.selectedFontFamily;
      span.style.fontSize = `${option.value.selectedFontSize}px`;
      span.style.letterSpacing = `${option.value.selectedletterSpacing}px`;
    }
  });
  dom.style.textShadow = option.value.shadowShow
    ? `${option.value.shadowColor} ${option.value.shadowX}px ${option.value.shadowY}px ${option.value.shadowFuzzy}px`
    : "";
  dom.style.background =
    option.value.selectedBgType === "color"
      ? `${lineargradientHandle(option.value.selectedBgColor)}`
      : `url(${setMinioUrl(option.value.selectedBgImage)})`;
  dom.style.backgroundRepeat = "no-repeat";
  dom.style.backgroundPosition = "center";
  dom.style.backgroundSize = "100% 100%";
};

const clearStyle = (dom: Element, index: number) => {
  if (!dom) return;
  dom.classList.remove("active");
  const childNodes = [...Array.from(dom.childNodes)];
  childNodes.forEach((span, spanIndex) => {
    const newIndex = span instanceof HTMLElement && span.className.includes("serial-item") ? 1 : spanIndex;
    if (span instanceof HTMLElement) {
      span.style.fontWeight = getKeyValueIndex(getSpanIndex(newIndex), undefined, "FontWeight");
      span.style.fontFamily = getKeyValueIndex(getSpanIndex(newIndex), undefined, "FontWeight");
      span.style.fontSize = getKeyValueIndex(getSpanIndex(newIndex), undefined, "FontSize", "px");
      // span.style.lineHeight = 'inherit';
      span.style.letterSpacing = getKeyValueIndex(getSpanIndex(newIndex), undefined, "letterSpacing", "px");
      span.style.color = getKeyValueIndex(getSpanIndex(newIndex), undefined, "Color");
      span.style.fontStyle = getKeyValueIndex(getSpanIndex(newIndex), undefined, "FontStyle");
    }
  });
  if (dom instanceof HTMLElement) {
    dom.style.textShadow = "none";
  }
  if (dom instanceof HTMLElement) {
    dom.style.background =
      option.value.seriesXbackgroundType[index % option.value.seriesXTabsName.length] === "color"
        ? `${option.value.seriesXBackground[index % option.value.seriesXTabsName.length]}`
        : `url(${setMinioUrl(option.value.selectedBgImage[index % option.value.seriesXbackgroundImage.length])})`;
  }
};

const handleClick = () => {
  if (!option.value.selectedShow) {
    return;
  }
  const dom = document.getElementById(`ft-table-row-${props.rowData.id}`);
  if (dom) {
    if (option.value.selectedMode === "single") {
      const activeItems = document.querySelectorAll(".ft-table-row.row-item.active");
      if (dom.classList.contains("active")) {
        clearStyle(dom, Number(dom.getAttribute("data-index")));
      } else {
        for (let i = 0; i < activeItems.length; i++) {
          const item = activeItems[i];
          clearStyle(item, Number(item.getAttribute("data-index")));
        }
        setStyle(dom);
      }
    } else {
      // 多选模式
      if (dom.classList.contains("active")) {
        clearStyle(dom, Number(dom.getAttribute("data-index")));
      } else {
        setStyle(dom);
      }
    }
  }
  emits("row-click", { index: props.index, params: props.rowData });
};
</script>

<style lang="scss" scoped>
.ft-table-row {
  .custom-list {
    color: #fff;
    font-weight: bold;
    height: 100%;
  }

  .custom-title {
    white-space: nowrap;
    background: rgba(0, 187, 255, 0.14);
    background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHsAAAAsBAMAAAC3YtoDAAAAD1BMVEUAAAAAuf8Auf8Auf8Auf8K12HLAAAABXRSTlMAzMC+sal/wWMAAABCSURBVEjHYxAUFBRgIAeAdY5qp0C7iIsDedpdXEDaFRjIBqPaR7WPah/VPqp9VPuodpzahY0NyNNsbDzwrYuRqx0AL9wSRVRH7eAAAAAASUVORK5CYII=");
    background-repeat: no-repeat;
    background-size: 100% 100%;
    border-bottom: dashed 0.25px transparent;
    box-sizing: border-box;
    height: 96%;
  }

  .custom-list {
    color: #fff;
    font-weight: bold;
    height: 100%;
    border-bottom: dashed 0.25px rgba(0, 204, 255, 0.5);

    &.DIN-Bold {
      font-family: DIN-Bold, sans-serif;
    }

    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  }

  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .carousel {
    overflow: hidden;
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

  &:nth-child(2n + 3) {
    box-shadow:
      inset -13px 0 13px -13px rgb(2 183 223 / 50%),
      inset 13px 0 13px -13px rgb(2 183 223 / 50%);
  }
}
:deep(.el-progress) {
  margin-top: 4px;
  width: 100%;
  box-sizing: border-box;
  .el-progress-bar {
    display: inline-block;
    vertical-align: middle;
    width: 100%;
    margin: 0 20px;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    .el-progress-bar__outer {
      border-radius: 0;
      height: 6px;
      background-color: rgba(0, 187, 255, 0.2);
      .el-progress-bar__inner {
        position: relative;
        border-radius: 0;
        background-color: transparent;
        background-image: var(--ft-progress-bar-bg-image, none);
        background-repeat: no-repeat;
        background-position: center;
        &::after {
          content: "";
          position: absolute;
          width: 3px;
          height: 8px;
          background-color: #ffffff;
        }
      }
    }
  }
  .el-progress__text {
    display: none;
  }
}
</style>
