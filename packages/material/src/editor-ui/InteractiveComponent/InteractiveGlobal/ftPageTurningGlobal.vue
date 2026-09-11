<template>
  <div class="ft-page-turning-global">
    <div class="flex flex-justify-between" style="width: 90%">
      <el-form-item label="启用文本页" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.isText" @change="update" />
      </el-form-item>
      <el-form-item label="是否支持循环" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.isLoop" @change="update" />
      </el-form-item>
    </div>
    <el-form-item label="自动翻页" :label-width="firstLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.isPlay" @change="update" />
    </el-form-item>
    <el-form-item label="间隔时长" v-if="selectTargetData[0].option.isPlay" :label-width="firstLabelWidth">
      <SwInputNumber unit="S" :min="1" v-model="selectTargetData[0].option.intervalTime" @change="update" />
    </el-form-item>
    <SwCollapseItem title="翻页按钮" open>
      <template #content>
        <el-form-item label="图片" :label-width="secondLabelWidth">
          <SwUpload v-model="selectTargetData[0].option.backgroundImage" @delete="update" @change="update" />
        </el-form-item>
        <el-form-item label="按钮宽度" :label-width="secondLabelWidth">
          <SwInputNumber :min="0" v-model="selectTargetData[0].option.buttonWidth" controls @change="update" />
        </el-form-item>
        <el-form-item label="按钮高度" :label-width="secondLabelWidth">
          <SwInputNumber :min="0" v-model="selectTargetData[0].option.buttonHeight" controls @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import SwUpload from "@editor/base/SwUpload/index.vue";

import { firstLabelWidth, secondLabelWidth } from "@editor/textComponent/textConfig/textConfig";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include checkbox-style();
</style>
