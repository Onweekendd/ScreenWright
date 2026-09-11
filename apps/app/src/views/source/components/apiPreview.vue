<template>
  <div class="api-preview" v-loading="loading">
    <apiPreviewHeader />
    <apiPreviewList />
    <apiPreviewResponse />
  </div>
</template>
<script setup lang="ts">
import { onMounted } from "vue";

import { cloneDeep } from "lodash-es";

import type { DbItem } from "@/model/DataModel";

import apiPreviewHeader from "./apiPreviewHeader.vue";
import apiPreviewList from "./apiPreviewList.vue";
import apiPreviewResponse from "./apiPreviewResponse.vue";
import { defaultParams } from "./constant";
import { useApiPreviewParams } from "./useApiPreviewParams";

const { params, loading } = useApiPreviewParams();
interface Props {
  row: DbItem;
}
const props = defineProps<Props>();
onMounted(() => {
  params.value = cloneDeep(defaultParams);
  if (props.row.config) {
    const config = JSON.parse(props.row.config);
    params.value.url = config.baseUrl;
  }
});
</script>
