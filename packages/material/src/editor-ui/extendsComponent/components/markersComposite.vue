<template>
  <div :class="[aniClass]" class="markers-composite" ref="entryRef">
    <div
      class="composite-canvas"
      :style="{
        width: `calc(100% - 340px - 40px)`
      }"
    >
      <div class="render-view" ref="renderView">
        <PhotoSphereViewer
          ref="photoSphereViewerRef"
          :element="selectTargetData[0]"
          :isEdit="true"
          @dblClick="handleAddMarker"
          @panoramaLoaded="handlePanoramaLoaded"
          @selectMarker="handleSelectMarker"
        />
      </div>
      <div class="back-to pointer fs-14" @click="toBack">
        <Icon type="iconfont-zuojiantou" size="14" />
        返回主编辑页
      </div>
      <div class="btn-control-edit">
        <el-tooltip effect="dark" placement="top">
          <div class="item" :class="{ active: markerState }" @click.stop="markerState = !markerState">
            <Icon type="iconfont-dingwei" size="14" />
          </div>
          <template #content>
            <p>添加标记</p>
          </template>
        </el-tooltip>
        <el-tooltip effect="dark" placement="top">
          <div class="item" @click.stop="handleDeleteMarker">
            <Icon type="iconfont-shanchu1" size="14" />
          </div>
          <template #content>
            <p>删除标记</p>
          </template>
        </el-tooltip>
      </div>
    </div>
    <div class="composite-option">
      <div class="option-title">参数设置</div>

      <div class="option-set" v-if="markerOption.id && !markerState">
        <SwCollapseItem title="基础配置" open>
          <template #content>
            <el-form-item label="位置" :label-width="secondLabelWidth">
              <div class="flex flex-center-between" style="width: 100%">
                <sw-input-number v-model="markerOption.position.yaw" disabled width="98" />
                <sw-input-number v-model="markerOption.position.pitch" disabled width="98" />
              </div>
            </el-form-item>

            <el-form-item label="大小" :label-width="secondLabelWidth">
              <div class="flex flex-center-between" style="width: 100%">
                <sw-input-number v-model="markerOption.size.width" width="98" unit="px" @change="handleUpdateMarker" />
                <sw-input-number v-model="markerOption.size.height" width="98" unit="px" @change="handleUpdateMarker" />
              </div>
            </el-form-item>

            <el-form-item label="旋转" :label-width="secondLabelWidth">
              <div class="flex flex-center-between" style="width: 100%">
                <sw-input-number
                  @change="handleUpdateMarker"
                  v-model="markerOption.rotation.yaw"
                  width="98"
                  unit="deg"
                  bottomLabel="偏航角"
                />
                <sw-input-number
                  @change="handleUpdateMarker"
                  v-model="markerOption.rotation.pitch"
                  width="98"
                  unit="deg"
                  bottomLabel="俯仰角"
                />
              </div>
            </el-form-item>
          </template>
        </SwCollapseItem>
        <sw-collapse-item title="文本" v-if="markerOption.type == 'html'" open>
          <template #content>
            <el-form-item label="内容" :label-width="secondLabelWidth">
              <sw-input
                @change="handleUpdateMarker"
                v-model="markerOption.innerHTML"
                type="textarea"
                :minRows="2"
                :maxRow="6"
                resize="none"
              />
            </el-form-item>
            <el-form-item label="字体" :label-width="secondLabelWidth">
              <ConfigTextStyle v-model="textStyle" @change="handleTextStyleChange" :isShowFontStyle="false" />
            </el-form-item>
          </template>
        </sw-collapse-item>

        <sw-collapse-item title="提示框" v-if="markerOption.type == 'tooltip'" open>
          <template #content>
            <el-form-item label="标记" :label-width="secondLabelWidth">
              <SwUpload v-model="markerOption.image" @change="handleUpdateMarker" @delete="handleUpdateMarker" />
            </el-form-item>

            <el-form-item label="内容" :label-width="secondLabelWidth">
              <sw-input
                @change="handleUpdateMarker"
                v-model="markerOption.tooltip.content"
                type="textarea"
                :minRows="2"
                :maxRow="6"
                resize="none"
              />
            </el-form-item>

            <el-form-item label="触发" :label-width="secondLabelWidth">
              <el-select
                @change="handleUpdateMarker"
                popper-class="sw-select-dropdown"
                v-model="markerOption.tooltip.trigger"
              >
                <el-option v-for="item in triggerOption" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>

            <el-form-item label="位置" :label-width="secondLabelWidth">
              <el-select
                @change="handleUpdateMarker"
                popper-class="sw-select-dropdown"
                v-model="markerOption.tooltip.position"
              >
                <el-option v-for="item in positionOption" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </template>
        </sw-collapse-item>
        <sw-collapse-item title="图片" v-if="markerOption.type == 'image'" open>
          <template #content>
            <el-form-item label="标记" :label-width="secondLabelWidth">
              <SwUpload v-model="markerOption.image" @change="handleUpdateMarker" @delete="handleUpdateMarker" />
            </el-form-item>
          </template>
        </sw-collapse-item>

        <sw-collapse-item title="视频" v-if="markerOption.type == 'video'" open>
          <template #content>
            <el-form-item label="标记" :label-width="secondLabelWidth">
              <SwUpload
                :fileType="FileType.video"
                v-model="markerOption.srcObj.src"
                @change="handleUpdateMarker"
                @delete="handleUpdateMarker"
              />
            </el-form-item>

            <el-form-item label="控制条" :label-width="secondLabelWidth">
              <el-checkbox v-model="markerOption.srcObj.controls" @change="handleUpdateMarker" />
            </el-form-item>
            <el-form-item label="静音" :label-width="secondLabelWidth">
              <el-checkbox v-model="markerOption.srcObj.muted" @change="handleUpdateMarker" />
            </el-form-item>
            <el-form-item label="自动播放" :label-width="secondLabelWidth">
              <el-checkbox v-model="markerOption.srcObj.autoplay" @change="handleUpdateMarker" />
            </el-form-item>
            <el-form-item label="循环播放" :label-width="secondLabelWidth">
              <el-checkbox v-model="markerOption.srcObj.loop" @change="handleUpdateMarker" />
            </el-form-item>
          </template>
        </sw-collapse-item>
      </div>
      <div class="option-select" v-else>
        <el-form-item label="选择标记类型">
          <el-select popper-class="sw-select-dropdown" v-model="markerAddType">
            <el-option v-for="item in typeOption" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <div class="marker-status">备注：点击添加标记按钮，然后双击360全景图任意位置，即可在该位置创建标记</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { defineAsyncComponent } from "vue";

