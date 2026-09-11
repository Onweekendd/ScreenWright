<template>
  <div class="subtabs-text-config">
    <SwCollapseItem title="文字">
      <template #content>
        <el-form-item label="边距" :label-width="secondLabelWidth">
          <div class="flex flex-justify-between" style="width: 100%">
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.paddingTop"
              width="40"
              bottomLabel="上"
            />
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.paddingBottom"
              width="40"
              bottomLabel="下"
            />
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.paddingLeft"
              width="40"
              bottomLabel="左"
            />
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.paddingRight"
              width="40"
              bottomLabel="右"
            />
          </div>
        </el-form-item>
        <el-form-item label="文字方向" :label-width="secondLabelWidth">
          <SwRadio
            direction="row"
            @change="update"
            :option="adaptationType"
            v-model="selectTargetData[0].option.writingMode"
          />
        </el-form-item>

        <ItemSelectAlign
          v-if="selectTargetData[0].option.writingMode == 'horizontal-tb'"
          label="水平对齐"
          :type="typeAttrs.flex"
          v-model="selectTargetData[0].option.alignItems"
          @change="update"
        />

        <ItemSelectAlign
          v-if="selectTargetData[0].option.writingMode == 'tb-rl'"
          label="垂直对齐"
          :type="typeAttrs.vertical"
          :model-value="verticalValue"
          @change="handleVertical"
        />
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="网格布局">
      <template #content>
        <template v-if="type === 'rollSubtabs'">
          <el-form-item label="布局方向" :label-width="secondLabelWidth">
            <el-select
              v-model="selectTargetData[0].option.direction"
              popper-class="sw-select-dropdown"
              @change="update"
            >
              <el-option v-for="item in commonOrient" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="显示个数" :label-width="secondLabelWidth">
            <SwInputNumber v-model="selectTargetData[0].option.directionNum" :min="1" @change="update" />
          </el-form-item>
        </template>

        <template v-else>
          <el-form-item label="布局" :label-width="secondLabelWidth">
            <div class="flex flex-justify-between" style="width: 100%">
              <SwInputNumber
                @change="update"
                v-model="selectTargetData[0].option.rows"
                width="100"
                :min="1"
                :max="100"
                controls
                bottomLabel="行数"
              />
              <SwInputNumber
                @change="update"
                v-model="selectTargetData[0].option.columns"
                width="100"
                :min="1"
                :max="100"
                controls
                bottomLabel="列数"
              />
            </div>
          </el-form-item>
        </template>
        <el-form-item label="间隔" :label-width="secondLabelWidth">
          <div class="flex flex-justify-between" style="width: 100%">
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.rowGap"
              width="100"
              :min="0"
              :max="100"
              unit="px"
              bottomLabel="行距"
            />
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.columnGap"
              width="100"
              :min="0"
              :max="100"
              unit="px"
              bottomLabel="列距"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";

import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import { SwRadio as SwRadio } from "@screenwright/ui/radio";
import ItemSelectAlign from "@editor/textComponent/textConfig/ItemComponent/ItemSelectAlign/index.vue";
import { typeAttrs } from "@editor/textComponent/textConfig/ItemComponent/ItemSelectAlign/ItemSelectAlign";

import { commonOrient, secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();

interface Props {
  type?: string;
}
withDefaults(defineProps<Props>(), {
  type: "subtabs"
});

const adaptationType = [
  { label: "横排", value: "horizontal-tb" },
  { label: "竖排", value: "tb-rl" }
];

const verticalValue = computed(() => {
  const mapValue: Record<string, string> = {
    "flex-start": "top",
    center: "center",
    "flex-end": "bottom"
  };
  return mapValue[selectTargetData.value[0].option.alignItems] || "";
});

const handleVertical = (val: string) => {
  console.log(val);
  const mapValue: Record<string, string> = {
    top: "flex-start",
    middle: "center",
    bottom: "flex-end"
  };
  const value = mapValue[val];
  selectTargetData.value[0].option.alignItems = value;
  update();
};
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
