<template>
  <SwCollapseItem @change="update" title="数值标签" v-model="selectTargetData[0].option.seriesLabelShow" showIcon>
    <template #content>
      <el-form-item label="内边距" label-width="73">
        <div class="fullWidth flex flex-center-between">
          <SwInputNumber
            @change="update"
            v-model="selectTargetData[0].option.seriesLabel.padding[0]"
            :min="0"
            width="40"
            unit="px"
          />
          <SwInputNumber
            @change="update"
            v-model="selectTargetData[0].option.seriesLabel.padding[1]"
            :min="0"
            width="40"
            unit="px"
          />
          <SwInputNumber
            @change="update"
            v-model="selectTargetData[0].option.seriesLabel.padding[2]"
            :min="0"
            width="40"
            unit="px"
          />
          <SwInputNumber
            @change="update"
            v-model="selectTargetData[0].option.seriesLabel.padding[3]"
            :min="0"
            width="40"
            unit="px"
          />
        </div>
      </el-form-item>
      <el-form-item label="文本样式" label-width="73">
        <configTextStyle v-model="input" @change="handleConfigTextChange" />
      </el-form-item>
      <el-form-item label="水平对齐" label-width="73">
        <el-select
          popper-class="sw-select-dropdown"
          v-model="selectTargetData[0].option.seriesLabel.align"
          placeholder="Select"
          style="width: 100%"
          @change="update"
        >
          <el-option v-for="item in textAlign" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="垂直对齐" label-width="73">
        <el-select
          popper-class="sw-select-dropdown"
          v-model="selectTargetData[0].option.seriesLabel.verticalAlign"
          placeholder="Select"
          style="width: 100%"
          @change="update"
        >
          <el-option v-for="item in verticalAlign" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <!-- 偏移 -->
      <ItemConfigOffsetDis />
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";

import configTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { useUpdateInstance } from "../../../useUpdateInstance";
import ItemConfigOffsetDis from "../../ItemComponent/ItemConfigOffsetDis/index.vue";

const { update, selectTargetData } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "seriesLabelFontFamily",
  fontStyle: "seriesLabelFontStyle",
  fontWeight: "seriesLabelFontWeight",
  fontSize: "seriesLabelFontSize",
  color: "seriesLabelColor"
});
const textAlign = ref([
  { label: "居中", value: "center" },
  { label: "左对齐", value: "right" },
  { label: "右对齐", value: "left" }
]);
const verticalAlign = ref([
  { label: "top", value: "bottom" },
  { label: "inside", value: "middle" },
  { label: "bottom", value: "top" }
]);
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