import { ElMessage } from "element-plus";

import { SwCollapseItem } from "@screenwright/ui";
import { SwInput } from "@screenwright/ui";
import { SwInputNumber } from "@screenwright/ui";
import { FileType } from "@editor/base/SwUpload/SwUpload";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";
// import { setMinioUrl } from "@screenwright/composables"
import { uuid } from "@screenwright/core";
import { handleMessageBox } from "@screenwright/composables";

import ConfigTextStyle from "../../components/configTextStyle/index.vue";
import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const PhotoSphereViewer = defineAsyncComponent(
  () => import("@material/components/ScreenwrightExtendsComponent/photoSphereViewer/index.vue")
);

const { selectTargetData, update } = useUpdateInstance();
const compositeOption = {
  type: "tooltip",
  image: "version-test/assets/newSystemAssets/标记/标记图标-1.png",
  elementLayer: null,
  tooltip: {
    content: "提示内容",
    trigger: "hover",
    position: "top center"
  },
  srcObj: {
    src: "version-test/assets/defaultImg/video.mp4",
    loop: true,
    autoplay: true,
    controls: false,
    muted: true
  },
  position: {
    pitch: 0, // 俯仰角
    yaw: 0 // 偏航角
  },
  size: {
    width: 50, // 宽度
    height: 50 // 高度
  },
  anchor: "bottom center",
  rotation: {
    pitch: "0deg",
    yaw: "0deg"
  },
  innerHTML: "这是一段文本",
  fontFamily: "sans-serif",
  fontSize: 16,
  fontColor: "#ffffff"
};

const emits = defineEmits(["onClose"]);

const textStyle = ref({
  fontFamily: "sans-serif",
  fontSize: 16,
  color: "#ffffff",
  fontStyle: "normal",
  fontWeight: "normal"
});
const handleTextStyleChange = (key: any) => {
  console.log("handleTextStyleChange", key, textStyle.value);
  markerOption.value.fontColor = textStyle.value.color;
  markerOption.value.fontFamily = textStyle.value.fontFamily;
  markerOption.value.fontSize = textStyle.value.fontSize;
  handleUpdateMarker();
};

const typeOption = ref([
  { label: "文本", value: "html" },
  { label: "图片", value: "image" },
  { label: "视频", value: "video" },
  { label: "提示框", value: "tooltip" }
]);

