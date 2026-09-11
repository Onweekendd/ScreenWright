<!-- 飞线的全局 -->
<template>
  <div class="flow-line-global">
    <el-form-item label="飞线编辑" :label-width="secondLabelWidth">
      <GlFlyLineEditorEntry />
    </el-form-item>
    <el-form-item label="混合模式" :label-width="secondLabelWidth">
      <el-select
        popper-class="sw-select-dropdown"
        v-model="currentChildrenItem.option.blendingMode"
        @change="update"
      >
        <el-option v-for="item in blendingOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>

    <SwCollapseItem title="飞线样式" open>
      <template #content>
        <el-form-item label="飞线长度" :label-width="secondLabelWidth">
          <sw-slider @change="update" v-model="currentChildrenItem.option.trailLength" :min="0" :max="1" :step="0.01" />
        </el-form-item>
        <el-form-item label="高度" :label-width="secondLabelWidth">
          <sw-input-number @change="update" v-model="currentChildrenItem.option.height" :min="0" />
        </el-form-item>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-color-picker
            :options="{ colorTypeOption: 'linear-gradient,single' }"
            v-model:color="currentChildrenItem.option.effectColor"
            v-model:opacity="currentChildrenItem.option.effectOpacity"
            field="effectColor"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <sw-slider
            @change="update"
            v-model="currentChildrenItem.option.lineWidth"
            :min="0"
            :max="20"
            :step="0.01"
            bottomLabel="粗细"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>

    <SwCollapseItem title="底线样式" show-icon v-model="currentChildrenItem.option.lineShow" @change="update">
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-color-picker
            :options="{ colorTypeOption: 'linear-gradient,single' }"
            v-model:color="currentChildrenItem.option.lineColor"
            v-model:opacity="currentChildrenItem.option.lineOpacity"
            field="lineColor"
            @change="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwColorPicker from "@/components/SwColorPicker/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwSlider from "@/components/SwSlider/index.vue";

import { secondLabelWidth } from "../../../../constants";
import GlFlyLineEditorEntry from "../glFlyLineEditorEntry.vue";
import { useChildrenDrawer } from "../../useChildrenDrawer";

const { currentChildrenItem, update } = useChildrenDrawer();

const blendingOptions = ref([
  { label: "正常", value: "NormalBlending" },
  { label: "相加", value: "AdditiveBlending" },
  { label: "相减", value: "SubtractiveBlending" },
  { label: "相乘", value: "MultiplyBlending" }
]);
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

.flow-line-global {
  padding: 0 16px;
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>
