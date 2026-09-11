<template>
  <div class="material-library-container">
    <div v-loading="loading" class="image-grid" :class="`grid-${params.pageSize}`">
      <material-library-item
        v-for="(image, index) in imageList"
        :key="index"
        :image-url="getImageUrl(image.url)"
        :title="image.name"
        :is-selected="isImageSelected(image)"
        :is-used="isImageUsed(image)"
        @select="toggleImageSelection(image)"
      />
    </div>
  </div>
  <div class="pagination-container">
    <Pagination
      :total="params.total"
      v-model:pageNum="params.currentPage"
      v-model:pageSize="params.pageSize"
      @pagination="handlePagination"
      layout="total, prev, pager, next"
      popper-class="sw-select-dropdown build-tabs-menu-ignore"
    />
  </div>

  <span class="dialog-footer">
    <el-button class="cancel-btn" @click="cancel">取 消</el-button>
    <el-button class="confirm-btn" type="primary" @click="handleConfirm">确 定</el-button>
  </span>
</template>
<script setup lang="ts">
import { inject, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import { ElMessage } from "element-plus";

import { minioPage } from "../api";
import { dialogInjectionKey } from "@screenwright/ui";
import type { PaginationEvent } from "@screenwright/ui";
import { Pagination } from "@screenwright/ui";
import { setMinioUrl } from "@screenwright/composables";

import MaterialLibraryItem from "./MaterialLibraryItem.vue";

const { confirm, cancel } = inject(dialogInjectionKey)!;
const route = useRoute();
// import { useUpdateInstance } from "../../useUpdateInstance"
const loading = ref(false);
interface Props {
  selectedImages: Array<any>;
  componentImages: Array<any>;
}
const props = withDefaults(defineProps<Props>(), {
  selectedImages: () => [],
  componentImages: () => []
});
const imageList = ref<any[]>([]);
const selectedList = ref<any[]>([]);
const params = ref({
  currentPage: 1,
  pageSize: 9,
  total: 0
});
const handlePagination = (e: PaginationEvent) => {
  params.value.currentPage = e.page;
  params.value.pageSize = e.pageSize;
  fetchImages();
};
const handleConfirm = () => {
  confirm();
};
const getImageUrl = (url: string) => {
  return url ? setMinioUrl(url) : "";
};
const isImageUsed = (image: any) => {
  return props.componentImages.some((item) => item.src === image.url);
};
const isImageSelected = (image: any) => {
  return selectedList.value.some((item) => item.url === image.url);
};
const toggleImageSelection = (image: any) => {
  if (isImageUsed(image)) {
    ElMessage.warning("该图片已在使用中");
    return;
  }

  const index = selectedList.value.findIndex((item) => item.url === image.url);
  if (index > -1) {
    selectedList.value.splice(index, 1);
  } else {
    selectedList.value.push(image);
  }
};
const fetchImages = async () => {
  try {
    loading.value = true;
    const paramsData = {
      size: params.value.pageSize,
      current: params.value.currentPage,
      fileType: "1",
      groupId: "",
      time: 1,
      name: "",
      resourceType: "",
      largeId: Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
    };
    const response = await minioPage(paramsData);
    if (response.success) {
      const dataList = response.result.records || [];
      params.value.total = response.result.total || 0;
      imageList.value = dataList;
    } else {
      throw new Error(response.message || "获取素材库数据失败");
    }
    console.log(response, "response");
  } catch (error) {
    ElMessage.error("获取素材库数据失败，请重试");
    console.error("Error fetching images:", error);
  } finally {
    loading.value = false;
  }
};
const validate = () => {
  return selectedList.value;
};

defineExpose({
  validate
});
onMounted(() => {
  selectedList.value = [...props.selectedImages];
  fetchImages();
});
</script>
<style lang="scss" scoped>
.material-library-container {
  overflow-y: auto;
  overflow-x: hidden;
  background-color: #232630;
  color: #fff;
  height: 553px;
  .image-grid {
    display: grid;
    gap: 12px;
    margin-bottom: 16px;
    padding-top: 2px;

    &.grid-9 {
      grid-template-columns: repeat(3, 1fr);
    }

    &.grid-20 {
      grid-template-columns: repeat(4, 1fr);
    }

    &.grid-50 {
      grid-template-columns: repeat(5, 1fr);
    }

    &.grid-99 {
      grid-template-columns: repeat(9, 1fr);
    }
  }
}
.pagination-container {
  margin: 12px 0;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  .el-button {
    width: 88px;
    height: 32px;
    border-radius: 4px;
    font-size: 14px;
    padding: 0;
    border: none;

    &.cancel-btn {
      background: transparent;
      color: #8b58e7;
      border: 1px solid rgba(139, 88, 231, 0.5);

      &:hover {
        background: rgba(139, 88, 231, 0.1);
        border-color: #8b58e7;
      }
    }

    &.confirm-btn {
      background: #8b58e7;
      color: #fff;
      margin-left: 12px;

      &:hover {
        background: lighten(#8b58e7, 10%);
      }
    }
  }
}
</style>
