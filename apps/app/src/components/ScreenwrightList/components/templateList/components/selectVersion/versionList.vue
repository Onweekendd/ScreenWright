<template>
  <div class="version-list">
    <div class="version-list-header">
      <span>版本</span>
      <span>描述</span>
      <span>最后编辑时间</span>
    </div>
    <div class="version-list-content">
      <el-scrollbar style="height: 100%">
        <div
          class="list-item"
          v-for="(item, i) in listData"
          :key="i"
          :class="{ 'is-select': selectVersionCode === item.versionCode }"
          @click="handleSelect(item)"
        >
          <span>
            <i class="iconfont iconfont-fabu1" v-if="item.status" />
            V{{ item.versionCode }}
          </span>
          <span>{{ item.versionDesc || "--" }}</span>
          <span>{{ setDate(item.updatedTime) }}</span>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

import type { ScreenVersion } from "@/model/Version";

interface Props {
  listData: ScreenVersion[];
  modelValue: string;
}

const props = defineProps<Props>();
const selectVersionCode = ref("");
const setDate = (date: string | null | undefined) => {
  return date ? date.replace("T", " ").slice(0, 19) : date;
};
const emits = defineEmits(["update:modelValue"]);

const handleSelect = (item: ScreenVersion) => {
  selectVersionCode.value = item.versionCode;
  emits("update:modelValue", selectVersionCode.value);
};

watch(
  () => props.modelValue,
  (nVal) => {
    selectVersionCode.value = nVal;
  }
);
onMounted(() => {
  selectVersionCode.value = props.modelValue;
});
</script>
<style lang="scss" scoped>
.version-list {
  border: 1px solid #3e4049;
  height: 330px;
  overflow: hidden;
  .version-list-content {
    height: 300px;
  }
  .version-list-header {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #bfbfbf;
    border-bottom: 1px solid #3e4049;
    padding: 3px 0;

    span {
      padding: 5px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    span:nth-child(1) {
      width: 80px;
      border-right: 1px solid #3e4049;
    }
    span:nth-child(2) {
      width: calc(100% - 240px);
      border-right: 1px solid #3e4049;
    }
    span:nth-child(3) {
      width: 160px;
    }
  }
  .list-item {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #bfbfbf;
    border-bottom: 1px solid #3e4049;
    cursor: pointer;
    padding: 3px 0;
    &.is-select {
      background: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
      color: #ffffff;
    }
    span {
      padding: 5px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    span:nth-child(1) {
      width: 80px;
      border-right: 1px solid #3e4049;
    }
    span:nth-child(2) {
      width: calc(100% - 240px);
      border-right: 1px solid #3e4049;
    }
    span:nth-child(3) {
      width: 160px;
    }
  }
}
</style>
