<template>
  <div>
    <el-select
      ref="main"
      v-model="value"
      placeholder="请选择"
      @change="handleSelect"
      :filterable="filterable"
      :clearable="clearable"
      :disabled="disabled"
      @visible-change="handleVisibleChange"
    >
      <el-option v-for="item in option" :key="item.value" :label="item.label" :value="item.value">
        <div class="option flex flex-align-center" :class="{ 'flex-justify-center': popperTextCenter }">
          <img
            v-if="showImage && isIncludeImgPrefix(item.cover || item.value)"
            class="option-image"
            :class="isSquareImage ? 'optionSquare' : ''"
            :src="getImageUrl(item.cover || item.value)"
          />
          <span class="option-label">{{ item.label }}</span>
        </div>
      </el-option>
    </el-select>
    <img
      v-if="showImage && isIncludeImgPrefix(previewImageUrl)"
      class="previewImage"
      :class="isSquareImage ? 'squareImage' : ''"
      :src="previewImageUrl"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { setMinioUrl } from "@/utils"

const { VUE_APP_MINIO_DEFAULT_PREFIX } = import.meta.env

interface FtSingleSelectProps {
  option: Array<{
    label: string
    value: string
    cover?: string
  }>
  filterable: boolean
  clearable: boolean
  showImage: boolean
  isSquareImage: boolean
  isNotValueHideImage: boolean
}

interface FtSingleSelectEmits {
  (e: "handleSelect", val: string, oldValue: string): void
}

const props = withDefaults(defineProps<FtSingleSelectProps>(), {
  option: () => [],
  filterable: false,
  clearable: false,
  showImage: false,
  isSquareImage: false,
  isNotValueHideImage: false
})

const emit = defineEmits<FtSingleSelectEmits>()

const main = ref(null)
const value = ref("")
const oldValue = ref("")
const previewImageUrl = ref("")
const disabled = ref(false)
const popperTextCenter = ref(false)

watch(
  value,
  (val) => {
    if (props.option && props.option.length > 0) {
      const valueList = props.option.map((item) => item.value)
      if (!valueList.includes(val)) {
        value.value = ""
        if (props.isNotValueHideImage) previewImageUrl.value = ""
        return
      }

      if (props.showImage) {
        const selectedObj = props.option.find((item) => item.value === val)
        if (!selectedObj) {
          previewImageUrl.value = ""
        } else {
          previewImageUrl.value = getImageUrl(selectedObj?.cover || selectedObj?.value)
        }
      }
    }
  },
  { immediate: true }
)

function handleSelect(val: string) {
  emit("handleSelect", val, oldValue.value)
}

function handleVisibleChange(val: boolean) {
  if (val) oldValue.value = value.value
}

function getImageUrl(url: string) {
  return setMinioUrl(url)
}

function isIncludeImgPrefix(url: string) {
  return VUE_APP_MINIO_DEFAULT_PREFIX && url?.includes(VUE_APP_MINIO_DEFAULT_PREFIX)
}
</script>

<style lang="scss" scoped>
.option {
  .option-image {
    width: 40px;
    height: 20px;
    margin-right: 16px;
    object-fit: cover;
  }
  .optionSquare {
    width: 20px;
  }
}
.previewImage {
  width: 208px;
  height: 104px;
  margin-top: 12px;
}
.squareImage {
  width: 104px;
  height: 104px;
  margin-left: 52px;
}
</style>
