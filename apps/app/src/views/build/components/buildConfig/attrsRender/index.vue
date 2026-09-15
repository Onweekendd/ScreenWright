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
            <KeepAlive max="20" :key="refreshKey">
              <component :is="renderComponent" />
            </KeepAlive>
          </div>
        </el-form>
      </div>
      <dataConfig v-if="active === echartsTabEnum.DATA" :key="refreshKey" />
      <interactiveConfig v-if="active === echartsTabEnum.INTERACTIVE" />
    </div>
    <ComponentStyle />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

import type { interactiveEnum, textEnum } from "@/components/componentEntry/type";

import { useEditStore } from "../../buildRender/hooks/useEditStore";
import { TargetFlag, useTargetData } from "../../buildRender/hooks/useTargetData";
import configAttrsTab from "../components/configAttrsTab/index.vue";
import configBaseAttrs from "../components/configBaseAttrs/index.vue";
import configDescription from "../components/configDescription/index.vue";
import configTab from "../components/configTab/index.vue";
import { excludeDataConfig } from "../constants";
import { echartsTabEnum } from "../type";
import ComponentStyle from "./components/interactiveConfig/componentStyle.vue";
import dataConfig from "./dataConfig.vue";
import interactiveConfig from "./interactiveConfig.vue";
import { useAttrsRender } from "./useAttrsRender";

const { selectTargetData } = useEditStore();
const { targetFlag, selectTargetData: targetData } = useTargetData();
const { options, activeTab, renderComponent } = useAttrsRender();
const active = ref(echartsTabEnum.STYLE);
const refreshKey = ref(0);
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
      if (curTabs.value.some((tab) => tab.key === active.value)) {
        refreshKey.value++;
      } else {
        active.value = echartsTabEnum.STYLE;
      }
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
