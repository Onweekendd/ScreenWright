<template>
  <div class="data-iot-config">
    <!-- 非通用组件 -->
    <template v-if="!isGeneralComponent">
      <commonDeviceConfig />
    </template>

    <!-- 通用组件 -->
    <template v-else>
      <iotGeneralConfig />
    </template>

    <el-form-item label="数据视图类型">
      <SwRadio direction="row" :option="dataViewType" v-model="formData.dataViewType" />
    </el-form-item>
    <SwSheetExcel
      :showContextmenu="false"
      :width="335"
      :height="340"
      :dataTable="selectTargetData[0].data"
      :showOverlayer="false"
      mode="read"
      @select="select"
      v-if="formData.dataViewType === 'excel'"
    />
    <div class="response-wrapper" v-else>
      <MonacoEditor language="json" v-model="codeStr" @change="change" />
      <fullCodeDialog v-model="codeStr" @change="change" />
    </div>

    <dataFilter />
    <dataResponse />
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";

import SwRadio from "@/components/SwRadio/index.vue";
import SwSheetExcel from "@/components/SwSheetExcel/index.vue";
import MonacoEditor from "@/components/MonacoEditor/index.vue";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { useDialog } from "@/hooks/useDialog";
import dataFilter from "@/views/build/components/buildConfig/attrsRender/components/dataFilter.vue";
import dataInterfaceDialog from "@/views/build/components/buildConfig/attrsRender/components/dataInterfaceDialog.vue";
import dataResponse from "@/views/build/components/buildConfig/attrsRender/components/dataResponse.vue";
import fullCodeDialog from "@/views/build/components/buildConfig/attrsRender/components/fullCodeDialog/index.vue";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";

import commonDeviceConfig from "./commonDeviceConfig.vue";
import iotGeneralConfig from "./iotGeneralConfig.vue";
import { useIotConfig } from "./useIotConfig";

// 使用相关hooks
const { dialog } = useDialog();
const { selectTargetData } = useEditStore();
const { isGeneralComponent, update } = useIotConfig();
const { emitFilterTrigger } = useCallbackArguments();

// 数据视图相关状态
const formData = ref({
  dataViewType: "excel"
});
const codeStr = ref("");
const dataViewType = ref([
  { label: "表格", value: "excel" },
  { label: "代码块", value: "code" }
]);

// 方法定义
const select = () => {
  dialog({
    DialogProps: {
      title: "数据内容",
      width: "1200px",
      modalClass: "data-interface-dialog"
    },
    componentProps: {},
    component: dataInterfaceDialog,
    center: true
  });
};

const change = (val: string) => {
  selectTargetData.value[0].data = JSON.parse(val);
  update();
  // 触发过滤器更新
  emitFilterTrigger(`${selectTargetData.value[0].id}`);
};

// 组件挂载时初始化数据
onMounted(async () => {
  codeStr.value = JSON.stringify(selectTargetData.value[0].data);
});
</script>

<style lang="scss" scoped>
.response-wrapper {
  width: 314px;
  height: 260px;
  position: relative;
}
</style>
