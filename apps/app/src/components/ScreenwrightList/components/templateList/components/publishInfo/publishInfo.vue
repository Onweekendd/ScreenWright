<template>
  <div class="publish-info" v-if="params" v-loading="loading">
    <template v-if="isSameVersionStatus">
      <publishDetail v-show="params.status" />
      <publishApplication v-show="!params.status" />
    </template>
    <template v-else>
      <differentVersion />
    </template>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted } from "vue";
import { toRef } from "vue";

import type { ScreenItem } from "@/model/Visual";

import differentVersion from "./differentVersion.vue";
import publishApplication from "./publishApplication.vue";
import publishDetail from "./publishDetail.vue";
// import publishMapInfo from "./publishMapInfo.vue";
import { usePublishInfo } from "./usePublishInfo";

interface Props {
  item: ScreenItem;
  type: string;
}
const props = defineProps<Props>();
const { params, loading, options, initItemData } = usePublishInfo();

const isSameVersionStatus = computed(() => {
  console.log(options.value, "options.value");
  if (!params.value) {
    return false;
  }

  const currentVersion = options.value.find((version: any) => version.status) || undefined;
  if (currentVersion) {
    return currentVersion.value === params.value.versionCode;
  }
  return true;
});

onMounted(() => {
  initItemData(toRef(props, "item"));
});
</script>
