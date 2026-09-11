<template>
  <div class="map-bar-global">
    <SwCoordinateTabs v-model="tabsActive" :option="coordinateOption" />
    <template v-if="tabsActive === 'bar'">
      <SwCollapseItem title="柱状图设置" open>
        <template #content>
          <el-form-item label="支持透明" :label-width="secondLabelWidth">
            <el-checkbox v-model="currentOption.transparent" @change="update" />
          </el-form-item>
          <el-form-item label="混合模式" :label-width="secondLabelWidth">
            <el-select popper-class="sw-select-dropdown" v-model="currentOption.blending" @change="update">
              <el-option v-for="item in blendingOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item label="柱状类型" :label-width="secondLabelWidth">
            <el-select popper-class="sw-select-dropdown" v-model="currentOption.barType" @change="update">
              <el-option label="方柱" value="box" />
              <el-option label="圆柱" value="cylinder" />
            </el-select>
          </el-form-item>

          <el-form-item label="柱狀宽度" :label-width="secondLabelWidth">
            <SwInputNumber v-model="currentOption.barWidth" @change="update" :min="0" :step="0.1" />
          </el-form-item>

          <el-form-item label="柱状高度" :label-width="secondLabelWidth">
            <div class="multi-input">
              <SwInputNumber v-model="currentOption.minHeight" @change="update" :min="0" />
              <span class="label">最小高度</span>

              <SwInputNumber v-model="currentOption.maxHeight" @change="update" :min="0" />
              <span class="label">最大高度</span>
            </div>
          </el-form-item>

          <!-- <el-form-item label="系列间距" :label-width="secondLabelWidth">
      <template #label>
            <span>系列间距</span>
            <el-tooltip content="多系列柱状图之间的间距" placement="top">
              <Icon type="QuestionFilled" style="margin-left: 4px; color: rgba(255, 255, 255, 0.45)" size="12" />
            </el-tooltip>
          </template> 
          <SwInputNumber v-model="currentOption.seriesGap" @change="update" :min="0" :step="0.1" />
        </el-form-item> -->

          <el-form-item label="总透明度" :label-width="secondLabelWidth">
            <SwSlider v-model="currentOption.opacity" :min="0" :max="100" @change="update" />
          </el-form-item>

          <el-form-item label="开启动画" :label-width="secondLabelWidth">
            <el-checkbox v-model="currentOption.animation" @change="update" />
          </el-form-item>

          <el-form-item label="动画时长" v-if="currentOption.animation" :label-width="secondLabelWidth">
            <SwInputNumber v-model="currentOption.animationDuration" @change="update" :min="100" :step="100" />
          </el-form-item>
        </template>
      </SwCollapseItem>
      <SwCollapseItem title="柱状系列" open>
        <template #icon>
          <div class="series-actions">
            <Icon type="Plus" @click="handleSeriesChange('add')" />
            <Icon type="Delete" @click="handleSeriesChange('delete')" />
          </div>
        </template>
        <template #content>
          <template v-if="seriesList.length > 0">
            <ScreenwrightSeriesTabs v-model="activeSeriesTab" :tabs="seriesList" nameKey="name" />
            <el-form-item label="数据字段" :label-width="secondLabelWidth">
              <SwInput v-model="currentSeries.field" @change="update" placeholder="对应数据中的字段名" />
            </el-form-item>

            <el-form-item label="颜色" :label-width="secondLabelWidth">
              <sw-color-picker
                :options="{ colorTypeOption: 'linear-gradient,single' }"
                v-model:color="currentSeries.color"
                v-model:opacity="currentSeries.opacity"
                field="barColor"
                @change="update"
              />
            </el-form-item>
          </template>
          <div v-else class="empty-list">列表为空，请点击 + 添加系列</div>
        </template>
      </SwCollapseItem>
    </template>

    <template v-else>
      <SwCollapseItem title="标牌设置" open>
        <template #content>
          <el-form-item label="偏移" :label-width="secondLabelWidth">
            <div class="multi-input">
              <SwInputNumber v-model="currentOption.label.offset[0]" @change="update" />
              <span class="label">X</span>

              <SwInputNumber v-model="currentOption.label.offset[1]" @change="update" />
              <span class="label">Y</span>
            </div>
          </el-form-item>

          <el-form-item label="轮播动画" :label-width="secondLabelWidth">
            <el-switch v-model="currentOption.label.carousel.show" @change="update" />
          </el-form-item>

          <el-form-item v-if="currentOption.label.carousel.show" label="时间间隔" :label-width="secondLabelWidth">
            <SwInputNumber v-model="currentOption.label.carousel.interval" @change="update" :min="500" :step="500" />
            <span class="unit">ms</span>
          </el-form-item>
        </template>
      </SwCollapseItem>
      <SwCollapseItem title="序号" @change="update" show-icon v-model="currentOption.label.sequence.show">
        <template #content>
          <el-form-item label="文本样式" :label-width="secondLabelWidth">
            <configTextStyle v-model="sequenceTextStyleInput" @change="handleSequenceTextStyleChange" />
          </el-form-item>

          <el-form-item label="背景图片" :label-width="secondLabelWidth">
            <SwUpload
              :model-value="getTextBgUrl(currentOption.label.sequence.background)"
              @update:model-value="(val: any) => setTextBgUrl(currentOption.label.sequence, 'background', val)"
              @delete="() => setTextBgUrl(currentOption.label.sequence, 'background', '')"
            />
          </el-form-item>

          <el-form-item label="尺寸" :label-width="secondLabelWidth">
            <div class="multi-input">
              <SwInputNumber v-model="currentOption.label.sequence.background.width" @change="update" :min="0" />
              <span class="label">宽度</span>

              <SwInputNumber v-model="currentOption.label.sequence.background.height" @change="update" :min="0" />
              <span class="label">高度</span>
            </div>
          </el-form-item>
          <el-form-item label="偏移" :label-width="secondLabelWidth">
            <div class="multi-input">
              <SwInputNumber v-model="currentOption.label.sequence.offset[0]" @change="update" />
              <span class="label">X</span>

              <SwInputNumber v-model="currentOption.label.sequence.offset[1]" @change="update" />
              <span class="label">Y</span>
            </div>
          </el-form-item>
        </template>
      </SwCollapseItem>

      <SwCollapseItem title="数值" show-icon v-model="currentOption.label.value.show" @change="update">
        <template #content>
          <el-form-item label="文本样式" :label-width="secondLabelWidth">
            <configTextStyle v-model="valueTextStyleInput" @change="handleValueTextStyleChange" />
          </el-form-item>

          <el-form-item label="文字背景" :label-width="secondLabelWidth">
            <el-select
              :model-value="getTextBgFillType(currentOption.label.value.background)"
              popper-class="sw-select-dropdown"
              @update:model-value="(val: any) => setTextBgFillType(currentOption.label.value, 'background', val)"
            >
              <el-option label="颜色" value="color" />
              <el-option label="图片" value="picture" />
            </el-select>
          </el-form-item>
          <el-form-item
            label="背景颜色"
            :label-width="secondLabelWidth"
            v-if="getTextBgFillType(currentOption.label.value.background) === 'color'"
          >
            <SwSingleColorPicker
              :model-value="getTextBgColor(currentOption.label.value.background)"
              @update:model-value="(val: any) => setTextBgColor(currentOption.label.value, 'background', val)"
            />
          </el-form-item>
          <el-form-item label="背景图片" :label-width="secondLabelWidth" v-else>
            <SwUpload
              :model-value="getTextBgUrl(currentOption.label.value.background)"
              @update:model-value="(val: any) => setTextBgUrl(currentOption.label.value, 'background', val)"
              @delete="() => setTextBgUrl(currentOption.label.value, 'background', '')"
            />
          </el-form-item>

          <el-form-item label="偏移" :label-width="secondLabelWidth">
            <div class="multi-input">
              <SwInputNumber v-model="currentOption.label.value.offset[0]" @change="update" />
              <span class="label">X</span>

              <SwInputNumber v-model="currentOption.label.value.offset[1]" @change="update" />
              <span class="label">Y</span>
            </div>
          </el-form-item>

          <SwCollapseItem title="后缀" :label-width="secondLabelWidth">
            <template #content>
              <el-form-item label="内容" :label-width="secondLabelWidth">
                <SwInput v-model="currentOption.label.value.suffix.content" @change="update" />
              </el-form-item>
              <el-form-item label="文本样式" :label-width="secondLabelWidth">
                <configTextStyle v-model="suffixTextStyleInput" @change="handleSuffixTextStyleChange" />
              </el-form-item>
              <el-form-item label="偏移" :label-width="secondLabelWidth">
                <div class="multi-input">
                  <SwInputNumber v-model="currentOption.label.value.suffix.offset[0]" @change="update" />
                  <span class="label">X</span>

                  <SwInputNumber v-model="currentOption.label.value.suffix.offset[1]" @change="update" />
                  <span class="label">Y</span>
                </div>
              </el-form-item>
            </template>
          </SwCollapseItem>
        </template>
      </SwCollapseItem>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import { cloneDeep } from "@/components/ScreenwrightSceneComponent/utils";
