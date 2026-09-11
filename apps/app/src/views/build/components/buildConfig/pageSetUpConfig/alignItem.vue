<template>
  <div class="align-item" :class="{ 'is-active': isActive }" :title="title">
    <Icon :type="type" size="14" />
  </div>
</template>
<script setup lang="ts">
import Icon from "@/components/Icon/index.vue";

interface Props {
  type: string;
  title?: string;
  isActive?: boolean;
}
defineProps<Props>();
</script>
<style lang="scss" scoped>
.align-item {
  width: 70px;
  height: 25px;
  background: #1a1e27;
  border: 1px solid #353745;
  text-align: center;
  cursor: pointer;
  line-height: 25px;
  &.is-active {
    border: 1px solid;
    border-image: linear-gradient(180deg, rgb(139, 88, 231), rgb(100, 44, 255)) 1 1;
  }
  &:hover {
    border: 1px solid;
    border-image: linear-gradient(180deg, rgb(139, 88, 231), rgb(100, 44, 255)) 1 1;
  }
}
</style>
