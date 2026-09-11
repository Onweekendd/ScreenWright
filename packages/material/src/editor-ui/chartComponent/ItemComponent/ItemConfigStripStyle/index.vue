<template>
  <SwCollapseItem :title="title" open>
    <template #content>
      <configStripStyle v-bind="$attrs" />
      <!-- <el-form-item label="高度">
        <SwInputNumber v-model="selectTargetData[0].option.height" @change="update" />
      </el-form-item> -->
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";

// import { SwInputNumber } from "@screenwright/ui/input-number"
import configStripStyle from "../../../components/configStripStyle/index.vue";

interface Props {
  title?: string;
}
withDefaults(defineProps<Props>(), {
  title: ""
});
</script>
