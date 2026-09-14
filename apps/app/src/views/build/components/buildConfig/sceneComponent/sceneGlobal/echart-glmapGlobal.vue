<template>
  <div class="echart-glmap-global">
    <template v-if="isSceneTarget">
      <el-form-item label="地图范围" :label-width="firstLabelWidth">
        <el-tree-select
          popper-class="sw-select-dropdown"
          :modelValue="currentRegion"
          :data="mapRegionCatalog"
          style="width: 100%"
          :check-strictly="true"
          @change="handleRegionChange"
        />
      </el-form-item>
      <el-form-item label="编辑模式" :label-width="firstLabelWidth">
        <el-button type="primary" size="small" class="scene-entry-button" @click="handleOpenEditMode">
          进入地图预览
        </el-button>
      </el-form-item>
      <el-form-item label="场景管理" :label-width="firstLabelWidth">
        <el-button type="primary" size="small" class="scene-entry-button" @click="handleOpenSceneManager">
          进入场景管理
        </el-button>
      </el-form-item>
      <el-form-item label="相机距离" :label-width="firstLabelWidth">
        <SwInputNumber v-model="selectTargetData[0].option.camera.distance" :min="20" :max="110" @change="update" />
      </el-form-item>
      <el-form-item label="垂直旋转" :label-width="firstLabelWidth">
        <SwInputNumber v-model="selectTargetData[0].option.camera.verticalTiltAngle" @change="update" />
      </el-form-item>
      <el-form-item label="水平旋转" :label-width="firstLabelWidth">
        <SwInputNumber v-model="selectTargetData[0].option.camera.horizontalRotationAngle" @change="update" />
      </el-form-item>
      <el-form-item label="地图旋转" :label-width="firstLabelWidth">
        <SwInputNumber v-model="selectTargetData[0].option.sceneControl.mapRotationAngle" @change="update" />
      </el-form-item>
      <el-form-item label="地图厚度" :label-width="firstLabelWidth">
        <SwInputNumber v-model="selectTargetData[0].option.sceneControl.regionHeight" @change="update" />
      </el-form-item>
      <SwCollapseItem title="地图区域" open>
        <template #content>
          <el-form-item label="填充方式" :label-width="secondLabelWidth">
            <el-select
              popper-class="sw-select-dropdown"
              v-model="selectTargetData[0].option.fillType"
              @change="update"
            >
              <el-option v-for="item in backgroundType" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item
            label="区域颜色"
            :label-width="secondLabelWidth"
            v-if="selectTargetData[0].option.fillType === 'color'"
          >
            <SwSingleColorPicker @change="update" v-model="selectTargetData[0].option.areaColor" />
          </el-form-item>

          <el-form-item
            label="颜色贴图"
            :label-width="secondLabelWidth"
            v-if="selectTargetData[0].option.fillType === 'picture'"
          >
            <sw-upload
              v-model="selectTargetData[0].option.picture"
              :fileType="FileType.img"
              :multiple="false"
              :showFileList="false"
              @change="update"
              @delete="update"
            />
          </el-form-item>
          <template v-if="selectTargetData[0].option.fillType === 'picture'">
            <el-form-item label="贴图平铺" :label-width="secondLabelWidth">
              <div style="display: flex; gap: 8px">
                <SwInputNumber
                  v-model="selectTargetData[0].option.uvScaleX"
                  :step="0.1"
                  :min="0.1"
                  @change="update"
                  placeholder="X"
                />
                <SwInputNumber
                  v-model="selectTargetData[0].option.uvScaleY"
                  :step="0.1"
                  :min="0.1"
                  @change="update"
                  placeholder="Y"
                />
              </div>
            </el-form-item>
            <el-form-item label="贴图偏移" :label-width="secondLabelWidth">
              <div style="display: flex; gap: 8px">
                <SwInputNumber
                  v-model="selectTargetData[0].option.uvOffsetX"
                  :step="0.1"
                  @change="update"
                  placeholder="X"
                />
                <SwInputNumber
                  v-model="selectTargetData[0].option.uvOffsetY"
                  :step="0.1"
                  @change="update"
                  placeholder="Y"
                />
              </div>
            </el-form-item>
            <el-form-item label="贴图旋转" :label-width="secondLabelWidth">
              <SwInputNumber v-model="selectTargetData[0].option.uvRotation" @change="update" />
            </el-form-item>
          </template>
          <!-- <el-form-item
          label="选中颜色贴图"
          :label-width="secondLabelWidth"
          v-if="selectTargetData[0].option.fillType === 'picture'"
        >
          <sw-upload
            v-model="selectTargetData[0].option.activePicture"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item> -->
          <!-- <el-form-item
          label="法线贴图"
          :label-width="secondLabelWidth"
          v-if="selectTargetData[0].option.fillType === 'picture'"
        >
          <sw-upload
            v-model="selectTargetData[0].option.normalMap"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
        <el-form-item
          label="法线系数"
          :label-width="secondLabelWidth"
          v-if="selectTargetData[0].option.fillType === 'picture'"
        >
          <SwInputNumber v-model="selectTargetData[0].option.normalMapIntensity" :min="0" @change="update" />
        </el-form-item> -->

          <el-form-item label="边框粗細" :label-width="secondLabelWidth">
            <SwInputNumber v-model="selectTargetData[0].option.borderWidth" :min="0" @change="update" />
          </el-form-item>
          <el-form-item label="边框颜色" :label-width="secondLabelWidth">
            <SwSingleColorPicker @change="update" v-model="selectTargetData[0].option.borderColor" />
          </el-form-item>
          <!-- 顶部泛光边界线配置 -->
          <el-form-item label="地块颜色" :label-width="secondLabelWidth">
            <SwSingleColorPicker @change="update" v-model="selectTargetData[0].option.sideGlowColor" />
          </el-form-item>
          <el-form-item label="地块辉光系数" :label-width="secondLabelWidth">
            <SwInputNumber
              v-model="selectTargetData[0].option.sideGlowStrength"
              :min="0"
              :max="5"
              controls
              @change="update"
            />
          </el-form-item>
          <el-form-item label="选中颜色" :label-width="secondLabelWidth">
            <SwSingleColorPicker @change="update" v-model="selectTargetData[0].option.activeAreaColor" />
          </el-form-item>
          <el-form-item label="选中边框颜色" :label-width="secondLabelWidth">
            <SwSingleColorPicker @change="update" v-model="selectTargetData[0].option.activeBorderColor" />
          </el-form-item>
        </template>
      </SwCollapseItem>
      <SwCollapseItem title="文本标签" open>
        <template #content>
          <el-form-item label="文本样式" title="文本样式" :label-width="secondLabelWidth">
            <ConfigTextStyle v-model="input" @change="handleConfigTextChange" />
          </el-form-item>
        </template>
      </SwCollapseItem>
      <SwCollapseItem title="光源设置" open>
        <template #content>
          <el-form-item label="环境光颜色" :label-width="secondLabelWidth">
            <SwSingleColorPicker @change="update" v-model="selectTargetData[0].option.light.ambientColor" />
          </el-form-item>
          <el-form-item label="环境光强度" :label-width="secondLabelWidth">
            <SwInputNumber
              v-model="selectTargetData[0].option.light.ambientIntensity"
              :min="0"
              :max="20"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="方向光颜色" :label-width="secondLabelWidth">
            <SwSingleColorPicker @change="update" v-model="selectTargetData[0].option.light.directionalColor" />
          </el-form-item>
          <el-form-item label="方向光强度" :label-width="secondLabelWidth">
            <SwInputNumber
              v-model="selectTargetData[0].option.light.directionalIntensity"
              :min="0"
              :max="20"
              @change="update"
            />
          </el-form-item>
        </template>
      </SwCollapseItem>
      <!-- <SwCollapseItem title="特效设置" open> -->
      <SwCollapseItem
        title="辉光处理"
        show-icon
        v-model="selectTargetData[0].option.sceneControl.bloom.enable"
        @change="update"
      >
        <template #content>
          <el-form-item label="泛光强度" :label-width="secondLabelWidth">
            <SwInputNumber
              v-model="selectTargetData[0].option.sceneControl.bloom.strength"
              :step="0.1"
              :min="0"
              :max="10"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="泛光半径" :label-width="secondLabelWidth">
            <SwInputNumber
              v-model="selectTargetData[0].option.sceneControl.bloom.radius"
              :step="0.01"
              :min="0"
              :max="1"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="泛光阈值" :label-width="secondLabelWidth">
            <SwInputNumber
              v-model="selectTargetData[0].option.sceneControl.bloom.threshold"
              :step="0.01"
              :min="0"
              :max="1"
              @change="update"
            />
          </el-form-item>
        </template>
      </SwCollapseItem>
      <SwCollapseItem
        title="内阴影"
        show-icon
        v-model="selectTargetData[0].option.sceneControl.innerShadow.enable"
        @change="update"
      >
        <template #content>
          <el-form-item label="颜色" :label-width="secondLabelWidth">
            <SwSingleColorPicker @change="update" v-model="selectTargetData[0].option.sceneControl.innerShadow.color" />
          </el-form-item>
          <el-form-item label="半径" :label-width="secondLabelWidth">
            <SwInputNumber
              v-model="selectTargetData[0].option.sceneControl.innerShadow.radius"
              :step="0.01"
              :min="0"
              :max="1"
              @change="update"
              controls
            />
          </el-form-item>
          <!-- <el-form-item label="强度" :label-width="secondLabelWidth">
          <SwInputNumber
            v-model="selectTargetData[0].option.sceneControl.innerShadow.opacity"
            :step="0.1"
            :min="0"
            :max="1"
            @change="update"
            controls
          />
        </el-form-item> -->
          <el-form-item label="分辨率" :label-width="secondLabelWidth">
            <SwInputNumber
              v-model="selectTargetData[0].option.sceneControl.innerShadow.resolution"
              :step="128"
              :min="128"
              :max="4096"
              @change="update"
              controls
            />
          </el-form-item>
        </template>
      </SwCollapseItem>
      <SwCollapseItem title="鼠标灵敏度" open>
        <template #content>
          <el-form-item label="滚轮缩放" :label-width="secondLabelWidth">
            <SwInputNumber
              v-model="selectTargetData[0].option.mouseControl.zoomSpeed"
              :min="0"
              :max="100"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="左键平移" :label-width="secondLabelWidth">
            <SwInputNumber
              v-model="selectTargetData[0].option.mouseControl.panSpeed"
              :min="0"
              :max="100"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="右键旋转" :label-width="secondLabelWidth">
            <SwInputNumber
              v-model="selectTargetData[0].option.mouseControl.rotateSpeed"
              :min="0"
              :max="100"
              @change="update"
            />
          </el-form-item>
        </template>
      </SwCollapseItem>
      <SwCollapseItem title="交互选项" open>
        <template #content>
          <el-form-item label="悬停抬升" :label-width="secondLabelWidth">
            <SwInputNumber
              v-model="selectTargetData[0].option.hoverLift.hoverLiftHeight"
              :min="0"
              :max="10"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="抬升间隔" :label-width="secondLabelWidth">
            <SwInputNumber v-model="selectTargetData[0].option.hoverLift.hoverLiftDuration" :min="0" @change="update" />
          </el-form-item>
          <el-form-item label="默认抬升" :label-width="secondLabelWidth">
            <el-select
              popper-class="sw-select-dropdown"
              v-model="selectTargetData[0].option.defaultLiftAdcode"
              :loading="defaultLiftOptionsLoading"
              @change="update"
            >
              <el-option
                v-for="item in defaultLiftOptions"
                :key="item.value || 'none'"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <template v-if="showDrillConfig">
            <el-form-item label="地图点击交互" title="地图点击交互" :label-width="firstLabelWidth">
              <el-checkbox @change="update" v-model="selectTargetData[0].option.autoDrillDown" />
            </el-form-item>
            <el-form-item
              label="最大下转"
              v-if="selectTargetData[0].option.autoDrillDown"
              :label-width="secondLabelWidth"
            >
              <sw-input-number
                @change="update"
                controls
                v-model="selectTargetData[0].option.maxDrillDownLevel"
                :max="2"
                :min="0"
              />
            </el-form-item>
          </template>
        </template>
      </SwCollapseItem>

      <!-- 地图编辑预览弹窗 -->
      <el-dialog
        v-model="editVisible"
        title="地图编辑预览"
        width="80%"
        destroy-on-close
        @opened="handleEditOpened"
        @closed="handleEditClosed"
      >
        <div ref="previewMapRef" class="preview-map-container" />
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="editVisible = false">关闭</el-button>
          </div>
        </template>
      </el-dialog>
    </template>
  </div>
