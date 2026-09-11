<template>
  <div
    class="assets-select"
    v-loading="loading"
    element-loading-text="Loading..."
    element-loading-svg-view-box="-10, -10, 50, 50"
  >
    <el-tabs v-model="assetsSide" class="assetsType" @tab-change="handleTopSideClick">
      <el-tab-pane v-for="(item, index) in assetsSelectData" :key="item.key" :label="item.title" :name="item.title">
        <el-tabs class="assetsType-child" v-model="groupName" tab-position="left" @tab-change="handleChangeGroup">
          <el-tab-pane v-for="v in item.children" :key="v.groupId" :label="v.title" :name="v.title">
            <div class="menu-content">
              <div
                v-for="(subItem, subIndex) in v.children"
                :key="`${subIndex}-${subItem.url}`"
                class="menu-content-item"
                :index="`${index}-${subIndex}`"
                @click="chooseMaterial(subItem)"
              >
                <div :class="[item.title == '本应用资产' ? 'usehove-local' : 'usehove']">
                  <img
                    class="assets-icon"
                    :style="`top:${item.title == '本应用资产' ? '10px' : '25px'}`"
                    :src="getMaterialTypeIcon(subItem.isVideo ?? false)"
                  />
                  <div
                    v-if="item.title != '本应用资产'"
                    :class="`top-text ellipsis`"
                    :title="`${subItem.title}(${subItem.fileType})`"
                  >
                    {{ subItem.title }}({{ subItem.fileType }})
                  </div>
                  <div class="inside-img">
                    <video
                      ref="useInViewRef"
                      style="max-width: 100%; max-height: 100%"
                      v-if="subItem.type === 'video' && subItem.url"
                      :src="setMinioUrl(subItem.url)"
                      crossorigin="anonymous"
                    />
                    <img
                      ref="useInViewRef"
                      style="width: 100%; height: 100%; object-fit: scale-down"
                      v-if="subItem.type === 'img' && subItem.url"
                      :src="setMinioUrl(subItem.url)"
                    />
                  </div>
                </div>
              </div>
            </div>
            <Pagination
              :total="params.total"
              v-model:pageNum="params.current"
              v-model:pageSize="params.size"
              :page-sizes="[10, 20, 50, 100]"
              @pagination="handlePagination"
              layout="total, prev, pager, next,sizes"
              popper-class="sw-select-dropdown build-tabs-menu-ignore"
            />
          </el-tab-pane>
        </el-tabs>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script lang="ts" setup>
import { inject, ref } from "vue";

import IconPicture from "@/assets/icon/assets-icon-picture.png";
import IconVideo from "@/assets/icon/assets-icon-video.png";
import { dialogInjectionKey } from "@/components/Dialog/constant";
import type { PaginationEvent } from "@/components/Pagination/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import { setMinioUrl } from "@/utils/config";

import { useSelectAssets } from "./useSelectAssets";
const { confirm } = inject(dialogInjectionKey)!;

const { params, assetsSelectData, assetsSide, groupName, changAssetsSide, changeGroupId, getData, loading } =
  useSelectAssets();

const handlePagination = (e: PaginationEvent) => {
  params.value.current = e.page;
  params.value.size = e.pageSize;
  getData();
};

const getMaterialTypeIcon = (isVideo: boolean) => {
  return isVideo ? IconVideo : IconPicture;
};
// 外部切换
const handleTopSideClick = () => {
  changAssetsSide();
  getData();
};
// 类型切换
const handleChangeGroup = () => {
  changeGroupId();
  getData();
};
const confirmRes = ref<any>(null);
const chooseMaterial = (item: any) => {
  confirmRes.value = item;
  confirm();
};

const validate = () => {
  return confirmRes.value;
};

defineExpose({
  validate
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
.assets-select {
  height: 600px;
  background-color: transparent;
}
:deep(.el-loading-mask) {
  background-color: rgba(0, 0, 0, 0.1) !important;
}
@import "./index.scss";
</style>
