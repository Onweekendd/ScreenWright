<template>
  <div>
    <el-drawer
      class="sw-drawer"
      v-model="projectFilterShow"
      title="全局过滤器管理"
      size="420px"
      :direction="direction"
      :before-close="handleClose"
    >
      <div class="sw-drawer__toolbar">
        <el-input :suffix-icon="Search" clearable v-model="params.search" placeholder="搜索过滤器" />
      </div>

      <div class="sw-drawer__scroll" v-if="filterDataList.length">
        <filterBox
          :modelValue="filterDataList"
          :needCheckBox="false"
          :needTest="false"
          @handleFilterDelete="handleFilterDelete"
          @handleClickShow="handleClickShow"
          @handleClickSave="handleClickSave"
          @handleCancel="handleCancel"
        />
      </div>
      <div class="sw-drawer__empty" v-else>
        <sw-empty size="80" :imgStyle="{ width: '80px', height: '80px' }" :desc="'暂无过滤器'" fontSize="14" />
      </div>

      <div class="sw-drawer__footer" v-if="params.total > 0">
        <Pagination v-model:pageNum="params.pageNumber" v-model:pageSize="params.pageSize" :total="params.total" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { Search } from "@element-plus/icons-vue";
import type { DrawerProps } from "element-plus";
// import { useDataConfig } from "../attrsRender/useDataConfig"
import { isUndefined } from "lodash-es";

import Pagination from "@/components/Pagination/index.vue";
import SwEmpty from "@/components/SwEmpty/index.vue";
import { handleMessageBox } from "@/utils/utils";
import type { Filter } from "@/views/build/components/buildRender/type";
import { useNavAction } from "@/views/build/useNavAction";

import filterBox from "../attrsRender/components/dataFilterDrawer/filterBox.vue";
import { useProjectFilter } from "./useProjectFilter";

const direction = ref<DrawerProps["direction"]>("rtl");
const { projectFilterShow } = useNavAction();
const { cloneDataFilterOnInit, filterDataList, params, handleSave, handleDelete, resetParams, resetFilterToCloneData } =
  useProjectFilter();

const handleClose = () => {
  projectFilterShow.value = false;
};

const handleFilterDelete = async (item: Filter) => {
  const isCanDelete = await handleMessageBox("是否删除所选过滤器?", {
    confirmButtonText: "确定",
    cancelButtonText: "取消"
  });
  if (!isCanDelete) {
    return;
  }

  await handleDelete(item.name);
  resetParams();
};
// 控制收缩显影
const handleClickShow = (item: Filter) => {
  if (isUndefined(item.show)) {
    item.show = false;
  }
  item.show = !item.show;
};

// 保存
const handleClickSave = async (item: Filter) => {
  handleClickShow(item);
  cloneDataFilterOnInit();
  await handleSave(item);
  resetParams();
};

// 取消
const handleCancel = async (item: Filter) => {
  handleClickShow(item);
  resetFilterToCloneData(item);

  await handleSave(item);
  resetParams();
};
</script>

<style lang="scss" scoped>
.sw-drawer__scroll {
  padding: 12px 14px 4px;
}
</style>
