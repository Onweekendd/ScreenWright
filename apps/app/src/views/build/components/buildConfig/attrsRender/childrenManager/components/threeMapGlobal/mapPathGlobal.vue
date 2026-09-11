<template>
  <div class="map-path-global">
    <el-form-item label="路径编辑" :label-width="secondLabelWidth">
      <GlPathEditorEntry />
    </el-form-item>

    <el-form-item label="混合模式" :label-width="secondLabelWidth">
      <el-select popper-class="sw-select-dropdown" v-model="currentOption.blendingMode" @change="update">
        <el-option v-for="item in blendingOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>

    <SwCollapseItem title="路径设置" open>
      <template #content>
        <el-form-item label="线宽" :label-width="secondLabelWidth">
          <SwInputNumber v-model="currentOption.lineWidth" :min="0.1" :step="0.1" @change="update" />
        </el-form-item>

        <el-form-item label="Z 偏移" :label-width="secondLabelWidth">
          <SwInputNumber v-model="currentOption.offsetZ" :step="0.1" @change="update" />
        </el-form-item>

        <el-form-item label="流光长度" :label-width="secondLabelWidth">
          <SwSlider v-model="currentOption.trailLength" :min="0.02" :max="1" :step="0.01" @change="update" />
        </el-form-item>

        <el-form-item label="动画时长" :label-width="secondLabelWidth">
          <SwInputNumber v-model="currentOption.animationDuration" :min="0.2" :step="0.1" @change="update" />
          <span class="unit">s</span>
        </el-form-item>

        <el-form-item label="循环播放" :label-width="secondLabelWidth">
          <el-checkbox v-model="currentOption.loop" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>

    <SwCollapseItem title="流光样式" open>
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <SwColorPicker
            :options="{ colorTypeOption: 'linear-gradient,single' }"
            v-model:color="currentOption.effectColor"
            v-model:opacity="currentOption.effectOpacity"
            field="effectColor"
            @change="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>

    <SwCollapseItem title="底线样式" show-icon v-model="currentOption.lineShow" @change="update">
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <SwColorPicker
            :options="{ colorTypeOption: 'linear-gradient,single' }"
            v-model:color="currentOption.lineColor"
            v-model:opacity="currentOption.lineOpacity"
            field="lineColor"
            @change="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwColorPicker from "@/components/SwColorPicker/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwSlider from "@/components/SwSlider/index.vue";

import { secondLabelWidth } from "../../../../constants";
import { useChildrenDrawer } from "../../useChildrenDrawer";
import GlPathEditorEntry from "../glPathEditorEntry.vue";

const { currentChildrenItem, update } = useChildrenDrawer();

const currentOption = computed(() => currentChildrenItem.value?.option || {});

const blendingOptions = ref([
  { label: "正常", value: "NormalBlending" },
  { label: "相加", value: "AdditiveBlending" },
  { label: "相减", value: "SubtractiveBlending" },
  { label: "相乘", value: "MultiplyBlending" }
]);

const initData = () => {
  if (!currentChildrenItem.value) return;
  currentChildrenItem.value.option = currentChildrenItem.value.option || {};
  const option = currentChildrenItem.value.option;
  let changed = false;

  const defaults: Record<string, any> = {
    blendingMode: "AdditiveBlending",
    lineWidth: 4,
    offsetZ: 2,
    trailLength: 0.28,
    animationDuration: 3.5,
    delay: 0,
    loop: true,
    lineShow: true,
    lineColor: "rgba(15,42,66,1)",
    lineOpacity: 100,
    effectColor: {
      type: "linear-gradient",
      angle: "0",
      colors: [
        { color: "rgba(34,211,238,1)", per: 0 },
        { color: "rgba(255,255,255,1)", per: 100 }
      ]
    },
    effectOpacity: 100
  };

  Object.keys(defaults).forEach((key) => {
    if (option[key] === undefined) {
      option[key] = defaults[key];
      changed = true;
    }
  });

  if (changed) {
    update();
  }
};

watch(
  () => currentChildrenItem.value,
  (value) => {
    if (value) {
      initData();
    }
  },
  { immediate: true, deep: true }
);

onMounted(() => {
  initData();
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

.map-path-global {
  padding: 0 16px;

  :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  .unit {
    margin-left: 8px;
    color: rgba(255, 255, 255, 0.45);
    font-size: 12px;
  }
}
</style>
