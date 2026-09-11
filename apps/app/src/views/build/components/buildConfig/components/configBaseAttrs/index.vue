<template>
  <div
    class="config-base-attrs"
    :key="selectTargetData[0].id"
    v-if="selectTargetData.length > 0 && selectTargetData[0]"
  >
    <div class="style-title">基本属性</div>
    <el-form label-width="100px" label-position="left" class="config-base-form">
      <!-- 示例1: 基础使用 - 根据 isClickable 状态自动切换光标 -->
      <el-form-item label="图层名称" :class="getCursorClass(false)">
        <sw-input
          @input="handleChangeInput"
          @blur="handleBlur"
          @focus="handleFocus"
          size="default"
          :model-value="selectTargetData[0].name"
          style="width: 100%"
          placeholder="请输入图层名称"
          :disabled="isLock"
        />
      </el-form-item>
      <StatusSelector label="位置" :is-locked="isLock" :properties="['left', 'top']">
        <div class="flex w-100 mb-10 flex-justify-between">
          <SwInputNumber
            @change="
              (val: number | undefined) => {
                handlePosition(positionType.left, val);
              }
            "
            width="90"
            :model-value="selectTargetData[0].left"
            unit="X"
            :disabled="isLock"
          />
          <SwInputNumber
            @change="
              (val: number | undefined) => {
                handlePosition(positionType.top, val);
              }
            "
            width="90"
            :model-value="selectTargetData[0].top"
            unit="Y"
            :disabled="isLock"
          />
        </div>
      </StatusSelector>

      <StatusSelector label="尺寸" :is-locked="isLock" :properties="['width', 'height']">
        <div class="flex w-100 mb-10 flex-justify-between">
          <SwInputNumber
            @change="
              (val: number | undefined) => {
                handleDirectionChange(direction.r, val);
              }
            "
            width="90"
            :unit="selectTargetData[0].unitPavenType === 'percent' ? '%W' : 'W'"
            :model-value="selectTargetData[0].component.width"
            :disabled="isLock || isEncodePanel"
          />
          <SwInputNumber
            @change="
              (val: number | undefined) => {
                handleDirectionChange(direction.b, val);
              }
            "
            width="90"
            :unit="selectTargetData[0].unitPavenType === 'percent' ? '%H' : 'H'"
            :model-value="selectTargetData[0].component.height"
            :disabled="isLock || isEncodePanel"
          />
        </div>
      </StatusSelector>
      <el-form-item label="布局约束" :is-locked="isLock">
        <div class="flex w-100 mb-10 flex-justify-between" style="padding-top: 5px">
          <ConfigLayoutConstraint v-model="constraintSettings" @change="update" />
        </div>
      </el-form-item>

      <StatusSelector label="显隐" :is-locked="isLock" :properties="['display']">
        <div class="flex w-100 flex-justify-between">
          <el-checkbox v-model="selectTargetData[0].display" @change="update" />
        </div>
      </StatusSelector>

      <el-form-item label="数据分析">
        <template #label>
          <span
            >数据分析
            <el-tooltip class="item" effect="dark" placement="left">
              <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
              <template #content>
                <p style="width: 200px">启动数据分析，会同步该图层数据到关联知识库，提供给数字人做数据分析等操作</p>
              </template>
            </el-tooltip>
          </span>
        </template>
        <el-checkbox v-model="enableDataAnalysisComputed" @change="update" />
      </el-form-item>

      <el-form-item label="数据分析名称" v-if="enableDataAnalysisComputed">
        <sw-input v-model="dataAnalysisNameComputed" @change="update" placeholder="请输入数据分析名称" />
      </el-form-item>

      <el-form-item
        label="单位类型"
        v-if="validProp(selectTargetData[0].component.name, unitParenList) && !selectTargetData[0].parent"
      >
        <template v-slot:label>
          <span
            >单位类型
            <el-tooltip class="item" effect="dark" placement="right">
              <i class="el-icon-question" style="font-size: 16px; vertical-align: middle" />
              <template #content>
                <p>宽高单位类型支持数值、百分比的切换，注意：切换百分比后原数值大小已变</p>
              </template>
            </el-tooltip>
          </span>
        </template>
        <sw-radio
          v-model="selectTargetData[0].unitPavenType"
          :option="unitParenOpt"
          :disabled="isLock || selectTargetData[0].parent"
          direction="row"
          @change="update"
        />
      </el-form-item>
    </el-form>
  </div>
</template>
<script setup lang="ts">
import { onMounted } from "vue";

import SwInput from "@/components/SwInput/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwRadio from "@/components/SwRadio/index.vue";
import Icon from "@/components/Icon/index.vue";
import StatusSelector from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/components/StatusSelector.vue";
import { direction } from "@/views/build/components/buildRender/type";

import ConfigLayoutConstraint from "./configLayoutConstraint/index.vue";
import { unitParenList, unitParenOpt, validProp } from "./index";
import { useConfigBaseAttrs } from "./useConfigBaseAttrs";

// useAddKeyboard hook已移至AdvancedFormItem组件中

const {
  selectTargetData,
  isLock,
  isEncodePanel,
  positionType,
  enableDataAnalysisComputed,
  dataAnalysisNameComputed,
  constraintSettings,
  handleDirectionChange,
  handleChangeInput,
  handlePosition,
  getCursorClass,
  handleBlur,
  handleFocus,
  update,
  initConstraint
} = useConfigBaseAttrs();

onMounted(() => {
  initConstraint();
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include radio-style();

:deep(.el-form-item__label) {
  cursor: inherit !important;
  color: inherit !important;
}

.sw-radio {
  .flex-column {
    :deep(.el-radio) {
      margin-right: 0 !important;
      width: 100%;
    }
  }
  :deep(.el-radio) {
    --el-radio-text-color: #b4b7c1;
  }
}
.w-100 {
  width: 100%;
}
.mb-10 {
  margin-bottom: 10px;
}
.config-base-attrs {
  .config-base-form {
    padding: 0 16px;
  }

  :deep(.el-form-item__label) {
    padding: 0 !important;
    color: #b4b7c1 !important;
    font-size: 12px;
    font-family:
      Source Han Sans CN-Normal,
      Source Han Sans CN;
    font-weight: 400;
  }
  .style-title {
    font-size: 12px;
    height: 30px;
    line-height: 30px;
    text-align: center;
    color: #ffffff !important;
    background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
    margin-bottom: 20px;
    border-radius: 5px 5px 0px 0px;
  }
  :deep(.el-input__inner) {
    font-size: 12px !important;
  }
}

// 原有的Ctrl键样式已移至AdvancedFormItem组件中
</style>
