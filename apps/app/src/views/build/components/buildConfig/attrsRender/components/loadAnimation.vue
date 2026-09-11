<template>
  <configCustom title="载入动画" :hasCtrl="false" v-if="selectTargetData[0].loadAnimation">
    <el-form-item label="动画类型" :label-width="labelWidth">
      <el-select
        v-model="selectTargetData[0].loadAnimation.type"
        popper-class="sw-select-dropdown"
        @change="handleSelect"
      >
        <el-option v-for="item in animationList" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <template v-if="selectTargetData[0].loadAnimation.type !== 'none'">
      <el-form-item label="速率" :label-width="labelWidth">
        <el-select
          v-model="selectTargetData[0].loadAnimation.timingFunction"
          placeholder="请选择"
          popper-class="sw-select-dropdown"
          @change="update"
        >
          <el-option v-for="item in filteredTimingFunction" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item
        label="方向"
        :label-width="labelWidth"
        v-if="selectTargetData[0].loadAnimation.type !== 'opacity-in'"
      >
        <el-select
          v-model="selectTargetData[0].loadAnimation.direction"
          placeholder="请选择"
          popper-class="sw-select-dropdown"
          @change="update"
        >
          <el-option v-for="item in animationPositions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="持续时间(ms)" :label-width="labelWidth">
        <SwInputNumber v-model="selectTargetData[0].loadAnimation.duration" @change="update" />
      </el-form-item>
      <el-form-item label="延时(ms)" :label-width="labelWidth">
        <SwInputNumber v-model="selectTargetData[0].loadAnimation.delay" @change="update" />
      </el-form-item>
    </template>
  </configCustom>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import SwInputNumber from "@/components/SwInputNumber/index.vue";

import { animationList, animationPosition, timingFunction } from "../../constants/index";
import type { updateDataType } from "../../type";
import { updateDataEnum } from "../../type";
import { useUpdateInstance } from "../../useUpdateInstance";
import ConfigCustom from "./interactiveConfig/components/configCustom.vue";

// 在此添加传参 默认组件 type = default | group; 默认 default 可传可不传  在group 的使用不同的业务hooks
interface Props {
  type?: updateDataType;
}

const props = withDefaults(defineProps<Props>(), {
  type: updateDataEnum.COMPONENTS
});

const { update, selectTargetData } = useUpdateInstance({
  type: props.type,
  history: false
});
const labelWidth = ref("85px");

// 过滤掉value为'none'的timing function选项
const filteredTimingFunction = computed(() => {
  return timingFunction.filter((item) => item.value !== "none");
});

// 根据动画类型过滤可用的动画方向选项
const animationPositions = computed(() => {
  if (selectTargetData.value.length !== 1) return [];

  let excludesType = "";
  const animationType = selectTargetData.value[0]?.loadAnimation?.type;

  if (animationType === "slide-clip-in" || animationType === "slide-scale-in") {
    excludesType = "tl,tr,bl,br";
  } else {
    excludesType = "center";
  }

  return animationPosition.filter((item) => !excludesType.includes(item.value));
});
// 监听selectTargetData变化，设置默认方向
// watch(
//   () =>
//     selectTargetData.value[0] &&
//     selectTargetData.value[0].loadAnimation &&
//     selectTargetData.value[0].loadAnimation.type,
//   () => {
//     if (!selectTargetData.value[0] || !selectTargetData.value[0].loadAnimation) {
//       return;
//     }
//     //
//     update();
//   }
// );
const handleSelect = () => {
  selectTargetData.value[0].loadAnimation.direction = "right";
  update();
};
</script>

<style scoped lang="scss">
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
.interactive-config {
  padding: 0 16px;
}
:deep(.el-select__wrapper) {
  min-height: 28px;
}
</style>
