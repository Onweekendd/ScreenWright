<template>
  <div class="vue-part" :style="styleSizeName">
    <div
      :class="{
        ...componentClasses
      }"
      :style="styleChartName"
      :id="`vue-part-${props.element.id}`"
    >
      <PreviewComponent
        v-if="option.js && option.template"
        :element="props.element"
        :template="option.template"
        :script="option.js"
        :style="option.css"
      />
      <div v-else class="vue-part-error">自定义组件运行错误</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

import { useActionEvent } from "@/hooks/eventHandling/useActionEvent";
import { EventTypeEnum } from "@/views/build/components/buildConfig/constants";
import { ThirdPartEnumType } from "@/views/build/components/buildRender/core/ThirdParty/type";
import type { ComponentType } from "@/views/build/components/buildRender/type";

import PreviewComponent from "./preview.vue";
import { useVuePart } from "./useVuePart";

const props = defineProps<{
  element: ComponentType;
}>();

const { addEvent } = useActionEvent();

const {
  styleSizeName,
  componentClasses,
  isBuild,
  option,
  events,
  styleChartName,
  handleEventAndCallbackEvent,
  handleEncode
} = useVuePart(props.element);

const handleEventAndEncode = (info: any) => {
  if (isBuild.value) {
    return;
  }
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.Click,
    events: events.value,

    throwValue: info
  });
  handleEncode(info);
};

onMounted(() => {
  addEvent({
    [`${ThirdPartEnumType.VuePart}-${props.element.id}`]: {
      handleClick: (info: any) => {
        handleEventAndEncode(info);
      }
    }
  });
});
</script>

<style lang="scss" scoped>
.vue-part {
  width: 100%;
  height: 100%;
}
.vue-part-error {
  width: 100%;
  height: 100%;
  color: red;
}
</style>
