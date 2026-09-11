<template>
  <div class="color-map-global">
    <el-form-item :label="labels.colorMode" :label-width="secondLabelWidth">
      <SwRadio
        class="mode-radio"
        direction="row"
        :option="colorModeOptions"
        v-model="currentChildrenItem.option.colorMode"
        @change="handleColorModeChange"
      />
    </el-form-item>

    <template v-if="isPiecewiseMode">
      <div class="piecewise-panel">
        <div class="piecewise-header">
          <span class="piecewise-title">{{ labels.fill }}</span>
          <div class="piecewise-actions">
            <Icon class="ghost-action" type="Operation" size="14" />
            <Icon class="piecewise-action" type="CirclePlus" size="14" @click="handleAddPiece" />
            <Icon class="piecewise-action" type="Delete" size="14" @click="handleDeletePiece" />
          </div>
        </div>

        <ScreenwrightSeriesTabs class="piecewise-tabs" v-model="activePieceTab" :tabs="pieceTabs" />

        <template v-if="currentPiece">
          <el-form-item :label="labels.valueRange" :label-width="secondLabelWidth">
            <div class="piece-range-row">
              <SwInputNumber
                class="piece-range-input"
                v-model="currentPiece.min"
                width="100"
                :min="0"
                :controls="false"
                :bottomLabel="labels.minValue"
                @change="handlePieceRangeChange"
              />
              <SwInputNumber
                class="piece-range-input"
                v-model="currentPiece.max"
                width="100"
                :min="0"
                :controls="false"
                :bottomLabel="labels.maxValue"
                @change="handlePieceRangeChange"
              />
            </div>
          </el-form-item>

          <el-form-item :label="labels.color" :label-width="secondLabelWidth">
            <div class="piece-color-row">
              <ScreenwrightColorPicker class="piece-picker" v-model="currentPiece.color" @change="handlePieceColorChange" />
              <SwInput class="piece-color-input" v-model="currentPiece.color" @change="handlePieceColorChange" />
              <SwInputNumber
                class="piece-opacity"
                v-model="currentChildrenItem.option.fillOpacity"
                width="60"
                unit="%"
                :min="0"
                :max="100"
                @change="handlePieceOpacityChange"
              />
            </div>
          </el-form-item>
        </template>
      </div>

      <el-form-item :label="labels.noDataFill" :label-width="secondLabelWidth">
        <div class="piece-color-row">
          <ScreenwrightColorPicker
            class="piece-picker"
            v-model="currentChildrenItem.option.noDataColor"
            @change="handleNoDataColorChange"
          />
          <SwInput
            class="piece-color-input"
            v-model="currentChildrenItem.option.noDataColor"
            @change="handleNoDataColorChange"
          />
          <SwInputNumber
            class="piece-opacity"
            v-model="currentChildrenItem.option.noDataOpacity"
            width="60"
            unit="%"
            :min="0"
            :max="100"
            @change="handleNoDataOpacityChange"
          />
        </div>
      </el-form-item>
    </template>

    <template v-else>
      <el-form-item :label="labels.fill" :label-width="secondLabelWidth">
        <div class="fill-row">
          <div class="fill-left">
            <ScreenwrightColorPicker
              class="fill-picker"
              v-model="currentChildrenItem.option.fillColor"
              :options="{ colorTypeOption: 'linear-gradient,single' }"
              @change="handleContinuousFillChange"
            />
          </div>
          <SwInputNumber
            class="fill-opacity"
            v-model="currentChildrenItem.option.fillOpacity"
            width="60"
            unit="%"
            :min="0"
            :max="100"
            @change="handleContinuousFillChange"
          />
        </div>
      </el-form-item>

      <el-form-item :label="labels.noDataFill" :label-width="secondLabelWidth">
        <div class="fill-row">
          <div class="fill-left">
            <ScreenwrightColorPicker
              class="fill-picker"
              v-model="currentChildrenItem.option.noDataColor"
              @change="handleNoDataColorChange"
            />
          </div>
          <SwInputNumber
            class="fill-opacity"
            v-model="currentChildrenItem.option.noDataOpacity"
            width="60"
            unit="%"
            :min="0"
            :max="100"
            @change="handleNoDataOpacityChange"
          />
        </div>
      </el-form-item>
    </template>

    <el-form-item :label="labels.borderOpacity" :label-width="secondLabelWidth">
      <SwSlider v-model="currentChildrenItem.option.borderOpacity" :min="0" :max="1" :step="0.01" @change="update" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

