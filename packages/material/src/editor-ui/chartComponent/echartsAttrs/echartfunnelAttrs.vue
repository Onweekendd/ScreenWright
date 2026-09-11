<template>
  <div class="echartfunnelAttrs">
    <el-form-item label="漏斗图朝向" :label-width="firstLabelWidth">
      <el-select
        v-model="selectTargetData[0].option.seriesOrient"
        popper-class="sw-select-dropdown"
        @change="update"
      >
        <el-option v-for="item in commonOrient" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="漏斗图排序" :label-width="firstLabelWidth">
      <el-select v-model="selectTargetData[0].option.seriesSort" popper-class="sw-select-dropdown" @change="update">
        <el-option v-for="item in funnelSort" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="布局类型" :label-width="firstLabelWidth">
      <el-select
        v-model="selectTargetData[0].option.seriesFunnelAlign"
        popper-class="sw-select-dropdown"
        @change="update"
      >
        <el-option v-for="item in textAlign" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="间距" :label-width="firstLabelWidth" open>
      <sw-input-number :controls="true" v-model="selectTargetData[0].option.seriesGap" @change="update" />
    </el-form-item>
    <ItemTextShadow v-model="ShadowInput" @change="handleConfigTextShadowChange" :labelWidth="firstLabelWidth" />
    <sw-collapse-item title="边框" open>
      <template #content>
        <el-form-item label="边框颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker
            v-model="selectTargetData[0].option.borderColor"
            field="seriesColor"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="边框宽度" :label-width="secondLabelWidth">
          <sw-input-number :controls="true" v-model="selectTargetData[0].option.borderWidth" @change="update" />
        </el-form-item>
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import { commonOrient, firstLabelWidth, funnelSort, secondLabelWidth, textAlign } from "../../constants";
import ItemTextShadow from "../../textComponent/textConfig/ItemComponent/ItemTextShadow/index.vue";
import { useItemTextShadowAttrs } from "../../textComponent/textConfig/ItemComponent/ItemTextShadow/useItemTextShadow";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input: ShadowInput, handleConfigTextShadowChange } = useItemTextShadowAttrs({
  color: "shadowColor",
  x: "shadowOffsetX",
  y: "shadowOffsetY",
  blur: "shadowBlur",
  preFied: ""
});
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
