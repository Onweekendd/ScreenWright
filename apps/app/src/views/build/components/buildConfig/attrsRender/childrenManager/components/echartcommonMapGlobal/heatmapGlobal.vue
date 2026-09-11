<template>
  <div class="heatmap-global">
    <el-form-item label="半径" :label-width="secondLabelWidth">
      <SwInputNumber
        v-model="currentChildrenItem.option.pointSize"
        width="100"
        :min="0"
        :controls="false"
        @change="handlePointSizeChange"
      />
    </el-form-item>

    <el-form-item label="模糊因子" :label-width="secondLabelWidth">
      <SwSlider
        v-model="blurFactorValue"
        :min="0.05"
        :max="1"
        :step="0.001"
        :show-tooltip="false"
        @change="handleBlurChange"
      />
    </el-form-item>

    <el-form-item label="数据范围" :label-width="secondLabelWidth">
      <div class="range-row">
        <SwInputNumber
          v-model="currentChildrenItem.option.visualMapMin"
          class="range-input"
          width="100"
          :controls="false"
          placeholder="最小值"
          @change="handleRangeChange"
        />
        <SwInputNumber
          v-model="currentChildrenItem.option.visualMapMax"
          class="range-input"
          width="100"
          :controls="false"
          placeholder="最大值"
          @change="handleRangeChange"
        />
      </div>
    </el-form-item>

    <el-form-item label="填充" :label-width="secondLabelWidth">
      <div class="fill-panel">
        <ScreenwrightColorPicker
          v-model="currentChildrenItem.option.fillColor"
          class="fill-picker"
          :options="{ colorTypeOption: 'linear-gradient,single' }"
          @change="handleFillChange"
        />

        <div class="preset-row">
          <button
            v-for="preset in gradientPresets"
            :key="preset.key"
            type="button"
            class="gradient-chip"
            :class="{ active: isPresetActive(preset.colors) }"
            :style="{ background: buildGradientCss(preset.colors) }"
            :title="preset.label"
            @click="applyGradientPreset(preset.colors)"
          />
        </div>

        <div class="fill-caption">最小值 -&gt; 最大值</div>
      </div>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";

import ScreenwrightColorPicker from "@/components/ScreenwrightColorPicker/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwSlider from "@/components/SwSlider/index.vue";

import { secondLabelWidth } from "../../../../constants";
import { useChildrenDrawer } from "../../useChildrenDrawer";

interface GradientStop {
  color: string;
  per: number;
}

interface GradientColor {
  type: "linear-gradient";
  angle: number;
  colors: GradientStop[];
}

interface GradientPreset {
  key: string;
  label: string;
  colors: string[];
}

const gradientPresets: GradientPreset[] = [
  {
    key: "default",
    label: "默认热力",
    colors: [
      "#313695",
      "#4575b4",
      "#74add1",
      "#abd9e9",
      "#e0f3f8",
      "#ffffbf",
      "#fee090",
      "#fdae61",
      "#f46d43",
      "#d73027",
      "#a50026"
    ]
  },
  {
    key: "green",
    label: "绿黄热力",
    colors: ["#47564b", "#8ea95a", "#f0b444"]
  },
  {
    key: "cyan",
    label: "青蓝热力",
    colors: ["#16324f", "#1c8ed6", "#90f3ff"]
  },
  {
    key: "sunset",
    label: "日落热力",
    colors: ["#391c56", "#d55672", "#f6b54d"]
  },
  {
    key: "lime",
    label: "青绿热力",
    colors: ["#173536", "#1ca57a", "#d8f06a"]
  }
];

const defaultGradientColors = gradientPresets[0].colors;

const { currentChildrenItem, update } = useChildrenDrawer();

const getOption = () => {
  return currentChildrenItem.value.option || (currentChildrenItem.value.option = {});
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

const toNumber = (value: unknown, fallback: number) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const extractColorsFromGradientString = (gradient: string): string[] => {
  return gradient.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g) || [];
};

const getGradientColors = (fillColor: unknown, fallback?: string[]): string[] => {
  if (Array.isArray(fillColor) && fillColor.length > 0) {
    return fillColor.filter((item): item is string => typeof item === "string");
  }

  if (
    fillColor &&
    typeof fillColor === "object" &&
    "type" in fillColor &&
    fillColor.type === "linear-gradient" &&
    "colors" in fillColor &&
    Array.isArray(fillColor.colors)
  ) {
    const colors = fillColor.colors
      .map((item) => (item && typeof item === "object" && "color" in item ? item.color : ""))
      .filter((item): item is string => Boolean(item));

    if (colors.length > 0) {
      return colors;
    }
  }

  if (typeof fillColor === "string" && fillColor) {
    const gradientColors = extractColorsFromGradientString(fillColor);
    if (gradientColors.length > 0) {
      return gradientColors;
    }
    return [fillColor];
  }

  if (Array.isArray(fallback) && fallback.length > 0) {
    return fallback;
  }

  return [...defaultGradientColors];
};

const buildFillColor = (colors?: string[]): GradientColor => {
  const targetColors = Array.isArray(colors) && colors.length > 0 ? colors : defaultGradientColors;
  const lastIndex = Math.max(targetColors.length - 1, 1);

  return {
    type: "linear-gradient",
    angle: 90,
    colors: targetColors.map((color, index) => ({
      color,
      per: Math.round((index / lastIndex) * 100)
    }))
  };
};

