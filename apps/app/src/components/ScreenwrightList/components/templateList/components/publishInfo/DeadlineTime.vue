<template>
  <div class="deadline-time flex flex-align-center" v-if="hasExpirationTime">
    <span class="label label-width-72"> 有效期至 </span>
    <el-date-picker
      v-model="expirationTime"
      popper-class="sw-date-picker-dropdown"
      type="datetime"
      placeholder="不选默认永久"
      :shortcuts="shortcuts"
      value-format="YYYY-MM-DD HH:mm:ss"
      @change="handleChange"
    />
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

interface Props {
  hasExpirationTime: boolean | null | undefined;
  modelValue: string | null | undefined;
}
const props = defineProps<Props>();
const emits = defineEmits(["update:modelValue", "change"]);
const expirationTime = ref();
const shortcuts = [
  {
    text: "七天",
    value: () => {
      const date = new Date();
      date.setTime(date.getTime() + 3600 * 1000 * 24 * 7);
      return date;
      //   picker.$emit("pick", date)
    }
  },
  {
    text: "一个月",
    value: () => {
      const date = new Date();
      date.setTime(date.getTime() + 3600 * 1000 * 24 * 30);
      return date;
      //   picker.$emit("pick", date)
    }
  },
  {
    text: "半年",
    value: () => {
      const date = new Date();
      date.setTime(date.getTime() + 3600 * 1000 * 24 * 181);
      return date;
      //   picker.$emit("pick", date)
    }
  },
  {
    text: "一年",
    value: () => {
      const date = new Date();
      date.setTime(date.getTime() + 3600 * 1000 * 24 * 365);
      return date;
      //   picker.$emit("pick", date)
    }
  },
  {
    text: "永久",
    value: () => {
      const date = new Date();
      date.setTime(date.getTime() + 3600 * 1000 * 24 * 365 * 100);
      return date;
      //   picker.$emit("pick", date)
    }
  }
];
const handleChange = (val: any) => {
  emits("update:modelValue", val);
  emits("change", val);
};
watch(
  () => props.modelValue,
  (nVal) => {
    if (nVal === null || nVal === undefined) {
      expirationTime.value = null;
    }
    expirationTime.value = props.modelValue;
    // debouncedGetTemplateList(nVal)
  }
);

onMounted(() => {
  expirationTime.value = props.modelValue;
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.label-width-72 {
  width: 72px;
}
.deadline-time {
  color: #bfbfbf;
  font-size: 14px;
  :deep(.el-date-editor) {
    width: calc(100% - 72px);
  }
  @include common-element-style(".el-input__wrapper");
}
</style>
