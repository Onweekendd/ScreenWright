<!-- 相机设置 -->
<template>
  <SwCollapseItem open title="相机设置">
    <template #content>
      <el-form-item :label-width="labelWidth" label="相机类型">
        <el-select
          style="width: 100%"
          popper-class="sw-select-dropdown"
          v-model="selectTargetData[0].option.projection"
          placeholder="Select"
          @change="update"
        >
          <el-option v-for="item in projection" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item :label-width="labelWidth" label="移动">
        <div class="flex flex-justify-between" style="width: 100%">
          <SwInputNumber
            width="60"
            @change="update"
            v-model="selectTargetData[0].option.viewControlX"
            controls
            bottomLabel="x"
          />
          <SwInputNumber
            width="60"
            @change="update"
            v-model="selectTargetData[0].option.viewControlY"
            controls
            bottomLabel="y"
          />
          <SwInputNumber
            width="60"
            @change="update"
            v-model="selectTargetData[0].option.viewControlZ"
            controls
            bottomLabel="z"
          />
        </div>
      </el-form-item>
      <SwCollapseItem open title="旋转">
        <template #content>
          <el-form-item label="绕X轴" :label-width="43">
            <SwSlider v-model="selectTargetData[0].option.alpha" @change="update" />
          </el-form-item>
          <el-form-item label="绕Y轴" :label-width="43">
            <SwSlider v-model="selectTargetData[0].option.beta" @change="update" />
          </el-form-item>
        </template>
      </SwCollapseItem>
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSlider } from "@screenwright/ui/slider";

import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
const labelWidth = ref("73");
const projection = ref([
  { label: "透视投影", value: "perspective" },
  { label: "正交投影", value: "orthographic" }
]);
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
:deep(.el-select__wrapper) {
  min-height: 28px;
}
</style>
