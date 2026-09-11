<template>
  <div class="multi-subtabs-global">
    <el-form-item label="默认选中项值" :label-width="firstLabelWidth">
      <div class="flex flex-center-between" style="width: 100%">
        <SwInput v-model="selectTargetData[0].option.active" @change="update" controls />
      </div>
    </el-form-item>
    <!-- 选项卡文字配置 -->
    <subtabsTextConfig />
  </div>
</template>
<script setup lang="ts">
import { SwInput as SwInput } from "@screenwright/ui/input";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import subtabsTextConfig from "../itemComponent/subtabsTextConfig/index.vue";

const { selectTargetData, update } = useUpdateInstance();
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include checkbox-style();
</style>
