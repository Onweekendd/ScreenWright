<template>
  <span class="custom-tree-more fl">
    <el-tooltip effect="dark" content="编辑" placement="top">
      <el-icon style="margin-right: 5px" @click.stop="handleEdit">
        <Edit size="14" />
      </el-icon>
    </el-tooltip>
    <el-tooltip effect="dark" content="删除" placement="top">
      <el-icon @click.stop="handleDelete">
        <Delete size="14" />
      </el-icon>
    </el-tooltip>
  </span>
</template>
<script setup lang="ts">
import { Delete, Edit } from "@element-plus/icons-vue";

const emits = defineEmits(["edit", "delete"]);
const handleEdit = () => {
  emits("edit");
};
const handleDelete = () => {
  emits("delete");
};
</script>
