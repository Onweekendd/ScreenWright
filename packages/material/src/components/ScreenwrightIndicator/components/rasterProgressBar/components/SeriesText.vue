<template>
  <div
    class="seriesText"
    :style="{
      position: 'absolute',
      transform: 'translate(-50%, -100%)',
      ...textStyle
    }"
  >
    {{ text }}
    <span
      class="seriesUnit"
      :style="{
        position: 'relative',
        left: `${option.seriesConfig.unitTranslateX}px`,
        top: `${option.seriesConfig.unitTranslateY}px`,
        ...(option.seriesConfig.isUnitCustomStyle ? unitStyle : {})
      }"
      >{{ option.seriesConfig.unitText }}</span
    >
  </div>
</template>

<script setup lang="ts">
interface Props {
  text: string;
  textStyle: any;
  unitStyle: any;
  option: any;
}

defineProps<Props>();
</script>
