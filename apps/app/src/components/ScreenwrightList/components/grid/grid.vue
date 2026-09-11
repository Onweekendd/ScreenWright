<template>
  <div class="sw-grid">
    <slot />
  </div>
</template>
<style lang="scss" scoped>
.sw-grid {
  display: grid;
  // 列数随容器宽度自适应（每列最小 320px）：宽屏自动增加列数，卡片不会被拉长，也不会出现大间距
  grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
  gap: 20px;
}
</style>
