<template>
  <div class="status-animation-container">
    <div class="create-animation" @click="createAnimation">
      <span>创建状态动画</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStatusAnimation } from "../attrsRender/components/statusAnimation/useStatusAnimation";

const { setEditorVisible } = useStatusAnimation();

const createAnimation = () => {
  setEditorVisible(true);
};
</script>

<style lang="scss" scoped>
.status-animation-container {
  width: 100%;
  .create-animation {
    cursor: pointer;
    font-size: 12px;
    width: fit-content;
    padding: 5px 10px;
    border-radius: 3px;
    margin-bottom: 10px;
    background-color: #383b49;
    &:hover {
      color: #ffffff;
      background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
    }
  }
}
</style>
