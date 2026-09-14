<template>
  <div class="coding">
    <div class="data-coding-dialog">
      <MonacoEditor language="javascript" v-model="coding" />
    </div>
    <div class="flex flex-justify-end btn-list dialog-footer">
      <div class="btn-item" @click="handleClose">取消</div>
      <div class="btn-item primary" @click="submit">提交</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, onMounted, ref } from "vue";

import { cloneDeep } from "lodash-es";

import { dialogInjectionKey } from "@/components/Dialog/constant";
import MonacoEditor from "@/components/MonacoEditor/index.vue";

const { confirm, cancel } = inject(dialogInjectionKey)!;
const coding = ref<any>(null);
const props = defineProps<{
  code: string;
}>();
const handleClose = () => {
  cancel();
};
const submit = () => {
  confirm();
};
const initCoding = () => {
  coding.value = cloneDeep(props.code);
};

const validate = () => {
  return coding.value;
};

defineExpose({
  validate
});

onMounted(() => {
  initCoding();
});
</script>
<style lang="scss" scoped>
.coding {
  .data-coding-dialog {
    height: 634px;
  }

  .btn-list {
    margin: 20px 0;
    .btn-item {
      width: 60px;
      background-color: #3d404c;
      height: 32px;
      line-height: 32px;
      margin-right: 12px;
      text-align: center;
      font-size: 14px;
      color: #fff;
      border: none;
      cursor: pointer;
      border-radius: 0.02rem;
      &.primary {
        border-color: var(--sw-theme-color);
        background: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
      }
    }
  }
}
</style>
