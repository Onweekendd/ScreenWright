<!-- 静态数据模板 -->
<template>
  <div class="data-static-data">
    <el-form-item label="数据视图类型">
      <SwRadio direction="row" :option="dataViewType" v-model="formData.dataViewType" />
    </el-form-item>
    <SwSheetExcel
      :showContextmenu="false"
      :width="335"
      :height="340"
      :dataTable="sheetExcelData"
      :showOverlayer="false"
      mode="read"
      @select="select"
      v-if="formData.dataViewType === 'excel'"
    />
    <div class="response-wrapper" v-else>
      <MonacoEditor language="json" v-model="codeStr" ref="monacoEditorRef" />
      <fullCodeDialog v-model="codeStr" @change="handleFullCodeChange" />
    </div>
    <dataFilter />
    <dataResponse />
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";

import { debounce } from "lodash-es";

import SwRadio from "@/components/SwRadio/index.vue";
import SwSheetExcel from "@/components/SwSheetExcel/index.vue";
import MonacoEditor from "@/components/MonacoEditor/index.vue";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { useDialog } from "@/hooks/useDialog";

import type { ChildComponent } from "../../../buildRender/type";
import { useUpdateInstance } from "../../useUpdateInstance";
import { useChildrenDrawer } from "../childrenManager/useChildrenDrawer";
import dataFilter from "./dataFilter.vue";
import dataInterfaceDialog from "./dataInterfaceDialog.vue";
import dataResponse from "./dataResponse.vue";
import fullCodeDialog from "./fullCodeDialog/index.vue";

const { visibleRef: isChildComponentEditing, currentChildrenItem } = useChildrenDrawer();
const { selectTargetData, update } = useUpdateInstance({
  history: false
});
const { emitFilterTrigger } = useCallbackArguments();
const monacoEditorRef = ref<InstanceType<typeof MonacoEditor> | null>(null);
const sheetExcelData = computed({
  get: () => {
    if (isChildComponentEditing.value) {
      return currentChildrenItem.value.data;
    } else {
      return selectTargetData.value[0].data;
    }
  },
  set: (val) => {
    if (isChildComponentEditing.value) {
      currentChildrenItem.value.data = val;
    } else {
      selectTargetData.value[0].data = val;
    }
  }
});
const { dialog } = useDialog();
const formData = ref({
  dataViewType: "excel"
});

// 防抖处理更新和过滤器触发
const debouncedUpdate = debounce(() => {
  update();
  if (isChildComponentEditing.value) {
    emitFilterTrigger(`${currentChildrenItem.value.id}`, currentChildrenItem.value as ChildComponent);
  } else {
    emitFilterTrigger(`${selectTargetData.value[0].id}`);
  }
}, 200);

const codeStr = computed({
  get: () => {
    return JSON.stringify(sheetExcelData.value, null, 2);
  },
  set: (val: string) => {
    try {
      const parsedData = JSON.parse(val);
      sheetExcelData.value = parsedData;
      if (isChildComponentEditing.value) {
        currentChildrenItem.value.data = parsedData;
      } else {
        selectTargetData.value[0].data = parsedData;
      }
      // 使用防抖触发更新和过滤器
      debouncedUpdate();
    } catch (e) {
      // JSON 解析失败，忽略（用户可能正在输入中）
      console.warn("Invalid JSON:", e);
    }
  }
});
const dataViewType = ref([
  { label: "表格", value: "excel" },
  { label: "代码块", value: "code" }
]);
const handleFullCodeChange = (val: string) => {
  monacoEditorRef.value?.setValue(val);
};

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
</script>
<style lang="scss" scoped>
.response-wrapper {
  width: 314px;
  height: 260px;
  position: relative;
}
</style>
