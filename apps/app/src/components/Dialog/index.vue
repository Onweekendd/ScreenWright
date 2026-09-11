<script setup lang="ts">
import type { Ref } from "vue";
import { computed, nextTick, provide, ref } from "vue";

import zhCn from "element-plus/es/locale/lang/zh-cn";

import type { DialogOptions } from "@/hooks/useDialog";

import { dialogInjectionKey } from "./constant";

defineOptions({
  name: "sw-dialog"
});
const dialogRef = ref<HTMLElement | null>(null);
const props = defineProps<DialogOptions<any>>();

const componentRef = ref<Ref<HTMLElement | null>>();

const selfVisible = ref(props.visible);

const emits = defineEmits<{
  (event: "update:visible", visible: boolean): void;
  (event: "close"): void;
}>();

const setVisible = (visible: boolean) => {
  selfVisible.value = visible;
  emits("update:visible", visible);
  emits("close");
  if (!visible && typeof props.onClose === "function") {
    props.onClose();
  }
};

const close = async () => {
  nextTick(() => {
    if (props.closeBefore) {
      props.closeBefore(componentRef.value, () => setVisible(false));
    } else {
      selfVisible.value = false;
      emits("close");
      if (typeof props.onClose === "function") {
        props.onClose();
      }
    }
  });
};
const cModalClass = computed(() => {
  const baseModalClass = props.DialogProps.modalClass
    ? `sw-dialog ${props.DialogProps.modalClass}`
    : "sw-dialog";
  return props.center ? `${baseModalClass} sw-dialog--center` : baseModalClass;
});

provide(dialogInjectionKey, {
  confirm: close,
  cancel: () => setVisible(false)
});
defineExpose({
  close
});
</script>

<template>
  <el-config-provider :locale="zhCn">
    <ElDialog
      ref="dialogRef"
      @close="setVisible(false)"
      v-model="selfVisible"
      v-bind="DialogProps"
      :modal-class="cModalClass"
      close-on-press-escape
    >
      <Component ref="componentRef" :is="component" v-bind="componentProps as any" />
    </ElDialog>
  </el-config-provider>
</template>
