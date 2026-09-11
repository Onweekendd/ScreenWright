<template>
  <div class="region-outline-global">
    <el-form-item label="高亮类型" :label-width="secondLabelWidth">
      <el-select popper-class="sw-select-dropdown" :model-value="targetType" @change="handleTargetTypeChange">
        <el-option label="区域" value="region" />
        <el-option label="大洲" value="continent" :disabled="!isWorldRoot" />
      </el-select>
    </el-form-item>

    <el-form-item :label="targetType === 'continent' ? '高亮大洲' : '高亮区域'" :label-width="secondLabelWidth">
      <el-select
        popper-class="sw-select-dropdown"
        :model-value="selectedTargetValues"
        multiple
        filterable
        collapse-tags
        collapse-tags-tooltip
        :loading="targetType === 'region' ? regionOptionsLoading : false"
        @change="handleTargetValuesChange"
      >
        <el-option v-for="item in currentTargetOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>

    <SwCollapseItem title="轮廓样式" open>
      <template #content>
        <el-form-item label="混合模式" :label-width="secondLabelWidth">
          <el-select popper-class="sw-select-dropdown" v-model="currentOption.blendingMode" @change="update">
            <el-option v-for="item in blendingOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="currentOption.color" @change="update" />
        </el-form-item>

        <el-form-item label="透明度" :label-width="secondLabelWidth">
          <SwSlider v-model="currentOption.opacity" :min="0" :max="100" @change="update" />
        </el-form-item>

        <el-form-item label="线宽" :label-width="secondLabelWidth">
          <SwSlider v-model="currentOption.lineWidth" :min="0.5" :max="12" :step="0.1" @change="update" />
        </el-form-item>

        <el-form-item label="Z 偏移" :label-width="secondLabelWidth">
          <SwInputNumber v-model="currentOption.zOffset" :min="0" :step="0.05" @change="update" />
        </el-form-item>

        <el-form-item label="流光" :label-width="secondLabelWidth">
          <el-checkbox v-model="currentOption.flow" @change="update" />
        </el-form-item>

        <el-form-item v-if="currentOption.flow" label="流动速度" :label-width="secondLabelWidth">
          <SwInputNumber v-model="currentOption.flowSpeed" :min="0.1" :step="0.1" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import GeoDataUtils from "@/components/ScreenwrightSceneComponent/component/echartcommonMap/geoDataUtils";
import { loadStaticGeoJson } from "@/components/ScreenwrightSceneComponent/component/echartGlmap/geoJsonRegionProvider";
import { worldContinentGroups } from "@/components/ScreenwrightSceneComponent/component/echartGlmap/worldContinentGroups";
import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwSingleColorPicker from "@/components/SwSingleColorPicker/index.vue";
import SwSlider from "@/components/SwSlider/index.vue";
import { getCurrentMapRegionSelection } from "@/views/build/components/buildConfig/sceneComponent/mapRegionCatalog";

import { secondLabelWidth } from "../../../../constants";
import { useChildrenDrawer } from "../../useChildrenDrawer";

interface RegionOptionItem {
  label: string;
  value: string;
}

const { currentChildrenItem, currentParentItem, update } = useChildrenDrawer();

const regionOptions = ref<RegionOptionItem[]>([]);
const regionOptionsLoading = ref(false);
const blendingOptions = ref([
  { label: "正常", value: "NormalBlending" },
  { label: "相加", value: "AdditiveBlending" },
  { label: "相减", value: "SubtractiveBlending" },
  { label: "相乘", value: "MultiplyBlending" }
]);

const continentTargetOptions = worldContinentGroups.map((group) => ({
  label: group.label,
  value: String(group.id)
}));

let geoUtils: GeoDataUtils | null = null;
let loadRequestId = 0;

const ensureGeoUtils = () => {
  if (!geoUtils) {
    geoUtils = new GeoDataUtils().init();
  }

  return geoUtils;
};

const currentOption = computed(() => currentChildrenItem.value?.option || {});
const currentData = computed<any[]>(() =>
  Array.isArray(currentChildrenItem.value?.data) ? currentChildrenItem.value.data : []
);
const parentRegionSelection = computed(() => getCurrentMapRegionSelection(currentParentItem.value?.data));
const isWorldRoot = computed(
  () =>
    parentRegionSelection.value.provider === "geojson-file" &&
    /\/cdn\/geo-world\/world\.json(?:\?.*)?$/i.test(String(parentRegionSelection.value.geoJsonUrl || ""))
);

const targetType = computed(() => {
  const configuredType = currentOption.value.targetType;
  if (configuredType === "continent" || configuredType === "region") {
    return configuredType;
  }

  return currentData.value.some((item) => item?.targetType === "continent" || item?.groupId) ? "continent" : "region";
});

const currentTargetOptions = computed(() =>
  targetType.value === "continent" ? continentTargetOptions : regionOptions.value
);

const selectedTargetValues = computed(() => {
  if (targetType.value === "continent") {
    return currentData.value
      .filter((item) => item?.targetType === "continent" || item?.groupId)
      .map((item) => String(item.groupId || ""))
      .filter(Boolean);
  }

  return currentData.value
    .filter((item) => item?.targetType !== "continent")
    .map((item) => String(item.adcode || ""))
    .filter(Boolean);
});