</template>
<script setup lang="ts">
import { computed, markRaw, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import GeoDataUtils from "@/components/ScreenwrightSceneComponent/component/echartcommonMap/geoDataUtils";
import { geojsonMapInstance } from "@/components/ScreenwrightSceneComponent/component/echartGlmap/geojsonMapInstance";
import { loadStaticGeoJson } from "@/components/ScreenwrightSceneComponent/component/echartGlmap/geoJsonRegionProvider";
import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwSingleColorPicker from "@/components/SwSingleColorPicker/index.vue";
import { FileType } from "@/components/SwUpload/SwUpload";
import SwUpload from "@/components/SwUpload/index.vue";

import ConfigTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import {
  getCurrentMapRegionSelection,
  getMapRegionModelValue,
  getMapRegionPath,
  mapRegionCatalog
} from "../mapRegionCatalog";
import {
  buildEchartGlmapEditorProps,
  ensureEchartGlmapViewManager,
  isEchartGlmapSceneComponent
} from "./echartGlmapSceneEditorUtils";

const route = useRoute();
const router = useRouter();
const { selectTargetData, update } = useUpdateInstance();
const isSceneTarget = computed(() => isEchartGlmapSceneComponent(selectTargetData.value[0]));
const defaultLiftOptions = ref<{ label: string; value: string }[]>([{ label: "无", value: "" }]);
const defaultLiftOptionsLoading = ref(false);
let defaultLiftRequestId = 0;
let geoUtils: GeoDataUtils | null = null;

const ensureGeoUtils = () => {
  if (!geoUtils) {
    geoUtils = new GeoDataUtils().init();
  }

  return geoUtils;
};

const buildDefaultLiftOptions = (features: any[] = []) => {
  const optionMap = new Map<string, string>();

  features.forEach((feature: any) => {
    const properties = feature?.properties || {};
    const adcode = String(properties.adcode || "");
    const name = String(properties.name || "");

    if (adcode && name && !optionMap.has(adcode)) {
      optionMap.set(adcode, name);
    }
  });

  return [
    { label: "无", value: "" },
    ...Array.from(optionMap.entries()).map(([value, label]) => ({
      label,
      value
    }))
  ];
};

// 补全配置：确保组件也有 bloom 和 innerShadow 结构
watch(
  () => (isSceneTarget.value ? selectTargetData.value[0]?.option?.sceneControl : null),
  (sc) => {
    if (sc && typeof sc === "object") {
      if (!sc.bloom) {
        sc.bloom = {
          enable: false,
          strength: 0.5,
          radius: 0.4,
          threshold: 0
        };
      }
      if (!sc.innerShadow) {
        sc.innerShadow = {
          enable: false,
          color: "#000000",
          radius: 0.3,
          opacity: 1.0,
          resolution: 1024
        };
      }
    }
  },
  { immediate: true }
);

watch(
  () => (isSceneTarget.value ? selectTargetData.value[0]?.option : null),
  (opt) => {
    if (opt && typeof opt === "object") {
      if (!opt.hoverLift || typeof opt.hoverLift !== "object") {
        opt.hoverLift = {};
      }
      if (opt.hoverLift.hoverLiftHeight === undefined) {
        opt.hoverLift.hoverLiftHeight = opt.hoverLift.height ?? 1;
      }
      if (opt.hoverLift.hoverLiftDuration === undefined) {
        opt.hoverLift.hoverLiftDuration = opt.hoverLift.duration ?? 300;
      }
      if (opt.uvScaleX === undefined) {
        opt.uvScaleX = 1;
      }
      if (opt.uvScaleY === undefined) {
        opt.uvScaleY = 1;
      }
      if (opt.uvOffsetX === undefined) {
        opt.uvOffsetX = 0;
      }
      if (opt.uvOffsetY === undefined) {
        opt.uvOffsetY = 0;
      }
      if (opt.uvRotation === undefined) {
        opt.uvRotation = 0;
      }
      if (opt.defaultLiftAdcode === undefined) {
        opt.defaultLiftAdcode = "";
      }
    }
  },
  { immediate: true }
);

const backgroundType = reactive([
  {
    label: "颜色",
    value: "color"
  },
  {
    label: "材质",
    value: "picture"
  }
]);
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "color",
  attrs: "textStyle"
});

