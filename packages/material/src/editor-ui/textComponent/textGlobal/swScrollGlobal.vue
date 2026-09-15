<template>
  <div class="ft-scroll-global">
    <el-form-item label="行数">
      <sw-input-number v-model="selectTargetData[0].option.count" @change="update" :min="1" />
    </el-form-item>
    <el-form-item label="行间距">
      <sw-input-number
        v-model="selectTargetData[0].option.lineMarginBottom"
        unit="px"
        :controls="false"
        @change="update"
      />
    </el-form-item>
    <el-form-item>
      <template #label>
        <span>
          默认高亮
          <el-tooltip class="item" effect="dark" placement="right">
            <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
            <template #content> 填写数值，英文逗号隔开，如第1个默认高亮是1，第1、2个都高亮是1,2；以此类推 </template>
          </el-tooltip>
        </span>
      </template>
      <sw-input v-model="selectTargetData[0].option.activeKeys" @change="update" />
    </el-form-item>
    <el-form-item label="光标显隐">
      <el-checkbox v-model="selectTargetData[0].option.cursorShow" @change="update" />
    </el-form-item>
    <Animate />
    <ScrollBar />
  </div>
</template>
<script setup lang="ts">
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import Icon from "@editor/base/Icon/index.vue";

import { useUpdateInstance } from "../../useUpdateInstance";
import Animate from "../textConfig/components/TextSwScrollGlobalConfig/animate.vue";
import ScrollBar from "../textConfig/components/TextSwScrollGlobalConfig/scrollBar.vue";

const { update, selectTargetData } = useUpdateInstance();
</script>
<style lang="scss" scoped>
</style>
