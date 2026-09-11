<template>
  <section class="center-animation-main" id="animation-editor">
    <div class="component-table">
      <template v-if="selectAnimationComputed">
        <template v-for="item in selectAnimationComponentSetting" :key="selectAnimationComputed.id + item.id">
          <el-row :gutter="8" type="flex" v-if="getComponentName(item.id) !== null">
            <el-col :span="4">
              <div class="grid">
                <span
                  :id="`animation-${item.id}`"
                  @click="onAnimationNameClick(item.id)"
                  @contextmenu="(e) => onAnimationDelete(e, item.id)"
                  :style="{ cursor: 'pointer', position: 'relative' }"
                >
                  {{ getComponentName(item.id) }}
                  <AnimationTooltip :animation="item" :show="item.type === 'load'" />
                </span>
              </div>
            </el-col>

            <el-col :span="4">
              <div class="grid">
                <el-select
                  :disabled="animationPlaying"
                  style="width: 100%"
                  placeholder="请选择"
                  :model-value="item.animationType"
                  popper-class="sw-select-dropdown"
                  size="small"
                  @change="(value: string) => onAnimationTypeChange(value as AnimationType, item)"
                >
                  <el-option
                    :label="getNoneAnimationType.label"
                    :value="getNoneAnimationType.value"
                    :key="getNoneAnimationType.value"
                  />

                  <el-option-group label="载入动画">
                    <el-option
                      v-for="optionItem in getLoadAnimationType"
                      :label="optionItem.label"
                      :value="optionItem.value"
                      :key="optionItem.value"
                    />
                  </el-option-group>

                  <el-option-group label="退出动画">
                    <el-option
                      v-for="optionItem in getUnloadAnimationType"
                      :label="optionItem.label"
                      :value="optionItem.value"
                      :key="optionItem.value"
                    />
                  </el-option-group>
                </el-select>
              </div>
            </el-col>

            <el-col :span="4">
              <div class="grid">
                <el-select
                  :model-value="item.direction"
                  :disabled="animationPlaying || !directionEnable(item.animationType)"
                  placeholder="动画无方向"
                  size="small"
                  @change="(value: string) => onAnimationDirectionChange(value, item)"
                  popper-class="sw-select-dropdown"
                >
                  <el-option
                    :label="optionItem.label"
                    :value="optionItem.value"
                    v-for="optionItem in animation2DirectionOption(item.animationType)"
                    :key="`${item.animationType}-${optionItem.value}`"
                  />
                </el-select>
              </div>
            </el-col>

            <el-col :span="4">
              <div class="grid">
                <el-select
                  :model-value="item.timingFunction"
                  :disabled="animationPlaying || !timingFunctionEnable(item)"
                  placeholder="请选择"
                  size="small"
                  @change="(value: string) => onTimingFunctionChange(value, item)"
                  popper-class="sw-select-dropdown"
                >
                  <el-option
                    v-for="optionItem in configOptions('timingFunction')"
                    :label="optionItem.label"
                    :value="optionItem.value"
                    :key="optionItem.value"
                  />
                </el-select>
              </div>
            </el-col>

            <el-col :span="4">
              <div class="grid">
                <el-input-number
                  size="small"
                  :disabled="animationPlaying || !durationEnable(item)"
                  @change="(value: number | undefined) => onAnimationDurationChange(value, item)"
                  @blur="(e: Event) => onNumberInputBlur(e, item, 'duration')"
                  @keydown="(e: KeyboardEvent) => onNumberInputKeydown(e, item, 'duration')"
                  :model-value="item.duration / 1000"
                  :step="0.1"
                  :min="0"
                  :precision="2"
                  :max="maxTime / 1000"
                />
              </div>
            </el-col>

            <el-col :span="4">
              <div class="grid">
                <el-input-number
                  size="small"
                  :disabled="animationPlaying || !delayEnable(item)"
                  @change="(value: number | undefined) => onAnimationBeginTimeChange(value, item)"
                  @blur="(e: Event) => onNumberInputBlur(e, item, 'delay')"
                  @keydown="(e: KeyboardEvent) => onNumberInputKeydown(e, item, 'delay')"
                  :model-value="item.delay / 1000"
                  :step="0.1"
                  :min="0"
                  :precision="2"
                  :max="maxTime / 1000"
                />
              </div>
            </el-col>
          </el-row>
        </template>
      </template>
    </div>
    <div
      class="modal"
      v-if="selectAnimationComputed && selectAnimationComponentSetting && selectAnimationComponentSetting.length === 0"
    >
      <span>使用ctrl+左键点击选中组件</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { ElCol, ElInputNumber, ElOption, ElOptionGroup, ElRow, ElSelect } from "element-plus";

