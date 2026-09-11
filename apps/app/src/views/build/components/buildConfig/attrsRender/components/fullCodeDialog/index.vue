<template>
  <div class="icon-position" @click="handleClickDialog">
    <Icon type="iconfont-fangda" />
  </div>
</template>
<script setup lang="ts">
import { useVModel } from "@vueuse/core";

import Icon from "@/components/Icon/index.vue";
import { useDialog } from "@/hooks/useDialog";
import { useUpdateInstance } from "@/views/build/components/buildConfig/useUpdateInstance";

import codeEditor from "./codeEditor.vue";
const { dialog } = useDialog();
const { selectTargetData } = useUpdateInstance();
interface Props {
  modelValue: string;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "change", value: string): void;
}>();
const input = useVModel(props, "modelValue", emit);

const handleClickDialog = () => {
  dialog({
    DialogProps: {
      title: "全屏模式",
      width: "80%",
      modalClass: "build-render-ignore"
    },
    closeBefore: async (componentData, done) => {
      const dataRes = await componentData.validate();
      input.value = dataRes.data;
      selectTargetData.value[0].data = JSON.parse(dataRes.data);
      done();
      emit("change", dataRes.data);
      emit("update:modelValue", dataRes.data);
    },
    componentProps: {
      modelValue: input.value
    },
    component: codeEditor,
    center: true
  });
};
</script>
<style lang="scss" scoped>
.icon-position {
  position: absolute;
  right: 0px;
  bottom: 0px;
  cursor: pointer;
}
</style>