const buildRegionOptions = (features: any[] = []) => {
  const optionMap = new Map<string, string>();

  features.forEach((feature: any) => {
    const properties = feature?.properties || {};
    const adcode = String(properties.adcode || properties.ADCODE || "");
    const name = String(properties.name || properties.NAME || "");

    if (adcode && name && !optionMap.has(adcode)) {
      optionMap.set(adcode, name);
    }
  });

  return Array.from(optionMap.entries()).map(([value, label]) => ({
    label,
    value
  }));
};

const normalizeChildData = (triggerUpdate = false) => {
  if (!currentChildrenItem.value) {
    return;
  }

  let changed = false;
  currentChildrenItem.value.option = currentChildrenItem.value.option || {};

  const defaults: Record<string, any> = {
    targetType: "region",
    color: "#3FEFFF",
    opacity: 100,
    lineWidth: 3,
    flow: false,
    flowSpeed: 1,
    zOffset: 0.15,
    blendingMode: "AdditiveBlending"
  };

  Object.keys(defaults).forEach((key) => {
    if (currentChildrenItem.value.option[key] === undefined) {
      currentChildrenItem.value.option[key] = defaults[key];
      changed = true;
    }
  });

  if (!Array.isArray(currentChildrenItem.value.data)) {
    currentChildrenItem.value.data = [];
    changed = true;
  }

  if (targetType.value === "continent" && !isWorldRoot.value) {
    currentChildrenItem.value.option.targetType = "region";
    currentChildrenItem.value.data = [];
    changed = true;
  }

  if (targetType.value === "region" && regionOptions.value.length > 0) {
    const validSet = new Set(regionOptions.value.map((item) => item.value));
    const optionLabelMap = new Map(regionOptions.value.map((item) => [item.value, item.label]));
    const currentRegionData = currentData.value.filter((item) => item?.targetType !== "continent");
    const nextData = currentRegionData
      .filter((item) => validSet.has(String(item?.adcode || "")))
      .map((item) => ({
        targetType: "region",
        adcode: String(item.adcode),
        name: item.name || optionLabelMap.get(String(item.adcode)) || ""
      }));

    if (JSON.stringify(nextData) !== JSON.stringify(currentRegionData)) {
      currentChildrenItem.value.data = nextData;
      changed = true;
    }
  }

  if (targetType.value === "continent") {
    const validSet = new Set(continentTargetOptions.map((item) => item.value));
    const optionLabelMap = new Map(continentTargetOptions.map((item) => [item.value, item.label]));
    const currentContinentData = currentData.value.filter((item) => item?.targetType === "continent" || item?.groupId);
    const nextData = currentContinentData
      .filter((item) => validSet.has(String(item?.groupId || "")))
      .map((item) => ({
        targetType: "continent",
        groupId: String(item.groupId),
        name: item.name || optionLabelMap.get(String(item.groupId)) || ""
      }));

    if (JSON.stringify(nextData) !== JSON.stringify(currentContinentData)) {
      currentChildrenItem.value.data = nextData;
      changed = true;
    }
  }

  if (changed && triggerUpdate) {
    update();
  }
};

const syncRegionOptions = async () => {
  if (!currentParentItem.value) {
    regionOptions.value = [];
    return;
  }

  const requestId = ++loadRequestId;
  regionOptionsLoading.value = true;

  try {
    const region = parentRegionSelection.value;
    let features: any[] = [];

    if (region.provider === "geojson-file" && region.geoJsonUrl) {
      const geoJson = await loadStaticGeoJson(region.geoJsonUrl);
      features = geoJson?.features || [];
    } else if (region.provider === "china-adcode" && region.adcode) {
      const result = await ensureGeoUtils().getGeoData(region.adcode);
      features = result?.fullData?.features || [];
    }

    if (requestId !== loadRequestId) {
      return;
    }

    regionOptions.value = buildRegionOptions(features);
    normalizeChildData(true);
  } catch (error) {
    if (requestId !== loadRequestId) {
      return;
    }

    console.warn("[regionOutline] 加载区域选项失败", error);
    regionOptions.value = [];
    normalizeChildData(true);
  } finally {
    if (requestId === loadRequestId) {
      regionOptionsLoading.value = false;
    }
  }
};

const handleTargetTypeChange = (value: "region" | "continent") => {
  if (!currentChildrenItem.value) {
    return;
  }

  const nextValue = value === "continent" && !isWorldRoot.value ? "region" : value;
  currentChildrenItem.value.option = currentChildrenItem.value.option || {};
  currentChildrenItem.value.option.targetType = nextValue;
  currentChildrenItem.value.data = [];
  update();
};

const handleTargetValuesChange = (values: string[]) => {
  if (!currentChildrenItem.value) {
    return;
  }

  const optionMap = new Map(currentTargetOptions.value.map((item) => [item.value, item.label]));

  currentChildrenItem.value.data =
    targetType.value === "continent"
      ? values.map((value) => ({
          targetType: "continent",
          groupId: value,
          name: optionMap.get(value) || value
        }))
      : values.map((value) => ({
          targetType: "region",
          adcode: value,
          name: optionMap.get(value) || value
        }));

  update();
};

watch(
  () => currentChildrenItem.value,
  (value) => {
    if (!value) {
      return;
    }

    normalizeChildData(true);
  },
  { immediate: true, deep: true }
);

watch(
  () => [
    currentParentItem.value?.id,
    parentRegionSelection.value.provider,
    parentRegionSelection.value.adcode,
    parentRegionSelection.value.geoJsonUrl
  ],
  () => {
    void syncRegionOptions();
  },
  { immediate: true }
);

onMounted(() => {
  normalizeChildData(true);
  void syncRegionOptions();
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

.region-outline-global {
  padding: 0 16px;

  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>
