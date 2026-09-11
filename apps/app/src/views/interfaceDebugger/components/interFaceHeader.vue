<template>
  <div class="inter-face-header flex flex-justify-between flex-align-center">
    <div class="total-list">
      <span>接口调试器/</span>
      <span>全部调试器</span>
    </div>
    <div class="header-search flex">
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
              <el-dropdown-item @click="handleItemClick(item)" v-for="item in sortTypeOptions" :key="item.value">
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
import { computed, ref } from "vue";

import { ArrowDown, Search } from "@element-plus/icons-vue";

import { useParams } from "../useParams";

const emits = defineEmits(["search"]);
const { params } = useParams();
const sortTypeOptions = ref([
  { label: "更新时间", value: 1 },
  { label: "创建时间", value: 2 }
]);
const optionsName = computed(() => {
  return sortTypeOptions.value.find((item) => item.value === params.value.time)?.label;
});
const handleSearch = () => {
  emits("search", params.value);
};
const handleItemClick = (item: { label: string; value: number }) => {
  params.value.time = item.value;
  emits("search", params.value);
};
</script>
<style scoped lang="scss">
@import "src/style/mixins/element.scss";
.inter-face-header {
  padding: 20px 20px 0 6px;
  font-family:
    Source Han Sans CN-Bold,
    Source Han Sans CN;
  font-weight: bold;
  color: #bfbfbf;
  font-size: 18px;
  @include common-element-style(".el-input__wrapper");
  :deep(.el-input) {
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
