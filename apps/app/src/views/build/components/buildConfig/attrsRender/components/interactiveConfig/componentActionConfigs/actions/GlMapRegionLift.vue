<template>
  <div>
    <el-form-item label="抬升地块" :label-width="85">
      <el-tree-select
        popper-class="sw-select-dropdown"
        :modelValue="action.glMapRegionLift.regionId"
        :data="liftRegionOptions"
        :loading="loading"
        style="width: 100%"
        :check-strictly="true"
        @change="handleRegionChange"
      />
    </el-form-item>
    <el-form-item label="抬升高度" :label-width="85">
      <SwInputNumber v-model="action.glMapRegionLift.height" :min="0" :max="10" @change="handleLiftConfigChange" />
    </el-form-item>
    <el-form-item label="抬升间隔" :label-width="85">
      <SwInputNumber v-model="action.glMapRegionLift.duration" :min="0" @change="handleLiftConfigChange" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

import GeoDataUtils from "@/components/ScreenwrightSceneComponent/component/echartcommonMap/geoDataUtils";
import { loadStaticGeoJson } from "@/components/ScreenwrightSceneComponent/component/echartGlmap/geoJsonRegionProvider";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import { extractComponentId } from "@/utils/utils";
import { getCurrentMapRegionSelection } from "@/views/build/components/buildConfig/sceneComponent/mapRegionCatalog";

import { useCustomEvent } from "../../useCustomEvent";

interface LiftRegionOption {
  label: string;
  value: string;
  adcode: string;
  name: string;
}

const { currentAction: action, update, allComponentMap } = useCustomEvent();

const loading = ref(false);
const liftRegionOptions = ref<LiftRegionOption[]>([{ label: "无", value: "", adcode: "", name: "" }]);
let requestId = 0;
let geoUtils: GeoDataUtils | null = null;

const ensureGeoUtils = () => {
  if (!geoUtils) {
    geoUtils = new GeoDataUtils().init();
  }
  return geoUtils;
};

const ensureActionConfig = () => {
  if (!action.value.glMapRegionLift) {
    action.value.glMapRegionLift = {
      regionId: "",
      adcode: "",
      name: "",
      height: 1,
      duration: 300
    };
  }
  if (action.value.glMapRegionLift.height === undefined || action.value.glMapRegionLift.height === null) {
    action.value.glMapRegionLift.height = 1;
  }
  if (action.value.glMapRegionLift.duration === undefined || action.value.glMapRegionLift.duration === null) {
    action.value.glMapRegionLift.duration = 300;
  }
};

const targetMapComponent = computed(() => {
  const component = action.value?.component?.[0];
  if (!component) {
    return null;
  }
  return allComponentMap.value.get(`${extractComponentId(component)}`) || null;
});

const targetMapKey = computed(() => action.value?.component?.[0] || "");
const targetRegionKey = computed(() => JSON.stringify(targetMapComponent.value?.data || []));

const buildLiftRegionOptions = (features: any[] = []): LiftRegionOption[] => {
  const optionMap = new Map<string, string>();

  features.forEach((feature: any) => {
    const properties = feature?.properties || {};
    const adcode = String(properties.adcode || properties.ADCODE || properties.id || properties.ID || "");
    const name = String(properties.name || properties.NAME || properties.fullname || "");

    if (adcode && name && !optionMap.has(adcode)) {
      optionMap.set(adcode, name);
    }
  });

  return [
    { label: "无", value: "", adcode: "", name: "" },
    ...Array.from(optionMap.entries()).map(([adcode, name]) => ({
      label: name,
      value: adcode,
      adcode,
      name
    }))
  ];
};

const findLiftRegionOption = (value: string) => {
  return liftRegionOptions.value.find((item) => item.value === value) || null;
};

const syncLiftRegionOptions = async () => {
  ensureActionConfig();

  const currentRequestId = ++requestId;
  const target = targetMapComponent.value;
  if (!target) {
    liftRegionOptions.value = [{ label: "无", value: "", adcode: "", name: "" }];
    return;
  }

  loading.value = true;

  try {
    const region = getCurrentMapRegionSelection(target.data);
    let features: any[] = [];

    if (region.provider === "geojson-file" && region.geoJsonUrl) {
      const geoJson = await loadStaticGeoJson(region.geoJsonUrl);
      features = geoJson.features || [];
    } else if (region.provider === "china-adcode" && region.adcode) {
      const result = await ensureGeoUtils().getGeoData(region.adcode);
      features = result?.fullData?.features || [];
    }

    if (currentRequestId !== requestId) {
      return;
    }

    const nextOptions = buildLiftRegionOptions(features);
    liftRegionOptions.value = nextOptions;

    const currentRegionId = String(action.value.glMapRegionLift.regionId || "");
    if (currentRegionId && !nextOptions.some((item) => item.value === currentRegionId)) {
      action.value.glMapRegionLift = {
        regionId: "",
        adcode: "",
        name: "",
        height: action.value.glMapRegionLift.height,
        duration: action.value.glMapRegionLift.duration
      };
      update();
    }
  } catch (error) {
    if (currentRequestId !== requestId) {
      return;
    }
    console.warn("[echart-glmap] 地块抬升候选区域加载失败:", error);
    liftRegionOptions.value = [{ label: "无", value: "", adcode: "", name: "" }];
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false;
    }
  }
};

const handleRegionChange = (value: string | number) => {
  ensureActionConfig();

  const regionId = String(value || "");
  const selected = findLiftRegionOption(regionId);
  action.value.glMapRegionLift = {
    regionId,
    adcode: selected?.adcode || regionId,
    name: selected?.name || selected?.label || "",
    height: action.value.glMapRegionLift.height,
    duration: action.value.glMapRegionLift.duration
  };
  update();
};

const handleLiftConfigChange = () => {
  ensureActionConfig();
  update();
};

watch(
  () => [targetMapKey.value, targetRegionKey.value],
  () => {
    void syncLiftRegionOptions();
  },
  { immediate: true }
);
</script>
