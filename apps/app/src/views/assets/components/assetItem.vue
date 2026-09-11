<template>
  <grid-item class="asset-item">
    <div class="content_info">
      <div class="content_info_checkbox">
        <el-checkbox
          v-if="[FileTypeEnum.personalPageAssets, FileTypeEnum.personalSceneAssets].includes(fileType)"
          :label="item.id"
          :model-value="getCheckbox(item)"
          @change="checkboxChange"
        />
      </div>
      <img class="materialType-icon" :src="getMaterialTypeIcon(item)" />
      <template v-if="`${item.resourceType}` === 'undefined'">
        <template v-if="item.img">
          <img :src="`${setMinioUrl(item.img)}`" />
        </template>
        <template v-else-if="item.hdrPreviewImg">
          <img :src="`${setMinioUrl(item.hdrPreviewImg)}`" />
        </template>
        <template v-else-if="item.url">
          <template v-if="isVideoOrWeb(item.url)">
            <video style="max-width: 100%; height: 100%" :src="setMinioUrl(item.url)" muted autoplay loop controls />
          </template>
          <img :src="`${setMinioUrl(item.url)}`" v-else />
        </template>

        <SwItemEmpty v-else />
      </template>
      <template v-else-if="`${item.resourceType}`">
        <template v-if="item.cover">
          <img :src="`${setMinioUrl(item.cover)}?t=${new Date().getTime()}`" />
        </template>
        <template v-else>
          <video
            style="max-width: 100%; height: 100%"
            v-if="`${item.resourceType}` === '2' && item.url && !item.cover"
            :src="setMinioUrl(item.url)"
            muted
            autoplay
            loop
            controls
            crossorigin="anonymous"
          />
          <img
            v-else-if="isShowImg"
            :src="
              isShowImg
                ? `${setMinioUrl(item.url)}?t=${new Date().getTime()}`
                : `${setMinioUrl(item.cover)}?t=${new Date().getTime()}`
            "
          />
          <SwItemEmpty v-else />
        </template>
      </template>
      <template v-else>
        <template v-if="item.resourceType === 0">
          <SwItemEmpty type="icon" />
        </template>
        <template v-else-if="isVideoOrWeb(item.url)">
          <video style="max-width: 100%; height: 100%" :src="setMinioUrl(item.url)" muted autoplay loop controls />
        </template>
        <img v-else-if="item.url" :src="getImageByType" />
        <SwItemEmpty v-else />
      </template>

      <assetMenu
        showPreview
        :showEdit="showEdit"
        :showExport="showExport"
        @handlePreview="handlePreview"
        @handleEdit="handleEdit"
        @handleExport="handleExport"
      />
    </div>
    <div class="content__main flex flex-justify-between flex-align-center">
      <span class="content__name">{{ item.name || item.label }}</span>
      <div
        class="content__menulist flex flex-align-center"
        v-if="[FileTypeEnum.personalPageAssets, FileTypeEnum.personalSceneAssets].includes(fileType)"
      >
        <el-tooltip content="查看使用情况" v-if="fileType === FileTypeEnum.personalPageAssets">
          <icon type="Tickets" size="14" @click="handleUseDetail" />
        </el-tooltip>
        <el-tooltip content="复制">
          <icon type="iconfont-copy" size="14" @click="handleCopy" />
        </el-tooltip>
        <el-tooltip content="删除">
          <icon type="iconfont-shanchu1" size="14" @click="handleDelete" />
        </el-tooltip>
      </div>
    </div>
  </grid-item>
</template>
<script setup lang="ts">
// import IconModal from "@/assets/icon/assets-icon-modal.png"
import { computed } from "vue";

import type { CheckboxValueType } from "element-plus";

import GridItem from "@/components/ScreenwrightList/components/grid/grid-item.vue";
import SwItemEmpty from "@/components/SwItemEmpty/index.vue";
import Icon from "@/components/Icon/index.vue";
import type { assetItem as assetItemProps } from "@/model/Assets";
import { setMinioUrl } from "@/utils/config";
import { FileTypeEnum, ResourceTypeEnum } from "@/views/build/components/buildTabs/assetsEditFrom/type";

