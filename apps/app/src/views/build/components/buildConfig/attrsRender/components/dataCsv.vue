<template>
  <div class="data-csv">
    <dataSelect v-model="input" :type="DataSourceType.LOCAL" @change="selectChange" />
    <dataFilter />

    <dataResponse />
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";

import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { DataSourceType } from "@/views/source/type";

import { useUpdateInstance } from "../../useUpdateInstance";
import dataFilter from "./dataFilter.vue";
import dataResponse from "./dataResponse.vue";
import dataSelect from "./dataSelect.vue";

const { emitFilterTrigger } = useCallbackArguments();
const { selectTargetData, update } = useUpdateInstance({
  history: false
});
const input = ref("");

const selectChange = async () => {
  emitFilterTrigger(`${selectTargetData.value[0].id}`);
  update();
};

onMounted(() => {
  const dataSource = selectTargetData.value[0].dataSource;
  if (dataSource && Object.keys(dataSource).length > 0) {
    input.value = dataSource.id;
  } else {
    input.value = "";
  }
});
</script>