import ScreenwrightSeriesTabs from "@/components/ScreenwrightSeriesTabs/index.vue";
import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwColorPicker from "@/components/SwColorPicker/index.vue";
import SwCoordinateTabs from "@/components/SwCoordinateTabs/index.vue";
import SwInput from "@/components/SwInput/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwSingleColorPicker from "@/components/SwSingleColorPicker/index.vue";
import SwSlider from "@/components/SwSlider/index.vue";
import SwUpload from "@/components/SwUpload/index.vue";
import Icon from "@/components/Icon/index.vue";
import configTextStyle from "@/views/build/components/buildConfig/components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "@/views/build/components/buildConfig/components/configTextStyle/useTextStyleAttrs";

import { secondLabelWidth } from "../../../../constants";
import { useChildrenDrawer } from "../../useChildrenDrawer";

const { currentChildrenItem, update } = useChildrenDrawer();

const activeSeriesTab = ref("");

const tabsActive = ref("bar");

const currentOption = computed(() => {
  return currentChildrenItem.value?.option || {};
});

const seriesList = computed(() => {
  return currentOption.value.seriesList || [];
});

const currentSeries = computed(() => {
  const list = seriesList.value;
  const name = activeSeriesTab.value;
  const item = list.find((p: any) => p.name === name);
  return item || list[0] || {};
});

