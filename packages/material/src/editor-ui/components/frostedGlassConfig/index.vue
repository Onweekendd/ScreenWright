<template>
  <el-form-item label="启用" :label-width="firstLabelWidth">
    <template #label>
      <span
        >启用
        <el-tooltip class="item" effect="dark" placement="right">
          <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
          <template #content>
            <p>开启毛玻璃效果，背后的元素会被模糊处理</p>
          </template>
        </el-tooltip>
      </span>
    </template>
    <el-checkbox v-model="selectTargetData[0].option.backdropFilter" @change="update" />
  </el-form-item>
  <el-form-item label="高斯模糊半径" :label-width="firstLabelWidth">
    <sw-input-number
      v-model="selectTargetData[0].option.backdropFilterBlur"
      unit="px"
      :controls="false"
      @change="update"
    />
  </el-form-item>
  <el-form-item label="饱和度" :label-width="firstLabelWidth">
    <sw-slider
      v-model="selectTargetData[0].option.backdropFilterSaturate"
      :min="100"
      :max="300"
      :step="10"
      unit="%"
      @change="update"
    />
  </el-form-item>
</template>
<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSlider } from "@screenwright/ui/slider";
import Icon from "@editor/base/Icon/index.vue";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
</script>
