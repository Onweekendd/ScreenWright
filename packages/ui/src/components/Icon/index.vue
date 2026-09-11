<template>
  <i
    v-if="isIconFont"
    :style="{ fontSize: `${size2Number}px`, color: color }"
    :class="['iconfont sw-icon', `${type}`]"
  />
  <ElIcon class="sw-icon" :size="size2Number" :color="color" v-else>
    <component :is="currentIcon" />
  </ElIcon>
</template>

<script lang="ts" setup>
import { computed } from "vue"
import { ElIcon } from "element-plus"
import * as Icons from "@element-plus/icons-vue"
interface Props {
  type: string
  size?: number | string
  color?: string
}

const isIconFont = computed(() => {
  return props.type.indexOf("iconfont") > -1
})

const props = defineProps<Props>()

const size2Number = computed(() => {
  if (isNaN(Number(props.size))) {
    return 20
  }
  return Number(props.size)
})

const currentIcon = computed(() => {
  const iconType = props.type
  let icon = null

  if (iconType !== "") {
    icon = iconType.replace(iconType[0], iconType[0].toUpperCase())
  }

  return icon ? (Icons as any)[icon] : null // 通过中括号的方式动态获取
})
</script>
