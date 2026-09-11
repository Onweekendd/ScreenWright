<template>
  <div :style="{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }">
    <template v-if="!isScenePopupPanel">
      <div class="flex flex-wrap">
        <el-form-item label="是否溢出滚动">
          <el-checkbox v-model="dynamicPanelOption.enableScroll" @change="update" />
        </el-form-item>
        <el-form-item label="手势滑动">
          <el-checkbox v-model="dynamicPanelOption.gestureSliding" @change="update" />
        </el-form-item>
      </div>

      <el-form-item label="开启轮播">
        <el-checkbox v-model="dynamicPanelOption.rotationShow" @change="update" />
      </el-form-item>
      <el-form-item v-if="dynamicPanelOption.rotationShow" label="轮播类型">
        <template #label>
          <span>
            轮播类型
            <el-tooltip class="item" effect="dark" placement="top">
              <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
              <template #content>
                <div>
                  <p>一般模式：只加载当前显示状态</p>
                  <p>常态模式：加载所有状态，切换显示当前状态</p>
                  <p>卡片模式：加载所有状态，卡片显示状态</p>
                </div>
              </template>
            </el-tooltip>
          </span>
        </template>
        <el-select
          popper-class="sw-select-dropdown"
          v-model="dynamicPanelOption.rotationType"
          clearable
          default-first-option
          placeholder="一般模式"
          @change="update"
        >
          <el-option v-for="item in carouselTypeOption" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <template v-if="dynamicPanelOption.rotationShow && !dynamicPanelOption.rotationType">
        <el-form-item label="自动轮播">
          <el-checkbox v-model="dynamicPanelOption.autoRotation" @change="update" />
        </el-form-item>
        <el-form-item label="轮播图标">
          <el-checkbox v-model="dynamicPanelOption.arrowShow" @change="update" />
        </el-form-item>
        <el-form-item label="图标上传" v-if="dynamicPanelOption.arrowShow">
          <div class="image-upload-box">
            <div class="arrow-left">
              <sw-upload
                v-model="dynamicPanelOption.imgLeft"
                :multiple="false"
                :showFileList="false"
                @change="update"
                @delete="update"
              />
            </div>
            <div class="arrow-right">
              <sw-upload
                v-model="dynamicPanelOption.imgRight"
                :multiple="false"
                :showFileList="false"
                @change="update"
                @delete="update"
              />
            </div>
          </div>
        </el-form-item>
        <el-form-item label="图标大小" v-if="dynamicPanelOption.arrowShow">
          <div class="flex flex-center" style="width: 100%">
            <sw-input-number
              v-model.number="dynamicPanelOption.arrowWidth"
              unit="px"
              bottomLabel="宽度"
              :controls="false"
              @change="update"
            />
            <sw-input-number
              v-model.number="dynamicPanelOption.arrowHeight"
              unit="px"
              bottomLabel="高度"
              :controls="false"
              @change="update"
            />
          </div>
        </el-form-item>
        <el-form-item label="动画类型">
          <el-select
            popper-class="sw-select-dropdown"
            v-model="dynamicPanelOption.animationType"
            clearable
            default-first-option
            placeholder="请选择动画类型"
            @change="update"
          >
            <el-option v-for="item in animationTypeOption" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="间隔时长">
          <sw-input-number
            unit="S"
            :controls="false"
            :min="1"
            v-model="dynamicPanelOption.timingFunction"
            @change="update"
          />
        </el-form-item>
      </template>
      <template v-if="dynamicPanelOption.rotationShow && dynamicPanelOption.rotationType">
        <el-form-item label="自动轮播">
          <el-checkbox v-model="dynamicPanelOption.autoRotation" @change="update" />
        </el-form-item>
        <el-form-item label="间隔时长">
          <sw-input-number
            unit="S"
            :controls="false"
            :min="1"
            v-model="dynamicPanelOption.timingFunction"
            @change="update"
          />
        </el-form-item>
      </template>
      <template v-if="dynamicPanelOption.rotationShow && dynamicPanelOption.rotationType">
        <sw-collapse-item title="中间卡片" :disabled="false">
          <template #content>
            <ft-card-settings v-model="card1Settings" :disable-x="true" @change="update" />
          </template>
        </sw-collapse-item>
        <sw-collapse-item title="两侧卡片" :disabled="false">
          <template #content>
            <ft-card-settings v-model="card2Settings" @change="update" />
          </template>
        </sw-collapse-item>
        <sw-collapse-item title="其他卡片" :disabled="false">
          <template #content>
            <el-form-item label="默认隐藏">
              <el-checkbox v-model="dynamicPanelOption.isCard3Show" @change="update" />
            </el-form-item>
            <ft-card-settings v-model="card3Settings" :min-opacity="0" @change="update" />
          </template>
        </sw-collapse-item>
      </template>
      <el-form-item label="开启内容滚动" v-if="dynamicPanelOption.rotationType === ''">
        <el-checkbox v-model="dynamicPanelOption.enableHorizontalScroll" @change="update" />
      </el-form-item>

      <el-form-item
        label="滚动方向"
        v-show="dynamicPanelOption.enableHorizontalScroll && dynamicPanelOption.rotationType === ''"
      >
        <el-select
          popper-class="sw-select-dropdown"
          v-model="dynamicPanelOption.horizontalScrollDirection"
          clearable
          default-first-option
          placeholder="请选择滚动方向"
          @change="update"
        >
          <el-option label="向左滚动" value="scrollLeft" />
          <el-option label="向右滚动" value="scrollRight" />
          <el-option label="向上滚动" value="scrollUp" />
          <el-option label="向下滚动" value="scrollDown" />
        </el-select>
      </el-form-item>

      <el-form-item
        label="滚动速度"
        v-show="dynamicPanelOption.enableHorizontalScroll && dynamicPanelOption.rotationType === ''"
        style="margin-bottom: 0"
      >
        <sw-input-number
          v-model="dynamicPanelOption.horizontalScrollSpeed"
          bottomLabel="滚动速度"
          unit="S"
          :controls="false"
          :min="1"
          @change="update"
        />
      </el-form-item>

      <!-- <div class="flex" style="width: 100%; gap: 8px">
        <el-form-item label="开启内容滚动">
          <el-checkbox v-model="dynamicPanelOption.enableHorizontalScroll" @change="update" />
        </el-form-item>

        <sw-input-number
          v-show="dynamicPanelOption.enableHorizontalScroll"
          v-model="dynamicPanelOption.horizontalScrollSpeed"
          bottomLabel="滚动速度"
          unit="px/S"
          :controls="false"
          class="scroll-input"
          :min="1"
          @change="update"
        />
      </div> -->

      <el-form-item label="切换状态初始化">
        <el-checkbox v-model="dynamicPanelOption.isSwitchStatusReload" @change="update" />
      </el-form-item>

      <el-form-item label="启用预加载">
        <el-checkbox v-model="dynamicPanelOption.isPreLoad" @change="update" />
      </el-form-item>

      <CustomPositionConfig v-model="dynamicPanelOption" @change="update" />

      <div class="panelBtn" @click.stop="openPanelEditor">编辑动态面板</div>
    </template>
    <template v-else>
      <div class="panelBtn" @click.stop="openPanelEditor">编辑场景弹窗面板</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import { isUndefined } from "lodash-es";

