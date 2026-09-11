<template>
  <div class="roll-subtabs-global">
    <el-form-item label="默认选中项值" :label-width="firstLabelWidth">
      <div class="flex flex-center-between" style="width: 100%">
        <SwInput v-model="selectTargetData[0].option.active" @change="update" />
      </div>
    </el-form-item>
    <!-- 选项卡文字配置 -->
    <subtabsTextConfig type="rollSubtabs" />
    <SwCollapseItem title="滚动图标" show-icon v-model="selectTargetData[0].option.arrowShow" @change="update">
      <template #content>
        <el-form-item label="图标上传" :label-width="secondLabelWidth">
          <SwUpload v-model="selectTargetData[0].option.imgLeft" @change="update" @delete="update" />
        </el-form-item>
        <el-form-item :label-width="secondLabelWidth">
          <SwUpload v-model="selectTargetData[0].option.imgRight" @change="update" @delete="update" />
        </el-form-item>

        <el-form-item :label-width="secondLabelWidth" label="图标大小">
          <div class="flex">
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.arrowWidth"
              unit="px"
              bottomLabel="宽度"
            />
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.arrowHeight"
              unit="px"
              bottomLabel="高度"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput as SwInput } from "@screenwright/ui/input";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import SwUpload from "@editor/base/SwUpload/index.vue";

import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import subtabsTextConfig from "../itemComponent/subtabsTextConfig/index.vue";

const { selectTargetData, update } = useUpdateInstance();
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include checkbox-style();
</style>
