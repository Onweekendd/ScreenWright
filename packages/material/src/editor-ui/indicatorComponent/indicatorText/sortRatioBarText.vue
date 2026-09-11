<template>
  <div class="sort-ratio-bar-text">
    <el-form-item label="启用" :label-width="firstLabelWidth">
      <el-switch v-model="selectTargetData[0].option.textConfig.isUsed" class="ft-switch" />
    </el-form-item>
    <el-form-item label="偏移" :label-width="firstLabelWidth">
      <div class="flex flex-justify-between" style="width: 100%">
        <SwInputNumber
          v-model="selectTargetData[0].option.textConfig.translateX"
          bottomLabel="水平"
          width="90"
          controls
          @change="update"
        />
        <SwInputNumber
          v-model="selectTargetData[0].option.textConfig.translateY"
          bottomLabel="垂直"
          width="90"
          controls
          @change="update"
        />
      </div>
    </el-form-item>
    <SwCollapseItem @change="update" title="标签" show-icon v-model="selectTargetData[0].option.textConfig.tagShow">
      <template #content>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange">
            <template #append>
              <div class="flex flex-justify-between" style="width: 100%">
                <SwInputNumber
                  v-model="selectTargetData[0].option.textConfig.tagLetterSpacing"
                  @change="update"
                  bottomLabel="字距"
                  unit="px"
                  width="60"
                  style="margin-left: 12px"
                />
                <SwInputNumber
                  v-model="selectTargetData[0].option.textConfig.tagLineHeight"
                  @change="update"
                  bottomLabel="行距"
                  unit="px"
                  width="60"
                />
              </div>
            </template>
          </configTextStyle>
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem @change="update" title="指标" show-icon v-model="selectTargetData[0].option.textConfig.indexShow">
      <template #content>
        <el-form-item label="保留小数" :label-width="secondLabelWidth">
          <sw-input-number
            @change="update"
            v-model.number="selectTargetData[0].option.textConfig.decimalPlace"
            unit="位"
            :min="0"
          />
        </el-form-item>
        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div class="flex flex-center-between" style="width: 100%">
            <sw-input-number
              v-model="selectTargetData[0].option.textConfig.indexTranslateX"
              unit="px"
              bottomLabel="水平"
              @change="update"
              width="100"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.textConfig.indexTranslateY"
              unit="px"
              bottomLabel="垂直"
              @change="update"
              width="100"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "tagFontFamily",
  fontStyle: "tagFontStyle",
  fontWeight: "tagFontWeight",
  fontSize: "tagFontSize",
  color: "tagColor",
  attrs: "textConfig"
});
</script>
