<!-- 是否留白 -->
<template>
  <el-form-item label="是否留白" label-width="100px">
    <div class="config-boundary">
      <el-checkbox @change="update" v-model="selectTargetData[0].option.boundaryGap" />
    </div>
  </el-form-item>
</template>
<script setup lang="ts">
import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
.config-boundary {
  @include checkbox-style();
}
</style>
