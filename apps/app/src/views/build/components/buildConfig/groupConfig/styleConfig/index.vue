<template>
  <div class="style-config">
    <el-form-item label="透视距离" :labelWidth="firstLabelWidth">
      <sw-input-number
        v-model.number="selectTargetData[0].option.perspective"
        :min="0"
        :controls="true"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="视点位置" :labelWidth="firstLabelWidth">
      <SwGridButton @change="update" v-model="selectTargetData[0].option.originGrid" />
    </el-form-item>
    <SwCollapseItem title="旋转" open @change="update">
      <template #content>
        <el-form-item label="绕X轴" :labelWidth="secondLabelWidth">
          <SwSlider
            v-model="selectTargetData[0].option.rotateX"
            :max="180"
            :min="-180"
            :step="0.1"
            unit="°"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="绕Y轴" :labelWidth="secondLabelWidth">
          <SwSlider
            v-model="selectTargetData[0].option.rotateY"
            :max="180"
            :min="-180"
            :step="0.1"
            unit="°"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="绕Z轴" :labelWidth="secondLabelWidth">
          <SwSlider
            v-model="selectTargetData[0].option.rotateZ"
            :max="180"
            :min="-180"
            :step="0.1"
            unit="°"
            @change="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="斜切" open @change="update">
      <template #content>
        <el-form-item label="X方向" :labelWidth="secondLabelWidth">
          <SwSlider v-model="selectTargetData[0].option.skewX" :min="-90" :max="90" unit="°" @change="update" />
        </el-form-item>
        <el-form-item label="Y方向" :labelWidth="secondLabelWidth">
          <SwSlider v-model="selectTargetData[0].option.skewY" :min="-90" :max="90" unit="°" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <el-form-item label="缩放" :labelWidth="firstLabelWidth">
      <div class="flex flex-center-between">
        <sw-input-number
          v-model.number="selectTargetData[0].option.scaleX"
          unit="%"
          bottomLabel="X"
          :controls="false"
          @change="update"
        />
        <sw-input-number
          v-model.number="selectTargetData[0].option.scaleY"
          unit="%"
          bottomLabel="Y"
          :controls="false"
          @change="update"
        />
      </div>
    </el-form-item>
    <el-form-item label="平移" :labelWidth="firstLabelWidth">
      <div class="flex flex-center-between">
        <sw-input-number
          v-model.number="selectTargetData[0].option.translateX"
          unit="px"
          bottomLabel="X"
          :controls="false"
          @change="update"
        />
        <sw-input-number
          v-model.number="selectTargetData[0].option.translateY"
          unit="px"
          bottomLabel="Y"
          :controls="false"
          @change="update"
        />
        <sw-input-number
          v-model.number="selectTargetData[0].option.translateZ"
          unit="px"
          bottomLabel="Z"
          :controls="false"
          @change="update"
        />
      </div>
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwGridButton from "@/components/SwGridButton/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwSlider from "@/components/SwSlider/index.vue";
import { firstLabelWidth, secondLabelWidth } from "@/views/build/components/buildConfig/constants";

import { updateDataEnum } from "../../type";
import { useUpdateInstance } from "../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance({
  type: updateDataEnum.GROUP
});
</script>
<style lang="scss" scoped>
.w-100 {
  width: 100%;
}
.mb-10 {
  margin-bottom: 10px;
}
.style-config {
  .config-base-form {
    padding: 0 16px;
  }

  :deep(.el-form-item__label) {
    padding: 0 !important;
    color: #b4b7c1 !important;
    font-size: 12px;
    font-family:
      Source Han Sans CN-Normal,
      Source Han Sans CN;
    font-weight: 400;
  }
}
</style>
