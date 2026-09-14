<template>
  <div class="data-filter-drawer">
    <el-drawer v-model="visible" @closed="handleClearNotSave" title="数据响应结果" :modal="false" destroy-on-close>
      <div class="filter-edit-content">
        <filterSwitch />
        <filterSelect v-if="selectTargetData[0].openFilter" />
        <div class="filter-box-wrapper">
          <filterBox
            v-model="currentFilter"
            :targetComponent="targetComponent"
            :need-check-box="true"
            :need-test="true"
            :fill-height="true"
            @handleClickTest="handleClickTest"
            @handleFilterCheckChange="handleFilterCheckChange"
            @handleFilterDelete="handleFilterDelete"
            @handleClickShow="handleClickShow"
            @handleClickSave="handleClickSave"
            @handleCancel="handleCancel"
            @openCodeDialog="openCodeDialog"
          />
        </div>
        <filterResponse />
        <transition name="el-fade-in-linear">
          <filterTest v-if="showFilterTest" />
        </transition>
      </div>
    </el-drawer>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useVModel } from "@vueuse/core";

import { ElMessage } from "element-plus";
import { isUndefined } from "lodash-es";

import { FILTER_FN_WRAP_FOOTER, FILTER_FN_WRAP_HEADER } from "@/components/MonacoEditor/setupCallbackArgsTypes";
import { useDialog } from "@/hooks/useDialog";
import { handleMessageBox } from "@/utils/utils";
import type { ChildComponent, ComponentType, Filter } from "@/views/build/components/buildRender/type";
import type { FilterValidationResult } from "@/views/build/useDataFilter";
import { useDataFilter } from "@/views/build/useDataFilter";

import { useUpdateInstance } from "../../../useUpdateInstance";
import { useChildrenDrawer } from "../../childrenManager/useChildrenDrawer";
import codeEditor from "../fullCodeDialog/codeEditor.vue";
import filterBox from "./filterBox.vue";
import filterResponse from "./filterResponse.vue";
import filterSelect from "./filterSelect.vue";
import filterSwitch from "./filterSwitch.vue";
import filterTest from "./filterTest.vue";
import { useFilterTest } from "./useFilterTest";

const { dialog } = useDialog();
const { selectTargetData } = useUpdateInstance();
const { showFilterTest, openFilterTest } = useFilterTest();
const {
  currentFilter,
  cloneDataFilterOnInit,
  handleClearNotSave,
  handleSaveFilter,
  handleFilterEnable,
  deleteFilterFromComponent,
  handleSave,
  resetFilterToCloneData,
  onFilterCodeChange
} = useDataFilter();
interface Props {
  modelValue: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits(["update:modelValue"]);
const visible = useVModel(props, "modelValue", emit);
const { visibleRef: isChildComponentEditing, currentChildrenItem } = useChildrenDrawer();

const targetComponent = computed(() => {
  return isChildComponentEditing.value ? (currentChildrenItem.value ?? undefined) : selectTargetData.value[0];
});

const openCodeDialog = (item: Filter) => {
  dialog({
    DialogProps: {
      title: "全屏模式",
      width: "80%",
      modalClass: "build-render-ignore"
    },
    closeBefore: async (componentData, done) => {
      const dataRes = await componentData.validate();
      onFilterCodeChange(item, dataRes.data);
      done();
      await handleClickSave(item);
    },
    componentProps: {
      modelValue: item.dataFormatter,
      language: "javascript",
      injectSdkTypes: true,
      wrapHeader: FILTER_FN_WRAP_HEADER,
      wrapFooter: FILTER_FN_WRAP_FOOTER
    },
    component: codeEditor,
    center: true
  });
};

// 开启数据过滤
const handleClickTest = (item: Filter) => {
  openFilterTest(item);
};

// checkBox
const handleFilterCheckChange = async ({
  filter,
  value,
  component
}: {
  filter: Filter;
  value: boolean;
  component: ComponentType | ChildComponent | undefined;
}) => {
  await handleFilterEnable({
    filter,
    value,
    component
  });
};

// 删除过滤器
const handleFilterDelete = async (item: Filter) => {
  const isCanDelete = await handleMessageBox("是否删除所选过滤器?", {
    confirmButtonText: "确定",
    cancelButtonText: "取消"
  });
  if (!isCanDelete) {
    return;
  }

  const res = await deleteFilterFromComponent(item);
  if (res.success) {
    ElMessage.success("删除成功");
  } else {
    ElMessage.error(res.error ?? "删除失败");
  }
};

const handleClickShow = (item: Filter) => {
  if (isUndefined(item.show)) {
    item.show = false;
  }
  item.show = !item.show;
};

// 保存
const handleClickSave = async (item: Filter) => {
  const res = (await handleSave(item)) as FilterValidationResult;

  if (res.success) {
    cloneDataFilterOnInit();
    ElMessage.success("保存成功");
  } else {
    // 根据错误类型显示相应的错误消息
    switch (res.error) {
      case "not_modified":
        ElMessage.error("未修改过滤器");
        break;
      case "duplicate_name":
        ElMessage.error("过滤器名称不可重复");
        break;
      case "empty_name":
        ElMessage.error("请输入过滤器名称");
        break;
      case "filter_not_found":
        ElMessage.error("未找到目标过滤器");
        break;
      case "save_failed":
        ElMessage.error("保存失败，请重试");
        break;
      default:
        ElMessage.error("操作失败");
    }
  }
};

// 取消
const handleCancel = async (item: Filter) => {
  if (item.notSaved) {
    handleClearNotSave();
  }

  handleClickShow(item);

  resetFilterToCloneData(item);
  await handleSaveFilter(item);
};
</script>
<style lang="scss" scoped>
.data-filter-drawer {
  :deep(.el-drawer) {
    --el-drawer-bg-color: var(--sw-panel-bg);
    .el-drawer__header {
      font-size: 12px !important;
      height: 36px;
      margin: 0;
      padding: 0 16px !important;
      color: #dfe0e3;
      background-color: #3d404c;
    }
    .el-drawer__body {
      padding: 0 !important;
      overflow: hidden;
    }
    .filter-edit-content {
      position: relative;
      display: flex;
      flex-direction: column;
      height: 100%;
      box-sizing: border-box;
      background-color: var(--sw-panel-bg);
      color: #b4b7c1;
      padding: 16px;
      font-size: 12px !important;
    }
    // 纵向 flex,让子组件 filterBox 里 .fill-height 卡片能 flex:1 撑满
    .filter-box-wrapper {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
  }
}
</style>
