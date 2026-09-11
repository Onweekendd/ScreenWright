<template>
  <div class="threeMap-iconList-config">
    <SwCollapseItem title="基础配置" open>
      <template #content>
        <el-form-item label="编辑" :label-width="secondLabelWidth">
          <GlPointEditorEntry />
        </el-form-item>
        <el-form-item label="原点位置" :label-width="secondLabelWidth">
          <el-select v-model="iconOption.originPoint" popper-class="sw-select-dropdown" @change="update">
            <el-option v-for="item in originPoint" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <SwCollapseItem title="旋转">
          <template #content>
            <el-form-item label="同步相机视角" :label-width="thirdLabelWidth">
              <el-select v-model="iconOption.followCamera" popper-class="sw-select-dropdown" @change="update">
                <el-option v-for="item in followCamera" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <template v-if="iconOption.followCamera === 'none'">
              <el-form-item label="X" :label-width="thirdLabelWidth">
                <SwSlider v-model="martixOption.rotation[0]" :min="-360" :max="360" @change="update" />
              </el-form-item>
              <el-form-item label="Y" :label-width="thirdLabelWidth">
                <SwSlider v-model="martixOption.rotation[1]" :min="-360" :max="360" @change="update" />
              </el-form-item>
              <el-form-item label="Z" :label-width="thirdLabelWidth">
                <SwSlider v-model="martixOption.rotation[2]" :min="-360" :max="360" @change="update" />
              </el-form-item>
            </template>
          </template>
        </SwCollapseItem>
        <el-form-item label="缩放" :label-width="secondLabelWidth">
          <div class="flex flex-justify-between" style="width: 100%">
            <Icon
              class="lock"
              :type="`${iconOption.scaleLock ? 'iconfont-suoding' : 'iconfont-jiesuo'}`"
              size="14"
              @click="handleLockScale"
              style="top: 10px; left: -4px; color: white"
            />
            <SwInputNumber @change="handleUpdateScale($event, 0)" v-model="martixOption.scale[0]" width="60" unit="X" />
            <SwInputNumber @change="handleUpdateScale($event, 1)" v-model="martixOption.scale[1]" width="60" unit="Y" />
            <SwInputNumber @change="handleUpdateScale($event, 2)" v-model="martixOption.scale[2]" width="60" unit="Z" />
            <!-- <div class="lock" @click="handleLockScale">
                <i :class="`el-tooltip ${option.options.scaleLock ? 'iconfont-suoding' : 'iconfont-jiesuo'}`" />
              </div> -->
          </div>
        </el-form-item>
        <el-form-item label="显示方式" :label-width="secondLabelWidth">
          <el-select v-model="iconOption.iconSize" popper-class="sw-select-dropdown" @change="update">
            <el-option v-for="item in iconSize" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem
      title="视频内容"
      v-if="type === 'iconList'"
      v-model="proxyAction.videoBoxShow"
      @change="update"
      showIcon
    >
      <template #content>
        <el-form-item label="混合模式" :label-width="secondLabelWidth">
          <el-select v-model="proxyAction.mixBlendMode" popper-class="sw-select-dropdown" @change="update">
            <el-option v-for="item in mixBlendMode" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item title="控制条" label="控制条" :label-width="secondLabelWidth">
          <el-checkbox v-model="proxyAction.controls" @change="update" />
        </el-form-item>
        <el-form-item title="自动播放" label="自动播放" :label-width="secondLabelWidth">
          <el-checkbox v-model="proxyAction.autoplay" @change="update" />
        </el-form-item>
        <el-form-item title="循环播放" label="循环播放" :label-width="secondLabelWidth">
          <el-checkbox v-model="proxyAction.loop" @change="update" />
        </el-form-item>
        <el-form-item title="静音" label="静音" :label-width="secondLabelWidth">
          <el-checkbox v-model="proxyAction.muted" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";

import { isSupportedFlv, isSupportedHls } from "@screenwright/material/media";

import { cloneDeep } from "@/components/ScreenwrightSceneComponent/utils";
import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwSlider from "@/components/SwSlider/index.vue";
import Icon from "@/components/Icon/index.vue";
import { setMinioUrl } from "@/utils/config";
import { customAction } from "@/views/build/components/buildConfig/attrsRender/childrenManager/threeMapChildConfig";
import { useThreeSceneChildComponent } from "@/views/build/components/buildConfig/attrsRender/childrenManager/useThreeSceneChildComponent";
import {
  followCamera,
  iconSize,
  mixBlendMode,
  originPoint,
  secondLabelWidth,
  thirdLabelWidth
} from "@/views/build/components/buildConfig/constants/index";

