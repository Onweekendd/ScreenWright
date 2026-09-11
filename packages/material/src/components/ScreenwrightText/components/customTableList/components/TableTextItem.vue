<template>
  <div :class="column.seriesYOverFlow" :style="textStyle">
    <template v-if="column.seriesYIsMapping">
      <PartsMarquee
        v-if="column.seriesYOverFlow === 'carousel'"
        style="padding: 0"
        :key="`${contentText}-${listIndex}`"
        :content="contentText"
        :power="25"
        :uuid="`${contentText}-${listIndex}`"
        direction="left"
      />
      <div v-else :data-translate="contentText">{{ contentText }}</div>
    </template>
    <template v-else>
      <!--   -->
      <PartsMarquee
        v-if="column.seriesYOverFlow === 'carousel'"
        style="padding: 0"
        :key="`${column.word}-${listIndex}`"
        :content="column.word"
        :power="25"
        :uuid="`${column.word}-${listIndex}`"
        direction="left"
      />
      <div v-else :data-translate="column.word">{{ column.word }}</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed } from "vue";

import { setMinioUrl } from "@material/minioUrl";

import PartsMarquee from "../../PartsMarquee/index.vue";

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
  option: {
    type: Object,
    required: true
  }
});

// 计算属性：获取文本内容
const contentText = computed(() => {
  let returnLabel = getColumnAliasLabel();

  // 内容类型为文字的特殊处理，加上后缀
  if (props.column?.wordValueType === "number") {
    returnLabel += props.column?.wordUnit || "";
  }

  return returnLabel;
});

// 计算属性：获取文本样式
const textStyle = computed<CSSProperties>(() => {
  const defaultStyle = {
    width: `${props.column.seriesYOffsetWidth}px`,
    textAlign: props.column.seriesYTextAlign as any,
    lineHeight: `${props.column.seriesYLineHeight}px`,
    fontFamily: `${props.column.seriesYFontFamily}`,
    fontSize: `${props.column.seriesYFontSize}px`,
    letterSpacing: `${props.column.seriesYLetterSpacing}px`,
    color: `${props.column.seriesYColor}`,
    fontStyle: `${props.column.seriesYFontStyle}`,
    fontWeight: `${props.column.seriesYFontWeight}`
  };

  const mappingStyle = props.column.seriesYIsMapping ? getAssignStyle() : {};
  return {
    ...defaultStyle,
    ...mappingStyle
  };
});

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

// 获取映射样式
const getAssignStyle = () => {
  let returnStyle = {};
  const alias = props.option.column[props.columnIndex].alias;
  if (alias && Object.keys(props.listItem).includes(alias)) {
    props.option.column[props.columnIndex]?.styleAssignList?.forEach((sa: any) => {
      // 字段名、内容类型、字段值与表格数据值匹配、该子项映射的值指定样式的值相等，则可以设置style
      if (sa.styleAssignKeyValue === contentText.value) {
        if (props.column?.wordValueType === "string") {
          returnStyle = {
            fontFamily: sa.styleAssignFontFamily,
            fontSize: sa.styleAssignFontSize + "px",
            lineHeight: (sa.styleAssignLineHeight || sa.styleAssignHeight) + "px",
            letterSpacing: sa.styleAssignLetterSpacing + "px",
            color: sa.styleAssignColor,
            fontStyle: sa.styleAssignFontStyle,
            fontWeight: sa.styleAssignFontWeight,
            background: `url(${setMinioUrl(sa.styleAssignBgImg || "")}) no-repeat center/100% 100%`,
            width: sa.styleAssignWdith + "px",
            marginLeft: sa.styleAssignMarginLeft + "px"
          };
        }
      }

      // 新加的文字类型如果是数字，需做特殊处理
      if (props.column?.wordValueType === "number") {
        // 设置checkCondition的入参
        const checkItem = {
          expected: sa.styleAssignKeyValue,
          field: props.column.alias,
          compare: sa.styleAssignConditions
        };

        // 检索是否满足条件
        if (checkCondition(checkItem, props.listItem)) {
          returnStyle = {
            fontFamily: sa.styleAssignFontFamily,
            fontSize: sa.styleAssignFontSize + "px",
            lineHeight: (sa.styleAssignLineHeight || sa.styleAssignHeight) + "px",
            letterSpacing: sa.styleAssignLetterSpacing + "px",
            color: sa.styleAssignColor,
            fontStyle: sa.styleAssignFontStyle,
            fontWeight: sa.styleAssignFontWeight,
            background: `url(${setMinioUrl(sa.styleAssignBgImg || "")}) no-repeat center/100% 100%`,
            width: sa.styleAssignWdith + "px",
            marginLeft: sa.styleAssignMarginLeft + "px"
          };
        }
      }
    });
  }

  return returnStyle;
};

// 检查条件
function checkCondition(
  checkItem: { expected: any; field: any; compare: any },
  listItem: Record<string, any>
): boolean {
  // 字段
  let func: string;
  // 若expected为字符串 则判断内容加双引号
  if (isNaN(Number(checkItem.expected))) {
    func = `"${listItem[checkItem.field] || 0}" ${checkItem.compare} "${checkItem.expected || ""}"`;
  } else func = `${listItem[checkItem.field] || 0} ${checkItem.compare} ${checkItem.expected || 0}`;

  switch (checkItem.compare) {
    case "include":
      return listItem[checkItem.field]?.includes(checkItem.expected);
    case "exclude":
      return !listItem[checkItem.field]?.includes(checkItem.expected);
    default:
      break;
  }
  // 检查func是否有效
  try {
    return eval(func);
  } catch {
    return false;
  }
}
</script>
