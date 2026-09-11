<template>
  <sw-collapse-item title="前缀图标" :label-width="secondWidth">
    <template #content>
      <el-form-item label="图片上传" :label-width="secondWidth">
        <sw-upload v-model="selectTargetData[0].option.icon" :multiple="false" :showFileList="false" @change="update" />
      </el-form-item>
      <el-form-item label="尺寸" :label-width="secondWidth">
        <div class="flex">
          <sw-input-number
            v-model.number="selectTargetData[0].option.iconWidth"
            bottomLabel="宽"
            :controls="false"
            @change="update"
            @delete="update"
          />
          <sw-input-number
            v-model.number="selectTargetData[0].option.iconHeight"
            bottomLabel="高"
            :controls="false"
            @change="update"
            @delete="update"
          />
        </div>
      </el-form-item>
      <!-- 边距 -->
      <ItemPaddingAttr :labelWidth="secondWidth" v-model="input" @change="handleConfigPaddingChange" />
    </template>
  </sw-collapse-item>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import SwUpload from "@editor/base/SwUpload/index.vue";

import { useUpdateInstance } from "../../../../useUpdateInstance";
import { useItemPaddingAttr } from "../../ItemComponent/ItemPaddingAttr/useItemPaddingAttr";
import ItemPaddingAttr from "./../../ItemComponent/ItemPaddingAttr/index.vue";

const { update, selectTargetData } = useUpdateInstance();
const { input, handleConfigPaddingChange } = useItemPaddingAttr({
  padding: "iconMargin"
});
const secondWidth = 73;
</script>
