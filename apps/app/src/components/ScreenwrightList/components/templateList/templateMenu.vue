<template>
  <div @mouseleave="handleMouseLeave" class="template-menu flex flex-justify-center flex-align-center flex-column">
    <div class="template-menu-btn flex">
      <div class="content__btn" @click="handlePreview">预览</div>
      <div class="content__btn" @click="handleEdit">编辑</div>
    </div>
    <div class="content__view">
      <el-tooltip content="发布" v-if="permissionMap.get(item.id).release">
        <span @click="handlePublish" class="font-family iconfont iconfont-fabu1 fs-18" />
      </el-tooltip>
      <el-tooltip content="复制" v-if="permissionMap.get(item.id).copy">
        <span @click="handleCopy" class="font-family iconfont iconfont-copy fs-14" />
      </el-tooltip>
      <el-tooltip content="修改" v-if="permissionMap.get(item.id).modify">
        <span @click="updateTemplate" class="font-family iconfont iconfont-bianji fs-14" />
      </el-tooltip>
      <el-tooltip content="导出" v-if="permissionMap.get(item.id).export">
        <span @click="handleExport" class="font-family iconfont iconfont-clouddownload fs-14" />
      </el-tooltip>
      <el-tooltip content="删除" v-if="permissionMap.get(item.id).delete">
        <span @click="deleteTemplate" class="font-family iconfont iconfont-shanchu1 fs-14" />
      </el-tooltip>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { ScreenItem } from "@/model/Visual";

import { useTemplateMenu } from "./useTemplateMenu";

const props = defineProps<{
  item: ScreenItem;
  permissionMap: Map<any, any>;
}>();
const { handlePublish, handleExport, handleCopy, handleEdit, handlePreview, deleteTemplate, updateTemplate } =
  useTemplateMenu(props.item);

const emits = defineEmits(["mouseLeave"]);

const handleMouseLeave = () => {
  emits("mouseLeave");
};
</script>
<style lang="scss" scoped>
@import "../style/templateMenu.scss";
</style>
