<template>
  <div class="asset-menu flex flex-justify-center flex-align-center">
    <div class="content__btn" @click="handlePreview" v-if="showPreview">预览</div>
    <div class="content__btn active" @click="handleEdit" v-if="showEdit">编辑</div>
    <div class="content__btn active" @click="handleExport" v-if="showExport">导出</div>
  </div>
</template>
<script setup lang="ts">
interface Props {
  showPreview: boolean;
  showEdit: boolean;
  showExport: boolean;
}
defineProps<Props>();

const emits = defineEmits(["handlePreview", "handleEdit", "handleExport"]);
const handlePreview = () => {
  emits("handlePreview");
};
const handleEdit = () => {
  emits("handleEdit");
};
const handleExport = () => {
  emits("handleExport");
};
</script>
<style lang="scss" scoped>
.asset-menu {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  background-color: rgba(29, 38, 46, 0.8);
  justify-content: space-evenly;
  .content__btn {
    width: 66px;
    height: 32px;
    text-align: center;
    background: #3d404c;
    font-size: 14px;
    color: #fff;
    border-radius: 4px;
    vertical-align: middle;
    line-height: 32px;
    box-sizing: border-box;
    transition: 0.3s ease;

    cursor: pointer;
    &.active {
      background: linear-gradient(180deg, #8b58e7, #642cff);
    }
  }
}
</style>
