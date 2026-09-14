<template>
  <div class="image-preview-container">
    <draggable
      :model-value="currentPageImages"
      class="image-grid grid-8"
      :class="`grid-${params.pageSize}`"
      item-key="id"
      @end="handleEnd"
      :disabled="!isDraggable"
    >
      <template #item="{ element, index }">
        <div class="flex">
          <div class="upload-panel" v-if="index === 0" :class="{ 'no-drag': index === 0 }">
            <div class="upload-option" @click="openUploadDialog">
              <Icon type="Plus" />
              <span style="font-size: 12px">上传图片</span>
            </div>
            <div class="upload-option" @click="openMaterialLibrary">
              <Icon type="Picture" />
              <span style="font-size: 12px">素材库</span>
            </div>
          </div>
          <ImagePreviewItem
            v-else
            :key="index"
            :imageUrl="getImageUrl(element.src)"
            :title="element.title"
            :index="index"
            @delete="handleDelete"
          />
        </div>
      </template>
    </draggable>

    <!-- <div class="upload-panel">
        <div class="upload-option" @click="openUploadDialog">
          <Icon type="Plus" />
          <span style="font-size: 12px">上传图片</span>
        </div>
        <div class="upload-option" @click="openMaterialLibrary">
          <Icon type="Picture" />
          <span style="font-size: 12px">素材库</span>
        </div>
      </div>
      <ImagePreviewItem
        v-for="(item, index) in currentPageImages"
        :key="index"
        :imageUrl="getImageUrl(item.src)"
        :title="item.title"
        :index="index"
        @delete="handleDelete"
      /> -->
  </div>
  <div class="pagination-wrapper" style="padding-top: 6px">
    <Pagination
      :total="params.total"
      v-model:pageNum="params.currentPage"
      v-model:pageSize="params.pageSize"
      :page-sizes="[8, 20, 50, 98]"
      @pagination="handlePagination"
      layout="total, prev, pager, next,sizes"
      popper-class="sw-select-dropdown build-tabs-menu-ignore"
    />
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import draggable from "vuedraggable";

import Icon from "@editor/base/Icon/index.vue";
import type { PaginationEvent } from "@screenwright/ui";
import { Pagination } from "@screenwright/ui";
import { useDialog } from "@screenwright/ui";
import { setMinioUrl } from "@screenwright/composables";

import type { ImageItem, MaterialLibraryImage, UploadResponse } from "../types";
import ImagePreviewItem from "./ImagePreviewItem.vue";
import ImageUploadDialog from "./ImageUploadDialog.vue";
import MaterialLibraryDialog from "./MaterialLibraryDialog.vue";

const { dialog } = useDialog();

interface Props {
  data: ImageItem[];
  isDraggable?: boolean;
  pageSize?: number;
  onDragEnd?: (data: ImageItem[]) => void;
  onChange: (data: ImageItem[]) => void;
}
const props = withDefaults(defineProps<Props>(), {
  pageSize: 8,
  isDraggable: false
});

const imageList = ref<ImageItem[]>([]);
const params = ref({
  currentPage: 1,
  pageSize: props.pageSize,
  total: props.data.length
});

