<template>
  <div class="fliter-option">
    <SwCollapseItem title="高斯模糊" v-model="blurEnabled" showIcon>
      <template #content>
        <el-form-item label="值" :label-width="secondLabelWidth">
          <sw-input-number v-model="blurValue" unit="px" :controls="false" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="亮度" v-model="brightnessEnabled" showIcon>
      <template #content>
        <el-form-item label="值" :label-width="secondLabelWidth">
          <SwSlider v-model="brightnessValue" :max="200" :step="1" unit="%" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="对比度" v-model="contrastEnabled" showIcon>
      <template #content>
        <el-form-item label="值" :label-width="secondLabelWidth">
          <SwSlider v-model="contrastValue" :max="200" :step="1" unit="%" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="灰度" v-model="grayscaleEnabled" showIcon>
      <template #content>
        <el-form-item label="值" :label-width="secondLabelWidth">
          <SwSlider v-model="grayscaleValue" :max="100" :step="1" unit="%" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="色相" v-model="hueEnabled" showIcon>
      <template #content>
        <el-form-item label="值" :label-width="secondLabelWidth">
          <SwSlider v-model="hueValue" :max="360" :step="1" unit="°" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="反色" v-model="invertEnabled" showIcon>
      <template #content>
        <el-form-item label="值" :label-width="secondLabelWidth">
          <SwSlider v-model="invertValue" :max="100" :step="1" unit="%" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="饱和度" v-model="saturateEnabled" showIcon>
      <template #content>
        <el-form-item label="值" :label-width="secondLabelWidth">
          <SwSlider v-model="saturateValue" :max="200" :step="1" unit="%" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="褐色" v-model="sepiaEnabled" showIcon>
      <template #content>
        <el-form-item label="值" :label-width="secondLabelWidth">
          <SwSlider v-model="sepiaValue" :max="100" :step="1" unit="%" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="阴影" v-model="shadowEnabled" showIcon>
      <template #content>
        <ItemTextShadow label="阴影" v-model="shadowInput" @change="handleShadowChange" :labelWidth="secondLabelWidth" />
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSlider } from "@screenwright/ui/slider";
import {
  buildFilterList,
  getFilterNumber,
  hasFilterFunction,
  joinFilterAndShadow,
  parseFilterList,
  removeFilterFunction,
  setFilterFunction,
  splitFilterAndShadow
} from "@editor/base/atomicCssComposers";
import ItemTextShadow from "@editor/textComponent/textConfig/ItemComponent/ItemTextShadow/index.vue";
import type { ShadowProps } from "@editor/textComponent/textConfig/ItemComponent/ItemTextShadow/type";

import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
const option = computed(() => selectTargetData.value[0].option as Record<string, any>);

// filter 字符串末尾的 drop-shadow 单独处理，其余简单函数（percent/deg/px 参数）走通用 token 解析
const restTokens = computed(() => parseFilterList(splitFilterAndShadow(option.value.filter).rest));
const currentShadow = computed(() => splitFilterAndShadow(option.value.filter).shadow);

const writeRest = (tokens: ReturnType<typeof parseFilterList>) => {
  option.value.filter = joinFilterAndShadow(buildFilterList(tokens), currentShadow.value);
};
const writeShadow = (shadow: ReturnType<typeof splitFilterAndShadow>["shadow"]) => {
  option.value.filter = joinFilterAndShadow(buildFilterList(restTokens.value), shadow);
};

/** 生成一个简单 filter 函数（如 contrast(120%)）的启用开关 + 数值两个 computed */
const useSimpleFilterFunction = (name: string, unit: string, defaultValue: number) => {
  const enabled = computed({
    get: () => hasFilterFunction(restTokens.value, name),
    set: (val: boolean) => {
      writeRest(val ? setFilterFunction(restTokens.value, name, `${defaultValue}${unit}`) : removeFilterFunction(restTokens.value, name));
      update();
    }
  });
  const value = computed({
    get: () => getFilterNumber(restTokens.value, name) ?? defaultValue,
    set: (val: number) => writeRest(setFilterFunction(restTokens.value, name, `${val}${unit}`))
  });
  return { enabled, value };
};

const { enabled: blurEnabled, value: blurValue } = useSimpleFilterFunction("blur", "px", 5);
const { enabled: brightnessEnabled, value: brightnessValue } = useSimpleFilterFunction("brightness", "%", 100);
const { enabled: contrastEnabled, value: contrastValue } = useSimpleFilterFunction("contrast", "%", 100);
const { enabled: grayscaleEnabled, value: grayscaleValue } = useSimpleFilterFunction("grayscale", "%", 50);
const { enabled: hueEnabled, value: hueValue } = useSimpleFilterFunction("hue-rotate", "deg", 180);
const { enabled: invertEnabled, value: invertValue } = useSimpleFilterFunction("invert", "%", 50);
const { enabled: saturateEnabled, value: saturateValue } = useSimpleFilterFunction("saturate", "%", 100);
const { enabled: sepiaEnabled, value: sepiaValue } = useSimpleFilterFunction("sepia", "%", 50);

const shadowEnabled = computed({
  get: () => currentShadow.value !== null,
  set: (val: boolean) => {
    writeShadow(val ? { inset: false, x: 0, y: 0, blur: 8, color: "rgba(255,255,255,1)" } : null);
    update();
  }
});
const shadowInput = computed<ShadowProps>({
  get: () => {
    const shadow = currentShadow.value ?? { x: 0, y: 0, blur: 8, color: "rgba(255,255,255,1)" };
    return { color: shadow.color, x: shadow.x, y: shadow.y, blur: shadow.blur };
  },
  set: (val) => writeShadow({ inset: false, ...val })
});
const handleShadowChange = () => update();
</script>