const positionOption = ref([
  { label: "上", value: "top center" },
  { label: "中", value: "cengter center" },
  { label: "下", value: "bottom center" },
  { label: "左", value: "left center" },
  { label: "左", value: "right center" }
]);
const triggerOption = ref([
  { label: "悬浮", value: "hover" },
  { label: "单击", value: "click" }
]);

const aniClass = ref("entryAni");
const entryRef = ref<HTMLElement>();
const markerOption = ref<Record<string, any>>({});
const markerAddType = ref("tooltip");
const currentGalleryItem = ref<any>(null);
const currentGalleryIndex = ref(-1);
const photoSphereViewerRef = ref<InstanceType<typeof PhotoSphereViewer> | null>(null);
const markerState = ref(false);

const handleDeleteMarker = async () => {
  if (!markerOption.value || !markerOption.value.id) {
    ElMessage.warning("未选中标记！");
    return;
  }
  markerState.value = false;
  const isDelete = await handleMessageBox("是否确认删除该标记?", {
    confirmButtonText: "确定",
    cancelButtonText: "取消"
  });
  if (!isDelete) {
    return;
  }
  if (!photoSphereViewerRef.value) {
    return;
  }
  photoSphereViewerRef.value.removeMarker(markerOption.value.id);
  const activeItem = selectTargetData.value[0];
  const markerIndex = activeItem.option.galleryItems[currentGalleryIndex.value].markers.findIndex(
    (a: any) => a.id === markerOption.value.id
  );
  if (markerIndex >= 0) {
    activeItem.option.galleryItems[currentGalleryIndex.value].markers.splice(markerIndex, 1);
  }
  markerOption.value.id = null;
};

const handleUpdateMarker = () => {
  if (!markerOption.value.id || !photoSphereViewerRef.value) return;
  const activeItem = selectTargetData.value[0];
  const markerIndex = activeItem.option.galleryItems[currentGalleryIndex.value].markers.findIndex(
    (a: any) => a.id === markerOption.value.id
  );
  if (markerIndex < 0) {
    activeItem.option.galleryItems[currentGalleryIndex.value].markers.push(markerOption.value);
  } else {
    activeItem.option.galleryItems[currentGalleryIndex.value].markers[markerIndex] = markerOption.value;
  }
  // 更新渲染
  const resData = photoSphereViewerRef.value.createElementLayer(markerOption.value);
  photoSphereViewerRef.value.updateMarker({
    ...markerOption.value,
    ...resData
  });
  update();
};
const handleSelectMarker = (marker: any) => {
  if (markerState.value) return;
  markerOption.value = { ...marker.config };
  textStyle.value = {
    fontFamily: markerOption.value.fontFamily,
    fontSize: markerOption.value.fontSize,
    color: markerOption.value.fontColor,
    fontStyle: "normal",
    fontWeight: "normal"
  };
};
const handleAddMarker = (data: any) => {
  if (!markerState.value) return;
  console.log(data, "handleAddMarker");
  if (!photoSphereViewerRef.value) {
    return;
  }
  const markerItem = {
    id: uuid(),
    ...JSON.parse(JSON.stringify(compositeOption)),
    type: markerAddType.value,
    image: compositeOption.image,
    position: {
      yaw: data.yaw,
      pitch: data.pitch
    }
  };
  const resData = photoSphereViewerRef.value.createElementLayer(markerItem);
  photoSphereViewerRef.value.addMarker({
    ...markerItem,
    ...resData
  });
  markerOption.value = { ...markerItem };
  currentGalleryItem.value.markers.push({
    ...markerOption.value
  });
  markerState.value = false;
  textStyle.value = {
    fontFamily: markerOption.value.fontFamily,
    fontSize: markerOption.value.fontSize,
    color: markerOption.value.fontColor,
    fontStyle: "normal",
    fontWeight: "normal"
  };
  update();
  console.log(selectTargetData.value[0], "selectTargetData.value[0]");
};

const handlePanoramaLoaded = (galleryId: string) => {
  if (!galleryId) {
    return;
  }
  const { galleryItems } = selectTargetData.value[0].option;
  currentGalleryItem.value = galleryItems.find((a: any) => a.id === galleryId) || null;
  currentGalleryIndex.value = galleryItems.findIndex((a: any) => a.id === galleryId) || 0;
  console.log(galleryId, "galleryId");
};

