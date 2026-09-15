<template>
  <sw-collapse-item title="超链设置" v-model="selectTargetData[0].option.link" @change="update" showIcon>
    <template #content>
      <el-form-item label="超链地址" :label-width="secondWidth">
        <sw-input v-model="selectTargetData[0].option.linkHref" @change="update" />
      </el-form-item>
      <el-form-item label="打开方式" :label-width="secondWidth">
        <el-select
          v-model="selectTargetData[0].option.linkTarget"
          popper-class="sw-select-dropdown"
          @change="update"
        >
          <el-option v-for="item in linkTarget" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </template>
  </sw-collapse-item>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";

import { useUpdateInstance } from "../../../../useUpdateInstance";
import { linkTarget } from "./option";

const { update, selectTargetData } = useUpdateInstance();
const secondWidth = 73;
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

</style>
