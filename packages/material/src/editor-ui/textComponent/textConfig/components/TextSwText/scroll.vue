<template>
  <sw-collapse-item title="跑马灯设置" v-model="hasMarquee" @change="update" showIcon>
    <template #content>
      <el-form-item label="滚动速度" :label-width="73">
        <sw-input-number v-model="marqueeSpeed" @change="update" />
      </el-form-item>
    </template>
  </sw-collapse-item>
</template>
<script setup lang="ts">
import { computed } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";

import { useUpdateInstance } from "../../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();

// 跑马灯由 option.marquee 是否存在驱动，折叠面板开关等价于新增/删除该字段
const hasMarquee = computed<boolean>({
  get: () => Boolean(selectTargetData.value[0].option.marquee),
  set: (value) => {
    if (value) {
      selectTargetData.value[0].option.marquee = {
        speed: selectTargetData.value[0].option.marquee?.speed ?? 100
      };
    } else {
      delete selectTargetData.value[0].option.marquee;
    }
  }
});

const marqueeSpeed = computed<number>({
  get: () => selectTargetData.value[0].option.marquee?.speed ?? 100,
  set: (value) => {
    if (!selectTargetData.value[0].option.marquee) {
      selectTargetData.value[0].option.marquee = { speed: value };
    } else {
      selectTargetData.value[0].option.marquee.speed = value;
    }
  }
});
</script>
