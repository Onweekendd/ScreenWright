<template>
  <div class="ft-translation-global">
    <el-form-item label="初始化加载" :label-width="firstLabelWidth">
      <template #label>
        <span
          >初始化加载
          <el-tooltip class="item" effect="dark" placement="right">
            <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
            <template #content>
              <p>勾选初始化加载，首次加载完成自动执行默认译文</p>
            </template>
          </el-tooltip>
        </span>
      </template>
      <el-checkbox @change="update" v-model="selectTargetData[0].option.initLoad" />
    </el-form-item>
    <el-form-item label="默认译文字典" :label-width="firstLabelWidth">
      <el-select popper-class="sw-select-dropdown" v-model="selectTargetData[0].option.defaultKey" @change="update">
        <el-option
          v-for="item in selectTargetData[0].option.dictList"
          :key="item.value"
          :label="item.alias"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import Icon from "@editor/base/Icon/index.vue";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
</style>
