<template>
  <!-- option.selectedShow && -->
  <li
    :class="`scroll-table-row list-item row-item flex flex-align-center scroll-table-row-${listIndex}`"
    @click="handleItemClick(listIndex)"
    :key="item.id"
    :style="setListStyle(listIndex)"
    :data-index="listIndex"
  >
    <span
      v-for="(field, index) in listLabel"
      :key="field.name"
      :class="field.alias === 'rowId' ? `serial-item ${id}` : option.seriesYOverFlow[getSpanIndex(index)]"
      :style="setListItemStyle(item, field, index)"
      :data-name="option.seriesYContentType[getSpanIndex(index)]"
    >
      <!-- 状态图片 -->
      <template v-if="option.seriesYContentType[getSpanIndex(index)] === 'statusImg'">
        <img
          v-if="option.statusConfigValue[getSpanIndex(index)].indexOf(item[field.alias]) > -1"
          :style="{
            width: `${
              option.statusConfigWidth[getSpanIndex(index)][
                option.statusConfigValue[getSpanIndex(index)].indexOf(item[field.alias])
              ]
            }px`,
            height: `${
              option.statusConfigHeight[getSpanIndex(index)][
                option.statusConfigValue[getSpanIndex(index)].indexOf(item[field.alias])
              ]
            }px`
          }"
          :src="
            setMinioUrl(
              option.statusConfigImg[getSpanIndex(index)][
                option.statusConfigValue[getSpanIndex(index)].indexOf(item[field.alias])
              ]
            )
          "
          alt=""
        />
      </template>
      <!-- 图片 -->
      <template v-else-if="option.seriesYContentType[getSpanIndex(index)] === 'image'">
        <!-- {{item[field.alias]}} -->
        <img
          :src="setMinioUrl(option.maskImage[getSpanIndex(index)])"
          :style="{
            width: `${option.imageWidth[getSpanIndex(index)]}px`,
            height: `${option.imageHeight[getSpanIndex(index)]}px`,
            '-webkit-mask-image': option.maskImage[getSpanIndex(index)]
              ? `url(${setMinioUrl(option.maskImage[getSpanIndex(index)])})`
              : '',
            '-webkit-mask-size': 'cover'
          }"
          alt=""
        />
      </template>
      <!-- 文字 -->
      <!-- <template v-else-if="option.seriesYContentType[getSpanIndex(index)] === 'word'"></template> -->
      <!-- 数字 -->
      <template v-else-if="option.seriesYContentType[getSpanIndex(index)] === 'number'">
        {{ option.thousandSplit[getSpanIndex(index)] ? thousandFormat(item[field.alias]) : item[field.alias] }}
        <span
          v-if="option.seriesYContentType[getSpanIndex(index)] === 'number' && option.suffixShow[getSpanIndex(index)]"
          :style="{
            display: 'inline-block',
            fontSize: option.suffixFontSize[getSpanIndex(index)] + 'px',
            fontFamily: option.suffixFontFamily[getSpanIndex(index)],
            letterSpacing: option.suffixletterSpacing[getSpanIndex(index)] + 'px',
            fontStyle: option.suffixFontStyle[getSpanIndex(index)],
            fontWeight: option.suffixFontWeight[getSpanIndex(index)],
            color: option.suffixColor[getSpanIndex(index)],
            transform: `translate3d(${option.suffixOffsetX[getSpanIndex(index)]}px,${
              option.suffixOffsetY[getSpanIndex(index)]
            }px,0px)`
          }"
          :data-translate="option.suffixContent[getSpanIndex(index)]"
        >
          {{ option.suffixContent[getSpanIndex(index)] }}
        </span>
      </template>
      <PartsMarquee
        v-else-if="option.seriesYOverFlow[getSpanIndex(index)] === 'carousel'"
        :key="`${listIndex}${index}`"
        :content="item[field.alias]"
        :power="25"
        direction="left"
        :uuid="`${listIndex}${index}`"
      />
      <template v-else-if="option.progressYConfig && option.seriesYContentType[getSpanIndex(index)] === 'progress'">
        <template v-if="isNaN(Number(item[field.alias]))">
          {{ item[field.alias] }}
        </template>
        <template v-else>
          <el-progress
            :type="
              option.progressYConfig && option.progressYConfig[getSpanIndex(index)]
                ? option.progressYConfig[getSpanIndex(index)].type
                : 'line'
            "
            :percentage="Number(item[field.alias]) === 0 ? 0 : item[field.alias]"
            :stroke-width="15"
            class="is-normal-background part-progress"
            :class="{ 'is-custom-background': option.progressYConfig[getSpanIndex(index)].status === 'custom' }"
            striped
            :show-text="
              option.progressYConfig[getSpanIndex(index)] ? option.progressYConfig[getSpanIndex(index)].showText : false
            "
            :indeterminate="
              option.progressYConfig[getSpanIndex(index)]
                ? option.progressYConfig[getSpanIndex(index)].indeterminate
                : false
            "
            :duration="
              option.progressYConfig && option.progressYConfig[getSpanIndex(index)]
                ? option.progressYConfig[getSpanIndex(index)].duration
                : 3
            "
            :style="getProgressAttrsStyle(index)"
          />
        </template>
      </template>
      <template v-else>
        {{
          option.seriesYContentType[getSpanIndex(index)] === "number" && option.thousandSplit[getSpanIndex(index)]
            ? thousandFormat(item[field.alias])
            : item[field.alias]
        }}
        <span
          v-if="option.seriesYContentType[getSpanIndex(index)] === 'number' && option.suffixShow[getSpanIndex(index)]"
          :style="{
            display: 'inline-block',
            fontSize: option.suffixFontSize[getSpanIndex(index)] + 'px',
            fontFamily: option.suffixFontFamily[getSpanIndex(index)],
            letterSpacing: option.suffixletterSpacing[getSpanIndex(index)] + 'px',
            fontStyle: option.suffixFontStyle[getSpanIndex(index)],
            fontWeight: option.suffixFontWeight[getSpanIndex(index)],
            color: option.suffixColor[getSpanIndex(index)],
            transform: `translate3d(${option.suffixOffsetX[getSpanIndex(index)]}px,${
              option.suffixOffsetY[getSpanIndex(index)]
            }px,0px)`
          }"
          :data-translate="option.suffixContent[getSpanIndex(index)]"
        >
          {{ option.suffixContent[getSpanIndex(index)] }}
        </span>
      </template>
    </span>
  </li>
