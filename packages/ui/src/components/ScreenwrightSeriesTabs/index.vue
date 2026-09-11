<template>
  <div class="ft-series-tabs">
    <div class="ft-series-tabs-content">
      <Icon type="ArrowLeft" @click="slide('left')" />
      <div class="container-wrapper" ref="containerRef">
        <el-tabs ref="tabsRef" v-model="active" :stretch="false" @tab-click="handleClick">
          <template v-if="isAuto">
            <el-tab-pane
              v-for="idx in len"
              :key="`${prefix}${idx}`"
              :name="idx.toString()"
              :label="`${prefix}${idx}`"
            />
          </template>
          <template v-else>
            <el-tab-pane
              v-for="(column, index) in tabItems"
              :key="getItemValue(column, nameKey) || String(column)"
              :name="index.toString()"
              :label="
                hasIndex
                  ? `${getItemValue(column, nameKey) || String(column)}${index}`
                  : getItemValue(column, nameKey) || String(column)
              "
            />
          </template>
        </el-tabs>
      </div>
      <Icon type="ArrowRight" @click="slide('right')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { useVModel } from "@vueuse/core"
import Icon from "@/components/Icon/index.vue"
import { ElTabs } from "element-plus"
import type { TabsPaneContext } from "element-plus"

// 定义标签项类型
interface TabItemObject {
  [key: string]: any
}

type TabItem = string | TabItemObject

// 定义组件属性类型
interface SeriesTabsProps {
  /** 当前选中的标签值，支持v-model绑定 */
  modelValue: string | number
  /** 标签页选项配置，包含position和type等属性 */
  tabs: any[]
  /** 是否在标签文本后显示索引，例如"标签1"、"标签2" */
  hasIndex?: boolean
  /** 是否自动生成标签内容，当为true时使用prefix和len生成 */
  isAuto?: boolean
  /** 自动生成标签时的前缀文本 */
  prefix?: string
  /** 自动生成的标签数量 */
  len?: number
  /** 当标签项为对象时，用于获取标签名称的键名 */
  nameKey?: string
}

const props = withDefaults(defineProps<SeriesTabsProps>(), {
  modelValue: "0",
  hasIndex: false,
  isAuto: false,
  prefix: "系列",
  len: 0,
  nameKey: "name"
})

const emit = defineEmits<{
  /** 更新modelValue事件 */
  (e: "update:modelValue", value: string | number): void
  /** 标签改变事件 */
  (e: "change", value: string | number): void
  /** 标签点击事件 */
  (e: "tabClick", tab: TabsPaneContext): void
}>()

// 使用v-model绑定
const activeValue = useVModel(props, "modelValue", emit)

// Refs
const tabsRef = ref<InstanceType<typeof ElTabs>>()
const containerRef = ref<HTMLElement>()

// Computed

const tabItems = computed<TabItem[]>(() => {
  //TabItem+ 如果props.tabs是数组，则直接返回；否则返回空数组
  return Array.isArray(props.tabs) ? props.tabs : []
})

// 当前激活的标签页
const active = ref("0")

/**
 * 安全获取对象属性或返回默认值
 * @param item TabItem类型的对象或字符串
 * @param key 键名
 * @returns 属性值或字符串表示
 */
const getItemValue = (item: TabItem, key: string): string => {
  if (typeof item === "object" && item !== null) {
    return item[key]?.toString() || ""
  }
  return String(item)
}

/**
 * 根据当前tab索引获取对应的值
 * @param index 标签索引字符串
 * @returns 对应的标签值
 */
const getTabValue = (index: string): string | number => {
  if (props.isAuto) return index

  const idx = Number(index)
  if (isNaN(idx) || !tabItems.value[idx]) return index

  const item = tabItems.value[idx]
  return typeof item === "object" && item !== null ? item[props.nameKey] : item
}

// 同步外部modelValue到内部active
watch(activeValue, (newVal) => {
  if (props.isAuto) {
    active.value = newVal?.toString().match(/([0-9]+)$/)?.[1] || "0"
    return
  }

  let findIndex = -1

  for (let i = 0; i < tabItems.value.length; i++) {
    const item = tabItems.value[i]
    const itemValue = typeof item === "object" && item !== null ? item[props.nameKey] : item

    if (itemValue === newVal) {
      findIndex = i
      break
    }
  }

  if (findIndex >= 0) {
    active.value = findIndex.toString()
  }
})

// 同步内部active到外部modelValue
watch(active, (newVal) => {
  const value = getTabValue(newVal)
  activeValue.value = value
  emit("change", value)
})

/**
 * 处理标签点击事件
 * @param pane 标签面板上下文
 */
const handleClick = (pane: TabsPaneContext) => {
  emit("tabClick", pane)
}

/**
 * 滑动切换标签页
 * @param direction 滑动方向，'left'或'right'
 */
const slide = (direction: "left" | "right") => {
  const currentIndex = Number(active.value)
  const maxIndex = (props.isAuto ? props.len : tabItems.value.length) - 1

  if (direction === "left" && currentIndex > 0) {
    active.value = (currentIndex - 1).toString()
  } else if (direction === "right" && currentIndex < maxIndex) {
    active.value = (currentIndex + 1).toString()
  }
}

onMounted(() => {
  console.log(props.tabs)
})
</script>

<style lang="scss" scoped>
.ft-series-tabs {
  position: relative;
  width: 100%;
  background: #3d404c;
  opacity: 0.8;
  margin-bottom: 16px;

  &-content {
    display: flex;
    align-items: center;
    height: 30px;
  }

  .container-wrapper {
    width: calc(100% - 32px);
    overflow: hidden;
    flex: 1;
  }

  :deep(.el-tabs) {
    margin-top: 16px;
  }

  :deep(.el-tabs__active-bar) {
    top: 25px !important;
    width: 48px !important;
    height: 2px;
    background: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
    opacity: 0.8;
  }
  :deep(.el-tabs__item) {
    padding: 0;
    font-size: 12px;
    line-height: 18px;
    height: 18px;
    width: 48px !important;
    text-align: center;
    color: #b4b7c1;
    background-color: #3d404c !important;
  }
  :deep(.is-active) {
    background-color: #3d404c !important;
    background-image: none !important;
    font-size: 12px;
    font-family:
      Source Han Sans CN-Normal,
      Source Han Sans CN;
    font-weight: 400;
    color: #9483ff !important;
    line-height: 14px;
  }
  :deep(.el-tabs__nav) {
    height: 27px;
  }
  :deep(.el-tabs__nav-wrap::after) {
    background-color: #3d404c;
  }
  :deep(.el-tabs__nav-wrap.is-scrollable) {
    padding: 0;
  }
  :deep(.el-tabs__nav-prev),
  :deep(.el-tabs__nav-next) {
    display: none;
  }
  i {
    width: 16px;
    font-size: 16px;
    height: 30px;
    opacity: 1;
    color: #b4b7c1;
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    &:nth-child(1) {
      left: 4px;
    }
    &:nth-child(2) {
      right: 12px;
    }
  }
}
</style>
