<template>
  <div class="ft-particles-interactive">
    <el-form-item label="启用交互" :label-width="firstLabelWidth">
      <el-switch class="ft-switch" v-model="selectTargetData[0].option.interactivity.enable" @change="update" />
    </el-form-item>
    <el-form-item label="交互距离" :label-width="firstLabelWidth">
      <sw-slider
        v-model="selectTargetData[0].option.interactivity.mouse.distance"
        :min="50"
        :max="300"
        @change="update"
      />
    </el-form-item>
    <!-- <el-form-item label="交互模式" :label-width="firstLabelWidth">
      <el-select
        popper-class="sw-select-dropdown"
        v-model="selectTargetData[0].option.interactivity.mode"
        placeholder="Select"
        style="width: 100%"
        @change="update"
      >
        <el-option v-for="item in modelOption" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item> -->
    <el-form-item label="交互透明度" :label-width="firstLabelWidth">
      <sw-slider
        v-model="selectTargetData[0].option.interactivity.line_linked.opacity"
        :min="0.1"
        :max="1"
        :step="0.1"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="启用点击事件" :label-width="firstLabelWidth">
      <el-switch
        class="ft-switch"
        v-model="selectTargetData[0].option.interactivity.events.onclick.enable"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="点击模式" :label-width="firstLabelWidth">
      <el-select
        popper-class="sw-select-dropdown"
        v-model="selectTargetData[0].option.interactivity.events.onclick.mode"
        placeholder="Select"
        style="width: 100%"
        @change="update"
      >
        <el-option v-for="item in clickModelOption" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="操作数量" :label-width="firstLabelWidth">
      <sw-slider
        v-model="selectTargetData[0].option.interactivity.events.onclick.nb"
        :min="1"
        :max="10"
        @change="update"
      />
    </el-form-item>
    <div class="action-buttons">
      <el-button type="primary" size="small" @click="onParticlesReStart">重新加载</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { SwSlider } from "@screenwright/ui";
import { useActionEvent } from "@screenwright/composables";
import { ExhibitEnum } from "@screenwright/types";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { eventList } = useActionEvent();
const { selectTargetData, update } = useUpdateInstance();

// const modelOption = ref([
//   {
//     label: "抓取",
//     value: "grab"
//   },
//   {
//     label: "添加",
//     value: "push"
//   },
//   {
//     label: "移除",
//     value: "remove"
//   }
// ])

const clickModelOption = ref([
  {
    label: "添加",
    value: "push"
  },
  {
    label: "移除",
    value: "remove"
  }
]);
const onParticlesReStart = () => {
  eventList.value[`${ExhibitEnum.FtParticles}-${selectTargetData.value[0].id}`].particlesReStart();
  console.log(
    `${ExhibitEnum.FtParticles}-${selectTargetData.value[0].id}`,
    eventList.value[`${ExhibitEnum.FtParticles}-${selectTargetData.value[0].id}`]
  );
};
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
.action-buttons {
  margin-top: 10px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  .el-button {
    color: #ffffff;
    width: 90%;
    background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
    border-color: transparent;
    border-radius: 4px;
    text-align: center;
  }
}
</style>