const getAnimationType = (elDom: HTMLElement | null) => {
  if (!elDom) return "";
  const animations: Record<"animation" | "OAnimation" | "MozAnimation" | "WebkitAnimation", string> = {
    animation: "animationend",
    OAnimation: "oAnimationEnd",
    MozAnimation: "animationend",
    WebkitAnimation: "webkitAnimationEnd"
  };
  for (const i in animations) {
    if ((elDom.style as any)[i] !== undefined) {
      return animations[i as keyof typeof animations];
    }
  }
};
const onClose = () => {
  const elDom = entryRef.value;
  if (!elDom) return;
  const eventType = getAnimationType(elDom as HTMLElement);
  if (!eventType) return;
  const handleAnimationend = () => {
    elDom.removeEventListener(eventType, handleAnimationend);
    emits("onClose");
  };

  elDom.addEventListener(eventType, handleAnimationend, false);
  aniClass.value = "exitAni";
};
const toBack = () => {
  onClose();
};
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
.markers-composite {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #181a24;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
  animation-duration: 0.5s;
  animation-timing-function: ease;
  animation-fill-mode: forwards;
  &.entryAni {
    animation-name: entryAni;
  }
  &.exitAni {
    animation-name: exitAni;
  }
  @keyframes entryAni {
    0% {
      opacity: 1;
      transform: translateX(100%);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }
  @keyframes exitAni {
    0% {
      opacity: 1;
      transform: translateX(0);
    }
    100% {
      opacity: 1;
      transform: translateX(100%);
    }
  }
  .composite-canvas {
    display: inline-block;
    --option-width: 340px;
    width: calc(100% - var(--option-width) - 40px);
    height: calc(100% - 40px);
    margin: 20px 20px;
    background-color: #232630;
    color: #b4b7c1;
    position: relative;
    vertical-align: bottom;
    .back-to {
      position: absolute;
      top: 0;
      left: 0;
      padding: 5px 10px;
      cursor: pointer;
      &:hover {
        color: #ffffff;
      }
    }
    .btn-control-edit {
      position: absolute;
      right: 0;
      top: -16px;
      .item {
        width: 36px;
        height: 36px;
        display: inline-flex;
        cursor: pointer;
        background: #373a47;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
        margin: 0 0 0 10px;
        &:hover,
        &.active {
          background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
          color: #ffffff;
        }
      }
    }
    .render-view {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      display: flex;
      justify-content: flex-start;
      align-items: center;
    }
  }
  .composite-option {
    display: inline-block;
    width: 340px;
    height: 100%;
    background-color: #232630;
    vertical-align: bottom;
    .option-title {
      height: 45px;
      line-height: 45px;
      padding: 0 20px;
      border-bottom: 1px solid #575757;
    }
    .option-set {
      width: 100%;
      height: calc(100% - 45px);
      overflow: auto;
      padding: 0 10px;
      :deep(.el-textarea__inner) {
        background-color: #0f1014 !important;
        box-shadow: 0 0 0 1px #0f1014 inset;
        &:hover {
          box-shadow: 0 0 0 1px #642cff inset !important;
        }
      }
      // @include common-element-style(".el-input__wrapper");
    }
    .btn-control-test {
      position: relative;
      z-index: 1;
      font-size: 12px;
      color: #b4b7c1;
      text-align: center;
      cursor: pointer;
      padding: 5px 0;
      margin: 5px 20px 0;
      background-color: rgba(55, 58, 71, 0.8);
      &:hover {
        color: #ffffff;
        background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
      }
    }
    .option-select {
      padding: 80px 10px 0 10px;
      position: relative;
      .marker-status {
        padding: 10px 20px;
        pointer-events: none;
        position: absolute;
        top: 0px;
        left: 0;
        color: red;
      }
    }
  }
  .default_button {
    color: #859094;
    line-height: 16px;
    padding: 5px 5px;
    margin: 0 5px;
    border-radius: 4px 4px;
    border: 1px solid #393b4a;
    cursor: pointer;
    &.primary {
      color: #ffffff;
      background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
    }
  }
  audio {
    width: 220px;
    height: 30px;
  }
  audio::-webkit-media-controls-enclosure {
    background: #444547;
  }
  audio::-webkit-media-controls-play-button {
    color: #b4b7c1;
    text-shadow: none;
  }
  audio::-webkit-media-controls-fullscreen-button,
  // audio::-webkit-media-controls-volume-control-container,
  audio::-webkit-media-controls-current-time-display,
  audio::-webkit-media-controls-time-remaining-display {
    display: none;
  }
  audio::-webkit-media-controls-timeline,
  audio::-webkit-media-controls-panel {
    padding: 0;
  }
}
</style>
