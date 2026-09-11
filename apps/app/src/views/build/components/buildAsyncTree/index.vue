<template>
  <div class="build-async-tree">
    <div class="tree-wrapper">
      <el-tree ref="elTreeRef" default-expand-all node-key="id" :data="data" show-checkbox :props="defaultProps" />
    </div>
    <div class="template-add-form-footer">
      <el-button type="default" @click="cancel">取消</el-button>
      <el-button type="primary" @click="confirm">确定</el-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, nextTick, onMounted, ref } from "vue";

import { ElMessage, ElTree } from "element-plus";

import { dialogInjectionKey } from "@/components/Dialog/constant";

import type { ComponentType } from "../buildRender/type";

const { confirm, cancel } = inject(dialogInjectionKey)!;
interface Props {
  treeData: ComponentType[];
}
const props = defineProps<Props>();
const elTreeRef = ref<InstanceType<typeof ElTree>>();

const defaultProps = {
  children: "children",
  label: "name",
  disabled: "disabled"
};

const data = ref<any[]>([
  {
    id: 1,
    name: "全选",
    children: []
  }
]);
const validate = () => {
  if (!elTreeRef.value) {
    return false;
  }
  const checked = elTreeRef.value.getCheckedNodes(true);
  console.log(checked, "checked");
  if (checked.length === 0) {
    ElMessage.error("请至少选择一个组件");
    return {
      success: false,
      data: checked
    };
  }
  return {
    success: true,
    data: checked
  };
};
defineExpose({
  validate
});
onMounted(async () => {
  await nextTick();
  data.value[0].children = props.treeData;
  console.log(data.value, "data[0]");
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.build-async-tree {
  width: 100%;
  .tree-wrapper {
    height: 300px;
    overflow-y: scroll;
  }

  :deep(.el-tree) {
    --el-tree-node-content-height: 28px !important;
    --el-text-color-regular: #fff !important;
    color: #fff !important;
    background: transparent;
    height: 100%;
    .el-tree-node__content {
      background-color: transparent !important;
      position: relative;
      top: 1px;
    }
    .el-tree-node__content:hover {
      background-image: linear-gradient(180deg, #8b58e7, #642cff) !important;
      color: #fff !important;
    }
    .el-tree-node {
      &:focus {
        .el-tree-node__content {
          background-color: transparent !important;
          color: #fff !important;
        }
      }
    }
  }
  @include checkbox-style();
  .template-add-form-footer {
    text-align: right;
    padding: 10px 0px 20px 20px;
    .el-button--primary {
      font-size: 14px;
      color: #fff;
      border: none;
      border-radius: 2px;
      background: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
      margin-left: 10px;
    }
    .el-button--default {
      background-color: #3d404c;
      font-size: 14px;
      color: #fff;
      border: none;
      border-radius: 2px;
    }
  }
}
</style>