import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwUpload from "@/components/SwUpload/index.vue";
import Icon from "@/components/Icon/index.vue";
import { useHistoryData } from "@/views/build/command/useHistoryData";
import { useEncodePanelInfo } from "@/views/build/components/encodeEditor/useEncodePanelInfo";
import { usePanelInfo } from "@/views/build/components/panelEditor/usePanelInfo";

import type { DynamicPanelProps } from "../../../buildRender/core/SystemComponent/panel/DynamicPanel";
import { useUpdateInstance } from "../../useUpdateInstance";
import CustomPositionConfig from "./components/CustomPositionConfig.vue";
import FtCardSettings from "./components/ftCardSettings.vue";

interface CardSettings {
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
}
const { clearHistory } = useHistoryData();
const router = useRouter();
const route = useRoute();
const { activeStatusStack, activeStatusId, panelInfo } = usePanelInfo();
const {
  activeStatusStack: encodeActiveStatusStack,
  activeStatusId: encodeActiveStatusId,
  panelInfo: encodePanelInfo
} = useEncodePanelInfo();
const { update, selectTargetData } = useUpdateInstance();

const dynamicPanelOption = computed(() => {
  return selectTargetData.value[0]?.option as DynamicPanelProps["option"];
});

const isScenePopupPanel = computed(() => {
  return selectTargetData.value[0].isPopupInScene ?? false;
});

/**
 * @description 轮播类型
 */
const carouselTypeOption = [
  { label: "一般模式", value: "" },
  { label: "常态模式", value: "normal" },
  { label: "卡片模式", value: "card" }
];

/**
 * @description 动画类型
 */
const animationTypeOption = [
  { label: "无", value: "none" },
  { label: "渐隐渐现", value: "opacity" }
];

/**
 * @description 打开动态面板编辑器
 */
