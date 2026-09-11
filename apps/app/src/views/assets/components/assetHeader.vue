<template>
  <div class="asset-header flex flex-align-center flex-justify-between">
    <div class="asset-header-left flex flex-align-center">
      <div class="asset-header-text">全部资产</div>
      <span class="num">{{ total }}个</span>
      <template v-if="[FileTypeEnum.personalPageAssets, FileTypeEnum.personalSceneAssets].includes(fileType)">
        <el-checkbox v-model="isCheck" @change="checkAll" />
        <el-button round class="deleteBatchBtn" :disabled="disabled" @click="handleDelete">批量删除</el-button>
      </template>
    </div>
    <div class="asset-header-right flex">
      <el-checkbox-group @change="handleSearch" v-model="params.resourceType">
        <el-checkbox v-if="showIcon" label="只显示图标" value="1" :disabled="getDisabledStatus('1')" />
        <el-checkbox v-if="showVideo" label="只显示视频" value="2" :disabled="getDisabledStatus('2')" />
        <el-checkbox v-if="showModel" label="只显示模型" value="0" :disabled="getDisabledStatus('0')" />
        <el-checkbox v-if="showMaterial" label="只显示材质贴图" value="3" :disabled="getDisabledStatus('3')" />
      </el-checkbox-group>
      <el-input :suffix-icon="Search" v-model="params.name" placeholder="请输入内容" @change="handleSearch" clearable />
      <div class="sort-list flex flex-align-center">
        <el-dropdown popper-class="sw-popper">
          <span class="el-dropdown-link">
            {{ optionsName }}
            <el-icon class="el-icon--right">
              <arrow-down />
            </el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleTimeSearch(item)" v-for="item in sortTypeOptions" :key="item.value">
                {{ item.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, watch } from "vue";

import { ArrowDown, Search } from "@element-plus/icons-vue";
import type { CheckboxValueType } from "element-plus";

import { FileTypeEnum } from "@/views/build/components/buildTabs/assetsEditFrom/type";

import { useAsset } from "../useAsset";

interface Props {
  disabled: boolean;
  showIcon: boolean;
  showModel: boolean;
  showMaterial: boolean;
  showVideo: boolean;
  fileType: FileTypeEnum;
}
const props = defineProps<Props>();
const emits = defineEmits(["handleBatchDelete", "handleSelectAll"]);
const isCheck = ref(false);
const { total, params, sortTypeOptions, optionsName, handleSearch, getAssetsListData } = useAsset();
watch(
  () => props.disabled,
  async (nVal) => {
    if (nVal) {
      if (nVal) {
        isCheck.value = false;
      }
    }
  },
  {
    immediate: true
  }
);
const handleDelete = () => {
  emits("handleBatchDelete", isCheck.value);
};
const checkAll = (val: CheckboxValueType) => {
  if (typeof val === "boolean") {
    emits("handleSelectAll", val);
  }
};

const handleTimeSearch = (item: { label: string; value: number }) => {
  params.value.time = item.value;
  getAssetsListData();
};
const getDisabledStatus = (resourceType: string) => {
  if (params.value.resourceType.length === 0) {
    return false;
  }
  return !params.value.resourceType.includes(resourceType);
};
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.asset-header-left {
  font-family:
    Source Han Sans CN-Bold,
    Source Han Sans CN;
  font-weight: bold;
  color: #bfbfbf;
  font-size: 18px;
  @include checkbox-style();
  .num {
    margin: 0 8px;
  }
  .el-button {
    margin: 0 0.1rem;
    color: #fff;
    height: 26px;
    border: none;

    &.deleteBatchBtn {
      background: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
    }
    &.is-disabled {
      background: #3d404c;
    }
  }
}
.asset-header-right {
  @include checkbox-style();
  @include common-element-style(".el-input__wrapper");
  .el-checkbox-group {
    display: flex;
  }
  .el-checkbox {
    margin-right: 36px;
    &:last-child {
      margin-right: 0;
    }
  }
  .el-input {
    width: 228px;
    margin-left: 20px;
  }
}
.sort-list {
  margin-left: 21px;
  cursor: pointer;
  color: #b4b7c1;
  font-family:
    Source Han Sans CN-Normal,
    Source Han Sans CN;
  font-weight: 400;
  :deep(.el-dropdown) {
    color: #b4b7c1;
  }
}
</style>
