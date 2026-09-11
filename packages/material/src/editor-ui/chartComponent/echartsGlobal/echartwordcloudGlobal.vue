<template>
  <div class="echartwordcloudGlobal">
    <el-form-item label="偏移" :label-width="firstLabelWidth">
      <div class="fullWidth flex flex-center-between">
        <sw-input-number
          v-model="selectTargetData[0].option.left"
          bottomLabel="x"
          unit="%"
          @change="update"
          width="90"
          :min="-100"
          :max="100"
        />
        <sw-input-number
          v-model="selectTargetData[0].option.top"
          bottomLabel="y"
          unit="%"
          @change="update"
          width="90"
          :min="-100"
          :max="100"
        />
      </div>
    </el-form-item>
    <SwCollapseItem title="标签" open>
      <template #content>
        <el-form-item label="字体类型" :label-width="secondLabelWidth">
          <el-select
            v-model="selectTargetData[0].option.fontFamily"
            popper-class="sw-select-dropdown"
            @change="update"
          >
            <el-option v-for="item in fontFamily" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="最大尺寸" :label-width="secondLabelWidth">
          <sw-slider v-model="selectTargetData[0].option.sizeRangeMax" @change="update" />
        </el-form-item>
        <el-form-item label="最小尺寸" :label-width="secondLabelWidth">
          <sw-slider v-model="selectTargetData[0].option.sizeRangeMin" @change="update" />
        </el-form-item>
        <el-form-item label="间距" :label-width="secondLabelWidth">
          <SwInputNumber controls v-model="selectTargetData[0].option.gridSize" :min="0" @change="update" />
        </el-form-item>
        <SwCollapseItem title="旋转范围" open>
          <template #content>
            <el-form-item label="最大角度" title="最大角度" :label-width="38">
              <sw-slider
                @change="update"
                v-model="selectTargetData[0].option.rotationRangeMax"
                :max="180"
                :min="-180"
                style="margin-left: 10px"
              />
            </el-form-item>
            <el-form-item label="最小角度" title="最小角度" :label-width="38">
              <sw-slider
                @change="update"
                v-model="selectTargetData[0].option.rotationRangeMin"
                :max="180"
                :min="-180"
                style="margin-left: 10px"
              />
            </el-form-item>
            <el-form-item label="步长" :label-width="38">
              <sw-input-number
                style="margin-left: 10px"
                @change="update"
                v-model="selectTargetData[0].option.rotationStep"
                :min="1"
              />
            </el-form-item>
          </template>
        </SwCollapseItem>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="图形" open>
      <template #content>
        <el-form-item label="类型" :label-width="secondLabelWidth">
          <el-select v-model="selectTargetData[0].option.shape" popper-class="sw-select-dropdown" @change="update">
            <el-option v-for="item in wordCloudShape" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="保持比例" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.keepAspect" @change="update" />
        </el-form-item>
        <el-form-item label="剪影图像" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.maskImageShow" @change="update" />
        </el-form-item>

        <template v-if="selectTargetData[0].option.maskImageShow">
          <el-form-item label="" :label-width="secondLabelWidth">
            <sw-upload v-model="selectTargetData[0].option.maskImage" @change="update" @delete="update" />
          </el-form-item>
          <el-form-item label="边界裁剪" :label-width="secondLabelWidth">
            <el-checkbox v-model="selectTargetData[0].option.drawOutOfBound" @change="update" />
          </el-form-item>
        </template>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSlider } from "@screenwright/ui/slider";
import SwUpload from "@editor/base/SwUpload/index.vue";
import { fontFamily } from "@editor/fontFamily";

import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const wordCloudShape = ref([
  {
    label: "方形",
    value: "square"
  },
  {
    label: "圆形",
    value: "circle"
  },
  {
    label: "菱形",
    value: "diamond"
  },
  {
    label: "斜三角",
    value: "triangle-forward"
  },
  {
    label: "三角形",
    value: "triangle"
  },
  {
    label: "五边形",
    value: "pentagon"
  },
  {
    label: "星形",
    value: "star"
  }
]);
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
}
</style>
