<template>
  <div class="siderTree">
    <el-tree
      ref="elTreeRef"
      node-key="uuid"
      :data="treeData"
      highlight-current
      :expand-on-click-node="false"
      @node-click="handleNodeClick"
      :key="refreshKey"
      :defaultExpandedKeys="defaultExpandedKeys"
    >
      <template #default="{ data }">
        <span
          :class="{
            'custom-tree': true
          }"
        >
          <renderParentNode
            :addApi="groupMapApi.addApi"
            :delApi="groupMapApi.delApi"
            :updateApi="groupMapApi.updateApi"
            :data="data"
            v-model:label="data.label"
          />
        </span>
      </template>
    </el-tree>
  </div>
</template>
<script setup lang="ts">
import renderParentNode from "./renderNode.vue";
import { useApiByRoute } from "./useApiByRoute";
import { useSiderTreeData } from "./useSiderTreeData";

const { elTreeRef, refreshKey, defaultExpandedKeys, treeData, handleNodeClick } = useSiderTreeData();

const { groupMapApi } = useApiByRoute();
</script>
<style lang="scss" scoped>
.siderTree {
  width: 100%;
}
</style>