const handleEnd = (data: any) => {
  console.log("Drag ended", data);
  const oldIndex = data.oldIndex;
  const newIndex = data.newIndex;
  if (oldIndex === 0 || newIndex === 0 || oldIndex === newIndex) {
    return;
  }
  const oldValue = imageList.value[oldIndex];
  const newValue = imageList.value[newIndex];
  imageList.value[newIndex] = oldValue;
  imageList.value[oldIndex] = newValue;
  if (props.onDragEnd) {
    props.onDragEnd(imageList.value);
  }
  console.log(imageList.value, "  imageList.value");
};
const getImageUrl = (src: string) => {
  return src ? setMinioUrl(src) : "";
};
const currentPageImages = computed(() => {
  const start = (params.value.currentPage - 1) * params.value.pageSize;
  const end = start + params.value.pageSize;
  return imageList.value.slice(start, end);
});
const handleDelete = (index: number) => {
  const realIndex = (params.value.currentPage - 1) * params.value.pageSize + index;
  imageList.value.splice(realIndex, 1);
  // 如果当前页没有数据了，且不是第一页，则跳转到上一页
  if (currentPageImages.value.length === 0 && params.value.currentPage > 1) {
    params.value.currentPage--;
  }
  params.value.total = imageList.value.length;
  // 通过onChange抛出删除后的数据
  props.onChange(imageList.value);
};
const openUploadDialog = () => {
  // Open upload dialog
  console.log("Open upload dialog");
  dialog({
    DialogProps: {
      title: "上传图片",
      width: "600",
      modalClass: "build-render-ignore"
      //   .build-render-ignore
    },
    componentProps: {},
    component: ImageUploadDialog,
    closeBefore: async (componentData, done) => {
      const res: UploadResponse[] = await componentData.validate();
      console.log("res", res[0]);
      const newImages: ImageItem[] = [];
      for (let i = 0; i < res.length; i++) {
        const newImage: ImageItem = {
          src: res[i].src,
          title: res[i].title,
          id: res[i].id
        };
        imageList.value.push(newImage);
        newImages.push(newImage);
      }
      params.value.total = imageList.value.length;
      params.value.currentPage = 1;

      // 通过onChange抛出上传后的数据
      props.onChange(imageList.value);
      done();
    }
  });
};
const openMaterialLibrary = () => {
  // Open material library
  console.log("Open material library");
  dialog({
    DialogProps: {
      title: "素材库",
      width: "800",
      modalClass: "build-render-ignore"
    },
    componentProps: {
      selectedImages: imageList.value,
      componentImages: imageList.value
    },
    component: MaterialLibraryDialog,
    closeBefore: async (componentData, done) => {
      const res: MaterialLibraryImage[] = await componentData.validate();
      const newImages: ImageItem[] = res
        .filter((image: MaterialLibraryImage) => image.url)
        .map(
          (image: MaterialLibraryImage): ImageItem => ({
            src: image.url,
            title: image.name
          })
        );
      // 简化过滤逻辑
      const uniqueImages = newImages.filter(
        (newImg: ImageItem) => !imageList.value.some((existingImg: ImageItem) => existingImg.src === newImg.src)
      );

      imageList.value.push(...uniqueImages);
      params.value.total = imageList.value.length;

      // 通过onChange抛出素材库选择后的数据
      props.onChange(imageList.value);
      done();
    }
  });
};
const handlePagination = (e: PaginationEvent) => {
  params.value.currentPage = e.page;
  params.value.pageSize = e.pageSize;
};
onMounted(() => {
  // 为了处理上传按钮
  imageList.value = [{ src: "", title: "", id: 0 }, ...props.data];
});
</script>
<style lang="scss" scoped>
.image-preview-container {
  height: 580px;
  background-color: var(--sw-panel-bg);
  color: #fff;
  overflow-y: auto;
  overflow-x: hidden;
  .image-grid {
    display: grid;
    gap: 12px;
    margin-bottom: 16px;
    grid-template-columns: repeat(3, 1fr);
    &.grid-8 {
      grid-template-columns: repeat(3, 1fr);

      @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }

    &.grid-20 {
      grid-template-columns: repeat(4, 1fr);

      @media (max-width: 992px) {
        grid-template-columns: repeat(3, 1fr);
      }

      @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }

    &.grid-50 {
      grid-template-columns: repeat(5, 1fr);

      @media (max-width: 1200px) {
        grid-template-columns: repeat(4, 1fr);
      }

      @media (max-width: 992px) {
        grid-template-columns: repeat(3, 1fr);
      }

      @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }

    &.grid-98 {
      grid-template-columns: repeat(7, 1fr);

      @media (max-width: 1400px) {
        grid-template-columns: repeat(5, 1fr);
      }

      @media (max-width: 1200px) {
        grid-template-columns: repeat(4, 1fr);
      }

      @media (max-width: 992px) {
        grid-template-columns: repeat(3, 1fr);
      }

      @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }
  }
  .upload-option {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;

    &:first-child::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 10%;
      width: 80%;
      height: 1px;
      background: color-mix(in srgb, var(--sw-theme-color) 30%, transparent);
    }

    &:hover {
      background-color: color-mix(in srgb, var(--sw-theme-color) 20%, transparent);

      i,
      span {
        color: #fff;
      }
    }

    i {
      font-size: 24px;
      color: var(--sw-theme-color);
      margin-bottom: 4px;
      transition: color 0.3s;
    }

    span {
      color: var(--sw-theme-color);
      font-size: 14px;
      transition: color 0.3s;
    }
  }
  .upload-panel {
    width: 100%;
    aspect-ratio: 1;
    border: 1px dashed color-mix(in srgb, var(--sw-theme-color) 50%, transparent);
    border-radius: 4px;
    display: grid;
    grid-template-rows: 1fr 1fr;
    background-color: color-mix(in srgb, var(--sw-theme-color) 10%, transparent);
    overflow: hidden;
    -webkit-transition: all 0.3s ease;
    transition: all 0.3s ease;
  }
}
</style>
