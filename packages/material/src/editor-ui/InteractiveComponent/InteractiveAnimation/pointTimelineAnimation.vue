<template>
  <div class="pointTimeline-animation">
    <el-form-item label="开启轮播" :label-width="firstLabelWidth">
      <el-checkbox @change="update" v-model="selectTargetData[0].option.animationConfig.loop" />
    </el-form-item>
    <el-form-item label="轮播间隔" :label-width="firstLabelWidth">
      <SwInputNumber
        v-model="selectTargetData[0].option.animationConfig.loopInterval"
        :min="1"
        unit="s"
        @change="update"
      />
    </el-form-item>

    <el-form-item :label-width="firstLabelWidth">
      <template #label>
        <span>动画过渡</span>
        <el-tooltip class="item" effect="dark" placement="right">
          <Icon type="QuestionFilled" size="14" style="position: relative; top: 10px; left: 2px" />
          <template #content>
            <p>动画移动的过渡时长</p>
          </template>
        </el-tooltip>
      </template>
      <SwInputNumber
        v-model="selectTargetData[0].option.animationConfig.animateTranstion"
        :min="1"
        unit="s"
        @change="update"
      />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import Icon from "@editor/base/Icon/index.vue";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
