<template>
  <section class="custom-animation-main" :style="{ height: `${editorHeight}px` }">
    <AnimationEditorResizer @on-resize="onResize" />
    <el-row :gutter="0">
      <el-col :span="24" style="width: 100%; height: 100%">
        <div class="animation-header">
          <div class="control-bar">
            <!-- TODO: 提取出控制条组件 -->
            <div class="control-button">
              <PlayButton :current-animation="currentAnimation" />
              <HistoryController />
            </div>
            <el-tooltip effect="dark" content="关闭" placement="top">
              <Icon
                name="关闭"
                type="iconfont-closeToHomepage"
                size="18"
                :style="{ cursor: 'pointer', color: 'white' }"
                @click="closeEdit"
              />
            </el-tooltip>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="animation-main">
      <el-row :style="{ height: `${editorHeight - 36}px`, overflowX: 'hidden' }">
        <el-col :span="2">
          <AnimationList
            ref="left"
            :screen-id="navInfo.id"
            :panel-id="props.panelId"
            :active-status-id="props.activeStatusId"
          />
        </el-col>

        <el-col
          :span="22"
          :style="{
            display: 'flex',
            flexDirection: 'column'
          }"
        >
          <ProgressTimeline
            :current-animation="currentAnimation"
            :animation-editor-width="animationEditor?.$el.clientWidth"
            :max-time="currentAnimationMaxTime"
            :screen-id="navInfo.id"
            :panel-id="props.panelId"
            :active-status-id="props.activeStatusId"
          />

          <div class="animation-editor-header">
            <el-row>
              <el-col :span="13">
                <AnimationTableHead />
              </el-col>

              <el-col :span="11" :style="{ overflowX: 'hidden' }">
                <TimeLine :max-time="maxTime" :panel-id="props.panelId" :active-status-id="props.activeStatusId" />
              </el-col>
            </el-row>
          </div>

          <div class="animation-editor-content" ref="animationEditorContent" id="animation-editor-content">
            <el-row>
              <el-col :span="13">
                <AnimationEditor
                  ref="animationEditor"
                  :screen-id="navInfo.id"
                  :panel-id="props.panelId"
                  :active-status-id="props.activeStatusId"
                  :key="editorKey"
                />
              </el-col>

              <el-col :span="11" :style="{ position: 'relative' }">
                <TimeManager :current-animation="currentAnimation" v-if="currentAnimation" />
                <CustomScrollbar v-if="currentAnimationList.length > 0 && editorHeight > 36" />
                <DividingLine :panel-id="props.panelId" :active-status-id="props.activeStatusId" />
              </el-col>
            </el-row>
            <div
              class="add-modal"
              v-if="currentAnimationList.length === 0"
              @click="() => onAddAnimation({ panelId: props.panelId, statusId: props.activeStatusId })"
            >
              <div class="text">点击添加动画</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </section>
</template>

<script setup lang="ts">
// @ts-check
import type { ComponentPublicInstance } from "vue";
import { computed, ref } from "vue";

import { ElCol, ElRow } from "element-plus";

import Icon from "@/components/Icon/index.vue";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

import AnimationEditor from "./AnimationEditor.vue";
import AnimationList from "./AnimationList.vue";
import AnimationTableHead from "./AnimationTableHead.vue";
import AnimationEditorResizer from "./components/AnimationEditorResizer.vue";
import CustomScrollbar from "./components/CustomScrollbar.vue";
import DividingLine from "./components/DividingLine.vue";
import HistoryController from "./components/HistoryController.vue";
import PlayButton from "./components/PlayButton.vue";
import ProgressTimeline from "./components/ProgressTimeline.vue";
import TimeLine from "./components/TimeLine.vue";
import TimeManager from "./TimeManager.vue";
import { useCustomAnimation } from "./useCustomAnimation";
import { getAnimationWithPanIdAndStatusId } from "./util";