import ScreenwrightColorPicker from "@/components/ScreenwrightColorPicker/index.vue";
import ScreenwrightSeriesTabs from "@/components/ScreenwrightSeriesTabs/index.vue";
import SwInput from "@/components/SwInput/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwRadio from "@/components/SwRadio/index.vue";
import SwSlider from "@/components/SwSlider/index.vue";
import Icon from "@/components/Icon/index.vue";

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

interface PiecewiseItem {
  name: string;
  min: number;
  max: number;
  color: string;
}

const labels = {
  color: "\u989c\u8272",
  colorMode: "\u989c\u8272\u6a21\u5f0f",
  fill: "\u586b\u5145",
  noDataFill: "\u65e0\u6570\u636e\u586b\u5145",
  borderOpacity: "\u63cf\u8fb9\u900f\u660e\u5ea6",
  continuous: "\u8fde\u7eed\u6620\u5c04",
  piecewise: "\u5206\u6bb5\u6620\u5c04",
  interval: "\u533a\u95f4",
  valueRange: "\u6570\u503c\u8303\u56f4",
  minValue: "\u6700\u5c0f\u503c",
  maxValue: "\u6700\u5927\u503c"
};

const defaultGradientColors = ["rgba(23,26,36,1)", "rgba(45,93,253,1)"];
const defaultPiecewiseColors = ["#FF0000", "#FFF000", "#00A76F"];

const { currentChildrenItem, update } = useChildrenDrawer();
const activePieceTab = ref("");

const colorModeOptions = ref([
  { label: labels.continuous, value: "continuous" },
  { label: labels.piecewise, value: "piecewise" }
]);

const isPiecewiseMode = computed(() => {
  return currentChildrenItem.value.option?.colorMode === "piecewise";
});

const piecewiseList = computed<PiecewiseItem[]>(() => {
  return currentChildrenItem.value.option?.piecewiseList || [];
});

const pieceTabs = computed(() => {
  return piecewiseList.value.map((item) => item.name);
});

const currentPieceIndex = computed(() => {
  const index = piecewiseList.value.findIndex((item) => item.name === activePieceTab.value);
  return index === -1 ? 0 : index;
});

const currentPiece = computed<PiecewiseItem | null>(() => {
  if (piecewiseList.value.length === 0) {
    return null;
  }

  return piecewiseList.value[currentPieceIndex.value] || piecewiseList.value[0] || null;
});

const buildFillColor = (colors?: string[]): GradientColor => {
  const targetColors = Array.isArray(colors) && colors.length > 0 ? colors : defaultGradientColors;
  const step = targetColors.length > 1 ? 100 / (targetColors.length - 1) : 100;

  return {
    type: "linear-gradient",
    angle: 90,
    colors: targetColors.map((color, index) => ({
      color,
      per: Math.round(index * step)
    }))
  };
};

const extractColorsFromGradientString = (gradient: string): string[] => {
  if (!gradient.includes("linear-gradient")) {
    return [];
  }

  return gradient.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g) || [];
};