</template>

<script setup lang="ts">
import { EventTypeEnum, type ComponentType } from "@screenwright/types";
import { lineargradientHandle } from "@screenwright/core";
import { isNil } from "lodash-es";

import { setMinioUrl } from "@material/minioUrl";
import { useBaseData } from "@screenwright/composables";

import PartsMarquee from "../PartsMarquee/index.vue";
import { thousandFormat } from "../utils";

const props = defineProps<{
  item: any;
  listIndex: number;
  listLabel: any[];
  currentList: any[];
  element: ComponentType;
}>();

defineEmits<{
  (e: "row-click", index: number, item: any): void;
}>();
const { option, component, id, handleEventAndCallbackEvent, handleEncode } = useBaseData(props.element);
const setStyle = (dom: HTMLElement) => {
  console.log([...Array.from(dom.childNodes)], "[...dom.childNodes]");
  if (!dom) {
    return;
  }
  dom.classList.add("active");
  const childNodes = [...Array.from(dom.childNodes)];
  childNodes.forEach((span) => {
    if (option.value.textStyleShow) {
      if (span instanceof HTMLElement) {
        span.style.fontWeight = option.value.selectedFontWeight;
        span.style.fontStyle = option.value.selectedFontStyle;
        span.style.color = option.value.selectedColor;
        span.style.fontFamily = option.value.selectedFontFamily;
        span.style.fontSize = `${option.value.selectedFontSize}px`;
        span.style.letterSpacing = `${option.value.selectedletterSpacing}px`;
      }
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
  // const childNodes = [...Array.from(dom.childNodes)];
  // childNodes.forEach((span, spanIndex) => {
  //   const newIndex = span instanceof HTMLElement && span.className.includes("serial-item") ? 1 : spanIndex;
  //   if (span instanceof HTMLElement) {
  //     span.style.fontWeight = getKeyValueIndex(getSpanIndex(newIndex), undefined, "FontWeight");
  //     span.style.fontFamily = getKeyValueIndex(getSpanIndex(newIndex), undefined, "FontWeight");
  //     span.style.fontSize = getKeyValueIndex(getSpanIndex(newIndex), undefined, "FontSize", "px");
  //     // span.style.lineHeight = 'inherit';
  //     span.style.letterSpacing = getKeyValueIndex(getSpanIndex(newIndex), undefined, "letterSpacing", "px");
  //     span.style.color = getKeyValueIndex(getSpanIndex(newIndex), undefined, "Color");
  //     span.style.fontStyle = getKeyValueIndex(getSpanIndex(newIndex), undefined, "FontStyle");
  //   }
  // });
  if (dom instanceof HTMLElement) {
    dom.style.textShadow = "none";
  }
  if (dom instanceof HTMLElement) {
    dom.style.background =
      option.value.seriesXbackgroundType[index % option.value.seriesXTabsName.length] === "color"
        ? `${option.value.seriesXBackground[index % option.value.seriesXTabsName.length]}`
        : `url(${setMinioUrl(option.value.seriesXbackgroundImage[index % option.value.seriesXTabsName.length])}) center center / 100% 100% no-repeat`;
  }
};
const handleItemClick = (index: number) => {
  if (option.value.selectedShow) {
    if (!props.currentList.length) return;
    const parentDom = document.getElementById(`parts-table-${id.value}`);
    if (!parentDom) {
      return;
    }
    const dom = parentDom.getElementsByClassName(`scroll-table-row-${index}`);
    if (dom && dom.length > 0) {
      if (option.value.selectedMode === "single") {
        // const activeItems = parentDom.getElementsByClassName("active");
        // if (activeItems.length > 1) {
        //   const activeItemsArr = [...Array.from(activeItems)];
        //   for (let i = 0; i < activeItemsArr.length; i++) {
        //     const item = activeItemsArr[i];
        //     clearStyle(item, Number(item.getAttribute("data-index")));
        //   }
        //   setStyle(dom[0] as HTMLElement);
        // } else {
        if (dom[0].classList.contains("active")) {
          clearStyle(dom[0], index);
        } else {
          // 清除其他行的样式
          const activeItems = parentDom.getElementsByClassName("active");
          for (let i = 0; i < activeItems.length; i++) {
            const item = activeItems[i];
            clearStyle(item, Number(item.getAttribute("data-index")));
          }
          setStyle(dom[0] as HTMLElement);
        }
        // }
      } else {
        // 多选模式
        if (dom[0].classList.contains("active")) {
          clearStyle(dom[0], index);
        } else {
          setStyle(dom[0] as HTMLElement);
        }
      }
    }
  }
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.Click,
    events: props.element.events,
    throwValue: props.item
  });

  handleEncode(props.item);
};

const getSpanIndex = (index: number) => {
  // 实现useSpanIndex逻辑
  return option.value.rowShow ? index - 1 : index;
};

const setListStyle = (listIndex: number) => {
  return {
    minHeight: `calc(100% / ${option.value.count})`,
    background:
      option.value.seriesXbackgroundType[listIndex % option.value.seriesXTabsName.length] === "color"
        ? option.value.seriesXBackground[listIndex % option.value.seriesXTabsName.length]
        : `url(${setMinioUrl(
            option.value.seriesXbackgroundImage[listIndex % option.value.seriesXTabsName.length]
          )}) no-repeat center/100% 100%`,
    border: `${option.value.seriesXBorderWidth[listIndex % option.value.seriesXTabsName.length]}px solid ${
      option.value.seriesXBorderColor[listIndex % option.value.seriesXTabsName.length]
    }`,
    textAlign: option.value.seriesYTextAlign[listIndex % option.value.seriesXTabsName.length],
    transform: `translate(${option.value.seriesXOffsetX[listIndex % option.value.seriesXTabsName.length]}px)`,
    borderRadius: `${option.value.seriesXRadius[listIndex % option.value.seriesXTabsName.length]}%`,
    height: `${Math.floor(
      (component.value.height -
        option.value.headerlineHeight -
        option.value.lineMarginBottom * (option.value.count - 1)) /
        option.value.count
    )}px`,
    lineHeight: `${Math.floor(
      (component.value.height -
        option.value.headerlineHeight -
        option.value.lineMarginBottom * (option.value.count - 1)) /
        option.value.count
    )}px`,
    marginBottom: `${option.value.lineMarginBottom}px`
  };
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

const setListItemStyle = (item: { [x: string]: any }, current: { alias: string | number }, currentIndex: number) => {
  return {
    display: "inline-block",
    width: `${option.value.seriesYWidth[getSpanIndex(currentIndex)]}px`,
    marginLeft: `${option.value.seriesYMarginLeft[getSpanIndex(currentIndex)]}px`,
    transform: `translate3d(${option.value.seriesYOffsetX[getSpanIndex(currentIndex)]}px, ${
      option.value.seriesYOffsetY[getSpanIndex(currentIndex)]
    }px, 0px)`,
    textAlign: option.value.seriesYTextAlign[getSpanIndex(currentIndex)],
    fontSize: getKeyValueIndex(getSpanIndex(currentIndex), item[current.alias], "FontSize", "px"),
    fontFamily: getKeyValueIndex(getSpanIndex(currentIndex), item[current.alias], "FontFamily"),
    backgroundImage: `url(${setMinioUrl(getKeyValueIndex(getSpanIndex(currentIndex), item[current.alias], "BgImg"))})`,

    backgroundSize: `${getKeyValueIndex(
      getSpanIndex(currentIndex),
      item[current.alias],
      "BgWdith",
      "px"
    )} ${getKeyValueIndex(getSpanIndex(currentIndex), item[current.alias], "BgHeight", "px")}`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: `${
      getKeyValueIndex(getSpanIndex(currentIndex), item[current.alias], "BgLeft", "px") || "left"
    } center`,

    letterSpacing: getKeyValueIndex(getSpanIndex(currentIndex), item[current.alias], "letterSpacing", "px"),
    fontStyle: getKeyValueIndex(getSpanIndex(currentIndex), item[current.alias], "FontStyle"),
    fontWeight: getKeyValueIndex(getSpanIndex(currentIndex), item[current.alias], "FontWeight"),
    color: getKeyValueIndex(getSpanIndex(currentIndex), item[current.alias], "Color"),
    lineHeight: `${option.value.seriesYlineHeight[getSpanIndex(currentIndex)]}px`,
    overflow: "hidden"
  };
};

const getProgressAttrsStyle = (index: number) => {
  const DEFAULT_PROGRESS_STYLE = {
    linearGradient: "linear-gradient(0.0deg,rgba(10,17,219,1) 0.0,rgba(137,181,252,1) 100.0%)",
    color: "#88FC8D",
    outerBgColor: "#ebeef5",
    fontColor: "#fff",
    fontSize: "18px",
    fontFamily: "siayuan-normal",
    fontStyle: "normal",
    fontWeight: "normal",
    borderRadius: "100px",
    commonColor: "#409EFF"
  };
  const spanIndex = getSpanIndex(index);
  const targetConfig = option.value.progressYConfig?.[spanIndex] ?? {};
  return {
    "--lineargradient": targetConfig.linearGradientColor
      ? lineargradientHandle(targetConfig.linearGradientColor)
      : DEFAULT_PROGRESS_STYLE.linearGradient,
    "--normalColor": targetConfig.color ?? DEFAULT_PROGRESS_STYLE.color,
    "--outerBgColor": targetConfig.outerBgColor ?? DEFAULT_PROGRESS_STYLE.outerBgColor,
    "--textColor": targetConfig.fontColor ?? DEFAULT_PROGRESS_STYLE.fontColor,
    "--textFontSize": targetConfig.fontSize ? `${targetConfig.fontSize}px` : DEFAULT_PROGRESS_STYLE.fontSize,
    "--textFamily": targetConfig.fontFamily ?? DEFAULT_PROGRESS_STYLE.fontFamily,
    "--textFontStyle": targetConfig.fontStyle ?? DEFAULT_PROGRESS_STYLE.fontStyle,
    "--textFontWeight": targetConfig.fontWeight ?? DEFAULT_PROGRESS_STYLE.fontWeight,
    "--borderRadius": isNil(targetConfig.borderRadius)
      ? DEFAULT_PROGRESS_STYLE.borderRadius
      : `${targetConfig.borderRadius}px`,
    "--commonColor": targetConfig.commonColor ?? DEFAULT_PROGRESS_STYLE.commonColor
  };
};
</script>
<style lang="scss" scoped>
span[data-name="btn"] {
  cursor: pointer;
}
.wrap {
  word-break: break-all;
}
.is-custom-background {
  :deep(.el-progress-bar__inner--striped) {
    background-image: var(--lineargradient);
    background-size: auto;
  }
}
.is-normal-background {
  :deep(.el-progress-bar__inner) {
    background-color: var(--normalColor) !important;
  }
}
.part-progress {
  :deep(.el-progress-bar__outer) {
    background-color: var(--outerBgColor) !important;
  }
  :deep(.el-progress__text) {
    color: var(--textColor) !important;
    font-size: var(--textFontSize) !important;
    font-family: var(--textFamily) !important;
    font-style: var(--textFontStyle) !important;
    font-weight: var(--textFontWeight) !important;
  }
  :deep(.el-progress-bar__outer) {
    border-radius: var(--borderRadius) !important;
  }
  :deep(.el-progress-bar__inner) {
    border-radius: var(--borderRadius) !important;
  }
  :deep(.el-progress-circle__path) {
    stroke: var(--commonColor) !important;
  }
  :deep(.el-progress-circle__track) {
    stroke: var(--outerBgColor) !important;
  }
}
</style>
