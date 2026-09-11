<template>
  <div class="requset-setting">
    <el-form-item label="接口地址" :label-width="firstLabelWidth">
      <sw-input
        v-model="selectTargetData[0].option.exportConfig.apiUrl"
        placeholder="请输入接口地址"
        @change="update"
      />
    </el-form-item>

    <el-form-item label="请求方式" :label-width="firstLabelWidth">
      <sw-radio
        @change="handleUpdate"
        direction="row"
        v-model="selectTargetData[0].option.exportConfig.method"
        :option="methodPost"
        style="margin-left: 10px"
      />
    </el-form-item>

    <HttpConfigEditor type="headers" />

    <HttpConfigEditor
      type="body"
      :showTooltip="false"
      :tooltipContent="'使用 ${file} 占位表示上传的图片; 返回格式类型 { code: number, message: string, timestamp: number, result: { signUrl: string }} '"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { SwInput } from "@screenwright/ui";
import { SwRadio } from "@screenwright/ui";

import { firstLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";
import HttpConfigEditor from "./httpConfigEditor.vue";

const { selectTargetData, update } = useUpdateInstance();
const methodPost = ref([
  {
    label: "POST",
    value: "POST"
  },
  {
    label: "PUT",
    value: "PUT"
  }
]);
const handleUpdate = () => {
  console.log("update", selectTargetData.value[0]);
  update();
};
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
.interface-config-form {
  .url-section,
  .method-section {
    margin-bottom: 20px;
  }
}
</style>
