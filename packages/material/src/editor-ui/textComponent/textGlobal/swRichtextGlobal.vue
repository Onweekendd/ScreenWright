<template>
  <Editor v-if="isRichText" v-model="selectTargetData[0].option.content" @change="update" />
</template>
<script setup lang="ts">
import { computed } from "vue";

import { useUpdateInstance } from "../../useUpdateInstance";
import Editor from "../textConfig/components/TextFtRichTextConfig/Editor.vue";

const { update, selectTargetData } = useUpdateInstance();

const isRichText = computed(() => {
  if (selectTargetData.value.length == 1) {
    return selectTargetData.value[0].component.prop.includes("ftRichtext");
  }
  return false;
});
</script>
