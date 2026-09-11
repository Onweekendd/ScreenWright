<template>
  <div class="action-item flex flex-center" :class="{ active: isActive, 'is-disabled': disabled }">
    <el-tooltip :content="content">
      <Icon :type="type" size="18" />
    </el-tooltip>
  </div>
</template>
<script setup lang="ts">
import Icon from "@/components/Icon/index.vue";

interface Props {
  type: string;
  content: string;
  disabled?: boolean;
  isActive?: boolean;
}
defineProps<Props>();
</script>
<style lang="scss" scoped>
.action-item {
  width: 25px;
  height: 25px !important;
  text-align: center;
  line-height: 25px !important;
  background-color: #373a47 !important;
  color: #b4b7c1;
  font-size: 12px;
  margin-right: 12px;
  border-radius: 4px;
  cursor: pointer;
  &.active {
    background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
    color: #fff !important;
  }
  &.is-disabled {
    opacity: 0.25;
    cursor: not-allowed;
    background: 0 0 !important;
  }
}
</style>
