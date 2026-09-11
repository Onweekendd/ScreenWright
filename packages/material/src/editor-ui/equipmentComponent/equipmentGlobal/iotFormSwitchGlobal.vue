<template>
  <div class="iot-form-switch-global">
    <el-form-item label="显示类型" :label-width="firstLabelWidth">
      <el-select v-model="selectTargetData[0].option.type" popper-class="sw-select-dropdown" @change="update">
        <el-option v-for="item in showTypeOption" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="打开时的文字" :label-width="firstLabelWidth">
      <sw-input v-model="selectTargetData[0].option.activeText" @change="update" />
    </el-form-item>
    <el-form-item label="关闭时的文字" :label-width="firstLabelWidth">
      <sw-input v-model="selectTargetData[0].option.inactiveText" @change="update" />
    </el-form-item>
    <el-form-item
      label="打开时的背景色"
      v-if="selectTargetData[0].option.type !== 'image'"
      :label-width="firstLabelWidth"
    >
      <sw-single-color-picker
        field="activeColor"
        v-model="selectTargetData[0].option.activeColor"
        :presetColor="selectTargetData[0].option.activeColor"
        @change="update"
      />
    </el-form-item>
    <el-form-item
      label="关闭时的背景色"
      v-if="selectTargetData[0].option.type !== 'image'"
      :label-width="firstLabelWidth"
    >
      <sw-single-color-picker
        field="inactiveColor"
        v-model="selectTargetData[0].option.inactiveColor"
        :presetColor="selectTargetData[0].option.inactiveColor"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="圆点大小" :label-width="firstLabelWidth">
      <sw-input-number v-model="selectTargetData[0].option.pointSize" unit="px" :controls="false" @change="update" />
    </el-form-item>
    <sw-collapse-item title="圆点配置" v-if="selectTargetData[0].option.type === 'default'">
      <template #content>
        <el-form-item label="打开时颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker
            field="pointColor"
            v-model="selectTargetData[0].option.pointColor"
            :presetColor="selectTargetData[0].option.pointColor"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="关闭时颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker
            field="pointColor2"
            v-model="selectTargetData[0].option.pointColor2"
            :presetColor="selectTargetData[0].option.pointColor2"
            @change="update"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="图标配置" v-if="selectTargetData[0].option.type === 'icon'">
      <template #content>
        <el-form-item label="打开图标" :label-width="secondLabelWidth">
          <sw-upload
            v-model="selectTargetData[0].option.activeIcon"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
        <el-form-item label="关闭图标" :label-width="secondLabelWidth">
          <sw-upload
            v-model="selectTargetData[0].option.inactiveIcon"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="图片配置" v-if="selectTargetData[0].option.type === 'image'">
      <template #content>
        <el-form-item label="打开图片" :label-width="secondLabelWidth">
          <sw-upload
            v-model="selectTargetData[0].option.activeImage"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
        <el-form-item label="关闭图片" :label-width="secondLabelWidth">
          <sw-upload
            v-model="selectTargetData[0].option.inactiveImage"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="文本配置">
      <template #content>
        <el-form-item label="样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange">
            <template #append>
              <sw-input-number
                v-model="selectTargetData[0].option.letterSpacing"
                unit="px"
                :controls="false"
                bottomLabel="字距"
                @change="update"
              />
            </template>
          </configTextStyle>
        </el-form-item>

        <el-form-item label="阴影" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.isTextShadow" @change="update" />
        </el-form-item>

        <el-form-item label="文本阴影" v-if="selectTargetData[0].option.isTextShadow" :label-width="70">
          <!-- <sw-color-picker
            class="colorPicker"
            size="mini"
            :show-alpha="false"
            v-model="selectTargetData[0].option.textShadow.color"
            @change="update"
          /> -->
          <div class="flex flex-between" style="width: 100%">
            <el-color-picker
              class="colorPicker"
              size="small"
              :show-alpha="true"
              v-model="selectTargetData[0].option.textShadow.color"
              style="position: relative; top: 7px"
              @change="update"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.textShadow.x"
              bottomLabel="X"
              :controls="false"
              @change="update"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.textShadow.y"
              bottomLabel="Y"
              :controls="false"
              @change="update"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.textShadow.blur"
              bottomLabel="模糊"
              :controls="false"
              @change="update"
            />
          </div>
        </el-form-item>
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui";
import { SwInput } from "@screenwright/ui";
import { SwInputNumber } from "@screenwright/ui";
import { SwSingleColorPicker } from "@screenwright/ui";
import SwUpload from "@editor/base/SwUpload/index.vue";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();

const showTypeOption = ref([
  { label: "默认", value: "default" },
  { label: "图标", value: "icon" },
  { label: "图片", value: "image" }
]);

const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "fontColor"
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
:deep(.el-color-picker__trigger) {
  border: none !important;
}
</style>
