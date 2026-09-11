<template>
  <div
    v-if="option.seriesConfig.tagShow"
    class="section"
    :style="{
      position: 'relative',
      left: `${option.seriesConfig.tagTranslateX}px`,
      top: `${option.seriesConfig.tagTranslateY}px`,
      ...sectionStyle
    }"
  >
    <div :style="{ position: 'absolute', transform: 'translate(-50%)', top: '0px', left: '0px', whiteSpace: 'nowrap' }">
      {{ sectionMin }}
      <div
        class="sectionUnit"
        :style="{
          display: 'inline-block',
          transform: `translate(${option.seriesConfig.tagUnitTranslateX}px, ${option.seriesConfig.tagUnitTranslateY}px)`,
          ...(option.seriesConfig.isTagUnitCustomStyle ? sectionUnitStyle : {})
        }"
      >
        {{ option.seriesConfig.tagUnitText }}
      </div>
    </div>
    <div
      :style="{
        position: 'absolute',
        transform: 'translate(-50%)',
        top: '0px',
        left: `${width}px`,
        whiteSpace: 'nowrap'
      }"
    >
      {{ sectionMax }}
      <div
        class="sectionUnit"
        :style="{
          display: 'inline-block',
          transform: `translate(${option.seriesConfig.tagUnitTranslateX}px, ${option.seriesConfig.tagUnitTranslateY}px)`,
          ...(option.seriesConfig.isTagUnitCustomStyle ? sectionUnitStyle : {})
        }"
      >
        {{ option.seriesConfig.tagUnitText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  width: number;
  option: any;
  sectionStyle: any;
  sectionUnitStyle: any;
  sectionMin: string | number;
  sectionMax: string | number;
}

defineProps<Props>();
</script>
