<template>
  <div class="select-version" v-loading="loading">
    <versionList :listData="listData" v-model="selectVersionCode" />
    <div class="select-version-footer">
      <span @click="cancel">取消</span>
      <span @click="confirm" class="button-primary">确定</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject } from "vue";
import { onMounted, ref } from "vue";

import { dialogInjectionKey } from "@/components/Dialog/constant";
import type { ScreenVersion } from "@/model/Version";

import versionList from "./versionList.vue";

const { confirm, cancel } = inject(dialogInjectionKey)!;
interface Props {
  listData: ScreenVersion[];
}
const props = defineProps<Props>();
const selectVersionCode = ref("");
const loading = ref(false);
onMounted(() => {
  selectVersionCode.value = props.listData[0].versionCode;
});
const validate = () => {
  return {
    success: true,
    loading: false,
    versionCode: selectVersionCode.value
  };
};
defineExpose({
  validate
});
</script>
<style lang="scss" scoped>
.select-version-footer {
  text-align: right;
  padding: 20px 0px 10px 0px;
  span {
    color: #ffffff;
    cursor: pointer;
    padding: 5px 10px;
    margin: 0 5px;
    border-color: #3d404c;
    background-color: #3d404c;
  }
  .button-primary {
    border-color: var(--sw-theme-color);
    background: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
  }
}
</style>
