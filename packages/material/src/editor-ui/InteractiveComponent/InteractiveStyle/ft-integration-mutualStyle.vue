<template>
  <div class="ft-integration-mutual-style">
    <StatusSelector label="X旋转" :label-width="firstLabelWidth" :properties="['rotateX']">
      <div class="flex flex-center-between" style="width: 100%">
        <SwInputNumber v-model="selectTargetData[0].option.rotateX" @change="update" controls />
      </div>
    </StatusSelector>

    <StatusSelector label="Y旋转" :label-width="firstLabelWidth" :properties="['rotateY']">
      <div class="flex flex-center-between" style="width: 100%">
        <SwInputNumber v-model="selectTargetData[0].option.rotateY" @change="update" controls />
      </div>
    </StatusSelector>

    <StatusSelector label="Z旋转" :label-width="firstLabelWidth" :properties="['rotateZ']">
      <div class="flex flex-center-between" style="width: 100%">
        <SwInputNumber v-model="selectTargetData[0].option.rotateZ" @change="update" controls />
      </div>
    </StatusSelector>

    <el-form-item label="X倾斜" :label-width="firstLabelWidth">
      <div class="flex flex-center-between" style="width: 100%">
        <SwInputNumber v-model="selectTargetData[0].option.skewX" @change="update" controls />
      </div>
    </el-form-item>
    <el-form-item label="Y倾斜" :label-width="firstLabelWidth">
      <div class="flex flex-center-between" style="width: 100%">
        <SwInputNumber v-model="selectTargetData[0].option.skewY" @change="update" controls />
      </div>
    </el-form-item>

    <!-- <StatusSelector label="透明度" :label-width="firstLabelWidth" :properties="['opacity']">
      <div class="flex flex-center-between" style="width: 100%">
        <SwSlider v-model="opacityValue" :default-value="1" @change="update" :min="0" :max="1" :step="0.01" />
      </div>
    </StatusSelector> -->
  </div>
</template>
<script setup lang="ts">
// import { computed } from "vue";

import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";

// import { SwSlider as SwSlider } from "@screenwright/ui/slider";
import StatusSelector from "../../attrsRender/components/statusAnimation/components/StatusSelector.vue";
import { firstLabelWidth } from "@editor/textComponent/textConfig/textConfig";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();

// // 计算属性：确保 opacity 属性存在，如果不存在则默认为 1
// const opacityValue = computed({
//   get: () => {
//     return selectTargetData.value?.[0]?.option?.opacity ?? 1;
//   },
//   set: (value: number) => {
//     if (selectTargetData.value?.[0]?.option) {
//       selectTargetData.value[0].option.opacity = value;
//     }
//   }
// });

// 初始化时确保 opacity 属性存在
const ensureOpacityExists = () => {
  if (selectTargetData.value?.[0]?.option && !("opacity" in selectTargetData.value[0].option)) {
    selectTargetData.value[0].option.opacity = 1;
  }
};

// 在组件挂载时确保 opacity 属性存在
ensureOpacityExists();
</script>
