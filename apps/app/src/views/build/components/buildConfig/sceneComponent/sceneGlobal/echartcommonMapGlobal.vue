<template>
  <div class="echartcommon-map-global">
    <el-form-item label="控制类型" :label-width="firstLabelWidth">
      <el-select
        v-model="selectTargetData[0].option.roam"
        popper-class="sw-select-dropdown"
        placeholder="Select"
        @change="update"
      >
        <el-option v-for="item in mapControlType" :key="item.label" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="地图范围" :label-width="firstLabelWidth">
      <el-tree-select
        popper-class="sw-select-dropdown"
        :modelValue="currentRegion"
        :data="provinceToCity"
        style="width: 100%"
        :check-strictly="true"
        @change="handleRegionChange"
      />
    </el-form-item>
    <SwCollapseItem title="地图区域" open>
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <SwSingleColorPicker @change="update" v-model="selectTargetData[0].option.areaColor" />
        </el-form-item>
        <el-form-item label="边框宽度" :label-width="secondLabelWidth">
          <SwInputNumber @change="update" unit="px" :min="0" v-model="selectTargetData[0].option.borderWidth" />
        </el-form-item>
        <el-form-item label="边框颜色" :label-width="secondLabelWidth">
          <SwSingleColorPicker @change="update" v-model="selectTargetData[0].option.borderColor" />
        </el-form-item>
        <el-form-item label="阴影" :label-width="secondLabelWidth">
          <div class="flex flex-justify-between" style="width: 100%">
            <el-color-picker
              class="colorPicker"
              size="small"
              :show-alpha="true"
              v-model="selectTargetData[0].option.shadowColor"
              style="position: relative; top: 5px; left: -4px"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.shadowOffsetX"
              :min="0"
              bottomLabel="X"
              width="50"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.shadowOffsetY"
              :min="0"
              bottomLabel="Y"
              width="50"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.shadowBlur"
              :min="0"
              bottomLabel="模糊"
              width="50"
              @change="update"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="文本标签" show-icon v-model="selectTargetData[0].option.geoLabelShow" @change="update">
      <template #content>
        <el-form-item label="文本样式" title="文本样式" :label-width="secondLabelWidth">
          <ConfigTextStyle v-model="input" @change="handleConfigTextChange" />
        </el-form-item>
      </template>
    </SwCollapseItem>

    <SwCollapseItem title="交互选项" open>
      <template #content>
        <el-form-item label="点击后自动下转" title="点击后自动下转" :label-width="firstLabelWidth">
          <el-checkbox @change="update" v-model="selectTargetData[0].option.autoDrillDown" />
        </el-form-item>
        <el-form-item label="最大下转" v-if="selectTargetData[0].option.autoDrillDown" :label-width="secondLabelWidth">
          <sw-input-number
            @change="update"
            controls
            v-model="selectTargetData[0].option.maxDrillDownLevel"
            :max="2"
            :min="0"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, ref } from "vue";

import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwSingleColorPicker from "@/components/SwSingleColorPicker/index.vue";

import ConfigTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import { provinceToCity } from "../provinceToCity";
import { getRegionPath } from "../utils";

const { selectTargetData, update } = useUpdateInstance();
const mapControlType = ref([
  { label: "平移缩放", value: true },
  { label: "平移", value: "move" },
  { label: "缩放", value: "scale" },
  { label: "固定", value: "false" }
]);
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "geoLabelFontFamily",
  fontSize: "geoLabelFontSize",
  color: "geoLabelColor",
  fontStyle: "geoLabelFontStyle",
  fontWeight: "geoLabelFontWeight"
});
const currentRegion = computed(() => {
  const last = selectTargetData.value[0].data[selectTargetData.value[0].data.length - 1];
  return { label: last.name, value: last.adcode };
});
const handleRegionChange = async (value: string) => {
  const regionPath = getRegionPath(value, provinceToCity);
  selectTargetData.value[0].data = regionPath;
  await nextTick();
  selectTargetData.value[0].option.refreshKey = !selectTargetData.value[0].option.refreshKey;
  update();
};
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
:deep(.el-color-picker__trigger) {
  border: none !important;
  width: 28px !important;
  height: 28px !important;
}
</style>
