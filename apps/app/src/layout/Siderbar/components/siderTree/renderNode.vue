<template>
  <span class="custom-tree-node fl" :class="{ 'has-children': hasShowInput }">
    <span :class="[`iconfont iconfont-${data.icon}`]" v-if="data.icon" />
    <span class="aside-label"> {{ data.label }} </span>
    <span class="tree-total">{{ data.count }}</span>
    <span @click.stop="addGroup" v-if="data.add" class="tree-title-icon iconfont iconfont-tianjia fr" />

    <template v-if="hasShowInput">
      <div class="edit-wrapper" v-show="isShowEditInput">
        <el-input ref="editInput" v-model="localLabel" @input="updateLabel" @blur="handleBlur" />
      </div>
      <customMore @edit="handleEdit" @delete="handleDelete" v-if="!data.isNotMore" />
    </template>
  </span>
</template>
<script setup lang="ts">
import customMore from "./customMore.vue";
import { type RenderNodeProps, useRenderNode } from "./useRenderNode";

const props = defineProps<RenderNodeProps>();
const emits = defineEmits(["update:Label"]);
const updateLabel = () => {
  emits("update:Label", localLabel);
};
const { hasShowInput, addGroup, isShowEditInput, editInput, localLabel, handleBlur, handleEdit, handleDelete } =
  useRenderNode(props);
</script>
<style scoped lang="scss">
@import "src/style/theme.scss";
.custom-tree-node {
  display: flex;
  align-items: center;
  width: 100%;
  line-height: 38px;
  overflow: hidden;
  position: relative;
  padding-right: 12px;
  .edit-wrapper {
    position: absolute;
    width: 150px;
    z-index: 1;
    top: 0;
    left: 16px;
    :deep(.el-input__wrapper) {
      box-shadow: none !important;
      background-color: rgba(24, 27, 36, 0.8) !important;
      padding-left: 5px;
      border: 1px solid #393b4a;
      .el-input__inner {
        height: 26px !important;
      }
      &:hover {
        box-shadow: 0 0 0 1px var(--sw-theme-color) inset !important;
      }
    }
  }
  .iconfont {
    font-size: 13px;
    flex-shrink: 0;
    margin-right: 6px;
    color: $sw-text-muted;
  }
  .aside-label {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    padding: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tree-total {
    flex-shrink: 0;
    margin-left: 8px;
    font-size: 12px;
    color: $sw-text-muted;
  }
  .tree-title-icon {
    flex-shrink: 0;
    margin-left: 8px;
    font-size: 13px;
    cursor: pointer;
    color: $sw-text-dim;
    &:hover {
      color: $sw-text-strong;
    }
  }
  .el-input__inner {
    width: 150px;
    color: #ddd;
  }
  .custom-tree-more {
    display: inline-block;
    width: 20px;
    text-align: center;
    opacity: 0;
    position: absolute;
    right: 20px;
    top: 3px;
    &:hover {
      color: #ffffff;
    }
  }
  &.has-children {
    &:hover {
      .custom-tree-more {
        opacity: 1;
      }
      .tree-total {
        opacity: 0;
      }
    }
  }
}
</style>
