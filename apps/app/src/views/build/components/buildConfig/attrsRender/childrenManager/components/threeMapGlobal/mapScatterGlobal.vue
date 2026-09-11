<template>
  <div class="model-scatter-global">
    <el-form-item label="点位编辑" :label-width="secondLabelWidth">
      <GlPointEditorEntry />
    </el-form-item>
    <SwCollapseItem title="散点设置" open>
      <template #content>
        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div class="multi-input">
            <SwInputNumber v-model="currentOption.offset[0]" @change="update" :step="0.1" />
            <span class="label">X</span>

            <SwInputNumber v-model="currentOption.offset[1]" @change="update" :step="0.1" />
            <span class="label">Y</span>

            <SwInputNumber v-model="currentOption.offset[2]" @change="update" :step="0.1" />
            <span class="label">Z</span>
          </div>
        </el-form-item>

        <SwCollapseItem title="旋转" :label-width="secondLabelWidth" open>
          <template #content>
            <el-form-item label="X" :label-width="thirdLabelWidth">
              <SwSlider v-model="currentOption.rotation[0]" :min="-360" :max="360" @change="update" />
            </el-form-item>
            <el-form-item label="Y" :label-width="thirdLabelWidth">
              <SwSlider v-model="currentOption.rotation[1]" :min="-360" :max="360" @change="update" />
            </el-form-item>
            <el-form-item label="Z" :label-width="thirdLabelWidth">
              <SwSlider v-model="currentOption.rotation[2]" :min="-360" :max="360" @change="update" />
            </el-form-item>
          </template>
        </SwCollapseItem>

        <el-form-item label="模型" :label-width="secondLabelWidth">
          <SwUpload
            v-model="currentOption.model"
            accept=".glb,.gltf"
            :file-type="FileType.model"
            @update:model-value="update"
            @delete="handleModelDelete"
          />
        </el-form-item>

        <el-form-item label="缩放" :label-width="secondLabelWidth">
          <div class="multi-input">
            <SwInputNumber v-model="currentOption.scale[0]" @change="update" :min="0.01" :step="0.1" />
            <span class="label">X</span>

            <SwInputNumber v-model="currentOption.scale[1]" @change="update" :min="0.01" :step="0.1" />
            <span class="label">Y</span>

            <SwInputNumber v-model="currentOption.scale[2]" @change="update" :min="0.01" :step="0.1" />
            <span class="label">Z</span>
          </div>
        </el-form-item>

        <el-form-item label="透明度" :label-width="secondLabelWidth">
          <SwSlider v-model="currentOption.opacity" :min="0" :max="100" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from "vue";

import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwSlider from "@/components/SwSlider/index.vue";
import { FileType } from "@/components/SwUpload/SwUpload";
import SwUpload from "@/components/SwUpload/index.vue";

import { secondLabelWidth, thirdLabelWidth } from "../../../../constants";
import { useChildrenDrawer } from "../../useChildrenDrawer";
import GlPointEditorEntry from "../glPointEditorEntry.vue";

const { currentChildrenItem, update } = useChildrenDrawer();

const currentOption = computed(() => {
  return currentChildrenItem.value?.option || {};
});

const handleModelDelete = () => {
  currentOption.value.model = "";
  update();
};

const initData = () => {
  if (!currentChildrenItem.value) return;
  if (!currentChildrenItem.value.option) {
    currentChildrenItem.value.option = {};
  }
  const opt = currentChildrenItem.value.option;
  let changed = false;

  const defaults: Record<string, any> = {
    model: "",
    offset: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    opacity: 100
  };

  Object.keys(defaults).forEach((key) => {
    if (opt[key] === undefined) {
      opt[key] = defaults[key];
      changed = true;
    }
  });

  if (changed) {
    update();
  }
};

watch(
  () => currentChildrenItem.value,
  (val) => {
    if (val) {
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

.model-scatter-global {
  padding: 0 16px;

  .multi-input {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;

    :deep(.sw-input-number) {
      flex: 1;
    }

    .label {
      color: rgba(255, 255, 255, 0.45);
      font-size: 12px;
      white-space: nowrap;
    }
  }

  .rotation-group {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;

    .rotation-row {
      display: flex;
      align-items: center;
      gap: 8px;

      .rotation-label {
        color: rgba(255, 255, 255, 0.65);
        font-size: 12px;
        white-space: nowrap;
        width: 40px;
      }

      .rotation-slider {
        flex: 1;
      }

      .rotation-input {
        width: 60px;
      }
    }
  }
}
</style>
