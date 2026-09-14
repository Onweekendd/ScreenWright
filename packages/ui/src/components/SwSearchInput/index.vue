<template>
  <el-autocomplete
    v-model="searchValue"
    :size="size"
    class="search-list"
    :popper-class="popperClass"
    :fetch-suggestions="fetchSuggestions"
    :placeholder="placeholder"
    :clearable="clearable"
    @select="handleSelect"
    @change="handleChange as any"
    @clear="handleClear"
    ref="inputRef"
  >
    <template #suffix>
      <i class="el-icon-search el-input__icon" />
    </template>
    <template #default="{ item }">
      <div class="name">{{ item[valueKey] }}</div>
    </template>
  </el-autocomplete>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core"
import { ElAutocomplete } from "element-plus"
import { ComponentPublicInstance, ref } from "vue"

interface Props {
  modelValue?: string
  placeholder?: string
  size?: "large" | "default" | "small"
  clearable?: boolean
  valueKey?: string
  popperClass?: string
  queryData?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  placeholder: "请输入内容",
  size: "small",
  clearable: false,
  valueKey: "value",
  popperClass: "sw-autocomplete-dropdown",
  queryData: () => []
})

const inputRef = ref<ComponentPublicInstance<InstanceType<typeof ElAutocomplete>>>()

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
  (e: "select", item: any): void
  (e: "change", value: string): void
  (e: "clear"): void
}>()

const searchValue = useVModel(props, "modelValue", emit)

const handleSelect = (item: any) => {
  emit("select", item)
  searchValue.value = item[props.valueKey]
}

const handleChange = (value: string) => {
  emit("change", value)
  searchValue.value = value
}
const fetchSuggestions = (queryString: string, callback: (suggestions: any[]) => void) => {
  if (props.queryData.length > 0) {
    const results = queryString ? props.queryData.filter(createFilter(queryString)) : props.queryData
    // 调用 callback 返回建议列表的数据
    callback(results)
  } else {
    callback([])
  }
}
const createFilter = (queryString: string) => {
  return (restaurant: any) => {
    return restaurant.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0
  }
}
const handleClear = () => {
  emit("clear")
}

defineExpose({
  focus: () => {
    inputRef.value?.focus()
  }
})
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-input__wrapper");

:deep(.el-autocomplete-suggestion) {
  display: none;
  background-color: rgb(33, 36, 45);
  border: none;
  li {
    color: #b4b7c1;
    font-size: 12px;
    &:hover {
      background-image: linear-gradient(180deg, var(--sw-theme-color), var(--sw-theme-color));
      color: #ffffff;
    }
  }
  .popper__arrow {
    opacity: 0;
  }
}
</style>