const buildGradientCss = (colors?: string[]) => {
  const targetColors = Array.isArray(colors) && colors.length > 0 ? colors : defaultGradientColors;
  return `linear-gradient(90deg, ${targetColors.join(", ")})`;
};

const getCurrentGradientColors = () => {
  const option = getOption();
  return getGradientColors(option.fillColor, option.visualMapColor);
};

const resolveBlurFactor = (option: Record<string, unknown>): number => {
  const pointSize = Math.max(toNumber(option.pointSize, 80), 1);
  const blurFactor = Number(option.blurFactor);

  if (Number.isFinite(blurFactor)) {
    return clamp(blurFactor, 0.05, 1);
  }

  const legacyBlur = Number(option.blurSize);
  if (Number.isFinite(legacyBlur)) {
    const normalizedValue = legacyBlur <= 1 ? legacyBlur : legacyBlur / pointSize;
    return clamp(normalizedValue, 0.05, 1);
  }

  return 0.613;
};

const syncVisualMapColors = () => {
  const option = getOption();
  const colors = getCurrentGradientColors();
  option.visualMapColor = colors;
  option.visualMapTabsName = colors.map((_, index) => `颜色${index + 1}`);
  option.fillColor = buildFillColor(colors);
};

const ensureOptionDefaults = () => {
  const option = getOption();
  option.pointSize = Math.max(toNumber(option.pointSize, 80), 0);
  option.visualMapMin = toNumber(option.visualMapMin, 0);
  option.visualMapMax = toNumber(option.visualMapMax, 100);
  option.minOpacity = clamp(toNumber(option.minOpacity, 0), 0, 1);
  option.maxOpacity = clamp(toNumber(option.maxOpacity, 1), 0, 1);
  option.resolution = Math.max(256, toNumber(option.resolution, 2048));
  option.fillColor = option.fillColor || buildFillColor(option.visualMapColor);
  option.blurFactor = resolveBlurFactor(option);
  option.blurSize = option.blurFactor;
  syncVisualMapColors();
};

const blurFactorValue = computed({
  get: () => resolveBlurFactor(getOption()),
  set: (value: number) => {
    const option = getOption();
    const normalizedValue = clamp(toNumber(value, 0.613), 0.05, 1);
    option.blurFactor = normalizedValue;
    option.blurSize = normalizedValue;
  }
});

const handlePointSizeChange = () => {
  const option = getOption();
  option.pointSize = Math.max(toNumber(option.pointSize, 80), 0);
  update();
};

const handleBlurChange = () => {
  const option = getOption();
  const normalizedValue = resolveBlurFactor(option);
  option.blurFactor = normalizedValue;
  option.blurSize = normalizedValue;
  update();
};

const handleRangeChange = () => {
  const option = getOption();
  let min = toNumber(option.visualMapMin, 0);
  let max = toNumber(option.visualMapMax, 100);

  if (max < min) {
    [min, max] = [max, min];
  }

  option.visualMapMin = min;
  option.visualMapMax = max;
  update();
};

const handleFillChange = () => {
  syncVisualMapColors();
  update();
};

const applyGradientPreset = (colors: string[]) => {
  const option = getOption();
  option.fillColor = buildFillColor(colors);
  syncVisualMapColors();
  update();
};

const isPresetActive = (colors: string[]) => {
  return getCurrentGradientColors().join("|") === colors.join("|");
};

watch(
  () => currentChildrenItem.value,
  () => {
    ensureOptionDefaults();
  },
  { immediate: true, deep: false }
);
</script>

<style lang="scss" scoped>
.heatmap-global {
  padding: 2px 14px 0;
}

.range-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.range-input {
  flex: 0 0 100px;
}

.fill-panel {
  width: 100%;
}

.fill-picker {
  width: 100%;

  :deep(.sw-color-picker) {
    width: 100%;
    height: 24px;
    justify-content: flex-start;
    padding: 3px;
    box-sizing: border-box;
    border: 1px solid #393b4a;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.02);
  }

  :deep(.color-preview) {
    width: 100%;
    height: 100%;
    border-radius: 2px;
  }
}

.preset-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
  margin-top: 8px;
}

.gradient-chip {
  height: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.gradient-chip.active {
  border-color: #4d7cff;
  box-shadow: 0 0 0 1px rgba(77, 124, 255, 0.24);
}

.gradient-chip:hover {
  border-color: rgba(255, 255, 255, 0.24);
  transform: translateY(-1px);
}

.fill-caption {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.65);
  font-size: 12px;
  line-height: 16px;
  text-align: center;
}

:deep(.el-form-item) {
  margin-bottom: 10px;
}

:deep(.el-form-item__content) {
  min-width: 0;
  line-height: 1;
}

:deep(.el-form-item__label) {
  overflow: hidden;
  display: inline-block;
  margin-right: 8px;
  padding: 0;
  color: #fff;
  font-weight: 400;
  font-size: 12px;
  line-height: 28px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

:deep(.el-input__wrapper) {
  min-height: 28px;
}

:deep(.el-input__inner) {
  font-size: 12px;
}

:deep(.sw-slider) {
  width: 100%;

  .el-slider__runway {
    margin-right: 10px;
  }

  .el-slider__input {
    width: 48px;
  }

  .inputBox {
    width: 56px !important;
  }
}

:deep(.sw-slider .unit) {
  top: 50%;
  right: 6px;
  transform: translateY(-50%);
  height: auto;
  line-height: 1;
}
</style>
