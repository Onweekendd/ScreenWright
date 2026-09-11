<template>
  <div
    class="table-button"
    :style="{
      backgroundColor: column.backgroundColor,
      color: column.textColor,
      borderRadius: `${column.borderRadius}px`,
      padding: `${column.paddingY}px ${column.paddingX}px`
    }"
    @click="emit('button-click', listItem, columnId)"
  >
    <div
      :class="`customTableList-btn id_${columnIndex}_${listIndex}`"
      :style="btnDefaultStyle"
      @mousedown.stop="handleMouseDown"
      @mouseup.stop="handleMouseUp"
      @click.stop="handleButtonClick"
      @mousemove="handleMouseMove"
      @mouseout="handleMouseOut"
    >
      <span class="ellipsis" :style="btnChildDefaultStyle" :data-translate="column.btnWord">
        {{ column.btnWord }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed, ref } from "vue";

import { setMinioUrl } from "@material/minioUrl";

const props = defineProps({
  column: {
    type: Object,
    required: true
  },
  listItem: {
    type: Object,
    required: true
  },
  listIndex: {
    type: Number,
    required: true
  },
  columnIndex: {
    type: Number,
    required: true
  },
  listData: {
    type: Array,
    required: true
  },
  option: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(["button-click", "btn-click"]);

const btnClicked = ref(false);
const columnId = computed(() => props.column.id || props.columnIndex);

// 获取按钮默认样式
const btnDefaultStyle = computed<CSSProperties>(() => {
  const defaultStyle = getBtnDefaultStyle("defaultObj");
  const mappingStyle = props.column.seriesYIsMapping ? getAssignStyle() : {};

  return {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    ...defaultStyle,
    ...mappingStyle
  };
});

// 获取按钮子元素样式
const btnChildDefaultStyle = computed<CSSProperties>(() => ({
  pointerEvents: "none",
  transform: `translate(${props.column.defaultObj?.textTranslateX}px, ${props.column.defaultObj?.textTranslateY}px)`,
  textShadow: props.column.defaultObj?.isTextShadow
    ? `${props.column.defaultObj?.textShadowColor} ${props.column.defaultObj?.textShadowX}px ${props.column.defaultObj?.textShadowY}px ${props.column.defaultObj?.textShadowBlur}px`
    : ""
}));

// 获取按钮默认样式
const getBtnDefaultStyle = (targetObj = "defaultObj"): CSSProperties => {
  // 根据传入的targetObj参数获取相应的样式对象
  const styleObj = props.column[targetObj] || props.column.defaultObj;

  return {
    width: `${props.column.seriesYOffsetWidth}px`,
    height: `${props.column.seriesYOffsetHeight}px`,
    lineHeight: `${styleObj?.seriesYLineHeight}px`,
    fontFamily: `${styleObj?.seriesYFontFamily}`,
    fontSize: `${styleObj?.seriesYFontSize}px`,
    letterSpacing: `${styleObj?.seriesYLetterSpacing}px`,
    color: `${styleObj?.seriesYColor}`,
    fontStyle: `${styleObj?.seriesYFontStyle}`,
    fontWeight: `${styleObj?.seriesYFontWeight}`,
    writingMode: props.column.seriesYTextWritingMode,
    alignItems: `${props.column.seriesYTextAlign}`,
    justifyContent: "center",
    background:
      styleObj?.backgroundType === "color"
        ? styleObj?.backgroundColor
        : `url(${setMinioUrl(styleObj?.backgroundImage || "")}) 50% 50% / ${styleObj?.backgroundImageType} no-repeat`,
    border: styleObj?.btnBorderShow
      ? `${styleObj?.borderWidth}px ${styleObj?.borderLineType} ${styleObj?.borderColor}`
      : "",
    boxShadow: styleObj?.btnShadowShow
      ? `${styleObj?.btnShadowInColor} ${styleObj?.btnShadowInX}px ${styleObj?.btnShadowInY}px ${styleObj?.btnShadowInBlur}px inset, ${styleObj?.btnShadowOutColor} ${styleObj?.btnShadowOutX}px ${styleObj?.btnShadowOutY}px ${styleObj?.btnShadowOutBlur}px`
      : ""
  };
};

// 获取映射样式
const getAssignStyle = (targetObj = "defaultObj") => {
  let returnStyle: CSSProperties = {};

  props.option.column[props.columnIndex][targetObj]?.styleAssignList?.forEach((item: any) => {
    if (item.styleAssignKeyValue === getColumnAliasLabel()) {
      returnStyle = {
        width: item.styleAssignWdith + "px",
        height: item.styleAssignHeight + "px",
        background: `url(${setMinioUrl(item.styleAssignBgImg || "")}) 50% 50% / ${
          props.option.column[props.columnIndex][targetObj].backgroundImageType
        } no-repeat`
      };
    }
  });

  return returnStyle;
};

// 获取列别名标签
const getColumnAliasLabel = () => {
  let returnLabel = "";
  const listItemKeys = Object.keys(props.listItem);

  if (
    props.option.column?.[props.columnIndex].alias &&
    listItemKeys.includes(props.option.column[props.columnIndex].alias)
  ) {
    returnLabel = props.listItem[props.option.column[props.columnIndex].alias];
  }

  return returnLabel;
};

// 按钮样式处理
const handleSetBtnStyle = (e: MouseEvent, type: string) => {
  const btnDom = e.target as HTMLElement;
  if (!btnDom) return;

  let btnDomNewStyle: any = {};
  const btnDomChildNewStyle: Record<string, string> = {};

  switch (type) {
    case "click":
      if (btnClicked.value) {
        btnDomNewStyle = getBtnDefaultStyle("activeObj");
      } else {
        if (props.column.btnIsHovered) {
          handleSetBtnStyle(e, "hover");
        } else {
          btnDomNewStyle = getBtnDefaultStyle();
        }
      }
      break;
    case "hover":
      if (props.column.btnIsHovered && !btnClicked.value) {
        btnDomNewStyle = getBtnDefaultStyle("hoverObj");
      }
      break;
    case "mouseout":
      {
        const targetAssignStyleIndex = props.column.defaultObj.styleAssignList.findIndex(
          (sn: any) => sn.styleAssignKeyValue === getColumnAliasLabel()
        );
        btnDomNewStyle = getBtnDefaultStyle();

        // 有指定样式就设置指定样式，没有就默认样式
        if (targetAssignStyleIndex !== -1) {
          const assignStyle = getAssignStyle();
          if (assignStyle) {
            btnDomNewStyle = {
              ...btnDomNewStyle,
              ...assignStyle
            };
          }
        }
      }
      break;
  }

  if (btnDomNewStyle) {
    Object.keys(btnDomNewStyle).forEach((key) => {
      (btnDom.style as any)[key] = btnDomNewStyle[key];
    });
  }

  if (btnDomChildNewStyle) {
    Object.keys(btnDomChildNewStyle).forEach((key) => {
      const childElement = Array.from(btnDom.childNodes)[0] as HTMLElement;
      (childElement.style as any)[key] = btnDomChildNewStyle[key];
    });
  }
};

// 添加以下事件处理函数
const handleMouseDown = (e: MouseEvent) => {
  btnClicked.value = true;
  handleSetBtnStyle(e, "click");
};

const handleMouseUp = (e: MouseEvent) => {
  btnClicked.value = false;
  handleSetBtnStyle(e, "click");
};

const handleButtonClick = () => {
  emit("btn-click", props.listItem, columnId.value);
};

const handleMouseMove = (e: MouseEvent) => {
  handleSetBtnStyle(e, "hover");
};

const handleMouseOut = (e: MouseEvent) => {
  handleSetBtnStyle(e, "mouseout");
};
</script>

<style lang="scss" scoped>
.table-button {
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  outline: none;
  width: 100%;
  height: 100%;
  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}
</style>
