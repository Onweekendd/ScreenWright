<template>
  <div class="ft-weather-style">
    <SwCollapseItem title="字体配置">
      <template #content>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <ConfigTextStyle v-model="input" @change="handleConfigTextChange" />
        </el-form-item>
        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div class="legend-size-wrapper flex flex-justify-between">
            <SwInputNumber
              v-model="selectTargetData[0].option.textTranslateX"
              unit="px"
              :controls="false"
              bottomLabel="X"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.textTranslateY"
              unit="px"
              :controls="false"
              bottomLabel="Y"
              @change="update"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui";
import { SwInputNumber } from "@screenwright/ui";

import ConfigTextStyle from "@editor/components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "@editor/components/configTextStyle/useTextStyleAttrs";
import { secondLabelWidth } from "@editor/constants";
import { useUpdateInstance } from "@editor/useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
console.log(selectTargetData.value[0], "selectTargetData.value[0]");

const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontSize: "fontSize",
  color: "fontColor",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight"
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
