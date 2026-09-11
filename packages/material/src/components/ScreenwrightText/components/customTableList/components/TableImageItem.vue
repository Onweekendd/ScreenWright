<template>
  <img :src="imageSrc" :style="imageStyle" alt="" v-if="imageSrc && imageSrc.length > 0" />
</template>

<script setup lang="ts">
import { computed } from "vue";

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
  columnIndex: {
    type: Number,
    required: true
  },
  option: {
    type: Object,
    required: true
  }
});

// 计算属性：获取图片源
const imageSrc = computed(() => {
  const assignStyle = getAssignStyle();
  if (props.column.seriesYIsMapping && assignStyle && assignStyle.icon) {
    return assignStyle.icon;
  }
  return setMinioUrl(props.column.icon || "");
});

// 计算属性：获取图片样式
const imageStyle = computed(() => {
  const defaultStyle = {
    width: `${props.column.seriesYOffsetWidth}px`,
    height: `${props.column.seriesYOffsetHeight}px`
  };

  const mappingStyle = props.column.seriesYIsMapping ? getAssignStyle() : {};

  return {
    "-webkit-mask-size": "cover",
    ...defaultStyle,
    ...mappingStyle
  };
});

// 获取映射样式
const getAssignStyle = () => {
  let returnStyle: Record<string, string> = {};

  if (
    props.option.column?.[props.columnIndex].alias &&
    Object.keys(props.listItem).includes(props.option.column[props.columnIndex].alias)
  ) {
    props.option.column[props.columnIndex]?.styleAssignList?.forEach((sa: any) => {
      if (sa.styleAssignKeyValue === getColumnAliasLabel()) {
        returnStyle = {
          icon: `${setMinioUrl(sa.styleAssignBgImg || "")}`,
          width: sa.styleAssignWdith + "px",
          height: sa.styleAssignHeight + "px"
        };
      }
    });
  }

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
</script>
