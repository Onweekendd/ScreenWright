<template>
  <div class="sw-collapse-item">
    <el-collapse v-model="activeNames">
      <el-collapse-item name="1" :disabled="disabled">
        <template #title>
          <span v-if="!hasTitleSlot">{{ title }}</span>
          <slot name="title" v-else />
        </template>
        <slot name="content" />
      </el-collapse-item>
    </el-collapse>
    <!-- 增加默认插槽，如果插槽内容为空，则显示图标 -->
    <div v-show="hasIconSlot" class="sw-collapse-item-icon">
      <slot name="icon" />
    </div>
    <div v-show="!hasIconSlot">
      <Icon
        v-if="showIcon"
        :type="iconType"
        color="#b4b7c1"
        size="16"
        @click="handleIconClick"
        class="sw-collapse-item-icon"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch, useSlots } from "vue"
import { FtCollapseItemProps, FtCollapseItemEmits } from "./SwCollapseItem"
import Icon from "@/components/Icon/index.vue"
import { computed } from "vue"
import { useVModel } from "@vueuse/core"
defineOptions({
  name: "SwCollapseItem",
  inheritAttrs: true
})
const slots = useSlots()
const props = defineProps<FtCollapseItemProps>()
const emit = defineEmits(FtCollapseItemEmits)
const input = useVModel(props, "modelValue", emit)

const disabled = computed(() => {
  if (!props.showIcon) {
    return false
  }
  return !input.value
})
const iconType = computed(() => {
  return input.value ? "iconfont-yanjing" : "iconfont-biyanjing"
})
const activeNames = ref<string[]>([])
const hasIconSlot = computed(() => {
  return !!slots.icon?.()
})
const hasTitleSlot = computed(() => {
  return !!slots.title?.()
})
const handleIconClick = () => {
  input.value = !input.value as boolean
  activeNames.value = activeNames.value.length ? [] : ["1"]
  emit("change", input.value as boolean)
}

watch(
  () => input.value,
  (nVal) => {
    if (nVal) {
      activeNames.value = ["1"]
    } else {
      activeNames.value = []
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (props.open) {
    activeNames.value = ["1"]
  }
})
</script>
<style lang="scss" scoped>
.sw-collapse-item {
  position: relative;
  :deep(.el-collapse) {
    --el-collapse-content-bg-color: #232630;
    --el-collapse-border-color: transparent;
    --el-collapse-header-bg-color: #232630;
    --el-collapse-header-text-color: #b4b7c1;
  }
  .sw-collapse-item-icon {
    position: absolute;
    right: 0;
    top: 16px;
    cursor: pointer;
    color: rgb(180, 183, 193);
    :deep(.el-icon + .el-icon) {
      margin-left: 8px;
    }
  }
  :deep(.el-collapse-item) {
    position: relative;
  }
  :deep(.el-collapse-item__header) {
    position: relative;
    padding-left: 26px;
    .el-collapse-item__arrow {
      position: absolute;
      left: 0;
      font-size: 18px;
    }
  }
  :deep(.el-collapse-item__content) {
    padding-left: 26px;
    padding-bottom: 0;
    position: relative;
    &::before {
      content: "";
      width: 4px;
      height: 100%;
      border: 1px solid #373a47;
      border-right: none;
      position: absolute;
      left: 6px;
      top: 0px;
      z-index: 1;
    }
  }
}
</style>