import GlPointEditorEntry from "../glPointEditorEntry.vue";

const { currentChildrenItem, martixOption, iconOption, update, type } = useThreeSceneChildComponent();

const mapBoxObj = ref<any>(null);
const activeName = ref("first");
const videoActiveName = ref("first");
const isEdit = ref(false);

const proxyAction = ref<any>({});
const initProxy = () => {
  const { interAction } = iconOption.value;
  mapBoxObj.value = null;
  activeName.value = "first";
  videoActiveName.value = "first";
  isEdit.value = false;
  // if (!interAction && action !== 'mapBox') return;
  if (JSON.stringify(interAction) !== "{}") {
    mapBoxObj.value = document.getElementsByClassName(`map-box-${iconOption.value.index}`)[0];
  } else {
    iconOption.value.interAction = cloneDeep(customAction);
  }
  if (iconOption.value.interAction) {
    proxyAction.value = new Proxy(iconOption.value.interAction, {
      set: (target: any, prop: any, value: any) => {
        target[prop] = value;
        console.log(prop, value);
        return setDomProperty(prop, value);
      }
    });
  }
};
const isBoxMode = computed(() => {
  const { mapBoxShow, action } = iconOption.value;
  return action === "mapBox" && mapBoxShow && mapBoxObj.value;
});
// 设置弹窗元素显隐
const setElementVisible = (type: string, val: boolean) => {
  if (!isBoxMode.value) {
    return;
  }
  mapBoxObj.value.children[type === "closeShow" ? 0 : 1].style.display = val ? "unset" : "none";
};

const setDomProperty = (prop: string, value: any) => {
  const dom = mapBoxObj.value as any;
  if (iconOption.value.action === "mapBox") {
    iconOption.value.interAction[prop] = value;
    if (dom) {
      const option = iconOption.value.interAction;
      const [close, video, tips] = dom.children as any;

      switch (prop) {
        case "src":
        case "link": {
          video[prop] = setMinioUrl(value);
          const videoFun: any = {
            flv: isSupportedFlv as any,
            m3u8: isSupportedHls as any
          };
          ["flv", "m3u8"].forEach((type) => {
            if (option.source === "link" && value.includes(`.${type}`)) {
              (videoFun[type] as any)(setMinioUrl(value), tips, video);
            }
          });
          return true;
        }
        case "controls":
        case "autoplay":
        case "loop":
        case "muted":
          video[prop] = value ? prop : "";
          return true;
        case "width":
        case "height":
        case "backgroundImage":
          dom.style[prop] = prop === "backgroundImage" ? `url(${setMinioUrl(value)})` : `${value}px`;
          return true;
        case "widthIcon":
        case "heightIcon":
        case "topIcon":
        case "rightIcon":
          close.style[`${prop.split("Icon")[0]}`] = `${value}px`;
          return true;
        case "closeShow":
        case "videoBoxShow":
          setElementVisible(prop, value);
          return true;
        default:
          break;
      }

      dom.style.lineHeight = `${option.height}px`;
      dom.style.padding = `${option.paddingTop}px ${option.paddingX}px ${option.paddingBottom}px ${option.paddingX}px`;

      video["width"] = option.width - option.paddingX * 2;
      video["height"] = option.height - option.paddingTop - option.paddingBottom;
      video["style"]["mix-blend-mode"] = option.mixBlendMode || "normal";
    }
  }
  return true;
};

// 控制缩放
const handleUpdateScale = ($event: any, i: any) => {
  const option = iconOption.value;
  option.scale[i] = $event;
  if (option.scaleLock) {
    option.scale = new Array(3).fill($event);
    martixOption.value.scale = option.scale;
  }
  update();
};
// 锁定缩放
const handleLockScale = () => {
  iconOption.value.scaleLock = !iconOption.value.scaleLock;
};

onMounted(() => {
  nextTick(() => {
    // if (currentChildrenItem.value) initData(currentChildrenItem.value.option.options)
    if (!currentChildrenItem.value.option.brushType) {
      initProxy();
    }
  });
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
.threeMap-iconList-config {
  padding: 0 16px;
}
</style>