// 文本样式 Hook
const {
  input: sequenceTextStyleInput,
  handleConfigTextChange: handleSequenceTextStyleChange,
  getInitValue: initSequenceTextStyle
} = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "color",
  attrs: "label.sequence.textStyle"
});

const {
  input: valueTextStyleInput,
  handleConfigTextChange: handleValueTextStyleChange,
  getInitValue: initValueTextStyle
} = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "color",
  attrs: "label.value.textStyle"
});

const {
  input: suffixTextStyleInput,
  handleConfigTextChange: handleSuffixTextStyleChange,
  getInitValue: initSuffixTextStyle
} = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "color",
  attrs: "label.value.suffix.textStyle"
});

// 背景样式处理
type TextBgFillType = "color" | "picture";
type TextBgValue = string | { type?: TextBgFillType; color?: string; url?: string; image?: string } | undefined | null;

const normalizeTextBg = (val: TextBgValue): { type: TextBgFillType; color: string; url: string } => {
  if (typeof val === "string") {
    return { type: "color", color: val, url: "" };
  }
  const type = val?.type === "picture" ? "picture" : "color";
  const color = typeof val?.color === "string" ? val.color : "transparent";
  const url = typeof val?.url === "string" ? val.url : val?.image || "";
  if (type === "color" && url && color === "transparent") {
    return { type: "picture", color, url };
  }
  return { type, color, url };
};

const getTextBgFillType = (val: TextBgValue): TextBgFillType => normalizeTextBg(val).type;
const getTextBgColor = (val: TextBgValue): string => normalizeTextBg(val).color;
const getTextBgUrl = (val: TextBgValue): string => normalizeTextBg(val).url;

const setTextBgFillType = (target: any, key: string, fillType: TextBgFillType) => {
  const cur = normalizeTextBg(target[key] as TextBgValue);
  if (fillType === "color") {
    target[key] = cur.color || "transparent";
  } else {
    target[key] = { type: "picture", image: cur.url || "", color: cur.color || "transparent" };
  }
  update();
};
const setTextBgColor = (target: any, key: string, color: string) => {
  const cur = normalizeTextBg(target[key] as TextBgValue);
  if (cur.type === "picture") {
    target[key] = { type: "picture", image: cur.url || "", color: color || "transparent" };
  } else {
    target[key] = color || "transparent";
  }
  update();
};
const setTextBgUrl = (target: any, key: string, url: string) => {
  const cur = normalizeTextBg(target[key] as TextBgValue);
  target[key] = { type: "picture", image: url || "", color: cur.color || "transparent" };
  update();
};

