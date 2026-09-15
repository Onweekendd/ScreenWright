<template>
  <SwSheetExcel @confirm="onConfirm" :width="1168" :height="600" :dataTable="selectTargetData[0].data" :button="true" />
</template>
<script setup lang="ts">
import { inject } from "vue";

import { defaults, flow, keys, map, reduce, union } from "lodash-es";

import { dialogInjectionKey } from "@/components/Dialog/constant";
import SwSheetExcel from "@/components/SwSheetExcel/index.vue";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";

import { useUpdateInstance } from "../../useUpdateInstance";

const { cancel } = inject(dialogInjectionKey)!;

const { emitFilterTrigger } = useCallbackArguments();
const { selectTargetData, update } = useUpdateInstance({
  history: false
});
function completeObjectKeys<T extends Record<string, any>>(data: T[]): T[] {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  // 收集所有对象的键并去重
  const allKeys = flow(
    (items: T[]) => items.map((obj) => keys(obj)),
    (keyArrays: string[][]) => union(...keyArrays)
  )(data);

  // 创建一个包含所有键的空对象作为默认值
  const defaultObj = reduce(
    allKeys,
    (result, key) => {
      result[key] = null;
      return result;
    },
    {} as Record<string, any>
  ) as T;

  // 使用 defaults 函数补全每个对象的键
  return map(data, (obj) => defaults({ ...obj }, defaultObj));
}
const onConfirm = (data: any) => {
  selectTargetData.value[0].data = completeObjectKeys(data);
  emitFilterTrigger(`${selectTargetData.value[0].id}`);
  update();
  cancel();
};
</script>