import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";

import AnimationTooltip from "./components/AnimationTooltip.vue";
import type { AnimationType } from "./type";
import { useAnimationEditor } from "./useAnimationEditor";
import { highlightComponent } from "./util";

// Props 定义
const props = defineProps<{
  translateY?: number;
  screenId?: number;
  panelId?: number;
  activeStatusId?: string;
}>();

// 使用动画编辑器hooks
const {
  maxTime,
  animationPlaying,
  selectAnimation,
  getNoneAnimationType,
  getLoadAnimationType,
  getUnloadAnimationType,
  onAnimationDelete,
  getComponentName,
  onAnimationTypeChange,
  onTimingFunctionChange,
  onAnimationDirectionChange,
  onAnimationBeginTimeChange,
  onAnimationDurationChange,
  onNumberInputBlur,
  onNumberInputKeydown,

  animation2DirectionOption,
  directionEnable,
  timingFunctionEnable,
  durationEnable,
  delayEnable,
  configOptions
} = useAnimationEditor();

const selectAnimationComputed = computed(() => {
  return selectAnimation({ panelId: props.panelId, activeStatusId: props.activeStatusId });
});

const selectAnimationComponentSetting = computed(() => {
  return selectAnimationComputed.value?.componentSetting;
});

const { setTargetSelectChart } = useEditStore();
const onAnimationNameClick = (id: number) => {
  setTargetSelectChart(id.toString());
  highlightComponent(id, 1000);
};
</script>

<style lang="scss" scoped>
$header-height: 36px;
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include common-element-style(".el-input__wrapper");

:deep(.el-select-group__title) {
  padding: 0;
  color: white;
}
.center-animation-main {
  flex-grow: 0;
  flex-shrink: 0;
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  background-color: rgb(46, 49, 63);
  border: 1px solid rgba(13, 7, 7, 0.6);
  border-top: none;
  border-bottom: none;
  color: #b4b7c1;
  font-size: 12px;
  position: relative;
  :deep(.el-input-number) {
    .el-input__inner {
      text-align: center !important;
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 0 24px !important;
    }

    @media (max-width: 1366px) {
      .el-input__inner {
        max-width: 80px;
      }
    }
  }
  .component-table {
    height: 100%;
    .el-row {
      width: 100%;
      height: 36px;
      border-bottom: 1px solid rgba(13, 7, 7, 0.6);
      margin-left: 0px !important;
      .grid {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;

        :deep(.el-input-number) {
          min-height: 28px !important;
          width: 100% !important;
          .el-input-number__decrease,
          .el-input-number__increase {
            width: 24px !important;
            background: transparent;
            border-color: #333 !important;
            color: #fff;
            position: absolute;
          }
          :deep(.el-input-number__increase) {
            border-bottom-color: #333 !important;
          }
          .el-input__wrapper {
            // width: 62px;
            padding-left: 0 !important;
            padding-right: 0 !important;
            .el-input__inner {
              width: 100%;
            }
          }
        }
      }
    }
  }
  .modal {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0px;
    top: 0px;
    display: flex;
    z-index: 999;
    justify-content: center;
    align-items: center;
    color: #b4b7c1;
    font-size: 14px;
    background-color: rgba(0, 0, 0, 0.3);
  }
  .ellipsis {
    text-overflow: ellipsis;
    overflow: hidden;
    word-break: break-all;
    white-space: nowrap;
    display: block !important;
    line-height: 32px;
    text-align: center;
  }
}
</style>
