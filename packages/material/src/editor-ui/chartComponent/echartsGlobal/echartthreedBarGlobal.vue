<template>
  <div class="echart-threed-bar-global">
    <!-- 边距组件配置 -->
    <ItemConfigDistance />
    <!-- 柱状样式配置 -->

    <!-- <ItemthreeDBarColor title="柱状样式" /> -->
    <div class="item-three-d-bar-color">
      <sw-collapse-item title="柱状样式" open>
        <template #content>
          <el-form-item label="柱体宽度" label-width="73">
            <sw-slider v-model="selectTargetData[0].option.seriesWidth" :max="40" :min="1" @change="update" />
          </el-form-item>
          <el-form-item label="柱体颜色" label-width="73">
            <sw-color-picker
              :options="{ colorTypeOption: 'linear-gradient,single' }"
              v-model:color="selectTargetData[0].option.seriesColor[0]"
              v-model:opacity="selectTargetData[0].option.seriesOpacity"
              field="seriesColor"
              @change="update"
              inputDisabled
            />
          </el-form-item>
          <el-form-item label="头部颜色" label-width="73">
            <sw-single-color-picker
              v-model="selectTargetData[0].option.seriesTopColor"
              field="seriesTopColor"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="底部颜色" label-width="73">
            <sw-single-color-picker
              v-model="selectTargetData[0].option.seriesBottomColor"
              field="seriesBottomColor"
              @change="update"
            />
          </el-form-item>
        </template>
      </sw-collapse-item>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";

import { useUpdateInstance } from "../../useUpdateInstance";
import ItemConfigDistance from "../ItemComponent/ItemConfigDistance/index.vue";

const { selectTargetData, update } = useUpdateInstance();
</script>
