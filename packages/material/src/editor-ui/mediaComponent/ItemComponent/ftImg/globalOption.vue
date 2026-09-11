<template>
  <StatusSelector label="图片上传" :label-width="firstLabelWidth" :properties="['image']">
    <sw-upload v-model="imgValue" :multiple="false" :showFileList="false" @change="onFileChange" />
  </StatusSelector>

  <el-form-item label="鼠标事件" :label-width="firstLabelWidth">
    <el-checkbox v-model="selectTargetData[0].option.pointerEvents" @change="update" />
  </el-form-item>

  <el-form-item :label-width="firstLabelWidth">
    <template #label>
      <span
        >开启预览
        <el-tooltip class="item" effect="dark" placement="right">
          <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
          <template #content>
            <p style="width: 200px">开启预览，同时鼠标事件也需启用，点击查看预览大图</p>
          </template>
        </el-tooltip>
      </span>
    </template>
    <el-checkbox v-model="selectTargetData[0].option.openReview" @change="update" />
  </el-form-item>
  <div v-if="selectTargetData[0].option.openReview">
    <el-form-item label="预览图大小" :label-width="firstLabelWidth">
      <sw-input-number
        v-model.number="selectTargetData[0].option.reviewImageWidth"
        :min="1"
        unit="%"
        :controls="false"
        @change="update"
      />
    </el-form-item>
  </div>

  <StatusSelector label="透明度" :label-width="firstLabelWidth" :properties="['opacity']">
    <SwSlider v-model="selectTargetData[0].option.opacity" :max="1" :step="0.1" unit="°" @change="update" />
  </StatusSelector>

  <el-form-item label="混合模式" :label-width="firstLabelWidth">
    <el-select popper-class="sw-select-dropdown" v-model="selectTargetData[0].option.mixBlendMode" @change="update">
      <el-option v-for="item in mixBlendMode" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </el-form-item>
  <SwCollapseItem title="背景" open>
    <template #content>
      <el-form-item label="填充方式" :label-width="secondLabelWidth">
        <el-select
          popper-class="sw-select-dropdown"
          v-model="selectTargetData[0].option.backgroundType"
          @change="update"
        >
          <el-option v-for="item in backgroundType" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item
        label="颜色"
        :label-width="secondLabelWidth"
        v-if="selectTargetData[0].option.backgroundType == 'color'"
      >
        <sw-single-color-picker v-model="selectTargetData[0].option.backgroundColor" @change="update" />
      </el-form-item>
      <el-form-item
        label="类型"
        :label-width="secondLabelWidth"
        v-if="selectTargetData[0].option.backgroundType == 'custom'"
      >
        <el-select
          popper-class="sw-select-dropdown"
          v-model="selectTargetData[0].option.backgroundImageType"
          @change="update"
        >
          <el-option v-for="item in backgroundSizeType" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item
        label="图片"
        :label-width="secondLabelWidth"
        v-if="selectTargetData[0].option.backgroundType == 'custom'"
      >
        <sw-upload
          v-model="selectTargetData[0].backgroundImage"
          :multiple="false"
          :showFileList="false"
          @change="update"
          @delete="update"
        />
      </el-form-item>
    </template>
  </SwCollapseItem>
  <SwCollapseItem title="旋转设置" v-model="selectTargetData[0].option.rotateShow" @change="update" showIcon>
    <template #content>
      <StatusSelector label="绕X轴" :label-width="secondLabelWidth" :properties="['rotateX']">
        <SwSlider
          v-model="selectTargetData[0].option.rotateX"
          :max="180"
          :min="-180"
          :step="0.1"
          unit="°"
          @change="update"
        />
      </StatusSelector>
      <StatusSelector label="绕Y轴" :label-width="secondLabelWidth" :properties="['rotateY']">
        <SwSlider
          v-model="selectTargetData[0].option.rotateY"
          :max="180"
          :min="-180"
          :step="0.1"
          unit="°"
          @change="update"
        />
      </StatusSelector>
      <StatusSelector label="绕Z轴" :label-width="secondLabelWidth" :properties="['rotateZ']">
        <SwSlider
          v-model="selectTargetData[0].option.rotateZ"
          :max="180"
          :min="-180"
          :step="0.1"
          unit="°"
          @change="update"
        />
      </StatusSelector>
    </template>
  </SwCollapseItem>
</template>

<script setup lang="ts">
import { computed, toRaw } from "vue";

import type { ComponentMinioAsset } from "@screenwright/types";
import { isPlainObject } from "lodash-es";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";
import type { FtUploadChangePayload } from "@editor/base/SwUpload/SwUpload";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";
import StatusSelector from "../../../attrsRender/components/statusAnimation/components/StatusSelector.vue";
import { backgroundSizeType } from "../../../textComponent/textConfig/constants";
// import { FileTypeEnum } from "@screenwright/types";
import type { MenuItemForRender } from "@screenwright/types";

import { firstLabelWidth, secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";
import { backgroundType, mixBlendMode } from "../dict";

const { update, selectTargetData } = useUpdateInstance();

const imgValue = computed({
  get() {
    const data = selectTargetData.value[0].data;
    if (Array.isArray(data)) {
      return data[0] ? data[0].value : "";
    } else if (isPlainObject(data)) {
      return data.value;
    } else {
      return data;
    }
  },
  set(newValue) {
    const data = selectTargetData.value[0].data;
    if (Array.isArray(data)) {
      selectTargetData.value[0].data = [{ ...data[0], value: newValue }];
    } else if (isPlainObject(data)) {
      data.value = newValue;
    } else {
      selectTargetData.value[0].data = newValue;
    }
  }
});

/**
 * 文件上传完成 处理是资源从资产库获取的情况
 * @param value 文件信息
 */
const onFileChange = (value: FtUploadChangePayload | MenuItemForRender) => {
  console.log(value, "value");
  selectTargetData.value[0].minioArr = [
    ...(selectTargetData.value[0].minioArr || []),
    toRaw({ ...value })
  ] as unknown as ComponentMinioAsset[];
  // if ("assetType" in value && value.assetType === FileTypeEnum.personalPageAssets) {
  //   selectTargetData.value[0].minioArr = [
  //     ...(selectTargetData.value[0].minioArr || []),
  //     toRaw({ ...value })
  //   ] as unknown as ComponentMinioAsset[];
  // } else {
  //   selectTargetData.value[0].minioArr = [
  //     ...(selectTargetData.value[0].minioArr || []),
  //     toRaw({ ...value })
  //   ] as unknown as ComponentMinioAsset[];
  // }

  update();
};
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include checkbox-style();
@include common-element-style(".el-select__wrapper");
:deep(.el-select__wrapper) {
  min-height: 28px;
}
</style>
