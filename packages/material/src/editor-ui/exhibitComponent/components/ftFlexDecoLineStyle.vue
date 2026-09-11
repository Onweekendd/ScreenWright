<template>
  <sw-collapse-item title="样式" @change="update" :open="true">
    <template #title>
      <span>线样式</span>
    </template>
    <template #content>
      <sw-collapse-item title="主体" :label-width="73">
        <template #content>
          <el-form-item label="图片" :label-width="73">
            <sw-upload v-model="selectTargetData[0].option.lineBodyPic" :multiple="false" :showFileList="false" />
          </el-form-item>
          <el-form-item label="透明度" :label-width="73">
            <sw-slider v-model="selectTargetData[0].option.lineBodyOpacity" unit="%" @change="update" />
          </el-form-item>
          <el-form-item label="尺寸" :label-width="73">
            <sw-input-number
              @change="update"
              width="60"
              :unit="'px'"
              v-model="selectTargetData[0].option.lineBodyHeight"
            />
          </el-form-item>
        </template>
      </sw-collapse-item>
      <sw-collapse-item title="左端点">
        <template #content>
          <el-form-item label="图片" :label-width="73">
            <sw-upload v-model="selectTargetData[0].option.lineLeftPic" :multiple="false" :showFileList="false" />
          </el-form-item>

          <StatusSelector label="尺寸" :is-locked="isLeftLock" :properties="['width', 'height']">
            <div class="flex w-100 mb-10 flex-justify-between">
              <sw-input-number
                @change="syncValue(selectTargetData[0].option.lineLeftWidth, 'left')"
                width="60"
                :unit="'W'"
                v-model="selectTargetData[0].option.lineLeftWidth"
              />
              <el-button link @click="isLeftLock = !isLeftLock" style="margin: 1px 3px; top: 2px; position: relative">
                <Icon
                  type="Lock"
                  size="16"
                  style="position: relative; color: var(--el-input-text-color)"
                  v-if="isLeftLock"
                />
                <Icon type="Unlock" size="16" style="position: relative; color: var(--el-input-text-color)" v-else />
              </el-button>
              <sw-input-number
                @change="syncValue(selectTargetData[0].option.lineLeftHeight, 'left')"
                width="60"
                :unit="'H'"
                v-model="selectTargetData[0].option.lineLeftHeight"
              />
            </div>
          </StatusSelector>
          <el-form-item label="透明度" :label-width="73">
            <sw-slider v-model="selectTargetData[0].option.lineLeftOpacity" unit="%" @change="update" />
          </el-form-item>
        </template>
      </sw-collapse-item>
      <sw-collapse-item title="右端点">
        <template #content>
          <el-form-item label="图片" :label-width="73">
            <sw-upload v-model="selectTargetData[0].option.lineRightPic" :multiple="false" :showFileList="false" />
          </el-form-item>

          <StatusSelector label="尺寸" :is-locked="isRightLock" :properties="['width', 'height']">
            <div class="flex w-100 mb-10 flex-justify-between">
              <sw-input-number
                @change="syncValue(selectTargetData[0].option.lineRightWidth, 'right')"
                width="60"
                :unit="'W'"
                v-model="selectTargetData[0].option.lineRightWidth"
              />
              <el-button link @click="isRightLock = !isRightLock" style="margin: 1px 3px; top: 2px; position: relative">
                <Icon
                  type="Lock"
                  size="16"
                  style="position: relative; color: var(--el-input-text-color)"
                  v-if="isRightLock"
                />
                <Icon type="Unlock" size="16" style="position: relative; color: var(--el-input-text-color)" v-else />
              </el-button>
              <sw-input-number
                @change="syncValue(selectTargetData[0].option.lineRightHeight, 'right')"
                width="60"
                :unit="'H'"
                v-model="selectTargetData[0].option.lineRightHeight"
              />
            </div>
          </StatusSelector>
          <el-form-item label="透明度" :label-width="73">
            <sw-slider v-model="selectTargetData[0].option.lineRightOpacity" unit="%" @change="update" />
          </el-form-item>
        </template>
      </sw-collapse-item>
    </template>
  </sw-collapse-item>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui";
import { SwInputNumber } from "@screenwright/ui";
import { SwSlider } from "@screenwright/ui";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";
import StatusSelector from "@editor/attrsRender/components/statusAnimation/components/StatusSelector.vue";

import { useUpdateInstance } from "../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();

const isLeftLock = ref(true);
const isRightLock = ref(true);

const syncValue = (val: number | string, dirct: "left" | "right") => {
  if (isLeftLock.value && dirct === "left") {
    if (selectTargetData.value && selectTargetData.value[0]) {
      selectTargetData.value[0].option.lineLeftWidth = val as number;
      selectTargetData.value[0].option.lineLeftHeight = val as number;
    }
  }
  if (isRightLock.value && dirct === "right") {
    if (selectTargetData.value && selectTargetData.value[0]) {
      selectTargetData.value[0].option.lineRightWidth = val as number;
      selectTargetData.value[0].option.lineRightHeight = val as number;
    }
  }
  update();
};
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
