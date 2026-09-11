<template>
  <svg :width="width" :height="height">
    <defs>
      <clipPath :id="`clipPath${uid}`">
        <rect
          v-for="(sectionRect, sectionRectIndex) in sectionRectList"
          :key="sectionRectIndex"
          :x="sectionRect.x"
          y="0"
          :rx="option.gridConfig.borderRadius"
          :ry="option.gridConfig.borderRadius"
          :width="sectionRect.width"
          :height="height"
        />
      </clipPath>
      <linearGradient :id="`foreGradient${uid}`" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0" :stop-color="foregroundColor[0].color" :stop-opacity="foregroundColor[0].opacity" />
        <stop offset="1" :stop-color="foregroundColor[1].color" :stop-opacity="foregroundColor[1].opacity" />
      </linearGradient>
    </defs>
    <rect
      :width="width"
      :height="height"
      :fill="option.gridConfig.backgroundColor"
      :clip-path="`url(#clipPath${uid})`"
    />
    <rect
      :width="width * valueProportion"
      :height="height"
      :fill="`url(#foreGradient${uid})`"
      :clip-path="`url(#clipPath${uid})`"
    >
      <animate
        attributeName="width"
        from="0"
        :to="width * valueProportion"
        :dur="`${option.globalConfig.isUsed ? option.globalConfig.animatieTime : 10}ms`"
        repeatCount="freeze"
      />
    </rect>
  </svg>
</template>

<script setup lang="ts">
interface Props {
  width: number;
  height: number;
  option: any;
  uid: string;
  sectionRectList: any[];
  valueProportion: number;
  foregroundColor: any[];
}

defineProps<Props>();
</script>
