<template>
  <sw-collapse-item title="超链设置" v-model="hasHref" @change="update" showIcon>
    <template #content>
      <el-form-item label="超链地址" :label-width="secondWidth">
        <sw-input v-model="hrefValue" @change="update" />
      </el-form-item>
      <el-form-item label="打开方式" :label-width="secondWidth">
        <el-select v-model="targetValue" popper-class="sw-select-dropdown" @change="update">
          <el-option v-for="item in linkTarget" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </template>
  </sw-collapse-item>
</template>
<script setup lang="ts">
import { computed } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";

import { useUpdateInstance } from "../../../../useUpdateInstance";
import { linkTarget } from "./option";

const { update, selectTargetData } = useUpdateInstance();
const secondWidth = 73;

// 超链接由 option.href 是否存在驱动，折叠面板开关等价于新增/删除该字段
const hasHref = computed<boolean>({
  get: () => Boolean(selectTargetData.value[0].option.href),
  set: (value) => {
    if (value) {
      selectTargetData.value[0].option.href = selectTargetData.value[0].option.href ?? "";
    } else {
      delete selectTargetData.value[0].option.href;
      delete selectTargetData.value[0].option.target;
    }
  }
});

const hrefValue = computed<string>({
  get: () => selectTargetData.value[0].option.href ?? "",
  set: (value) => {
    selectTargetData.value[0].option.href = value;
  }
});

const targetValue = computed<string>({
  get: () => selectTargetData.value[0].option.target ?? "_self",
  set: (value) => {
    selectTargetData.value[0].option.target = value;
  }
});
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

</style>
