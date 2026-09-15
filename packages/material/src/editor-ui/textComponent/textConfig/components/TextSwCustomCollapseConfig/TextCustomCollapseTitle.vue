<template>
  <SwCollapseItem title="标题配置" open>
    <template #content>
      <el-form-item label="高度" :label-width="secondLabelWidth">
        <SwInputNumber v-model="selectTargetData[0].option.titleHeight" @change="update" unit="px" />
      </el-form-item>
      <el-form-item label="背景图" :label-width="secondLabelWidth">
        <SwUpload v-model="selectTargetData[0].option.titleBgImage" @change="update" />
      </el-form-item>
      <el-form-item label="尺寸类型" :label-width="secondLabelWidth">
        <el-select
          popper-class="sw-select-dropdown"
          v-model="selectTargetData[0].option.titleBgSize"
          @change="update"
        >
          <el-option v-for="item in backgroundSizeType" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="文本样式" :label-width="secondLabelWidth">
        <ConfigTextStyle v-model="input" @change="handleConfigTextChange" labelWidth="73">
          <template #append>
            <sw-input-number
              style="margin-left: 10px"
              v-model="selectTargetData[0].option.letterSpacing"
              unit="px"
              bottomLabel="字距"
              @change="update"
              width="80"
            />
          </template>
        </ConfigTextStyle>
      </el-form-item>
      <el-form-item label="对齐方式" :label-width="secondLabelWidth">
        <el-select
          style="width: 100%"
          popper-class="sw-select-dropdown"
          v-model="selectTargetData[0].option.textAlign"
          @change="update"
        >
          <el-option v-for="item in textAlign" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="文本偏移" :label-width="secondLabelWidth">
        <div class="flex flex-center-between">
          <sw-input-number
            v-model="selectTargetData[0].option.textTranslateX"
            unit="px"
            @change="update"
            bottomLabel="X"
          />
          <sw-input-number
            v-model="selectTargetData[0].option.textTranslateY"
            unit="px"
            @change="update"
            bottomLabel="Y"
          />
        </div>
      </el-form-item>
      <el-form-item label="阴影" :label-width="secondLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.isTextShadow" @change="update" />
      </el-form-item>
      <ItemTextShadow
        v-if="selectTargetData[0].option.isTextShadow"
        v-model="textShadowInput"
        label="文本阴影"
        @change="handleConfigTextShadowChange"
        :label-width="secondLabelWidth"
      />
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import SwUpload from "@editor/base/SwUpload/index.vue";
import ConfigTextStyle from "@editor/components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "@editor/components/configTextStyle/useTextStyleAttrs";
import ItemTextShadow from "../../ItemComponent/ItemTextShadow/index.vue";
import { useItemTextShadowAttrs } from "../../ItemComponent/ItemTextShadow/useItemTextShadow";

import { useUpdateInstance } from "../../../../useUpdateInstance";
import { secondLabelWidth } from "../../../textConfig/textConfig";
import { backgroundSizeType } from "../../constants";

const { update, selectTargetData } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "fontColor"
});

const { input: textShadowInput, handleConfigTextShadowChange } = useItemTextShadowAttrs({
  preFied: "textShadow",
  color: "color",
  x: "x",
  y: "y",
  blur: "blur"
});
const textAlign = ref([
  { label: "居中", value: "center" },
  { label: "左对齐", value: "left" },
  { label: "右对齐", value: "right" }
]);
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

.input-wrap {
  width: 100%;
}
</style>