const getVisualMapColors = (fillColor: any, fallback?: string[]): string[] => {
  if (fillColor?.type === "linear-gradient" && Array.isArray(fillColor.colors)) {
    const gradientColors = fillColor.colors.map((item: GradientStop) => item?.color).filter(Boolean);
    if (gradientColors.length > 0) {
      return gradientColors;
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

const resolveRangeValue = (value: any, fallback: number): number => {
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? fallback : numericValue;
};

const normalizeColorInput = (value: any, fallback: string): string => {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    return fallback;
  }

  if (text.startsWith("#") || text.startsWith("rgb") || text.startsWith("linear-gradient")) {
    return text;
  }

  if (/^[0-9a-fA-F]{3,8}$/.test(text)) {
    return `#${text}`;
  }

  return text;
};

const resolveLegacyPieceValue = (item: any, key: "min" | "max") => {
  return (
    item?.[key] ??
    item?.range?.[key] ??
    item?.range?.value?.find((entry: any) => entry?.name === key)?.value ??
    item?.value?.find((entry: any) => entry?.name === "range")?.value?.find((entry: any) => entry?.name === key)?.value
  );
};

const resolveLegacyPieceColor = (item: any) => {
  return item?.color ?? item?.value?.find((entry: any) => entry?.name === "color")?.value;
};

const buildDefaultPiecewiseList = (min: number, max: number, colors?: string[]): PiecewiseItem[] => {
  const palette = Array.isArray(colors) && colors.length > 0 ? colors : defaultPiecewiseColors;
  const count = Math.max(3, palette.length);
  const safeMax = max > min ? max : min + 100;
  const step = (safeMax - min) / count;

  return Array.from({ length: count }, (_, index) => {
    const start = Math.round((min + step * index) * 100) / 100;
    const end = Math.round((index === count - 1 ? safeMax : min + step * (index + 1)) * 100) / 100;

    return {
      name: `${labels.interval}${index + 1}`,
      min: start,
      max: end,
      color:
        palette[index] || palette[palette.length - 1] || defaultPiecewiseColors[index % defaultPiecewiseColors.length]
    };
  });
};

const normalizePiecewiseList = (option: any): PiecewiseItem[] => {
  const fallbackMin = resolveRangeValue(option.visualMapMin, 0);
  const fallbackMax = resolveRangeValue(option.visualMapMax, 100);
  const fallbackColors = getVisualMapColors(option.fillColor, option.visualMapColor);
  const rawList =
    (Array.isArray(option.piecewiseList) && option.piecewiseList.length > 0 ? option.piecewiseList : null) ||
    (Array.isArray(option.colorList) && option.colorList.length > 0 ? option.colorList : null);

  if (!rawList) {
    return buildDefaultPiecewiseList(fallbackMin, fallbackMax, fallbackColors);
  }

  const count = rawList.length;
  const safeMax = fallbackMax > fallbackMin ? fallbackMax : fallbackMin + 100;
  const step = (safeMax - fallbackMin) / Math.max(count, 1);

  return rawList.map((item: any, index: number) => {
    const defaultMin = Math.round((fallbackMin + step * index) * 100) / 100;
    const defaultMax = Math.round((index === count - 1 ? safeMax : fallbackMin + step * (index + 1)) * 100) / 100;
    let min = resolveRangeValue(resolveLegacyPieceValue(item, "min"), defaultMin);
    let max = resolveRangeValue(resolveLegacyPieceValue(item, "max"), defaultMax);

    if (max < min) {
      [min, max] = [max, min];
    }

    return {
      name: item?.name || `${labels.interval}${index + 1}`,
      min,
      max,
      color: normalizeColorInput(
        resolveLegacyPieceColor(item),
        fallbackColors[index] ||
          fallbackColors[fallbackColors.length - 1] ||
          defaultPiecewiseColors[index % defaultPiecewiseColors.length]
      )
    };
  });
};

const renamePiecewiseItems = (list: PiecewiseItem[]) => {
  list.forEach((item, index) => {
    item.name = `${labels.interval}${index + 1}`;
  });
};

const syncContinuousOptions = () => {
  const option = currentChildrenItem.value.option;
  const colors = getVisualMapColors(option.fillColor, option.visualMapColor);
  option.visualMapColor = colors;
  option.visualMapTabsName = colors.map((_, index) => `${labels.color}${index + 1}`);
  option.fillColor = option.fillColor || buildFillColor(colors);
};

const syncPiecewiseOptions = () => {
  const option = currentChildrenItem.value.option;
  const list = normalizePiecewiseList(option);
  renamePiecewiseItems(list);
  option.piecewiseList = list;
  option.visualMapTabsName = list.map((item) => item.name);
  option.visualMapColor = list.map((item) => item.color);
  option.visualMapMin = list[0]?.min ?? resolveRangeValue(option.visualMapMin, 0);
  option.visualMapMax = list[list.length - 1]?.max ?? resolveRangeValue(option.visualMapMax, 100);
  option.fillColor = buildFillColor(option.visualMapColor);
};

const syncOptionState = () => {
  if (isPiecewiseMode.value) {
    syncPiecewiseOptions();
  } else {
    syncContinuousOptions();
  }
};

const syncActivePieceTab = () => {
  const tabs = pieceTabs.value;
  if (tabs.length === 0) {
    activePieceTab.value = "";
    return;
  }

  if (!tabs.includes(activePieceTab.value)) {
    activePieceTab.value = tabs[0];
  }
};

const ensureOptionDefaults = () => {
  const option = currentChildrenItem.value.option || (currentChildrenItem.value.option = {});
  option.colorMode = option.colorMode === "piecewise" ? "piecewise" : "continuous";
  option.fillOpacity = Number.isFinite(Number(option.fillOpacity)) ? Number(option.fillOpacity) : 100;
  option.noDataColor = option.noDataColor || "#A09E9E";
  option.noDataOpacity = Number.isFinite(Number(option.noDataOpacity)) ? Number(option.noDataOpacity) : 20;
  option.borderOpacity = Number.isFinite(Number(option.borderOpacity)) ? Number(option.borderOpacity) : 1;
  option.fillColor = option.fillColor || buildFillColor(option.visualMapColor);
  option.piecewiseList = normalizePiecewiseList(option);
  syncOptionState();
  syncActivePieceTab();
};

const handleColorModeChange = () => {
  syncOptionState();
  syncActivePieceTab();
  update();
};

const handleContinuousFillChange = () => {
  syncContinuousOptions();
  update();
};

const handlePieceColorChange = () => {
  if (!currentPiece.value) {
    return;
  }

  currentPiece.value.color = normalizeColorInput(
    currentPiece.value.color,
    defaultPiecewiseColors[currentPieceIndex.value % defaultPiecewiseColors.length]
  );
  syncPiecewiseOptions();
  update();
};

const handlePieceOpacityChange = () => {
  currentChildrenItem.value.option.fillOpacity = resolveRangeValue(currentChildrenItem.value.option.fillOpacity, 100);
  syncPiecewiseOptions();
  update();
};

const handlePieceRangeChange = () => {
  if (!currentPiece.value) {
    return;
  }

  currentPiece.value.min = resolveRangeValue(currentPiece.value.min, 0);
  currentPiece.value.max = resolveRangeValue(currentPiece.value.max, currentPiece.value.min);

  if (currentPiece.value.max < currentPiece.value.min) {
    [currentPiece.value.min, currentPiece.value.max] = [currentPiece.value.max, currentPiece.value.min];
  }

  syncPiecewiseOptions();
  update();
};

const handleNoDataColorChange = () => {
  currentChildrenItem.value.option.noDataColor = normalizeColorInput(
    currentChildrenItem.value.option.noDataColor,
    "#A09E9E"
  );
  update();
};

const handleNoDataOpacityChange = () => {
  const value = resolveRangeValue(currentChildrenItem.value.option.noDataOpacity, 20);
  currentChildrenItem.value.option.noDataOpacity = Math.min(100, Math.max(0, value));
  update();
};

const handleAddPiece = () => {
  const option = currentChildrenItem.value.option;
  const list = normalizePiecewiseList(option);
  const index = currentPieceIndex.value;
  const current = list[index] || list[list.length - 1];
  const next = list[index + 1];
  const span = Math.max(1, resolveRangeValue(current?.max, 100) - resolveRangeValue(current?.min, 0) || 50);
  const newMin = resolveRangeValue(current?.max, 0);
  let newMax = newMin + span;

  if (next) {
    newMax = resolveRangeValue(next.min, newMin + span);
    if (newMax <= newMin) {
      newMax = newMin + span;
    }
    next.min = newMax;
  }

  list.splice(index + 1, 0, {
    name: `${labels.interval}${list.length + 1}`,
    min: newMin,
    max: newMax,
    color: current?.color || defaultPiecewiseColors[(index + 1) % defaultPiecewiseColors.length]
  });

  option.piecewiseList = list;
  syncPiecewiseOptions();
  activePieceTab.value =
    option.piecewiseList[index + 1]?.name || option.piecewiseList[option.piecewiseList.length - 1]?.name || "";
  update();
};

const handleDeletePiece = () => {
  const option = currentChildrenItem.value.option;
  const list = normalizePiecewiseList(option);

  if (list.length <= 1) {
    return;
  }

  const index = currentPieceIndex.value;
  const previous = list[index - 1];
  const next = list[index + 1];
  const current = list[index];

  if (previous && next) {
    next.min = previous.max;
  } else if (!previous && next) {
    next.min = current.min;
  }

  list.splice(index, 1);
  option.piecewiseList = list;
  syncPiecewiseOptions();
  const nextIndex = Math.min(index, option.piecewiseList.length - 1);
  activePieceTab.value = option.piecewiseList[nextIndex]?.name || "";
  update();
};

watch(
  () => currentChildrenItem.value,
  () => {
    ensureOptionDefaults();
  },
  { immediate: true, deep: false }
);

watch(
  pieceTabs,
  () => {
    syncActivePieceTab();
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.color-map-global {
  padding: 2px 14px 0;
}

.mode-radio,
.fill-row,
.piece-range-row,
.piece-color-row,
.no-data-row {
  width: 100%;
}

:deep(.el-form-item) {
  margin-bottom: 10px;
}

.piecewise-panel {
  margin-bottom: 10px;
  padding-bottom: 2px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.piecewise-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-top: 8px;
}

.piecewise-title {
  color: #fff;
  font-size: 12px;
  line-height: 18px;
}

.piecewise-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #b4b7c1;
}

.ghost-action {
  opacity: 0.75;
  cursor: default;
}

.piecewise-action {
  cursor: pointer;
}

.piecewise-tabs {
  margin-bottom: 8px;
}

.piecewise-tabs :deep(.ft-series-tabs) {
  margin-bottom: 0;
}

.fill-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.fill-left {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 72px;
  width: 72px;
  min-width: 72px;
}

.fill-picker {
  width: 24px;
  min-width: 24px;
  height: 24px;
  flex: 0 0 24px;
}

.fill-opacity {
  flex: 0 0 60px;
  margin-left: auto;
}

.piece-range-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.piece-range-input {
  flex: 1;
  min-width: 0;

  :deep(.inputBox) {
    width: 100% !important;
  }
}

.piece-color-row {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 60px;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.piece-picker {
  width: 24px;
  min-width: 24px;
  height: 24px;
}

.piece-color-input {
  min-width: 0;

  :deep(.inputBox) {
    width: 100%;
  }
}

.piece-opacity {
  :deep(.inputBox) {
    width: 60px !important;
  }
}

.fill-opacity,
.piece-opacity {
  :deep(.unit) {
    top: 50%;
    right: 6px;
    transform: translateY(-50%);
    height: auto;
    line-height: 1;
  }
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

:deep(.el-form-item__content) {
  min-width: 0;
  line-height: 1;
}

:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
  margin-right: 8px;
  font-weight: 400;
  font-size: 12px;
  line-height: 28px;
  color: #fff;
}

:deep(.el-radio-group) {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;
}

:deep(.el-radio) {
  margin-right: 0;
}

:deep(.el-radio__label) {
  padding-left: 4px;
  font-size: 12px;
}

:deep(.el-input__wrapper) {
  min-height: 28px;
}

:deep(.el-input__inner) {
  font-size: 12px;
}
</style>
