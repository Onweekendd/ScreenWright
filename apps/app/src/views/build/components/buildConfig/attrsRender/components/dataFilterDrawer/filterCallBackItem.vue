<template>
  <div class="filter-callback flex flex-align-center">
    <div class="callback-text">回调字段</div>
    <div class="callback-add flex flex-wrap flex-align-center">
      <div class="callback-item" v-for="item in callBackArr" :key="item + Math.random()">
        <span>{{ item }}</span>
        <Icon type="iconfont-guanbi" size="14" class="callback-icon" @click="deleteItem(item)" />
      </div>
      <div v-show="isShowEdit" ref="ftSearchInputContainerRef">
        <SwSearchInput
          ref="ftSearchInputRef"
          @select="onSelect"
          @keydown.enter="onEnter"
          @clear="onClear"
          v-model="editValue"
          :query-data="suggestionsData"
          class="callback-edit"
          placeholder="请输入回调字段"
          clearable
        />
      </div>
      <el-button type="text" class="callback-btn" @click="showEditInput" v-show="!isShowEdit">
        <Icon type="iconfont-jiahao" size="14" />
        <span>添加回调</span>
      </el-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { ComponentPublicInstance } from "vue";
import { computed, ref } from "vue";
import { nextTick } from "vue";
import { onClickOutside, useVModel } from "@vueuse/core";

import { uniq } from "lodash-es";

import SwSearchInput from "@/components/SwSearchInput/index.vue";
import Icon from "@/components/Icon/index.vue";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";

const ftSearchInputRef = ref<ComponentPublicInstance<InstanceType<typeof SwSearchInput>>>();
const ftSearchInputContainerRef = ref<HTMLElement>();
interface Props {
  modelValue: string[];
}
const editValue = ref("");
const isShowEdit = ref(false);
const emit = defineEmits<{
  "update:modelValue": [value: string[]];
}>();
const props = defineProps<Props>();
const callBackArr = useVModel(props, "modelValue", emit);
const { callbackArgumentsManager } = useCallbackArguments();
onClickOutside(ftSearchInputContainerRef, () => {
  isShowEdit.value = false;
  editValue.value = "";
});

// 搜索建议数据
const suggestionsData = computed(() => {
  const keys = Object.keys(callbackArgumentsManager.value);
  // 过滤掉已经在callBackArr中存在的数据，防止重复选择
  const filteredKeys = keys.filter((key) => !callBackArr.value.includes(key));
  // 使用lodash的uniq方法进行去重，并格式化为SwSearchInput所需的格式
  return uniq(filteredKeys).map((key) => ({
    value: key
  }));
});

const showEditInput = async () => {
  isShowEdit.value = true;
  await nextTick();

  ftSearchInputRef.value?.focus();
};
// 提炼的公共函数：添加回调字段
const addCallbackItem = (value?: string) => {
  if (value !== undefined) {
    editValue.value = value;
  }

  if (editValue.value.length > 0) {
    callBackArr.value = [...callBackArr.value, editValue.value];
    isShowEdit.value = false;
  }
};

const onSelect = ({ value }: { value: string }) => {
  addCallbackItem(value);

  // 重置状态
  isShowEdit.value = false;
  editValue.value = "";
};

const onClear = () => {
  editValue.value = "";
};

const onEnter = () => {
  addCallbackItem();

  // 重置状态
  isShowEdit.value = false;
  editValue.value = "";
};
const deleteItem = (item: string) => {
  callBackArr.value = callBackArr.value.filter((v) => v !== item);
};
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include common-element-style(".el-input__wrapper");

:deep(.el-input__inner) {
  width: 100px !important;
}

.callback-text {
  white-space: nowrap;
  margin-right: 8px;
}
.callback-item {
  box-sizing: border-box;
  min-width: 40px;
  height: 22px;
  background: #383c47;
  border-radius: 2px;
  padding: 0 4px;
  margin: 0 0 0px 8px;
  cursor: pointer;
  line-height: 22px;
}
.callback-btn {
  width: 77px;
  margin-left: 8px;
  font-size: 12px;
  height: 22px;
  padding: 0;
  color: var(--sw-theme-color) !important;
  border: 1px solid var(--sw-theme-color) !important;
}
.callback-icon {
  margin-left: 7px;
  top: 1px;
}
.callback-edit {
  margin-left: 7px;
  --el-component-size: 20px;
  width: 77px;
  :deep(.el-autocomplete) {
    width: 100%;
  }
}
</style>
