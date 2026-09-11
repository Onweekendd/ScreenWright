<template>
  <div class="no-render-component flex flex-center">{{ element.component }}组件无法渲染</div>
</template>
<script lang="ts" setup>
defineProps({
  element: {
    type: Object,
    required: true
  }
});
</script>
<style lang="scss" scoped>
.no-render-component {
  width: 100%;
  height: 100%;
  color: #fff;
  font-size: 40px;
}
</style>
