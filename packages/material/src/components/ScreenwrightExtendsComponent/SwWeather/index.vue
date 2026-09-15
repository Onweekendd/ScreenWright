<template>
  <div class="ft-weather">
    <div v-for="item in dataChartItemList" :key="item.weather" class="default-weather" :style="[styleDefaultFont]">
      <img
        class="weather-icon"
        v-if="element.option.isIcon"
        :style="[styleIcon]"
        :src="setMinioUrl(getWeather(item.weather))"
        draggable="false"
      />
      <div class="weather-info" v-if="element.option.isWeather">
        <span :data-translate="item.weather">{{ item.weather }}</span>
      </div>
      <div class="temperature-info" v-if="element.option.isTemperature">
        <template v-if="element.option.weatherType === weatherType[0].value">
          <span> {{ item.temperature ? item.temperature.min : "" }} </span>
          <span> {{ element.option.suffix }} </span>
        </template>
        <template v-if="element.option.weatherType === weatherType[1].value">
          <span> {{ item.temperature ? item.temperature.min : "" }} </span>
          <span> {{ element.option.connector }} </span>
          <span> {{ item.temperature ? item.temperature.max : "" }} </span>
          <span> {{ element.option.suffix }} </span>
        </template>
      </div>
      <div class="wind-info" v-if="element.option.isWind">
        <span> {{ item.wind ? item.wind.direction : "" }} </span>
        <span> {{ item.wind ? item.wind.level : "" }} </span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { setMinioUrl } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";

import { useSwWeather } from "./useSwWeather";

const props = defineProps<{
  element: ComponentType;
}>();
const { dataChartItemList, styleDefaultFont, styleIcon, weatherType, getWeather } = useSwWeather(props.element);
</script>
<style lang="scss" scoped>
.ft-weather {
  width: 100%;
  height: 100%;
}
.default-weather {
  height: 100%;
  color: #ffffff;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  & > div {
    margin: 2px 10px;
  }
  .weather-icon {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translate(0, -50%);
  }
}
</style>
