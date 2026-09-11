<template>
  <div class="layout-item">
    <configCustom title="回调参数" @onEvent="handleCustomEvent">
      <div class="content-pad-row" v-if="callbackOptions.length && currentCallback">
        <configTabsItem
          @tabs-change="updateCurrentCallback"
          :candraggable="false"
          :eventList="callbackOptions"
          :currentTab="activeTab"
        />
        <!--  TODO: 添加UE差异化处理
        <el-form-item label="处理方式" :label-width="60">
          <el-select
            v-model="currentCallback.method"
            placeholder="请选择"
            @change="update"
            popper-class="sw-select-dropdown"
          >
            <el-option v-for="item in ueMessageTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item> -->
        <el-form-item label="字段值" :label-width="60" v-if="currentCallback.value">
          <SearchInput
            v-model="currentCallback.value.origin.value"
            :queryData="originQueryData"
            @change="update"
            @select="update"
          />
        </el-form-item>
        <el-form-item label="变量名" :label-width="60" v-if="currentCallback.value">
          <SwInput :modelValue="currentCallback.value.target.value" @update:modelValue="handleTargetValueChange" />
        </el-form-item>
      </div>
      <div v-else style="padding: 0 0.2rem; font-size: 12px">{{ defaultMgs }}</div>
    </configCustom>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";

import SwInput from "@/components/SwInput/index.vue";
import SearchInput from "@/components/SwSearchInput/index.vue";
import ConfigCustom from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/components/configCustom.vue";
import configTabsItem from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/components/configTabsItem.vue";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";

import { useCallbackOption } from "./useCallbackOption";

const { selectTargetData } = useEditStore();

const {
  currentCallback,
  defaultMgs,
  activeTab,
  originQueryData,
  callbackOptions,
  addCallback,
  deleteCallback,
  updateCurrentCallback,
  syncActiveState,
  update,
  updateCallbackArgument,
  init,
  updateAllCallbackArguments
} = useCallbackOption();

watch(
  () => selectTargetData.value[0]?.cbArgs,
  (newCbArgs, oldCbArgs) => {
    if (!newCbArgs) {
      return;
    }
    // 当cbArgs改变时，同步激活项状态
    syncActiveState();
    updateAllCallbackArguments(oldCbArgs);
  }
);

/**
 * 处理变量名变更
 * @param {string} newValue - 新的变量名
 */
const handleTargetValueChange = (newValue: string) => {
  updateCallbackArgument(newValue);
};

/**
 * 处理自定义事件
 * @param {string} event - 事件类型
 */
const handleCustomEvent = (event: string) => {
  if (event === "add") {
    addCallback();
  } else if (event === "delete") {
    deleteCallback();
  }
};

onMounted(() => {
  init();
});
</script>

<style scoped lang="scss">
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
