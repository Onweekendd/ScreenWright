<template>
  <div class="fence-global">
    <el-form-item label="路径编辑" :label-width="secondLabelWidth">
      <GlPathEditorEntry />
    </el-form-item>

    <el-form-item label="混合模式" :label-width="secondLabelWidth">
      <el-select popper-class="sw-select-dropdown" v-model="currentOption.blendingMode" @change="update">
        <el-option v-for="item in blendingOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>

    <SwCollapseItem title="围墙设置" open>
      <template #content>
        <el-form-item label="高度" :label-width="secondLabelWidth">
          <SwInputNumber v-model="currentOption.height" :min="0" :step="1" @change="update" />
        </el-form-item>

        <el-form-item label="Z 偏移" :label-width="secondLabelWidth">
          <SwInputNumber v-model="currentOption.offsetZ" :step="0.1" @change="update" />
        </el-form-item>

        <el-form-item label="填充类型" :label-width="secondLabelWidth">
          <el-select popper-class="sw-select-dropdown" v-model="currentOption.fillType" @change="update">
            <el-option label="渐变" value="gradient" />
            <el-option label="图片 / 视频" value="picture" />
          </el-select>
        </el-form-item>

        <template v-if="currentOption.fillType === 'picture'">
          <el-form-item label="素材" :label-width="secondLabelWidth">
            <SwUpload
              v-model="currentOption.textureUrl"
              :fileType="FileType.imgAndVideo"
              :multiple="false"
              :showFileList="false"
              @change="update"
              @delete="update"
            />
          </el-form-item>

          <el-form-item label="着色" :label-width="secondLabelWidth">
            <SwSingleColorPicker v-model="currentOption.tintColor" @change="update" />
          </el-form-item>

          <el-form-item label="透明度" :label-width="secondLabelWidth">
            <SwSlider v-model="currentOption.tintOpacity" :min="0" :max="100" @change="update" />
          </el-form-item>
        </template>

        <template v-else>
          <el-form-item label="填充" :label-width="secondLabelWidth">
            <SwColorPicker
              :options="{ colorTypeOption: 'linear-gradient,single' }"
              v-model:color="currentOption.fillColor"
              v-model:opacity="currentOption.fillOpacity"
              field="fillColor"
              @change="update"
            />
          </el-form-item>
        </template>
      </template>
    </SwCollapseItem>

    <SwCollapseItem title="扫描线" show-icon v-model="currentOption.lineShow" @change="update">
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

        <el-form-item label="线宽" :label-width="secondLabelWidth">
          <SwSlider v-model="currentOption.lineWidth" :min="0.01" :max="0.4" :step="0.01" @change="update" />
        </el-form-item>

        <el-form-item label="动画时长" :label-width="secondLabelWidth">
          <SwInputNumber v-model="currentOption.animationDuration" :min="0.2" :step="0.1" @change="update" />
          <span class="unit">s</span>
        </el-form-item>

        <el-form-item label="间隔" :label-width="secondLabelWidth">
          <SwInputNumber v-model="currentOption.animationInterval" :min="0" :step="0.1" @change="update" />
          <span class="unit">s</span>
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
import SwSingleColorPicker from "@/components/SwSingleColorPicker/index.vue";
import SwSlider from "@/components/SwSlider/index.vue";
import { FileType } from "@/components/SwUpload/SwUpload";
import SwUpload from "@/components/SwUpload/index.vue";

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
    height: 60,
    offsetZ: 0,
    fillType: "gradient",
    fillColor: {
      type: "linear-gradient",
      angle: "90",
      colors: [
        { color: "rgba(16,56,83,0.08)", per: 0 },
        { color: "rgba(38,196,255,0.95)", per: 100 }
      ]
    },
    fillOpacity: 100,
    textureUrl: "",
    tintColor: "#ffffff",
    tintOpacity: 100,
    lineShow: true,
    lineColor: "rgba(255,255,255,1)",
    lineOpacity: 100,
    lineWidth: 0.08,
    animationDuration: 2.2,
    animationInterval: 0.8
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

.fence-global {
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
