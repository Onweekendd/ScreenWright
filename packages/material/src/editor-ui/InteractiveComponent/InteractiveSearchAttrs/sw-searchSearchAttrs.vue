<template>
  <div class="ft-search-attrs">
    <SwCollapseItem title="按钮" show-icon v-model="selectTargetData[0].option.isButton" @change="update">
      <template #content>
        <el-form-item label="按钮位置" :label-width="secondLabelWidth">
          <el-select
            v-model="selectTargetData[0].option.buttonPosition"
            popper-class="sw-select-dropdown"
            @change="update"
          >
            <el-option v-for="item in waveDirection" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="宽度" :label-width="secondLabelWidth">
          <SwInputNumber @change="update" v-model="selectTargetData[0].option.buttonWidth" unit="px" />
        </el-form-item>
        <el-form-item label="搜索图标" v-if="selectTargetData[0].option.buttonIconType" :label-width="secondLabelWidth">
          <el-select
            v-model="selectTargetData[0].option.buttonIconType"
            popper-class="sw-select-dropdown"
            @change="update"
          >
            <el-option v-for="item in selectIconType" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <template
          v-if="selectTargetData[0].option.buttonIconType === 'default' || !selectTargetData[0].option.buttonIconType"
        >
          <el-form-item label="图标大小" :label-width="secondLabelWidth">
            <SwInputNumber @change="update" v-model="selectTargetData[0].option.buttonIconSize" :controls="true" />
          </el-form-item>
          <el-form-item label="图标颜色" :label-width="secondLabelWidth">
            <SwSingleColorPicker @change="update" v-model="selectTargetData[0].option.buttonIconColor" />
          </el-form-item>
        </template>
        <template v-else-if="selectTargetData[0].option.buttonIconType === 'custom'">
          <el-form-item label="图片" :label-width="secondLabelWidth">
            <SwUpload @change="update" @delete="update" v-model="selectTargetData[0].option.buttonIcon" />
          </el-form-item>
          <el-form-item label="图标大小" :label-width="secondLabelWidth">
            <div class="flex">
              <SwInputNumber
                @change="update"
                v-model="selectTargetData[0].option.buttonIconWidth"
                :controls="true"
                bottomLabel="宽"
              />
              <SwInputNumber
                @change="update"
                v-model="selectTargetData[0].option.buttonIconHeight"
                :controls="true"
                bottomLabel="高"
              />
            </div>
          </el-form-item>
        </template>
        <el-form-item label="填充方式" :label-width="secondLabelWidth">
          <el-select
            popper-class="sw-select-dropdown"
            v-model="selectTargetData[0].option.backgroundTypeBtn"
            @change="update"
          >
            <el-option label="颜色" value="color" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item
          :label-width="secondLabelWidth"
          label="颜色"
          v-if="selectTargetData[0].option.backgroundTypeBtn == 'color'"
        >
          <SwSingleColorPicker v-model="selectTargetData[0].option.backgroundColorBtn" @change="update" />
        </el-form-item>

        <template v-if="selectTargetData[0].option.backgroundTypeBtn == 'custom'">
          <el-form-item label="类型" :label-width="secondLabelWidth">
            <el-select
              popper-class="sw-select-dropdown"
              v-model="selectTargetData[0].option.backgroundImageTypeBtn"
              @change="update"
            >
              <el-option label="适应" value="100% 100%" />
              <el-option label="原比例" value="contain" />
              <el-option label="裁切" value="cover" />
            </el-select>
          </el-form-item>
          <el-form-item label="图片" :label-width="secondLabelWidth">
            <SwUpload v-model="selectTargetData[0].option.backgroundImageBtn" @delete="update" @change="update" />
          </el-form-item>
        </template>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker as SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";

import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const waveDirection = ref([
  { label: "左", value: "left" },
  { label: "右", value: "right" }
]);
const selectIconType = ref([
  { label: "默认", value: "default" },
  { label: "自定义图标", value: "custom" }
]);
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
