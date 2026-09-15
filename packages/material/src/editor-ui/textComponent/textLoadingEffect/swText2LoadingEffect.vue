<template>
  <div class="ft-text2-loading-effect">
    <el-form-item label="动画类型" :label-width="firstLabelWidth">
      <template #label>
        <span
          >效果类型
          <el-tooltip class="item" effect="dark" placement="right">
            <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
            <template #content>
              <p>多条数据时暂不生效</p>
            </template>
          </el-tooltip>
        </span>
      </template>
      <el-select
        v-model="selectTargetData[0].option.textAnimationType"
        popper-class="sw-select-dropdown"
        @change="update"
      >
        <el-option v-for="item in textAniOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="效果速率" :label-width="firstLabelWidth">
      <sw-input-number
        v-model="selectTargetData[0].option.textAnimationTiming"
        unit="ms"
        :min="100"
        :controls="false"
        :disabled="!selectTargetData[0].option.textAnimationType"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="效果延迟" :label-width="firstLabelWidth">
      <sw-input-number
        v-model="selectTargetData[0].option.textAnimationDelay"
        unit="ms"
        :min="0"
        :controls="false"
        :disabled="!selectTargetData[0].option.textAnimationType"
        @change="update"
      />
    </el-form-item>
  </div>
</template>
<script lang="ts" setup>
import { SwInputNumber } from "@screenwright/ui/input-number";
import Icon from "@editor/base/Icon/index.vue";

import { useUpdateInstance } from "../../useUpdateInstance";
import { textAniOptions } from "../textConfig/constants";
import { firstLabelWidth } from "../textConfig/textConfig";

const { selectTargetData, update } = useUpdateInstance();
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

</style>
