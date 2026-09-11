<template>
  <div class="item-bar-and-line-high-light">
    <el-form-item label="是否高亮">
      <el-checkbox v-model="selectTargetData[0].option.isHover" @change="update" />
    </el-form-item>
    <template v-if="selectTargetData[0].option.isHover">
      <ItemHightLightStyle />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useUpdateInstance } from "../../../useUpdateInstance";
import ItemHightLightStyle from "../ItemHightLightStyle/index.vue";

const { selectTargetData, update } = useUpdateInstance();
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include checkbox-style();
</style>