const editVisible = ref(false);
const previewMapRef = ref<HTMLElement | null>(null);
let previewInstance: geojsonMapInstance | null = null;

const currentRegionSelection = computed(() => getCurrentMapRegionSelection(selectTargetData.value[0]?.data));
const showDrillConfig = computed(() => currentRegionSelection.value.allowDrillDown);
const currentRegion = computed(() => getMapRegionModelValue(selectTargetData.value[0]?.data).value);

const syncDefaultLiftOptions = async () => {
  if (!isSceneTarget.value || !selectTargetData.value[0]) {
    defaultLiftOptions.value = [{ label: "无", value: "" }];
    return;
  }

  const requestId = ++defaultLiftRequestId;
  const region = currentRegionSelection.value;

  defaultLiftOptionsLoading.value = true;

  try {
    let features: any[] = [];

    if (region.provider === "geojson-file" && region.geoJsonUrl) {
      const geoJson = await loadStaticGeoJson(region.geoJsonUrl);
      features = geoJson.features || [];
    } else if (region.provider === "china-adcode" && region.adcode) {
      const result = await ensureGeoUtils().getGeoData(region.adcode);
      features = result?.fullData?.features || [];
    }

    if (requestId !== defaultLiftRequestId) {
      return;
    }

    const nextOptions = buildDefaultLiftOptions(features);
    defaultLiftOptions.value = nextOptions;

    const currentDefaultLiftAdcode = String(selectTargetData.value[0]?.option?.defaultLiftAdcode || "");
    if (currentDefaultLiftAdcode && !nextOptions.some((item) => item.value === currentDefaultLiftAdcode)) {
      selectTargetData.value[0].option.defaultLiftAdcode = "";
      update();
    }
  } catch (error) {
    if (requestId !== defaultLiftRequestId) {
      return;
    }

    console.warn("[echart-glmap] 默认抬升候选区域加载失败:", error);
    defaultLiftOptions.value = [{ label: "无", value: "" }];
  } finally {
    if (requestId === defaultLiftRequestId) {
      defaultLiftOptionsLoading.value = false;
    }
  }
};