const props = withDefaults(
  defineProps<{
    panelId?: number;
    activeStatusId?: string;
  }>(),
  {
    panelId: undefined,
    activeStatusId: undefined
  }
);

const { editorHeight, selectId, maxTime, closeEdit, onAddAnimation, animationList } = useCustomAnimation();
const { navInfo } = useLargeScreenInfo();
const { allComponentMap } = useGlobalComponentData();

const animationEditorContent = ref<HTMLElement | null>(null);
const animationEditor = ref<ComponentPublicInstance<InstanceType<typeof AnimationEditor>>>();

const editorKey = ref(0);

const currentAnimationList = computed(() => {
  return getAnimationWithPanIdAndStatusId({
    data: animationList.value,
    panelId: props.panelId,
    statusId: props.activeStatusId
  });
});

const currentAnimation = computed(() => {
  return currentAnimationList.value.find((v) => v.id === selectId.value);
});

const currentAnimationMaxTime = computed(() => {
  if (!currentAnimation.value) return 0;

  return currentAnimation.value.componentSetting
    .filter((componentSetting) => {
      const component = allComponentMap.value.get(componentSetting.id.toString());
      if (!component) return false;

      // 简化判断逻辑：检查组件类型是否为load时返回false
      if (componentSetting.type === "load") return false;

      // 检查动画是否可用：确保delay和duration已定义
      return componentSetting.delay !== undefined && componentSetting.duration !== undefined;
    })
    .reduce((acc: number, cur) => {
      return Math.max(acc, cur.delay + cur.duration);
    }, 0);
});

const onResize = () => {
  editorKey.value++;
};
</script>

<style lang="scss">
$left: 218px;
$rowHeight: 36px;
.custom-animation-main {
  position: fixed;
  left: $left;
  bottom: 0%;
  z-index: 999;
  width: calc(100% - $left - 340px);
  font-family:
    Source Han Sans CN-Normal,
    Source Han Sans CN;
  border-top: 1px rgba(13, 7, 7, 0.6) solid;
  border-bottom: 1px solid #000000;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  min-width: 810px;
  .el-row {
    width: 100%;
    height: 36px;
    .el-col {
      .animation-header {
        width: 100%;
        height: 100%;
        font-size: 14px;
        display: flex;
        flex-direction: row-reverse;
        align-items: center;
        background-color: rgb(46, 49, 63);
        box-sizing: border-box;
        border-bottom: 1px solid rgba(13, 7, 7, 0.6);
        padding: 0 8px;
        .control-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;

          column-gap: 8px;

          height: 100%;
          width: 42%;
          .control-button {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 10px;

            .el-tooltip {
              text-align: center;
              cursor: pointer;
              flex-shrink: 0;
              color: #b4b7c1;
              font-size: 12px;
            }
          }
          .el-tooltip {
            text-align: center;
            cursor: pointer;
            flex-shrink: 0;
            color: #b4b7c1;
            font-size: 12px;
          }
        }
      }
    }
  }

  .animation-main {
    width: 100%;
    height: 100%;
    background-color: rgb(46, 49, 63);

    .el-row {
      width: 100%;
      height: 100%;
      .el-col {
        height: 100%;
      }
    }
    .animation-editor-header {
      width: 100%;
      height: $rowHeight;
      color: #b4b7c1;
      font-size: 12px;
    }

    .animation-editor-content {
      width: 100%;
      height: 0;
      flex: 1;
      overflow-x: visible;
      overflow-y: scroll;
      position: relative;
    }

    .add-modal {
      width: 100%;
      height: 100%;
      position: absolute;
      left: 0px;
      top: 0px;
      background-color: rgba(0, 0, 0, 0.3);
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      font-size: 32px;
      color: #b4b7c1;
      backdrop-filter: blur(2px);
      cursor: pointer;
      .text {
        font-size: 16px;
      }
    }
  }
}
</style>
