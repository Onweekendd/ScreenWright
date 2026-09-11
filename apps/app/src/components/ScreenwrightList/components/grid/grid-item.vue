<template>
  <div class="sw-grid-item">
    <slot />
  </div>
</template>
<style lang="scss" scoped>
.sw-grid-item {
  height: 214px;
  position: relative;
  border-radius: 6px;
  border: none;
  background-color: #292b38;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
