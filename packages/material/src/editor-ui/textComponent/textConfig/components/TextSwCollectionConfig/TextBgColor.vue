<template>
  <SwCollapseItem title="背景色" open>
    <template #content>
      <ItemPaddingAttr v-model="input" @change="handleConfigPaddingChange" />
      <el-form-item label="填充方式" :label-width="labelWidth">
        <el-select
          v-model="selectTargetData[0].option.backgroundType"
          popper-class="sw-select-dropdown"
          @change="update"
        >
          <el-option label="颜色" value="color" />
          <el-option label="自定义" value="custom" />
        </el-select>
      </el-form-item>
      <el-form-item label="颜色" :label-width="labelWidth" v-if="selectTargetData[0].option.backgroundType === 'color'">
        <sw-single-color-picker field="background" v-model="selectTargetData[0].option.background" />
      </el-form-item>
      <el-form-item
        label="图片"
        :label-width="labelWidth"
        v-if="selectTargetData[0].option.backgroundType === 'custom'"
      >
        <sw-upload
          v-model="selectTargetData[0].option.backgroundImage"
          :multiple="false"
          :showFileList="false"
          @change="update"
          @delete="update"
        />
      </el-form-item>
    </template>
  </SwCollapseItem>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";

import { useUpdateInstance } from "../../../../useUpdateInstance";
import ItemPaddingAttr from "../../ItemComponent/ItemPaddingAttr/index.vue";
import { useItemPaddingAttr } from "../../ItemComponent/ItemPaddingAttr/useItemPaddingAttr";

const { update, selectTargetData } = useUpdateInstance();
const labelWidth = ref(73);

const { input, handleConfigPaddingChange } = useItemPaddingAttr();
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

</style>
