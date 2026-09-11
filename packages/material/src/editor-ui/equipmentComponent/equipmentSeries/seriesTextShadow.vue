<template>
  <div
    class="text-background-shadow"
    v-if="selectTargetData[0].option.seriesTabsList[index] && selectTargetData[0].option.seriesTabsList[index][attrs]"
  >
    <SwCollapseItem title="文字">
      <template #content>
        <el-form-item label="文字样式" :label-width="labelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange" />
        </el-form-item>
        <el-form-item label="偏移" :label-width="labelWidth">
          <div class="flex flex-justify-between" style="width: 100%">
            <SwInputNumber
              v-model="selectTargetData[0].option.seriesTabsList[index][attrs].textTranslateX"
              :min="0"
              :max="100"
              bottomLabel="X"
              width="100"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.seriesTabsList[index][attrs].textTranslateY"
              :min="0"
              :max="100"
              bottomLabel="Y"
              width="100"
              @change="update"
            />
          </div>
        </el-form-item>
        <el-form-item label="阴影" :label-width="labelWidth">
          <el-checkbox
            @change="update"
            v-model="selectTargetData[0].option.seriesTabsList[index][attrs].isTextShadow"
          />
        </el-form-item>
        <el-form-item
          label="文本阴影"
          v-if="selectTargetData[0].option.seriesTabsList[index][attrs].isTextShadow"
          :label-width="labelWidth"
        >
          <div class="flex flex-justify-between" style="width: 100%">
            <el-color-picker
              class="colorPicker"
              size="small"
              :show-alpha="true"
              v-model="selectTargetData[0].option.seriesTabsList[index][attrs].textShadow.color"
              style="position: relative; top: 7px; left: -4px"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.seriesTabsList[index][attrs].textShadow.x"
              :min="0"
              bottomLabel="X"
              width="50"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.seriesTabsList[index][attrs].textShadow.y"
              :min="0"
              bottomLabel="Y"
              width="50"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.seriesTabsList[index][attrs].textShadow.blur"
              :min="0"
              bottomLabel="模糊"
              width="50"
              @change="update"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="背景" open>
      <template #content>
        <el-form-item label="填充方式" :label-width="labelWidth">
          <el-select
            popper-class="sw-select-dropdown"
            v-model="selectTargetData[0].option.seriesTabsList[index][attrs].backgroundType"
            @change="update"
          >
            <el-option label="颜色" value="color" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>

        <el-form-item
          label="颜色"
          :label-width="labelWidth"
          v-if="selectTargetData[0].option.seriesTabsList[index][attrs].backgroundType == 'color'"
        >
          <SwSingleColorPicker
            v-model="selectTargetData[0].option.seriesTabsList[index][attrs].backgroundColor"
            @change="update"
            width="80"
          />
        </el-form-item>

        <template v-if="selectTargetData[0].option.seriesTabsList[index][attrs].backgroundType == 'custom'">
          <el-form-item
            label="类型"
            :label-width="labelWidth"
            v-if="selectTargetData[0].option.seriesTabsList[index][attrs].backgroundType == 'custom'"
          >
            <el-select
              popper-class="sw-select-dropdown"
              v-model="selectTargetData[0].option.seriesTabsList[index][attrs].backgroundImageType"
              @change="update"
            >
              <el-option label="适应" value="100% 100%" />
              <el-option label="原比例" value="contain" />
              <el-option label="裁切" value="cover" />
            </el-select>
          </el-form-item>

          <el-form-item label="图片" :label-width="labelWidth">
            <SwUpload
              v-model="selectTargetData[0].option.seriesTabsList[index][attrs].backgroundImage"
              @change="update"
              @delete="update"
            />
          </el-form-item>
        </template>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="描边" open>
      <template #content>
        <el-form-item label="颜色" :label-width="labelWidth">
          <SwSingleColorPicker
            v-model="selectTargetData[0].option.seriesTabsList[index][attrs].borderColor"
            @change="update"
            width="80"
          />
        </el-form-item>
        <el-form-item label="粗细" :label-width="labelWidth">
          <SwInputNumber
            v-model="selectTargetData[0].option.seriesTabsList[index][attrs].borderWidth"
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

import { SwCollapseItem } from "@screenwright/ui";
import { SwInputNumber } from "@screenwright/ui";
import { SwSingleColorPicker } from "@screenwright/ui";
import SwUpload from "@editor/base/SwUpload/index.vue";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { thirdLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const labelWidth = parseInt(thirdLabelWidth) + 10;
const { selectTargetData, update } = useUpdateInstance();
interface Props {
  attrs: string;
  index: number;
}
const props = defineProps<Props>();
const attrs = ref(props.attrs);
const currentIndex = ref(props.index);
watch(
  () => props.attrs,
  (newVal) => {
    attrs.value = newVal;
    const pathAttrs = `seriesTabsList[${currentIndex.value}].${newVal}`;
    getInitValue(pathAttrs);
  }
);
watch(
  () => props.index,
  (newVal) => {
    currentIndex.value = newVal;
    const pathAttrs = `seriesTabsList[${currentIndex.value}].${attrs.value}`;
    getInitValue(pathAttrs);
  }
);
const { input, handleConfigTextChange, getInitValue } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "fontColor",
  attrs: `seriesTabsList[${props.index}].${props.attrs}`
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
:deep(.el-color-picker__trigger) {
  border: none !important;
}
</style>
