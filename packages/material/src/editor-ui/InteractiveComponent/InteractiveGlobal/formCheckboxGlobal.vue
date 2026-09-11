<template>
  <div class="form-checkbox-global">
    <el-form-item label="选中字体色" :label-width="firstLabelWidth">
      <SwSingleColorPicker v-model="selectTargetData[0].option.textColor" @change="update" width="80" />
    </el-form-item>
    <el-form-item label="选中填充色" :label-width="firstLabelWidth">
      <SwSingleColorPicker v-model="selectTargetData[0].option.fillColor" @change="update" width="80" />
    </el-form-item>

    <el-form-item label="选中数量限制" :label-width="firstLabelWidth">
      <div class="flex flex-justify-between" style="width: 100%">
        <SwInputNumber v-model="selectTargetData[0].option.min" bottomLabel="最小数量" @change="update" />
        <SwInputNumber v-model="selectTargetData[0].option.max" bottomLabel="最大数量" @change="update" />
      </div>
    </el-form-item>
    <el-form-item label="多选框尺寸" :label-width="firstLabelWidth">
      <div class="flex flex-justify-between" style="width: 100%">
        <SwInputNumber v-model="selectTargetData[0].option.sizeX" bottomLabel="宽度" @change="update" unit="px" />
        <SwInputNumber v-model="selectTargetData[0].option.sizeY" bottomLabel="高度" @change="update" unit="px" />
      </div>
    </el-form-item>

    <SwCollapseItem title="文本配置">
      <template #content>
        <el-form-item label="样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange">
            <template #append>
              <SwInputNumber
                v-model="selectTargetData[0].option.letterSpacing"
                @change="update"
                bottomLabel="字距"
                unit="px"
                width="120"
                style="margin-left: 12px"
              />
            </template>
          </configTextStyle>
        </el-form-item>
        <el-form-item label="阴影" :label-width="secondLabelWidth">
          <el-checkbox @change="update" v-model="selectTargetData[0].option.isTextShadow" />
        </el-form-item>
        <el-form-item label="文本阴影" v-if="selectTargetData[0].option.isTextShadow" :label-width="secondLabelWidth">
          <div class="flex flex-justify-between" style="width: 100%">
            <el-color-picker
              class="colorPicker"
              size="small"
              :show-alpha="true"
              v-model="selectTargetData[0].option.textShadow.color"
              style="position: relative; top: 7px; left: -4px"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.textShadow.x"
              :min="0"
              bottomLabel="X"
              width="50"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.textShadow.y"
              :min="0"
              bottomLabel="Y"
              width="50"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.textShadow.blur"
              :min="0"
              bottomLabel="模糊"
              width="50"
              @change="update"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker as SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "fontColor"
});
</script>
<style lang="scss" scoped>
:deep(.el-color-picker__trigger) {
  border: none !important;
}
</style>
