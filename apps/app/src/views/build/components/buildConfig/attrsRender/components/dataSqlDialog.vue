<template>
  <div class="data-sql-dialog">
    <MonacoEditor language="sql" v-model="selectTargetData[0].sql" />
  </div>
</template>
<script setup lang="ts">
import MonacoEditor from "@/components/MonacoEditor/index.vue";

import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData } = useUpdateInstance();
</script>
<style lang="scss" scoped>
.data-sql-dialog {
  height: 634px;
}
</style>
