<template>
  <div class="btn-option">
    <el-form-item label="按钮类型" :label-width="firstLabelWidth">
      <el-select popper-class="sw-select-dropdown" v-model="selectTargetData[0].option.buttonType" @change="update">
        <el-option v-for="item in buttonTypeOption" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="按钮大小" :label-width="firstLabelWidth">
      <div class="flex flex-center-between">
        <sw-input-number
          v-model.number="selectTargetData[0].option.buttonWidth"
          :min="0"
          unit="px"
          bottomLabel="宽度"
          @change="update"
        />
        <sw-input-number
          v-model.number="selectTargetData[0].option.buttonHeight"
          :min="0"
          unit="px"
          bottomLabel="高度"
          @change="update"
        />
      </div>
    </el-form-item>
    <el-form-item label="位置偏移" :label-width="firstLabelWidth">
      <div class="flex flex-center-between">
        <sw-input-number
          v-model.number="selectTargetData[0].option.buttonTranslateX"
          :min="0"
          unit="px"
          bottomLabel="X"
          @change="update"
        />
        <sw-input-number
          v-model.number="selectTargetData[0].option.buttonTranslateY"
          :min="0"
          unit="px"
          bottomLabel="Y"
          @change="update"
        />
      </div>
    </el-form-item>
    <el-form-item
      label="按钮内容"
      v-if="selectTargetData[0].option.buttonType === 'text'"
      :label-width="firstLabelWidth"
    >
      <sw-input v-model="selectTargetData[0].option.buttonContent" type="text" @change="update" />
    </el-form-item>
    <SwCollapseItem title="背景图">
      <template #content>
        <el-form-item label="类型" :label-width="secondLabelWidth">
          <el-select
            popper-class="sw-select-dropdown"
            v-model="selectTargetData[0].option.buttonImageType"
            @change="update"
          >
            <el-option v-for="item in backgroundImageType" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="图片" :label-width="secondLabelWidth">
          <sw-upload
            v-model="selectTargetData[0].option.buttonImage"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem v-if="selectTargetData[0].option.buttonType === 'icon'" title="图标">
      <template #content>
        <el-form-item label="类型" :label-width="secondLabelWidth">
          <el-select
            popper-class="sw-select-dropdown"
            v-model="selectTargetData[0].option.buttonIconType"
            @change="update"
          >
            <el-option v-for="item in backgroundImageType" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="大小" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model.number="selectTargetData[0].option.buttonIconWidth"
              :min="1"
              unit="px"
              bottomLabel="宽度"
              @change="update"
            />
            <sw-input-number
              v-model.number="selectTargetData[0].option.buttonIconHeight"
              :min="1"
              unit="px"
              bottomLabel="高度"
              @change="update"
            />
          </div>
        </el-form-item>
        <el-form-item label="图标" :label-width="secondLabelWidth">
          <sw-upload
            v-model="selectTargetData[0].option.buttonIcon"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem v-else title="文本">
      <template #content>
        <el-form-item label="文字样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="fontInput" @change="handleChange">
            <template #append>
              <div class="flex flex-center-between" style="width: 100%">
                <sw-input-number
                  v-model.number="selectTargetData[0].option.buttonLetterSpacing"
                  :min="0"
                  unit="px"
                  bottomLabel="字距"
                  @change="update"
                />
              </div>
            </template>
          </configTextStyle>
        </el-form-item>
        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model.number="selectTargetData[0].option.buttonTextTranslateX"
              :min="0"
              unit="px"
              bottomLabel="X"
              @change="update"
            />
            <sw-input-number
              v-model.number="selectTargetData[0].option.buttonTextTranslateY"
              :min="0"
              unit="px"
              bottomLabel="Y"
              @change="update"
            />
          </div>
        </el-form-item>
        <el-form-item label="阴影" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.isButtonTextShadow" @change="update" />
        </el-form-item>
        <el-form-item
          label="文本阴影"
          :label-width="secondLabelWidth"
          v-if="selectTargetData[0].option.isButtonTextShadow"
        >
          <div class="flex flex-left-between">
            <el-color-picker
              class="colorPicker"
              size="small"
              :show-alpha="true"
              v-model="selectTargetData[0].option.buttonTextShadow.color"
              style="position: relative; top: 5px"
              @change="update"
            />
            <sw-input-number v-model="selectTargetData[0].option.buttonTextShadow.x" bottomLabel="X" @change="update" />
            <sw-input-number v-model="selectTargetData[0].option.buttonTextShadow.y" bottomLabel="Y" @change="update" />
            <sw-input-number
              v-model="selectTargetData[0].option.buttonTextShadow.blur"
              bottomLabel="模糊"
              @change="update"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { reactive } from "vue";

// import SwSingleColorPicker from "@/components/SwSingleColorPicker/index.vue"
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import SwUpload from "@editor/base/SwUpload/index.vue";

import configTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();

const { input: fontInput, handleConfigTextChange: handleChange } = useFontStyleAttrs({
  fontFamily: "buttonFontFamily",
  fontStyle: "buttonFontStyle",
  fontWeight: "buttonFontWeight",
  fontSize: "buttonFontSize",
  color: "buttonFontColor"
});

const buttonTypeOption = reactive([
  { label: "文本", value: "text" },
  { label: "图标", value: "icon" }
]);

const backgroundImageType = reactive([
  { label: "适应", value: "100% 100%" },
  { label: "原比例", value: "contain" },
  { label: "裁切", value: "cover" }
]);
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
:deep(.el-color-picker__trigger) {
  border: none !important;
}
.sw-label-type {
  width: 100%;
  :deep(.el-select) {
    margin-right: 5px;
  }
  :deep(.el-select__wrapper) {
    min-height: 28px;
  }
  .sw-label-type-number {
    position: relative;
    top: -2px;
  }
}
</style>
