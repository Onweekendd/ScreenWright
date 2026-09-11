<template>
  <sw-collapse-item title="样式" @change="update" :open="true">
    <template #title>
      <span>矩形样式</span>
    </template>
    <template #content>
      <sw-collapse-item title="左上">
        <template #content>
          <el-form-item label="图片" :label-width="secondLabelWidth">
            <sw-upload v-model="selectTargetData[0].option.cornerTLPic" :multiple="false" :showFileList="false" />
          </el-form-item>

          <StatusSelector label="尺寸" :is-locked="locks.tl" :properties="['width', 'height']">
            <div class="flex w-100 mb-10 flex-justify-between">
              <SwInputNumber
                @change="syncValue(selectTargetData[0].option.cornerTLWidth, 'tl')"
                width="60"
                :unit="'W'"
                v-model="selectTargetData[0].option.cornerTLWidth"
              />
              <el-button link @click="locks.tl = !locks.tl" style="margin: 1px 3px; top: 2px; position: relative">
                <Icon
                  type="Lock"
                  size="16"
                  style="position: relative; color: var(--el-input-text-color)"
                  v-if="locks.tl"
                />
                <Icon type="Unlock" size="16" style="position: relative; color: var(--el-input-text-color)" v-else />
              </el-button>
              <SwInputNumber
                @change="syncValue(selectTargetData[0].option.cornerTLHeight, 'tl')"
                width="60"
                :unit="'H'"
                v-model="selectTargetData[0].option.cornerTLHeight"
              />
            </div>
          </StatusSelector>
          <el-form-item label="透明度" :label-width="secondLabelWidth">
            <sw-slider v-model="selectTargetData[0].option.cornerTLOpacity" unit="%" @change="update" />
          </el-form-item>
        </template>
      </sw-collapse-item>
      <sw-collapse-item title="右上">
        <template #content>
          <el-form-item label="图片" :label-width="secondLabelWidth">
            <sw-upload v-model="selectTargetData[0].option.cornerTRPic" :multiple="false" :showFileList="false" />
          </el-form-item>

          <StatusSelector label="尺寸" :is-locked="locks.tr" :properties="['width', 'height']">
            <div class="flex w-100 mb-10 flex-justify-between">
              <SwInputNumber
                @change="syncValue(selectTargetData[0].option.cornerTRWidth, 'tr')"
                width="60"
                :unit="'W'"
                v-model="selectTargetData[0].option.cornerTRWidth"
              />
              <el-button link @click="locks.tr = !locks.tr" style="margin: 1px 3px; top: 2px; position: relative">
                <Icon
                  type="Lock"
                  size="16"
                  style="position: relative; color: var(--el-input-text-color)"
                  v-if="locks.tr"
                />
                <Icon type="Unlock" size="16" style="position: relative; color: var(--el-input-text-color)" v-else />
              </el-button>
              <SwInputNumber
                @change="syncValue(selectTargetData[0].option.cornerTRHeight, 'tr')"
                width="60"
                :unit="'H'"
                v-model="selectTargetData[0].option.cornerTRHeight"
              />
            </div>
          </StatusSelector>
          <el-form-item label="透明度" :label-width="secondLabelWidth">
            <sw-slider v-model="selectTargetData[0].option.cornerTROpacity" unit="%" @change="update" />
          </el-form-item>
        </template>
      </sw-collapse-item>
      <sw-collapse-item title="左下">
        <template #content>
          <el-form-item label="图片" :label-width="secondLabelWidth">
            <sw-upload v-model="selectTargetData[0].option.cornerBLPic" :multiple="false" :showFileList="false" />
          </el-form-item>

          <StatusSelector label="尺寸" :is-locked="locks.bl" :properties="['width', 'height']">
            <div class="flex w-100 mb-10 flex-justify-between">
              <SwInputNumber
                @change="syncValue(selectTargetData[0].option.cornerBLWidth, 'bl')"
                width="60"
                :unit="'W'"
                v-model="selectTargetData[0].option.cornerBLWidth"
              />
              <el-button link @click="locks.bl = !locks.bl" style="margin: 1px 3px; top: 2px; position: relative">
                <Icon
                  type="Lock"
                  size="16"
                  style="position: relative; color: var(--el-input-text-color)"
                  v-if="locks.bl"
                />
                <Icon type="Unlock" size="16" style="position: relative; color: var(--el-input-text-color)" v-else />
              </el-button>
              <SwInputNumber
                @change="syncValue(selectTargetData[0].option.cornerBLHeight, 'bl')"
                width="60"
                :unit="'H'"
                v-model="selectTargetData[0].option.cornerBLHeight"
              />
            </div>
          </StatusSelector>
          <el-form-item label="透明度" :label-width="secondLabelWidth">
            <sw-slider v-model="selectTargetData[0].option.cornerBLOpacity" unit="%" @change="update" />
          </el-form-item>
        </template>
      </sw-collapse-item>
      <sw-collapse-item title="右下">
        <template #content>
          <el-form-item label="图片" :label-width="secondLabelWidth">
            <sw-upload v-model="selectTargetData[0].option.cornerBRPic" :multiple="false" :showFileList="false" />
          </el-form-item>

          <StatusSelector label="尺寸" :is-locked="locks.br" :properties="['width', 'height']">
            <div class="flex w-100 mb-10 flex-justify-between">
              <SwInputNumber
                @change="syncValue(selectTargetData[0].option.cornerBRWidth, 'br')"
                width="60"
                :unit="'W'"
                v-model="selectTargetData[0].option.cornerBRWidth"
              />
              <el-button link @click="locks.br = !locks.br" style="margin: 1px 3px; top: 2px; position: relative">
                <Icon
                  type="Lock"
                  size="16"
                  style="position: relative; color: var(--el-input-text-color)"
                  v-if="locks.br"
                />
                <Icon type="Unlock" size="16" style="position: relative; color: var(--el-input-text-color)" v-else />
              </el-button>
              <SwInputNumber
                @change="syncValue(selectTargetData[0].option.cornerBRHeight, 'br')"
                width="60"
                :unit="'H'"
                v-model="selectTargetData[0].option.cornerBRHeight"
              />
            </div>
          </StatusSelector>
          <el-form-item label="透明度" :label-width="secondLabelWidth">
            <sw-slider v-model="selectTargetData[0].option.cornerBROpacity" unit="%" @change="update" />
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
import { secondLabelWidth } from "../../constants";

import { useUpdateInstance } from "../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();

const locks = ref({
  tl: true,
  tr: true,
  bl: true,
  br: true
});

const syncValue = (val: number | string, key: "tl" | "tr" | "bl" | "br") => {
  const setVal = (kW: string, kH: string) => {
    if (selectTargetData.value && selectTargetData.value[0]) {
      selectTargetData.value[0].option[kW] = val;
      selectTargetData.value[0].option[kH] = val;
    }
  };
  const handle = {
    tl: () => {
      setVal("cornerTLWidth", "cornerTLHeight");
    },

    tr: () => {
      setVal("cornerTRWidth", "cornerTRHeight");
    },
    bl: () => {
      setVal("cornerBLWidth", "cornerBLHeight");
    },
    br: () => {
      setVal("cornerBRWidth", "cornerBRHeight");
    }
  };

  if (handle[key] instanceof Function && locks.value[key]) handle[key]();

  update();
};
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
