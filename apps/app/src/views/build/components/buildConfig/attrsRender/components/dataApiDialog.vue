<template>
  <div class="data-api-dialog">
    <MonacoEditor language="json" v-model="inputVal" @change="update" />
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";

import MonacoEditor from "@/components/MonacoEditor/index.vue";

import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance({
  history: false
});
const props = defineProps<{
  field: string;
}>();
const inputVal = computed({
  get: () => {
    return props.field === "requestHeader"
      ? selectTargetData.value[0].requestHeader
      : selectTargetData.value[0].requestBody;
  },
  set: (val) => {
    if (props.field === "requestHeader") {
      selectTargetData.value[0].requestHeader = val;
    } else {
      selectTargetData.value[0].requestBody = val;
    }
  }
});
</script>
<style lang="scss" scoped>
.data-api-dialog {
  height: 634px;
}
</style>