import { getMaterialTypeIcon } from "../baseSetting";
import assetMenu from "./assetMenu.vue";

interface Props {
  item: assetItemProps;
  checkedItem: assetItemProps[];
  fileType: FileTypeEnum;
}
const props = defineProps<Props>();
const emits = defineEmits([
  "handleUseDetail",
  "handleCopy",
  "handleDelete",
  "handleCheckboxChange",
  "handlePreview",
  "handleEdit",
  "handleExport"
]);
const isShowImg = computed(() => {
  return [ResourceTypeEnum.image, ResourceTypeEnum.materialTexture].includes(props.item.resourceType);
});
const showEdit = computed(() => {
  return [FileTypeEnum.personalPageAssets, FileTypeEnum.personalSceneAssets].includes(props.fileType);
});
const showExport = computed(() => {
  return [FileTypeEnum.personalPageAssets, FileTypeEnum.personalSceneAssets].includes(props.fileType);
});

const handlePreview = () => {
  emits("handlePreview", props.item);
};
const getImageByType = computed(() => {
  if (!props.item.type && props.item.type !== 0) {
    return `${setMinioUrl(props.item.hdrPreviewImg)}`;
  }
  if (props.item.type === 1) {
    return `${setMinioUrl(props.item.url)}`;
  } else if (props.item.type === 0) {
    return `${setMinioUrl(props.item.img || "")}`;
  }
  return `${setMinioUrl(props.item.hdrPreviewImg)}`;
});
const isVideoOrWeb = (url: string) => {
  const lastType = url.split(".").pop();
  return lastType === "mp4" || lastType === "webm";
};
const handleEdit = () => {
  emits("handleEdit", props.item);
};
const handleExport = () => {
  emits("handleExport", props.item);
};
const getCheckbox = (item: assetItemProps) => {
  return props.checkedItem.some((i) => i.id === item.id);
};

const checkboxChange = (val: CheckboxValueType) => {
  emits("handleCheckboxChange", val, props.item);
};

const handleUseDetail = () => {
  emits("handleUseDetail", props.item);
};
const handleCopy = () => {
  emits("handleCopy", props.item);
};
const handleDelete = () => {
  emits("handleDelete", props.item);
};
// const getMaterialTypeIcon = (materialType, item) => {
//   // 针对城市数据单独处理
//   if ([6, 7].includes(this.activeGroup.pid)) {
//     return getMaterialCityTypeIcon(getCityFileType(item.url))
//   }
//   return getMaterialTypeIcon(materialType)
// }
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.asset-item {
  position: relative;
  height: 197px !important;
  border: 1px solid transparent;
  @include checkbox-style();

  .content_info_checkbox {
    position: absolute;
    top: -7px;
    left: 3px;
    z-index: 3;
  }
  .content_info {
    position: relative;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    height: calc(100% - 46px);
    img {
      width: 100%;
      height: 100%;
      object-fit: scale-down;
      transition: all 0.5s ease;
    }
    .materialType-icon {
      position: absolute;
      right: 10px;
      top: 10px;
      width: 30px;
      height: 30px;
      z-index: 5;
    }
  }
  .asset-menu {
    display: none;
  }
  &:hover {
    .content_info img {
      transform: scale(1.1);
    }
    .asset-menu {
      display: inline-flex;
    }
    border-color: #642cff;
  }
}
.content__main {
  font-size: 12px;
  width: 100%;
  height: 46px;
  display: flex;
  align-items: center;
  position: absolute;
  bottom: 0;
  justify-content: space-between;
  background: #1d262e;
  box-sizing: border-box;
  padding: 0 10px;
  color: #bcc9d4;
  .content__menulist {
    cursor: pointer;
    i {
      margin-right: 10px;
    }
  }
  .content__name {
    width: 150px !important;
    padding: 0 5px;
    line-height: 28px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    border: 1px solid transparent;
  }
}
</style>
