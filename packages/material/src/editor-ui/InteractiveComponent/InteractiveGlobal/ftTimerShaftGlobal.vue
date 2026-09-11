<template>
  <div class="ft-timer-shaft-global">
    <el-form-item label="默认选中" :label-width="firstLabelWidth">
      <template #label>
        <span>默认选中</span>
        <el-tooltip class="item" effect="dark" placement="right">
          <Icon type="QuestionFilled" size="14" style="position: relative; top: 10px; left: 2px" />
          <template #content>
            <p>默认选中索引是1, 即选中第一个; 以此类推</p>
          </template>
        </el-tooltip>
      </template>
      <SwInputNumber v-model="selectTargetData[0].option.active" controls @change="update" />
    </el-form-item>

    <el-form-item label="显示个数" :label-width="firstLabelWidth">
      <SwInputNumber v-model="selectTargetData[0].option.size" controls :min="1" @change="update" />
    </el-form-item>

    <el-form-item label="文字换行" :label-width="firstLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.isPrewrap" @change="update" />
    </el-form-item>
    <SwCollapseItem title="动画">
      <template #content>
        <div class="flex flex-justify-between" style="width: 80%">
          <el-form-item label="自动播放" :label-width="secondLabelWidth">
            <el-checkbox v-model="selectTargetData[0].option.autoPlay" @change="update" />
          </el-form-item>
          <el-form-item label="循环播放" :label-width="secondLabelWidth">
            <el-checkbox v-model="selectTargetData[0].option.loop" @change="update" />
          </el-form-item>
        </div>
        <el-form-item label="动画间隔" :label-width="secondLabelWidth">
          <SwInputNumber unit="s" :min="1" v-model="selectTargetData[0].option.interval" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import Icon from "@editor/base/Icon/index.vue";

import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
