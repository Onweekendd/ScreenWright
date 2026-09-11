<template>
  <div class="text-background-shadow" v-if="selectTargetData[0].option[attrs]">
    <SwCollapseItem title="文字">
      <template #content>
        <el-form-item label="文字样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange" />
        </el-form-item>
        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div class="flex flex-justify-between" style="width: 100%">
            <SwInputNumber
              v-model="selectTargetData[0].option[attrs].textTranslateX"
              :min="-1000"
              :max="1000"
              bottomLabel="X"
              width="100"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option[attrs].textTranslateY"
              :min="-1000"
              :max="1000"
              bottomLabel="Y"
              width="100"
              @change="update"
            />
          </div>
        </el-form-item>
        <el-form-item label="阴影" :label-width="secondLabelWidth">
          <el-checkbox @change="update" v-model="selectTargetData[0].option[attrs].isTextShadow" />
        </el-form-item>
        <el-form-item
          label="文本阴影"
          v-if="selectTargetData[0].option[attrs].isTextShadow"
          :label-width="secondLabelWidth"
        >
          <div class="flex flex-justify-between" style="width: 100%">
            <el-color-picker
              class="colorPicker"
              size="small"
              :show-alpha="true"
              v-model="selectTargetData[0].option[attrs].textShadow.color"
              style="position: relative; top: 7px"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option[attrs].textShadow.x"
              :min="0"
              bottomLabel="X"
              width="50"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option[attrs].textShadow.y"
              :min="0"
              bottomLabel="Y"
              width="50"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option[attrs].textShadow.blur"
              :min="0"
              bottomLabel="模糊"
              width="50"
              @change="update"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="背景">
      <template #content>
        <el-form-item label="填充方式" :label-width="secondLabelWidth">
          <el-select
            popper-class="sw-select-dropdown"
            v-model="selectTargetData[0].option[attrs].backgroundType"
            @change="update"
          >
            <el-option label="颜色" value="color" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>

        <el-form-item
          label="颜色"
          :label-width="secondLabelWidth"
          v-if="selectTargetData[0].option[attrs].backgroundType == 'color'"
        >
          <SwSingleColorPicker v-model="selectTargetData[0].option[attrs].backgroundColor" @change="update" />
        </el-form-item>

        <template v-if="selectTargetData[0].option[attrs].backgroundType == 'custom'">
          <el-form-item
            label="类型"
            :label-width="secondLabelWidth"
            v-if="selectTargetData[0].option[attrs].backgroundType == 'custom'"
          >
            <el-select
              popper-class="sw-select-dropdown"
              v-model="selectTargetData[0].option[attrs].backgroundImageType"
              @change="update"
            >
              <el-option label="适应" value="100% 100%" />
              <el-option label="原比例" value="contain" />
              <el-option label="裁切" value="cover" />
            </el-select>
          </el-form-item>

          <el-form-item label="图片" :label-width="secondLabelWidth">
            <SwUpload v-model="selectTargetData[0].option[attrs].backgroundImage" @change="update" @delete="update" />
          </el-form-item>
        </template>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="描边" @change="update" v-model="selectTargetData[0].option[attrs].isBorder" showIcon>
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option[attrs].borderColor" @change="update" />
        </el-form-item>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <SwInputNumber
            v-model="selectTargetData[0].option[attrs].borderWidth"
            :min="0"
            :max="100"
            unit="px"
            @change="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";

import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker as SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";

import configTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
interface Props {
  attrs: string;
}
const props = defineProps<Props>();
const attrs = ref(props.attrs);
watch(
  () => props.attrs,
  (newVal) => {
    attrs.value = newVal;
    getInitValue(props.attrs);
  }
);
const { input, handleConfigTextChange, getInitValue } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "fontColor",
  attrs: props.attrs
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include checkbox-style();
@include common-element-style(".el-select__wrapper");
:deep(.el-color-picker__trigger) {
  border: none !important;
}
:deep(.el-select__wrapper) {
  min-height: 24px;
}
</style>
