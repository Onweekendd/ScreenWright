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
@import "src/style/theme.scss";
.status-animation-container {
  width: 100%;
  .create-animation {
    cursor: pointer;
    font-size: 12px;
    width: fit-content;
    padding: 5px 10px;
    border-radius: 3px;
    margin-bottom: 10px;
    background-color: $sw-control-bg;
    &:hover {
      color: #ffffff;
      background-image: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
    }
  }
}
</style>
