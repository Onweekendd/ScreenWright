<template>
  <sw-collapse-item
    :title="title"
    v-model="selectTargetData[0].option.seriesList[currentIndex][`${prefix}Show`]"
    showIcon
    @change="update"
  >
    <template #content>
      <el-form-item label="文本样式" :label-width="thirdLabelWidth">
        <ConfigTextStyle v-model="textTyle[currentIndex]" @change="handleChange" />
      </el-form-item>
    </template>
  </sw-collapse-item>
</template>
<script lang="ts" setup>
import { onMounted, ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { capitalizeFirstLetter } from "@editor/attrsRender/utils";

import type { StyleProps } from "../../../components/configTextStyle/configTextStyle";
import ConfigTextStyle from "../../../components/configTextStyle/index.vue";
import { thirdLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const props = defineProps<{
  currentIndex: number;
  title: string;
  prefix: string;
}>();
const textTyle = ref<StyleProps[]>([]);
const init = () => {
  selectTargetData.value[0].option.seriesList.forEach((item: any) => {
    textTyle.value.push({
      fontFamily: item[`${props.prefix}FontFamily`],
      fontSize: item[`${props.prefix}FontSize`],
      color: item[`${props.prefix}Color`],
      fontStyle: item[`${props.prefix}FontStyle`],
      fontWeight: item[`${props.prefix}FontWeight`]
    });
  });
};
const handleChange = (key: keyof StyleProps, value: StyleProps) => {
  selectTargetData.value[0].option.seriesList[props.currentIndex][`${props.prefix}${capitalizeFirstLetter(key)}`] =
    value[key];
  update();
};
onMounted(() => {
  init();
});
</script>
