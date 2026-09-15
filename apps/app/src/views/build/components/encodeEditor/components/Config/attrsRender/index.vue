<template>
  <div class="echarts-config" v-if="selectTargetData[0]">
    <div style="height: 100%" v-show="targetFlag === TargetFlag.ComponentOption && 'id' in targetData[0]">
      <configTab :tabs="curTabs" v-model="active" :size="20" />
      <configDescription />
      <div
        class="flex flex-column"
        v-if="active === echartsTabEnum.STYLE"
        :style="{ height: 'calc(100% - 67px - 56px)' }"
      >
        <el-form class="echarts-config-form" label-width="90px" label-position="left">
          <configBaseAttrs />
          <configAttrsTab v-model="activeTab" :options="options" v-if="options && options.length > 0" />
          <div class="echarts-config-wrapper">
            <component :is="renderComponent" />
          </div>
        </el-form>
      </div>
      <dataConfig v-if="active === echartsTabEnum.DATA" />
      <interactiveConfig v-if="active === echartsTabEnum.INTERACTIVE" />
    </div>
    <ComponentStyle />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { InteractiveEnum } from "@screenwright/types";

import { interactiveEnum, mediaEnum, textEnum } from "@/components/componentEntry/type";
import ComponentStyle from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/componentStyle.vue";
import dataConfig from "@/views/build/components/buildConfig/attrsRender/dataConfig.vue";
import { useAttrsRender } from "@/views/build/components/buildConfig/attrsRender/useAttrsRender";
import configAttrsTab from "@/views/build/components/buildConfig/components/configAttrsTab/index.vue";
import configBaseAttrs from "@/views/build/components/buildConfig/components/configBaseAttrs/index.vue";
import configDescription from "@/views/build/components/buildConfig/components/configDescription/index.vue";
import configTab from "@/views/build/components/buildConfig/components/configTab/index.vue";
import { echartsTabEnum } from "@/views/build/components/buildConfig/type";
import { extendsEnumType } from "@/views/build/components/buildRender/core/ExtendsComponents/type";
import { sceneEnumType } from "@/views/build/components/buildRender/core/SceneComponent/type";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { TargetFlag, useTargetData } from "@/views/build/components/buildRender/hooks/useTargetData";

import interactiveConfig from "./interactiveConfig.vue";

const { selectTargetData } = useEditStore();
const { targetFlag, selectTargetData: targetData } = useTargetData();
const { options, activeTab, renderComponent } = useAttrsRender();
const excludeDataConfig = [
  textEnum.SwDatetime,
  interactiveEnum.SwVoiceControl,
  textEnum.SwRichtext,
  sceneEnumType.MapProjection,
  sceneEnumType.Maptalks,
  sceneEnumType.Mapmars,
  sceneEnumType.ThreeScene,
  sceneEnumType.IndustryScene,
  extendsEnumType.PageReload,
  extendsEnumType.SwMaskLayer,
  extendsEnumType.SimpleParticle,
  extendsEnumType.SimpleStar,
  extendsEnumType.FullScreenSwitch,
  mediaEnum.SwImgBorder,
  InteractiveEnum.videoProgress
];

const active = ref(echartsTabEnum.STYLE);
const tabs = ref([
  {
    title: "样式",
    en: "style",
    key: echartsTabEnum.STYLE,
    icon: "iconfont-style_btn"
  },
  {
    title: "数据",
    en: "data",
    key: echartsTabEnum.DATA,
    icon: "iconfont-data_btn"
  },
  {
    title: "交互",
    en: "interactive",
    key: echartsTabEnum.INTERACTIVE,
    icon: "iconfont-interactive_btn"
  }
]);

const curTabs = computed(() => {
  if (!selectTargetData.value[0]) {
    return [];
  }
  if (excludeDataConfig.includes(selectTargetData.value[0].component.prop as textEnum | interactiveEnum)) {
    return tabs.value.filter((item) => item.key !== echartsTabEnum.DATA);
  }
  return tabs.value;
});

watch(
  () => selectTargetData.value && selectTargetData.value[0],
  () => {
    if (selectTargetData.value && selectTargetData.value[0]) {
      active.value = echartsTabEnum.STYLE;
    }
  }
);
</script>
<style lang="scss" scoped>
.echarts-config {
  height: 100%;
  .echarts-config-form {
    overflow: auto;
  }
  .echarts-config-wrapper {
    padding: 0 16px;
  }
  :deep(.el-form-item) {
    margin-bottom: 10px;
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
