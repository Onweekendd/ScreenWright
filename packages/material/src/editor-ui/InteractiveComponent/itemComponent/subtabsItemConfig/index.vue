<template>
  <div class="subtabs-item-config">
    <el-form-item label="默认选中项值" :label-width="firstLabelWidth">
      <div class="flex flex-center-between" style="width: 100%">
        <SwInput v-model="selectTargetData[0].option.active" @change="update" controls />
      </div>
    </el-form-item>
    <div class="flex flex-center-between flex-wrap">
      <el-form-item :label-width="firstLabelWidth">
        <template #label>
          <span
            >是否关联
            <el-tooltip class="item" effect="dark" placement="right">
              <Icon type="QuestionFilled" size="14" style="position: relative; top: 2px" />
              <template #content>
                <p>若设置启动关联的选项卡，则它们会共用一个选中项值</p>
              </template>
            </el-tooltip>
          </span>
        </template>
        <el-checkbox v-model="selectTargetData[0].option.related" @change="update" />
      </el-form-item>

      <el-form-item
        label="是否关联隔离"
        v-if="selectTargetData[0].option.related && isInsidePanel"
        :label-width="firstLabelWidth"
      >
        <el-checkbox v-model="selectTargetData[0].option.isIsolated" @change="update" />
      </el-form-item>
      <el-form-item label="取消选中" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.isCancelSelected" @change="update" />
      </el-form-item>
    </div>
    <div class="flex flex-center-between">
      <el-form-item label="高度跟随行数" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.setMinHeight" @change="update" />
      </el-form-item>
      <el-form-item label="选中项不变" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.isFixedSelectedItem" @change="update" />
      </el-form-item>
    </div>
    <div class="flex flex-center-between">
      <el-form-item label="跟随画布滑动" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.followCanvasSlide" @change="update" />
      </el-form-item>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";

import { SwInput as SwInput } from "@screenwright/ui/input";
import Icon from "@editor/base/Icon/index.vue";

import { firstLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();

const isInsidePanel = computed(() => {
  return selectTargetData.value[0].parentDynamicPanelId && selectTargetData.value[0].parentDynamicPanelId.length > 0;
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include checkbox-style();
</style>
