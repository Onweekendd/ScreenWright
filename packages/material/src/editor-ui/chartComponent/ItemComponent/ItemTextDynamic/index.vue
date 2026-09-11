<template>
  <el-form-item label="文本自定义" title="文本自定义" :label-width="labelWidth">
    <div class="fullWidth flex flex-center">
      <sw-input
        v-model="selectTargetData[0].option.markLineLabelCustom[props.currentIndex]"
        style="flex: 1"
        @change="update"
        v-if="showMarkLineLabelCustom"
      />
      <sw-input v-else v-model="selectTargetData[0].option.xAxisLabelCustom[props.currentIndex]" />
      <el-popover placement="top-end" effect="dark" width="200" trigger="hover">
        <template #reference>
          <Icon class="custom-icon" type="QuestionFilled" size="16" color="rgb(180, 183, 193)" />
        </template>
        <div>
          <div>字符串模板 模板变量有：</div>
          <div>{a}：系列名。</div>
          <div>{b}：数据名。</div>
          <div>{c}：数据值。</div>
          <div>{@xxx}：数据中名为 'xxx' 的维度的值，如 {@product} 表示名为 'product' 的维度的值。</div>
          <div>{@[n]}：数据中维度 n 的值，如 {@[3]} 表示维度 3 的值，从 0 开始计数</div>
        </div>
      </el-popover>
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { SwInput } from "@screenwright/ui/input";
import Icon from "@editor/base/Icon/index.vue";

import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const props = withDefaults(
  defineProps<{
    currentIndex: number;
    labelWidth: string;
    showMarkLineLabelCustom?: boolean;
  }>(),
  {
    currentIndex: 0,
    labelWidth: "100px",
    showMarkLineLabelCustom: true
  }
);
</script>

<style scoped>
.custom-icon {
  margin-left: 10px;
}
</style>
