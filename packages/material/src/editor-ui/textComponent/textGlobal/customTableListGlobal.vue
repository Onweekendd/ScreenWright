<!-- 自定义列表 -->
<template>
  <div class="custom-table-list-global" v-if="selectTargetData[0].option.globalConfig">
    <el-form-item label="行数" :label-width="firstLabelWidth">
      <sw-input-number
        v-model.number="selectTargetData[0].option.globalConfig.globalRowCount"
        :min="0"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="行间距" :label-width="firstLabelWidth">
      <sw-input-number
        v-model.number="selectTargetData[0].option.globalConfig.globalRowLineMarginBottom"
        :min="0"
        unit="px"
        :controls="false"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="列数" :label-width="firstLabelWidth">
      <sw-input-number
        v-model.number="selectTargetData[0].option.globalConfig.globalColCount"
        :min="1"
        @change="update"
      />
    </el-form-item>
    <!-- 偏移 -->
    <GlobalTranslate />
    <!-- 动画 -->
    <Animate />
    <!-- 纵向滚动条 -->
    <ScrollYBar />
    <!-- 背景 -->
    <GlobalBg />
  </div>
</template>
<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui/input-number";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import Animate from "../textConfig/components/TextSwCustomTableListConfig/animate.vue";
import GlobalBg from "../textConfig/components/TextSwCustomTableListConfig/globalBg.vue";
import GlobalTranslate from "../textConfig/components/TextSwCustomTableListConfig/globalTranslate.vue";
import ScrollYBar from "../textConfig/components/TextSwCustomTableListConfig/scrollYBar.vue";

const { update, selectTargetData } = useUpdateInstance();
</script>
