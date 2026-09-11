<template>
  <el-drawer
    class="style-config-drawer"
    v-model="visibleRef"
    direction="rtl"
    :append-to-body="true"
    :destroy-on-close="true"
    :modal-append-to-body="true"
    :with-header="false"
    modal-class="build-render-ignore"
    @close="handleClose"
  >
    <configTab :tabs="curTabs" v-model="active" :size="20" />
    <childrenAttrs />
    <configAttrsTab v-model="activeTab" :options="componentOptions" v-if="echartsTabEnum.STYLE === active" />
    <el-form class="style-config-drawer-form">
      <component :is="componentByTab" v-if="echartsTabEnum.STYLE === active" />
      <div class="data" v-if="echartsTabEnum.DATA === active">
        <dataConfig />
      </div>
      <interactiveConfig v-if="echartsTabEnum.INTERACTIVE === active" />
    </el-form>
  </el-drawer>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";

import configAttrsTab from "../../components/configAttrsTab/index.vue";
import configTab from "../../components/configTab/index.vue";
// import mapmarsSetting from "./components/mapmarsSetting/index.vue"
// import peerStreamGlobal from "./components/extendsComponents/ue-peer-streamingGlobal.vue"
// import pixelStreamGlobal from "./components/extendsComponents/ue-pixel-streamingGlobal.vue"
// import vesselGlobal from "./components/extendsComponents/ue-vesselGlobal.vue"
// import { ueStreamType } from "../../../buildRender/core/ExtendsComponents/type"
import { echartsTabEnum } from "../../type";
import { useUpdateInstance } from "../../useUpdateInstance";
import dataConfig from "../dataConfig.vue";
import interactiveConfig from "../interactiveConfig.vue";
import childrenAttrs from "./childrenAttrs.vue";
import echartcommonMapGlobal from "./components/echartcommonMapGlobal/index.vue";
import extendsGlobal from "./components/extendsComponents/index.vue";
import threeMapGlobal from "./components/threeMapGlobal/index.vue";
import threeMapStyle from "./components/threeMapStyle/index.vue";
import { useChildrenDrawer } from "./useChildrenDrawer";

// import { useTargetData } from "@/views/build/components/buildRender/hooks/useTargetData"
const { visibleRef, active, curTabs, handleClose } = useChildrenDrawer();
// const { setSelectedTargetActionData, onConfigDrawerClose, setTargetFlag } = useTargetData()
const { selectTargetData } = useUpdateInstance();

const activeTab = ref("Global");

const componentByTab = computed(() => {
  const component = componentOptions.value.find((item) => item.value === activeTab.value)?.component;
  return component;
});
watch(
  () => visibleRef.value,
  () => {
    if (componentOptions.value.length > 0) {
      activeTab.value = componentOptions.value[0].value;
    } else {
      activeTab.value = "Global";
    }
  }
);
const componentOptions = computed(() => {
  const props = selectTargetData.value[0].type;
  const mapComponentType: Record<any, any[]> = {
    mapEffectScatter: [
      {
        label: "全局",
        value: "Global",
        component: echartcommonMapGlobal
      }
    ],
    mapGlScatter: [
      {
        label: "全局",
        value: "Global",
        component: echartcommonMapGlobal
      }
    ],
    mapLines: [
      {
        label: "全局",
        value: "Global",
        component: echartcommonMapGlobal
      }
    ],
    heatmap: [
      {
        label: "全局",
        value: "Global",
        component: echartcommonMapGlobal
      }
    ],
    colormap: [
      {
        label: "全局",
        value: "Global",
        component: echartcommonMapGlobal
      }
    ],
    ueToFunEvent: [
      {
        label: "全局",
        value: "Global",
        component: extendsGlobal
      }
    ],
    flowLine: [
      {
        label: "全局",
        value: "Global",
        component: threeMapGlobal
      }
    ],
    mapPath: [
      {
        label: "全局",
        value: "Global",
        component: threeMapGlobal
      }
    ],
    fence: [
      {
        label: "全局",
        value: "Global",
        component: threeMapGlobal
      }
    ],
    plane: [
      {
        label: "全局",
        value: "Global",
        component: threeMapGlobal
      }
    ],
    mapGlIcon: [
      {
        label: "全局",
        value: "Global",
        component: threeMapGlobal
      },
      {
        label: "样式",
        value: "Style",
        component: threeMapStyle
      }
    ],
    mapBar: [
      {
        label: "全局",
        value: "Global",
        component: threeMapGlobal
      }
    ],
    mapScatter: [
      {
        label: "全局",
        value: "Global",
        component: threeMapGlobal
      }
    ],
    regionOutline: [
      {
        label: "全局",
        value: "Global",
        component: threeMapGlobal
      }
    ]
    // [sceneEnumType.Mapmars]: [
    //   {
    //     label: "基础设置",
    //     value: "Setting",
    //     component: mapmarsSetting
    //   }
    // ],
    // [sceneEnumType.Maptalks]: [],
    // [sceneEnumType.MapProjection]: [],
    // [ueStreamType.UePeerStreaming]: [
    //   {
    //     label: "全局",
    //     value: "Global",
    //     component: peerStreamGlobal
    //   }
    // ],
    // [ueStreamType.UeVessel]: [
    //   {
    //     label: "全局",
    //     value: "Global",
    //     component: vesselGlobal
    //   }
    // ],
    // [ueStreamType.UePixelStreaming]: [
    //   {
    //     label: "全局",
    //     value: "Global",
    //     component: pixelStreamGlobal
    //   }
    // ]
  };
  return mapComponentType[props] || [];
});
</script>
<style lang="scss" scoped>
.style-config-drawer-form {
  :deep(.el-form-item__label) {
    color: #fff;
    display: inline-block !important;
  }
}
</style>
