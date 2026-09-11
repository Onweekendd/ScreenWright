<!-- 线的全局 -->
<template>
  <div class="line-global">
    <SwCollapseItem title="线特效">
      <template #content>
        <el-form-item label="类型" :label-width="secondLabelWidth">
          <SwRadio
            direction="row"
            :option="effectType"
            v-model="currentChildrenItem.option.effectType"
            @change="update"
          />
        </el-form-item>
        <el-form-item
          label="动画时间"
          :label-width="secondLabelWidth"
          v-if="currentChildrenItem.option.effectType === 'period'"
        >
          <SwInputNumber @change="update" v-model="currentChildrenItem.option.period" unit="s" :min="1" />
        </el-form-item>
        <el-form-item
          :label-width="secondLabelWidth"
          label="速度"
          v-if="currentChildrenItem.option.effectType === 'constantSpeed'"
        >
          <sw-input-number
            @change="update"
            v-model.number="currentChildrenItem.option.constantSpeed"
            unit="px/s"
            :min="0"
          />
        </el-form-item>
        <el-form-item :label-width="secondLabelWidth" label="延时">
          <sw-input-number v-model.number="currentChildrenItem.option.delay" unit="s" :min="0" @change="update" />
        </el-form-item>
        <el-form-item :label-width="secondLabelWidth" label="标记图形" title="标记图形">
          <el-select
            popper-class="sw-select-dropdown"
            v-model="currentChildrenItem.option.effectSymbol"
            @change="update"
          >
            <el-option v-for="item in effectSymbol" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item
          :label-width="secondLabelWidth"
          label="图片"
          v-if="currentChildrenItem.option.effectSymbol === 'image'"
        >
          <SwUpload v-model="currentChildrenItem.option.effectSymbolImage" @change="update" @delete="update" />
        </el-form-item>

        <el-form-item label="颜色" v-else :label-width="secondLabelWidth">
          <sw-color-picker
            :options="{ colorTypeOption: 'linear-gradient,single' }"
            v-model:color="currentChildrenItem.option.effectColor"
            v-model:opacity="currentChildrenItem.option.effectOpacity"
            field="effectColor"
            @change="update"
          />
        </el-form-item>

        <el-form-item label="尺寸" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model.number="currentChildrenItem.option.effectSymbolWidth"
              unit="px"
              bottomLabel="宽度"
              :min="0"
              @change="update"
            />
            <sw-input-number
              v-model.number="currentChildrenItem.option.effectSymbolHeight"
              unit="px"
              bottomLabel="高度"
              :min="0"
              @change="update"
            />
          </div>
        </el-form-item>

        <el-form-item label="特效尾迹" :label-width="secondLabelWidth">
          <sw-slider @change="update" v-model="currentChildrenItem.option.trailLength" :min="0" :max="1" :step="0.01" />
        </el-form-item>
        <el-form-item label="循环" :label-width="secondLabelWidth">
          <el-checkbox @change="update" v-model="currentChildrenItem.option.loop" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="线">
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-color-picker
            :options="{ colorTypeOption: 'linear-gradient,single' }"
            v-model:color="currentChildrenItem.option.lineColor"
            v-model:opacity="currentChildrenItem.option.lineOpacity"
            field="lineColor"
            @change="update"
          />

          <!-- <SwSingleColorPicker @change="update" v-model="selectTargetData[0].option.areaActiveColor" /> -->
        </el-form-item>

        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <sw-input-number @change="update" v-model="currentChildrenItem.option.lineWidth" unit="px" :min="0" />
        </el-form-item>
      </template>
    </SwCollapseItem>

    <SwCollapseItem title="文本标签" show-icon v-model="currentChildrenItem.option.lineLabelShow" @change="update">
      <template #content>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="input" @change="handleChange" />
        </el-form-item>
        <el-form-item label="位置" :label-width="secondLabelWidth">
          <el-select
            popper-class="sw-select-dropdown"
            v-model="currentChildrenItem.option.lineLabelPosition"
            @change="update"
          >
            <el-option
              v-for="item in lineLabelPositionType"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwColorPicker from "@/components/SwColorPicker/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwRadio from "@/components/SwRadio/index.vue";
import SwSlider from "@/components/SwSlider/index.vue";
import SwUpload from "@/components/SwUpload/index.vue";

import type { StyleProps } from "../../../../components/configTextStyle/configTextStyle";
import configTextStyle from "../../../../components/configTextStyle/index.vue";
import { secondLabelWidth } from "../../../../constants";
import { useChildrenDrawer } from "../../useChildrenDrawer";

const { currentChildrenItem, update } = useChildrenDrawer();
const input = ref({
  fontSize: currentChildrenItem.value.option.lineLabelFontSize,
  fontFamily: currentChildrenItem.value.option.lineLabelFontFamily,
  fontWeight: currentChildrenItem.value.option.lineLabelFontWeight,
  fontStyle: currentChildrenItem.value.option.lineLabelFontStyle,
  color: currentChildrenItem.value.option.lineLabelColor
});
const handleChange = (key: string, value: StyleProps) => {
  currentChildrenItem.value.option.lineLabelColor = value.color;
  currentChildrenItem.value.option.lineLabelFontSize = value.fontSize;
  currentChildrenItem.value.option.lineLabelFontFamily = value.fontFamily;
  currentChildrenItem.value.option.lineLabelFontWeight = value.fontWeight;
  currentChildrenItem.value.option.lineLabelFontStyle = value.fontStyle;
  update();
};

const effectType = ref([
  { label: "按时间", value: "period" },
  { label: "按速度", value: "constantSpeed" }
]);
const lineLabelPositionType = ref([
  { label: "起始点", value: "start" },
  { label: "中点", value: "middle" },
  { label: "结束点", value: "end" }
]);
const effectSymbol = ref([
  {
    label: "圆",
    value: "circle"
  },
  {
    label: "方形",
    value: "rect"
  },
  {
    label: "方圆形",
    value: "roundRect"
  },
  {
    label: "三角形",
    value: "triangle"
  },
  {
    label: "菱形",
    value: "diamond"
  },
  {
    label: "水滴形",
    value: "pin"
  },
  {
    label: "箭头形",
    value: "arrow"
  },
  {
    label: "自定义",
    value: "image"
  }
]);
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