const blendingOptions = [
  { label: "正常", value: "NormalBlending" },
  { label: "相加", value: "AdditiveBlending" },
  { label: "相减", value: "SubtractiveBlending" },
  { label: "相乘", value: "MultiplyBlending" }
];

const coordinateOption = [
  { label: "柱状图", value: "bar" },
  { label: "标牌", value: "label" }
];

const initData = () => {
  if (!currentChildrenItem.value) return;
  if (!currentChildrenItem.value.option) {
    currentChildrenItem.value.option = {};
  }
  const opt = currentChildrenItem.value.option;
  let changed = false;

  const defaults: any = {
    transparent: true,
    blending: "NormalBlending",
    barType: "box",
    barWidth: 2,
    minHeight: 4,
    maxHeight: 40,
    seriesGap: 0.8,
    opacity: 100,
    animation: true,
    animationDuration: 1000
  };

  Object.keys(defaults).forEach((key) => {
    if (opt[key] === undefined) {
      opt[key] = defaults[key];
      changed = true;
    }
  });

  if (!opt.seriesList || opt.seriesList.length === 0) {
    opt.seriesList = [{ id: "series_" + Date.now(), name: "系列1", field: "value", color: "#00ffff" }];
    changed = true;
  }

  if (opt.label && !opt.label.carousel) {
    opt.label.carousel = { show: false, interval: 1000 };
    changed = true;
  }

  if (changed) {
    update();
  }

  if (opt.seriesList && opt.seriesList.length > 0 && !activeSeriesTab.value) {
    activeSeriesTab.value = opt.seriesList[0].name;
  }
};

const handleSeriesChange = (type: "add" | "delete") => {
  const list = seriesList.value;
  if (type === "add") {
    let maxNum = 0;
    list.forEach((p: any) => {
      const match = typeof p.name === "string" ? p.name.match(/系列(\d+)/) : null;
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) maxNum = num;
      }
    });
    const newName = `系列${maxNum + 1}`;

    const newItem =
      list.length > 0 ? cloneDeep(list[list.length - 1]) : { name: "系列1", field: "value", color: "#00ffff" };
    newItem.name = newName;
    newItem.id = "series_" + Date.now();
    list.push(newItem);
    activeSeriesTab.value = newItem.name;
  } else if (type === "delete" && list.length > 1) {
    const index = list.findIndex((p: any) => p.name === activeSeriesTab.value);
    if (index !== -1) {
      list.splice(index, 1);
      const nextIndex = Math.max(0, index - 1);
      activeSeriesTab.value = list[nextIndex].name;
    }
  }
  update();
};

watch(
  () => currentChildrenItem.value,
  (val) => {
    if (val) {
      initData();
      initSequenceTextStyle("label.sequence.textStyle");
      initValueTextStyle("label.value.textStyle");
      initSuffixTextStyle("label.value.suffix.textStyle");
    }
  },
  { immediate: true, deep: true }
);

onMounted(() => {
  initData();
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
.map-bar-global {
  padding: 0 16px;
  .multi-input {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;

    :deep(.sw-input-number) {
      flex: 1;
    }

    .label {
      color: rgba(255, 255, 255, 0.45);
      font-size: 12px;
      white-space: nowrap;
    }
  }
  .empty-list {
    padding: 20px;
    text-align: center;
    color: rgba(255, 255, 255, 0.45);
    font-size: 13px;
  }
  .sub-tabs {
    display: flex;
    background: #1d2122;
    border-radius: 4px;
    padding: 2px;
    margin-bottom: 12px;

    .sub-tab-item {
      flex: 1;
      height: 24px;
      line-height: 24px;
      text-align: center;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.65);
      cursor: pointer;
      border-radius: 2px;
      transition: all 0.3s;

      &.active {
        background: #363637;
        color: #fff;
      }

      &:hover:not(.active) {
        color: #fff;
      }
    }
  }
}
</style>
