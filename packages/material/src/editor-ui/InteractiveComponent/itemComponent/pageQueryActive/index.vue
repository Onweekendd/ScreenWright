<template>
  <div class="page-query-config">
    <el-form-item label="文本样式" :label-width="firstLabelWidth">
      <configTextStyle v-model="input" @change="handleConfigTextChange" />
    </el-form-item>
    <SwCollapseItem title="背景" open>
      <template #content>
        <el-form-item label="填充方式" :label-width="secondLabelWidth">
          <el-select
            popper-class="sw-select-dropdown"
            v-model="selectTargetData[0].option.checkedBackgroundType"
            @change="update"
          >
            <el-option label="颜色" value="color" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item
          label="颜色"
          :label-width="secondLabelWidth"
          v-if="selectTargetData[0].option.checkedBackgroundType == 'color'"
        >
          <SwSingleColorPicker v-model="selectTargetData[0].option.checkedBackgroundColor" @change="update" />
        </el-form-item>

        <template v-if="selectTargetData[0].option.checkedBackgroundType == 'custom'">
          <el-form-item label="类型" :label-width="secondLabelWidth">
            <el-select
              popper-class="sw-select-dropdown"
              v-model="selectTargetData[0].option.checkedBackgroundImageType"
              @change="update"
              style="margin-left: 2px"
            >
              <el-option label="适应" value="100% 100%" />
              <el-option label="原比例" value="contain" />
              <el-option label="裁切" value="cover" />
            </el-select>
          </el-form-item>
          <el-form-item label="图片" :label-width="secondLabelWidth">
            <SwUpload v-model="selectTargetData[0].option.checkedBackgroundImage" @change="update" @delete="update" />
          </el-form-item>
        </template>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="描边" open>
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.checkedBorderColor" @change="update" />
        </el-form-item>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <SwInputNumber unit="px" v-model="selectTargetData[0].option.checkedBorderWidth" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker as SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";

import configTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "checkedFontFamily",
  fontStyle: "checkedFontStyle",
  fontWeight: "checkedFontWeight",
  fontSize: "checkedFontSize",
  color: "checkedColor"
});
</script>
