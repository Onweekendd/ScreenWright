<template>
  <div class="curved-track-list">
    <!-- 使用 option 对象配置弧形轨道，imageSize / gap 用 px -->
    <threeContainer
      :images="mergedOption.imageList"
      :image-size="imageSizeWorld"
      :gap="gapWorld"
      :curve-direction="mergedOption.curveDirection"
      :curve-strength="mergedOption.curveStrength"
      :curve-frequency="mergedOption.curveFrequency"
      :wheel-direction="mergedOption.wheelDirection"
      :wheel-factor="mergedOption.wheelFactor"
      :disabled-scroll="mergedOption.disabledScroll"
      @onImageClick="onImageClick"
    />
  </div>
</template>

<script setup lang="ts">
import { EventTypeEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

import threeContainer from "./threeContent.vue";
import { useCurvedTrackList } from "./useCurvedTrackList";

defineOptions({
  name: "CurvedTrackList"
});
interface Props {
  element: ComponentType;
}
const props = defineProps<Props>();

const { mergedOption, imageSizeWorld, gapWorld, handleEventAndCallbackEvent } = useCurvedTrackList(props.element);

const onImageClick = (val: any) => {
  console.log("onImageClick val", val);
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.Click,
    events: props.element.events,
    throwValue: val.imageItem
  });
};
</script>

<style lang="scss" scoped>
.curved-track-list {
  width: 100%;
  height: 100%;
}
</style>
