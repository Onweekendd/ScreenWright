<template>
  <SwCollapseItem title="内容配置" open>
    <template #content>
      <el-form-item label="高度" :label-width="secondLabelWidth">
        <SwInputNumber v-model="selectTargetData[0].option.contentHeight" @change="update" unit="px" />
      </el-form-item>
      <el-form-item label="背景图" :label-width="secondLabelWidth">
        <SwUpload v-model="selectTargetData[0].option.contentBgImage" @change="update" />
      </el-form-item>
      <el-form-item label="尺寸类型" :label-width="secondLabelWidth">
        <el-select
          popper-class="sw-select-dropdown"
          v-model="selectTargetData[0].option.contentBgSize"
          @change="update"
        >
          <el-option v-for="item in backgroundSizeType" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="窗口边距" :label-width="secondLabelWidth">
        <div class="input-wrap flex flex-center-between">
          <SwInputNumber
            v-model="selectTargetData[0].option.paddingTop2"
            :controls="false"
            unit="px"
            bottom-label="上下"
            width="90"
            @change="update"
          />
          <SwInputNumber
            v-model="selectTargetData[0].option.paddingLeft2"
            :controls="false"
            unit="px"
            bottom-label="左右"
            width="90"
            @change="update"
          />
        </div>
      </el-form-item>
      <el-form-item label="窗口比例" :label-width="secondLabelWidth">
        <div class="input-wrap flex flex-center-between">
          <SwInputNumber
            v-model="selectTargetData[0].option.imageWidth"
            :controls="false"
            unit="%"
            width="90"
            @change="update"
          />
          <SwInputNumber
            v-model="selectTargetData[0].option.imageHeight"
            :controls="false"
            unit="%"
            width="90"
            @change="update"
          />
        </div>
      </el-form-item>
      <el-form-item label="窗口偏移" :label-width="secondLabelWidth">
        <div class="input-wrap flex flex-center-between">
          <SwInputNumber
            v-model="selectTargetData[0].option.translateX"
            unit="px"
            :controls="false"
            bottom-label="X"
            @chaneg="update"
            width="90"
          />
          <SwInputNumber
            v-model="selectTargetData[0].option.translateY"
            unit="px"
            :controls="false"
            bottom-label="Y"
            @chaneg="update"
            width="90"
          />
        </div>
      </el-form-item>
      <el-form-item label="圆角边框" :label-width="secondLabelWidth">
        <div class="input-wrap flex flex-center-between">
          <SwInputNumber
            v-model="selectTargetData[0].option.radiusTop"
            :controls="false"
            bottom-label="上"
            @chaneg="update"
            width="40"
          />
          <SwInputNumber
            v-model="selectTargetData[0].option.radiusRight"
            :controls="false"
            bottom-label="右"
            @chaneg="update"
            width="40"
          />
          <SwInputNumber
            v-model="selectTargetData[0].option.radiusBottom"
            :controls="false"
            bottom-label="下"
            @chaneg="update"
            width="40"
          />
          <SwInputNumber
            v-model="selectTargetData[0].option.radiusLeft"
            :controls="false"
            bottom-label="左"
            @chaneg="update"
            width="40"
          />
        </div>
      </el-form-item>
      <el-form-item label="文本样式" :label-width="secondLabelWidth">
        <ConfigTextStyle v-model="input" @change="handleConfigTextChange" :showLetterSpacing="true" labelWidth="73" />
      </el-form-item>
      <el-form-item label="阴影" :label-width="secondLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.isTextShadow2" @change="update" />
      </el-form-item>
      <ItemTextShadow
        v-if="selectTargetData[0].option.isTextShadow2"
        v-model="textShadowInput"
        label="文本阴影"
        @change="handleConfigTextShadowChange"
        :label-width="secondLabelWidth"
      />
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
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
  fontFamily: "fontFamily2",
  fontStyle: "fontStyle2",
  fontWeight: "fontWeight2",
  fontSize: "fontSize2",
  color: "fontColor2"
  // letterSpacing: "letterSpacing2",
  // lineHeight: "lineHeight2"
});

const { input: textShadowInput, handleConfigTextShadowChange } = useItemTextShadowAttrs({
  preFied: "textShadow2",
  color: "color",
  x: "x",
  y: "y",
  blur: "blur"
});
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

.input-wrap {
  width: 100%;
}
</style>