const handleRegionChange = (value: string | { value?: string }) => {
  const regionValue = typeof value === "string" ? value : value?.value || "china";
  const regionPath = getMapRegionPath(regionValue);
  selectTargetData.value[0].data = regionPath;
  selectTargetData.value[0].option.refreshKey = !selectTargetData.value[0].option.refreshKey;
  update();
};

const handleOpenEditMode = () => {
  editVisible.value = true;
};

const getMapProps = () => buildEchartGlmapEditorProps(selectTargetData.value[0]);

const handleOpenSceneManager = () => {
  const component = selectTargetData.value[0] as any;

  if (!isEchartGlmapSceneComponent(component)) {
    return;
  }

  ensureEchartGlmapViewManager(component);
  router.push({
    name: "glScene",
    params: {
      id: route.params.id,
      cid: component.id
    }
  });
};

const handleEditOpened = async () => {
  if (!previewMapRef.value) return;

  if (!previewInstance) {
    previewInstance = markRaw(new geojsonMapInstance());
  }

  const props = getMapProps();
  await previewInstance.updateDraw(previewMapRef.value, props as any);
};

const handleEditClosed = () => {
  if (previewInstance) {
    previewInstance.dispose();
    previewInstance = null;
  }
};

// 监听配置变化，实时更新预览
watch(
  () => [selectTargetData.value[0].option, selectTargetData.value[0].presetChild, selectTargetData.value[0].data],
  async () => {
    if (editVisible.value && previewInstance && previewMapRef.value) {
      const props = getMapProps();
      await previewInstance.updateDraw(previewMapRef.value, props as any);
    }
  },
  { deep: true }
);

watch(
  () => [
    isSceneTarget.value,
    currentRegionSelection.value.provider,
    currentRegionSelection.value.adcode,
    currentRegionSelection.value.geoJsonUrl
  ],
  () => {
    void syncDefaultLiftOptions();
  },
  { immediate: true }
);
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
:deep(.el-color-picker__trigger) {
  border: none !important;
  width: 28px !important;
  height: 28px !important;
}

.preview-map-container {
  width: 100%;
  height: 600px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.dialog-footer {
  text-align: right;
  padding-top: 10px;
}

.scene-entry-button {
  min-width: 96px;
  border: none !important;
  background: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%) !important;
  box-shadow: 0 6px 16px color-mix(in srgb, var(--sw-theme-color) 22%, transparent);
}

.scene-entry-button:hover,
.scene-entry-button:focus {
  background: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%) !important;
}

.scene-entry-button.is-disabled,
.scene-entry-button.is-disabled:hover {
  background: linear-gradient(180deg, color-mix(in srgb, var(--sw-theme-color) 72%, transparent) 0%, color-mix(in srgb, var(--sw-theme-color) 72%, transparent) 100%) !important;
  box-shadow: none;
}
</style>
