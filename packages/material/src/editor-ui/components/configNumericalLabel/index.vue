<template>
  <div class="config-numerical-label" v-if="selectTargetData[0].option">
    <el-form-item label="文本样式" :label-width="labelWidth">
      <configTextStyle v-model="input" @change="handleConfigTextChange" />
    </el-form-item>
    <el-form-item label="偏移" :label-width="labelWidth">
      <div class="legend-size-wrapper flex flex-justify-between">
        <SwInputNumber v-model="offsetX" :controls="false" unit="px" bottom-label="X" width="100" @change="update" />
        <SwInputNumber v-model="offsetY" :controls="false" unit="px" bottom-label="Y" width="100" @change="update" />
      </div>
    </el-form-item>

    <el-form-item label="后缀" :label-width="labelWidth" v-if="type === 'custom-suffix'">
      <div class="legend-size-wrapper flex flex-justify-between">
        <SwInput @change="update" v-model="selectTargetData[0].option.seriesLabelSuffix" />
      </div>
    </el-form-item>

    <el-form-item label="文本自定义" :label-width="labelWidth" v-if="type === 'custom-text'">
      <div class="legend-size-wrapper flex flex-center">
        <SwInput style="margin-right: 10px" @change="update" v-model="selectTargetData[0].option.xAxisLabelCustom" />
        <el-popover placement="top-start" width="200" trigger="hover">
          <template #reference>
            <Icon class="custom-icon" type="QuestionFilled" size="16" color="rgb(180, 183, 193)" />
          </template>
          <div>
            <div>字符串模板 模板变量有：</div>
            <div>{a}：系列名。</div>
            <div>{b}：数据名。</div>
            <div>{c}：数据值。</div>
            <div>{@xxx}：数据中名为 'xxx' 的维度的值，如 {@product} 表示名为 'product' 的维度的值。</div>
            <div>{@[n]}：数据中维度 n 的值，如 {@[3]} 表示维度 3 的值，从 0 开始计数</div>
          </div>
        </el-popover>
      </div>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import Icon from "@editor/base/Icon/index.vue";

import { useUpdateInstance } from "../../useUpdateInstance";
import configTextStyle from "../configTextStyle/index.vue";
import { useFontStyleAttrs } from "../configTextStyle/useTextStyleAttrs";

interface Props {
  labelWidth?: string | number;
  type?: "custom-text" | "custom-suffix" | "none";
  index?: number;
}

const props = withDefaults(defineProps<Props>(), {
  labelWidth: "73",
  type: "custom-suffix",
  index: undefined
});

const { selectTargetData, update } = useUpdateInstance();

const { input, handleConfigTextChange } = useFontStyleAttrs(
  {
    fontFamily: "seriesLabelFontFamily",
    fontStyle: "seriesLabelFontStyle",
    fontWeight: "seriesLabelFontWeight",
    fontSize: "seriesLabelFontSize",
    color: "seriesLabelColor"
  },
  props.index
);

const offsetX = computed({
  get() {
    if (props.index !== undefined && selectTargetData.value[0].option.seriesLabelOffsetX) {
      return selectTargetData.value[0].option.seriesLabelOffsetX[props.index];
    }
    return selectTargetData.value[0].option.seriesLabelOffsetX || 0;
  },
  set(value) {
    if (props.index !== undefined) {
      selectTargetData.value[0].option.seriesLabelOffsetX[props.index] = value;
    } else {
      selectTargetData.value[0].option.seriesLabelOffsetX = value;
    }
  }
});

const offsetY = computed({
  get() {
    if (props.index !== undefined && selectTargetData.value[0].option.seriesLabelOffsetY) {
      return selectTargetData.value[0].option.seriesLabelOffsetY[props.index];
    }
    return selectTargetData.value[0].option.seriesLabelOffsetY || 0;
  },
  set(value) {
    if (props.index !== undefined) {
      selectTargetData.value[0].option.seriesLabelOffsetY[props.index] = value;
    } else {
      selectTargetData.value[0].option.seriesLabelOffsetY = value;
    }
  }
});
</script>

<style lang="scss" scoped>
.legend-size-wrapper {
  width: 100%;
  .custom-icon {
    position: relative;
    top: 2px;
  }
}
</style>