const openPanelEditor = () => {
  // 终端交互特殊情况
  if (selectTargetData.value[0].isLock) {
    return;
  }
  clearHistory();

  if (route.name === "encode") {
    encodeActiveStatusStack.value.push({
      panelId: encodePanelInfo.value.config.id!,
      activeStatusId: encodeActiveStatusId.value
    });

    router.push({
      name: "encode",
      params: { cid: selectTargetData.value[0]?.id }
    });
    return;
  }

  if (route.name === "panel") {
    activeStatusStack.value.push({
      panelId: panelInfo.value.config.id!,
      activeStatusId: activeStatusId.value
    });
  }

  router.push({
    name: "panel",
    params: { cid: selectTargetData.value[0]?.id }
  });
};

// 中间卡片设置（带setter，直接写回 option 并调用 update）
const card1Settings = computed<CardSettings>({
  get() {
    return {
      translateX: dynamicPanelOption.value.card1TranslateX,
      translateY: dynamicPanelOption.value.card1TranslateY,
      scaleX: dynamicPanelOption.value.card1ScaleX,
      scaleY: dynamicPanelOption.value.card1ScaleY,
      opacity: isUndefined(dynamicPanelOption.value.card1Opacity) ? 1 : dynamicPanelOption.value.card1Opacity
    };
  },
  set(val) {
    dynamicPanelOption.value.card1TranslateX = val.translateX;
    dynamicPanelOption.value.card1TranslateY = val.translateY;
    dynamicPanelOption.value.card1ScaleX = val.scaleX;
    dynamicPanelOption.value.card1ScaleY = val.scaleY;
    dynamicPanelOption.value.card1Opacity = val.opacity;
    update();
  }
});

// 两侧卡片设置
const card2Settings = computed<CardSettings>({
  get() {
    console.log(dynamicPanelOption.value.card2Opacity, "dynamicPanelOption.value.card2Opacity");
    return {
      translateX: dynamicPanelOption.value.card2TranslateX,
      translateY: dynamicPanelOption.value.card2TranslateY,
      scaleX: dynamicPanelOption.value.card2ScaleX,
      scaleY: dynamicPanelOption.value.card2ScaleY,
      opacity: isUndefined(dynamicPanelOption.value.card2Opacity) ? 0.25 : dynamicPanelOption.value.card2Opacity
    };
  },
  set(val) {
    dynamicPanelOption.value.card2TranslateX = val.translateX;
    dynamicPanelOption.value.card2TranslateY = val.translateY;
    dynamicPanelOption.value.card2ScaleX = val.scaleX;
    dynamicPanelOption.value.card2ScaleY = val.scaleY;
    dynamicPanelOption.value.card2Opacity = val.opacity;
    update();
  }
});

// 其他卡片设置
const card3Settings = computed<CardSettings>({
  get() {
    return {
      translateX: dynamicPanelOption.value.card3TranslateX,
      translateY: dynamicPanelOption.value.card3TranslateY,
      scaleX: dynamicPanelOption.value.card3ScaleX,
      scaleY: dynamicPanelOption.value.card3ScaleY,
      opacity: isUndefined(dynamicPanelOption.value.card3Opacity) ? 0.1 : dynamicPanelOption.value.card3Opacity
    };
  },
  set(val) {
    dynamicPanelOption.value.card3TranslateX = val.translateX;
    dynamicPanelOption.value.card3TranslateY = val.translateY;
    dynamicPanelOption.value.card3ScaleX = val.scaleX;
    dynamicPanelOption.value.card3ScaleY = val.scaleY;
    dynamicPanelOption.value.card3Opacity = val.opacity;
    update();
  }
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include checkbox-style();
@include common-element-style(".el-select__wrapper");
:deep(.el-select__wrapper) {
  min-height: 28px;
}

.flex-wrap {
  flex-wrap: wrap;
  -webkit-flex-wrap: wrap;
}
:deep(.scroll-input) {
  .unit {
    top: 7px;
  }
}

.flex {
  display: -ms-flexbox;
  display: -webkit-box;
  display: flex;
}

.flex-center {
  justify-content: center;
}

.panelBtn {
  text-align: center;
  background: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
  border-radius: 5px 5px;
  padding: 8px 0;
  margin: 5px 20px 0;
  font-size: 12px;
  font-family:
    Source Han Sans CN-Regular,
    Source Han Sans CN;
  color: #fff;
  cursor: pointer;
}

.image-upload-box {
  width: 100%;
  .arrow-left {
    position: relative;
    &::before {
      content: "左";
      position: absolute;
      left: -20px;
      top: 50%;
      transform: translateY(-50%);
    }
  }
  .arrow-right {
    position: relative;
    &::before {
      content: "右";
      position: absolute;
      left: -20px;
      top: 50%;
      transform: translateY(-50%);
    }
  }
}
</style>
