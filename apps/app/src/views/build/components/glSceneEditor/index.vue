<template>
  <div class="gl-scene-editor-page">
    <button class="gl-scene-editor-back" type="button" @click="handleBack">
      <el-icon><ArrowLeft /></el-icon>
      <span>返回主编辑视图</span>
    </button>

    <div v-if="initialized && isSceneTarget" class="gl-scene-editor-layout">
      <section class="stage-panel">
        <div class="stage-frame">
          <div ref="previewHostRef" class="preview-host" />
        </div>
      </section>

      <aside class="scene-sidebar">
        <div class="scene-sidebar__header">
          <div class="scene-sidebar__title">场景管理</div>
          <div class="scene-sidebar__subtitle">{{ sceneStatusText }}</div>
        </div>

        <section class="scene-sidebar__section scene-sidebar__section--manager">
          <SwCollapseItem class="scene-collapse" title="多场景" v-model="scenePanelExpanded">
            <template #icon>
              <div class="scene-collapse__actions">
                <button
                  class="scene-tool-button"
                  type="button"
                  title="复制场景"
                  :disabled="!selectedScene"
                  @click.stop="handleCloneScene"
                >
                  <Icon type="iconfont-copy" size="14" />
                </button>
                <button class="scene-tool-button" type="button" title="新增场景" @click.stop="handleAddScene">
                  <Icon type="Plus" size="14" />
                </button>
                <button
                  class="scene-tool-button"
                  type="button"
                  title="删除场景"
                  :disabled="!selectedScene"
                  @click.stop="handleRemoveScene"
                >
                  <Icon type="iconfont-shanchu" size="14" />
                </button>
              </div>
            </template>
            <template #content>
              <div v-if="draftScenes.length" class="scene-collapse__body">
                <ScreenwrightSeriesTabs v-model="selectedSceneTab" :tabs="sceneTabOptions" />
              </div>
              <div v-else class="scene-empty-panel">
                <SwEmpty
                  class="scene-empty-panel__content"
                  size="36"
                  :imgStyle="{ width: '72px', height: '72px' }"
                  :desc="'先从当前视角创建一个场景'"
                  fontSize="12"
                />
              </div>
            </template>
          </SwCollapseItem>
        </section>

        <section v-if="selectedScene" class="scene-sidebar__section scene-sidebar__section--roam">
          <div class="scene-roam-block">
            <div class="scene-roam-block__header">
              <div class="scene-roam-block__title">视角漫游</div>
              <div class="scene-collapse__actions">
                <button
                  class="scene-tool-button"
                  type="button"
                  title="定位"
                  :disabled="!selectedShot"
                  @click.stop="handleLocateShot"
                >
                  <Icon type="iconfont-dingwei" size="14" />
                </button>
                <button
                  class="scene-tool-button"
                  type="button"
                  title="播放"
                  :disabled="!selectedScene.shots.length"
                  @click.stop="handlePlayShots"
                >
                  <Icon type="Promotion" size="14" />
                </button>
                <button class="scene-tool-button" type="button" title="添加" @click.stop="handleAddShot">
                  <Icon type="Plus" size="14" />
                </button>
                <button
                  class="scene-tool-button"
                  type="button"
                  title="删除"
                  :disabled="!selectedShot"
                  @click.stop="handleRemoveShot"
                >
                  <Icon type="iconfont-shanchu" size="14" />
                </button>
              </div>
            </div>

            <div v-if="selectedScene.shots.length && selectedShot" class="scene-roam-panel">
              <div class="scene-collapse__body scene-collapse__body--shots">
                <ScreenwrightSeriesTabs v-model="selectedShotTab" :tabs="shotTabOptions" />
              </div>

              <el-form class="scene-roam-form">
                <el-form-item :label-width="shotLabelWidth">
                  <template #label>
                    <span class="scene-form-label">视点</span>
                  </template>
                  <div class="camera-vector-grid">
                    <SwInputNumber
                      v-model="selectedShot.camera.position.x"
                      unit="X"
                      :controls="false"
                      :step="0.1"
                      :precision="4"
                      @change="handleSelectedShotCameraChange"
                    />
                    <SwInputNumber
                      v-model="selectedShot.camera.position.y"
                      unit="Y"
                      :controls="false"
                      :step="0.1"
                      :precision="4"
                      @change="handleSelectedShotCameraChange"
                    />
                    <SwInputNumber
                      v-model="selectedShot.camera.position.z"
                      unit="Z"
                      :controls="false"
                      :step="0.1"
                      :precision="4"
                      @change="handleSelectedShotCameraChange"
                    />
                  </div>
                </el-form-item>

                <el-form-item :label-width="shotLabelWidth">
                  <template #label>
                    <span class="scene-form-label">目标点</span>
                  </template>
                  <div class="camera-vector-grid">
                    <SwInputNumber
                      v-model="selectedShot.camera.target.x"
                      unit="X"
                      :controls="false"
                      :step="0.1"
                      :precision="4"
                      @change="handleSelectedShotCameraChange"
                    />
                    <SwInputNumber
                      v-model="selectedShot.camera.target.y"
                      unit="Y"
                      :controls="false"
                      :step="0.1"
                      :precision="4"
                      @change="handleSelectedShotCameraChange"
                    />
                    <SwInputNumber
                      v-model="selectedShot.camera.target.z"
                      unit="Z"
                      :controls="false"
                      :step="0.1"
                      :precision="4"
                      @change="handleSelectedShotCameraChange"
                    />
                  </div>
                </el-form-item>

                <el-form-item :label-width="shotLabelWidth">
                  <template #label>
                    <span class="scene-form-label">飞行时间</span>
                  </template>
                  <SwInputNumber
                    v-model="selectedShot.duration"
                    unit="s"
                    :controls="false"
                    :min="0"
                    :step="0.1"
                    :precision="1"
                  />
                </el-form-item>
              </el-form>

              <div class="scene-roam-panel__footer">
                <el-button type="primary" class="capture-button" @click="handleCaptureCurrentShot">
                  获取相机当前视角
                </el-button>
              </div>
            </div>
            <div v-else class="scene-empty-panel">
              <SwEmpty
                class="scene-empty-panel__content"
                size="36"
                :imgStyle="{ width: '72px', height: '72px' }"
                :desc="'请先添加一个视角'"
                fontSize="12"
              />
            </div>
          </div>
        </section>

        <section v-else class="scene-sidebar__section scene-sidebar__empty">
          <SwEmpty
            class="scene-sidebar__empty-content"
            size="40"
            :imgStyle="{ width: '92px', height: '92px' }"
            :desc="'请先创建或选择一个场景'"
            fontSize="12"
          />
        </section>
      </aside>
    </div>

    <div v-else-if="initialized" class="gl-scene-editor-empty">
      <div class="gl-scene-editor-empty__title">未找到可编辑的 2.5D 地图组件</div>
      <el-button type="primary" @click="handleBack">返回编辑器</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";

import { ArrowLeft } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { cloneDeep } from "lodash-es";

import {
  geojsonMapInstance,
  type SceneShotItem,
  type SceneStateItem,
  type SceneViewCamera
} from "@/components/ScreenwrightSceneComponent/component/echartGlmap/geojsonMapInstance";
import ScreenwrightSeriesTabs from "@/components/ScreenwrightSeriesTabs/index.vue";
import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwEmpty from "@/components/SwEmpty/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import Icon from "@/components/Icon/index.vue";
import { saveLayersByType } from "@/views/build/components/buildRender/utils";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
import { useInitLargeScreenData } from "@/views/build/useInitLargeScreenData";

import {
  buildEchartGlmapEditorProps,
  ensureEchartGlmapViewManager,
  isEchartGlmapSceneComponent
} from "../buildConfig/sceneComponent/sceneGlobal/echartGlmapSceneEditorUtils";

const route = useRoute();
const router = useRouter();
const { initLargeScreen } = useInitLargeScreenData();
const { allComponentMap } = useGlobalComponentData();

const initialized = ref(false);
const previewHostRef = ref<HTMLElement | null>(null);
const draftScenes = ref<SceneStateItem[]>([]);
const selectedSceneIndex = ref(-1);
const selectedShotIndex = ref(-1);
const previewCurrentView = ref<SceneViewCamera | null>(null);
const scenePanelExpanded = ref(true);
const hasPendingChanges = ref(false);
const isPlayingShots = ref(false);

let suppressDraftDirty = false;
let lastPersistedSnapshot = "";
let shotPlaybackToken = 0;
let previewInstance: geojsonMapInstance | null = null;
let unbindPreviewViewChange: (() => void) | null = null;

const screenId = computed(() => Number(route.params.id));
const componentId = computed(() => String(route.params.cid || ""));
const targetComponent = computed(() => allComponentMap.value.get(componentId.value) as any);
const isSceneTarget = computed(() => isEchartGlmapSceneComponent(targetComponent.value));
const selectedScene = computed(() => draftScenes.value[selectedSceneIndex.value] ?? null);
const selectedShot = computed(() => selectedScene.value?.shots[selectedShotIndex.value] ?? null);
const shotLabelWidth = "64px";

const createId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const getSceneTabLabel = (index: number) => `场景${index + 1}`;
const getShotTabLabel = (index: number) => `视角${index + 1}`;

const sceneTabOptions = computed(() => draftScenes.value.map((_, index) => getSceneTabLabel(index)));
const shotTabOptions = computed(() => selectedScene.value?.shots.map((_, index) => getShotTabLabel(index)) || []);

const selectedSceneTab = computed({
  get: () => (selectedSceneIndex.value >= 0 ? getSceneTabLabel(selectedSceneIndex.value) : ""),
  set: (value: string | number) => {
    const match = String(value).match(/(\d+)$/);
    const index = match ? Number(match[1]) - 1 : -1;
    if (index >= 0 && index < draftScenes.value.length) {
      selectedSceneIndex.value = index;
    }
  }
});

const selectedShotTab = computed({
  get: () => (selectedShotIndex.value >= 0 ? getShotTabLabel(selectedShotIndex.value) : ""),
  set: (value: string | number) => {
    const match = String(value).match(/(\d+)$/);
    const index = match ? Number(match[1]) - 1 : -1;
    if (selectedScene.value && index >= 0 && index < selectedScene.value.shots.length) {
      selectedShotIndex.value = index;
    }
  }
});

const sceneStatusText = computed(() => {
  if (selectedSceneIndex.value < 0) {
    return "未选中任何场景";
  }

  return "当前场景：" + getSceneTabLabel(selectedSceneIndex.value);
});

const createDefaultView = (): SceneViewCamera => ({
  position: { x: 0, y: 0, z: 0 },
  target: { x: 0, y: 0, z: 0 }
});

const normalizeVector = (value: any, fallback: { x: number; y: number; z: number }) => ({
  x: Number(value?.x ?? fallback.x),
  y: Number(value?.y ?? fallback.y),
  z: Number(value?.z ?? fallback.z)
});

const normalizeShot = (item: any, index: number): SceneShotItem => ({
  id: item?.id || createId("shot"),
  name: item?.name || getShotTabLabel(index),
  duration: Math.max(Number(item?.duration ?? 5), 0),
  camera: {
    position: normalizeVector(item?.camera?.position, createDefaultView().position),
    target: normalizeVector(item?.camera?.target, createDefaultView().target)
  }
});

const normalizeScene = (item: any, index: number): SceneStateItem => {
  const rawShots = Array.isArray(item?.shots) && item.shots.length ? item.shots : [];

  return {
    id: item?.id || createId("scene"),
    name: item?.name || getSceneTabLabel(index),
    shots: rawShots.length ? rawShots.map((shot: any, shotIndex: number) => normalizeShot(shot, shotIndex)) : []
  };
};

const convertLegacyViewList = (viewList: any[]) =>
  (Array.isArray(viewList) ? viewList : []).map((item: any, index: number) =>
    normalizeScene(
      {
        name: item?.name || getSceneTabLabel(index),
        shots: [
          {
            name: getShotTabLabel(0),
            duration: item?.duration ?? 5,
            camera: item?.camera
          }
        ]
      },
      index
    )
  );

const getPreviewViewSnapshot = () => {
  if (previewInstance) {
    return cloneDeep(previewInstance.getCurrentView());
  }

  return previewCurrentView.value ? cloneDeep(previewCurrentView.value) : null;
};

const buildShotFromView = (view: SceneViewCamera | null, index: number): SceneShotItem => ({
  id: createId("shot"),
  name: getShotTabLabel(index),
  duration: 5,
  camera: cloneDeep(view || createDefaultView())
});

const buildSceneFromView = (view: SceneViewCamera | null, index: number): SceneStateItem => ({
  id: createId("scene"),
  name: getSceneTabLabel(index),
  shots: [buildShotFromView(view, 0)]
});

const cloneSceneState = (scene: SceneStateItem, index: number): SceneStateItem => ({
  id: createId("scene"),
  name: getSceneTabLabel(index),
  shots: scene.shots.map((shot, shotIndex) => ({
    ...cloneDeep(shot),
    id: createId("shot"),
    name: shot.name || getShotTabLabel(shotIndex)
  }))
});

const stopShotPlayback = () => {
  shotPlaybackToken += 1;
  isPlayingShots.value = false;
  previewInstance?.stopViewAnimation();
};

const buildPersistedSceneList = () =>
  draftScenes.value.map((scene, sceneIndex) => ({
    id: scene.id,
    name: scene.name || getSceneTabLabel(sceneIndex),
    shots: scene.shots.map((shot, shotIndex) => ({
      id: shot.id,
      name: shot.name || getShotTabLabel(shotIndex),
      duration: Math.max(Number(shot.duration || 0), 0),
      camera: cloneDeep(shot.camera)
    }))
  }));

const buildLegacyViewList = (sceneList: SceneStateItem[]) =>
  sceneList
    .map((scene, sceneIndex) => {
      const firstShot = scene.shots[0];
      if (!firstShot) {
        return null;
      }

      return {
        name: scene.name || getSceneTabLabel(sceneIndex),
        duration: Math.max(Number(firstShot.duration || 0), 0),
        camera: cloneDeep(firstShot.camera)
      };
    })
    .filter(Boolean);

const syncViewManagerFromDraft = () => {
  if (!targetComponent.value) {
    return;
  }

  const viewManager = ensureEchartGlmapViewManager(targetComponent.value);
  const persistedSceneList = buildPersistedSceneList();
  viewManager.sceneList = persistedSceneList;
  viewManager.viewList = buildLegacyViewList(persistedSceneList);
};

const persistSceneConfig = async () => {
  if (!targetComponent.value) {
    return true;
  }

  const persistedSceneList = buildPersistedSceneList();
  const nextSnapshot = JSON.stringify(persistedSceneList);
  const viewManager = ensureEchartGlmapViewManager(targetComponent.value);
  viewManager.sceneList = persistedSceneList;
  viewManager.viewList = buildLegacyViewList(persistedSceneList);

  if (!hasPendingChanges.value && nextSnapshot === lastPersistedSnapshot) {
    hasPendingChanges.value = false;
    lastPersistedSnapshot = nextSnapshot;
    return true;
  }

  const result = await saveLayersByType(
    targetComponent.value,
    Boolean(targetComponent.value.parentDynamicPanelId?.length)
  );
  const saveSuccess = !(result && typeof result === "object" && "success" in result && result.success === false);

  if (saveSuccess) {
    hasPendingChanges.value = false;
    lastPersistedSnapshot = nextSnapshot;
  }

  return saveSuccess;
};

const syncDraftScenesFromComponent = () => {
  if (!targetComponent.value) {
    draftScenes.value = [];
    selectedSceneIndex.value = -1;
    selectedShotIndex.value = -1;
    hasPendingChanges.value = false;
    lastPersistedSnapshot = "[]";
    return;
  }

  const viewManager = ensureEchartGlmapViewManager(targetComponent.value);
  const useLegacyViewList = !viewManager.sceneList?.length && Array.isArray(viewManager.viewList) && viewManager.viewList.length > 0;
  const sourceSceneList =
    Array.isArray(viewManager.sceneList) && viewManager.sceneList.length
      ? viewManager.sceneList
      : convertLegacyViewList(viewManager.viewList || []);

  suppressDraftDirty = true;
  draftScenes.value = sourceSceneList.map((scene: any, index: number) => normalizeScene(scene, index));
  suppressDraftDirty = false;

  lastPersistedSnapshot = JSON.stringify(buildPersistedSceneList());
  hasPendingChanges.value = useLegacyViewList;

  if (!draftScenes.value.length) {
    selectedSceneIndex.value = -1;
    selectedShotIndex.value = -1;
    return;
  }

  selectedSceneIndex.value = 0;
  selectedShotIndex.value = draftScenes.value[0].shots.length ? 0 : -1;
};

const initPreview = async () => {
  if (!targetComponent.value) return;

  await nextTick();
  if (!previewHostRef.value) return;

  if (!previewInstance) {
    previewInstance = markRaw(new geojsonMapInstance());
  }

  if (unbindPreviewViewChange) {
    unbindPreviewViewChange();
    unbindPreviewViewChange = null;
  }

  await previewInstance.updateDraw(previewHostRef.value, buildEchartGlmapEditorProps(targetComponent.value) as any);

  unbindPreviewViewChange = previewInstance.onViewChange((view) => {
    previewCurrentView.value = cloneDeep(view);
  });

  if (selectedShot.value) {
    previewInstance.setView(cloneDeep(selectedShot.value.camera));
  } else {
    previewCurrentView.value = cloneDeep(previewInstance.getCurrentView());
  }
};

const initializeEditor = async () => {
  initialized.value = false;
  await initLargeScreen(screenId.value);

  if (!isSceneTarget.value) {
    initialized.value = true;
    return;
  }

  syncDraftScenesFromComponent();
  initialized.value = true;
  await initPreview();
};

const handleBack = async () => {
  stopShotPlayback();
  const saveSuccess = await persistSceneConfig();
  if (!saveSuccess) {
    return;
  }

  router.push({
    name: "build",
    params: {
      id: screenId.value
    }
  });
};

const handleAddScene = () => {
  const currentView = getPreviewViewSnapshot() || selectedShot.value?.camera || createDefaultView();
  draftScenes.value.push(buildSceneFromView(currentView, draftScenes.value.length));
  selectedSceneIndex.value = draftScenes.value.length - 1;
  selectedShotIndex.value = 0;
};

const handleCloneScene = () => {
  if (!selectedScene.value) {
    return;
  }

  draftScenes.value.push(cloneSceneState(selectedScene.value, draftScenes.value.length));
  selectedSceneIndex.value = draftScenes.value.length - 1;
  selectedShotIndex.value = draftScenes.value[selectedSceneIndex.value].shots.length ? 0 : -1;
};

const handleRemoveScene = () => {
  if (selectedSceneIndex.value < 0) {
    return;
  }

  stopShotPlayback();
  draftScenes.value.splice(selectedSceneIndex.value, 1);

  if (!draftScenes.value.length) {
    selectedSceneIndex.value = -1;
    selectedShotIndex.value = -1;
    return;
  }

  selectedSceneIndex.value = Math.min(selectedSceneIndex.value, draftScenes.value.length - 1);
  selectedShotIndex.value = draftScenes.value[selectedSceneIndex.value].shots.length ? 0 : -1;
};

const handleLocateShot = () => {
  if (!previewInstance || !selectedShot.value) {
    return;
  }

  stopShotPlayback();
  previewInstance.setView(cloneDeep(selectedShot.value.camera));
};

const handlePlayShots = async () => {
  if (!previewInstance || !selectedScene.value?.shots.length) {
    return;
  }

  if (isPlayingShots.value) {
    stopShotPlayback();
    return;
  }

  previewInstance.stopViewAnimation();
  const token = ++shotPlaybackToken;
  isPlayingShots.value = true;

  try {
    for (let index = 0; index < selectedScene.value.shots.length; index += 1) {
      if (token !== shotPlaybackToken) {
        break;
      }

      selectedShotIndex.value = index;
      const currentShot = selectedScene.value.shots[index];
      await previewInstance.viewToAsync(cloneDeep(currentShot.camera), Math.max(Number(currentShot.duration || 0), 0) * 1000);
    }
  } finally {
    if (token === shotPlaybackToken) {
      isPlayingShots.value = false;
    }
  }
};

const handleAddShot = () => {
  if (!selectedScene.value) {
    return;
  }

  const currentView = getPreviewViewSnapshot() || selectedShot.value?.camera || createDefaultView();
  const insertIndex = selectedShotIndex.value >= 0 ? selectedShotIndex.value + 1 : selectedScene.value.shots.length;
  selectedScene.value.shots.splice(insertIndex, 0, buildShotFromView(currentView, insertIndex));
  selectedShotIndex.value = insertIndex;
};

const handleRemoveShot = () => {
  if (!selectedScene.value || selectedShotIndex.value < 0) {
    return;
  }

  stopShotPlayback();
  selectedScene.value.shots.splice(selectedShotIndex.value, 1);

  if (!selectedScene.value.shots.length) {
    selectedShotIndex.value = -1;
    return;
  }

  selectedShotIndex.value = Math.min(selectedShotIndex.value, selectedScene.value.shots.length - 1);
};

const handleCaptureCurrentShot = () => {
  if (!selectedShot.value) {
    ElMessage.warning("请先选择一个视角");
    return;
  }

  const currentView = getPreviewViewSnapshot();
  if (!currentView) {
    ElMessage.warning("当前还没有可读取的相机视角");
    return;
  }

  selectedShot.value.camera = cloneDeep(currentView);
  ElMessage.success("已获取相机当前视角");
};

const handleSelectedShotCameraChange = () => {
  if (!previewInstance || !selectedShot.value) {
    return;
  }

  stopShotPlayback();
  previewInstance.setView(cloneDeep(selectedShot.value.camera));
};

watch(
  () => route.params.cid,
  async () => {
    stopShotPlayback();
    await initializeEditor();
  }
);

watch(selectedSceneIndex, (index) => {
  stopShotPlayback();

  if (index < 0 || !selectedScene.value) {
    selectedShotIndex.value = -1;
    return;
  }

  if (!selectedScene.value.shots.length) {
    selectedShotIndex.value = -1;
    return;
  }

  if (selectedShotIndex.value < 0 || selectedShotIndex.value >= selectedScene.value.shots.length) {
    selectedShotIndex.value = 0;
  }
});

watch(
  draftScenes,
  () => {
    if (suppressDraftDirty || !initialized.value || !isSceneTarget.value) {
      return;
    }

    hasPendingChanges.value = true;
    syncViewManagerFromDraft();
  },
  { deep: true }
);

onBeforeRouteLeave(async () => {
  stopShotPlayback();
  return await persistSceneConfig();
});

onMounted(async () => {
  await initializeEditor();
});

onBeforeUnmount(() => {
  stopShotPlayback();

  if (unbindPreviewViewChange) {
    unbindPreviewViewChange();
    unbindPreviewViewChange = null;
  }

  if (previewInstance) {
    previewInstance.dispose();
    previewInstance = null;
  }
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";

.gl-scene-editor-page {
  min-height: 100vh;
  padding: 14px 16px 16px;
  box-sizing: border-box;
  background: #1c1f29;
  color: #eef2ff;
}

.gl-scene-editor-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  margin-bottom: 8px;
  padding: 0 10px;
  border: 1px solid rgba(130, 96, 255, 0.35);
  border-radius: 6px;
  background: linear-gradient(180deg, rgba(113, 78, 245, 0.2) 0%, rgba(74, 40, 171, 0.14) 100%);
  color: #d8cfff;
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.gl-scene-editor-back:hover {
  border-color: rgba(138, 108, 255, 0.68);
  background: linear-gradient(180deg, rgba(123, 86, 255, 0.28) 0%, rgba(82, 46, 189, 0.18) 100%);
  color: #ffffff;
}

.gl-scene-editor-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 344px;
  gap: 12px;
  min-height: calc(100vh - 70px);
}

.stage-panel {
  padding: 8px;
  border: 1px solid #000000;
  background: #232630;
}

.stage-frame {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 96px);
  background: #262c38;
}

.preview-host {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 96px);
}

.scene-sidebar {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  border: 1px solid #000000;
  background: #232630;
}

.scene-sidebar__header {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 0 14px;
  border-bottom: 1px solid #373a47;
}

.scene-sidebar__title {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.scene-sidebar__subtitle {
  font-size: 12px;
  color: #8e97ab;
}

.scene-sidebar__section {
  padding: 0 12px;
}

.scene-sidebar__section--manager,
.scene-sidebar__section--roam {
  padding-top: 8px;
  padding-bottom: 4px;
}

.scene-collapse__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 6px;
}

.scene-tool-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  padding: 0;
  background: transparent;
  color: #b4b7c1;
  cursor: pointer;
  transition: color 0.2s ease;
}

.scene-tool-button:hover {
  color: #9483ff;
}

.scene-tool-button:disabled {
  color: #646c7f;
  cursor: not-allowed;
}

.scene-collapse__body {
  padding: 2px 0 6px;
}

.scene-collapse__body--shots {
  padding-top: 0;
}

.scene-collapse__body :deep(.ft-series-tabs) {
  margin-bottom: 0;
  background: #3d404c;
  opacity: 1;
}

.scene-collapse__body :deep(.ft-series-tabs-content) {
  height: 32px;
}

.scene-collapse__body :deep(.el-tabs) {
  width: 100%;
  margin-top: 0;
}

.scene-collapse__body :deep(.el-tabs__header) {
  margin: 0;
}

.scene-collapse__body :deep(.el-tabs__nav-wrap) {
  height: 32px;
}

.scene-collapse__body :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.scene-collapse__body :deep(.el-tabs__nav) {
  height: 32px;
}

.scene-collapse__body :deep(.el-tabs__active-bar) {
  display: none;
}

.scene-collapse__body :deep(.el-tabs__item) {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px !important;
  height: 32px;
  padding: 0;
  font-size: 12px;
  line-height: 32px;
  color: #b4b7c1;
}

.scene-collapse__body :deep(.el-tabs__item.is-active) {
  color: #9483ff !important;
}

.scene-collapse__body :deep(.el-tabs__item.is-active::after) {
  content: "";
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 0;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
}

.scene-collapse__body :deep(.ft-series-tabs i) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 32px;
  font-size: 14px;
  line-height: 1;
}

.scene-empty-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 0 12px;
}

.scene-empty-panel__content {
  width: 100%;
}

.scene-roam-block {
  padding-top: 4px;
}

.scene-roam-block__header {
  display: flex;
  min-height: 32px;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 4px;
}

.scene-roam-block__title {
  font-size: 12px;
  line-height: 20px;
  color: #ffffff;
}

.scene-roam-panel {
  padding: 4px 0 10px;
}

.scene-roam-form {
  padding-top: 6px;
}

.scene-roam-form :deep(.el-form-item) {
  align-items: flex-start;
  margin-bottom: 12px;
}

.scene-roam-form :deep(.el-form-item__label) {
  padding-right: 8px;
  line-height: 28px;
  white-space: nowrap;
}

.scene-roam-form :deep(.el-form-item__content) {
  min-width: 0;
}

.scene-form-label {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  color: #ffffff;
  line-height: 28px;
  white-space: nowrap;
}

.camera-vector-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
}

.scene-roam-form :deep(.el-input),
.scene-roam-form :deep(.el-input-number),
.scene-roam-form :deep(.sw-input-number) {
  width: 100%;
}

.scene-roam-panel__footer {
  padding-top: 6px;
}

.capture-button {
  width: 100%;
  height: 28px;
  font-size: 12px;
}

.gl-scene-editor-page :deep(.el-button--primary) {
  --el-button-bg-color: #714ef5;
  --el-button-border-color: #714ef5;
  --el-button-hover-bg-color: #8465fb;
  --el-button-hover-border-color: #8465fb;
  --el-button-active-bg-color: #5d35e7;
  --el-button-active-border-color: #5d35e7;
  --el-button-disabled-bg-color: #4d3a91;
  --el-button-disabled-border-color: #4d3a91;
  border: none !important;
  background: linear-gradient(180deg, #8b58e7 0%, #642cff 100%) !important;
  box-shadow: 0 8px 18px rgba(100, 44, 255, 0.24);
}

.gl-scene-editor-page :deep(.el-button--primary:hover),
.gl-scene-editor-page :deep(.el-button--primary:focus) {
  background: linear-gradient(180deg, #9665ef 0%, #7241ff 100%) !important;
}

.gl-scene-editor-page :deep(.el-button--primary.is-disabled),
.gl-scene-editor-page :deep(.el-button--primary.is-disabled:hover) {
  background: linear-gradient(180deg, rgba(123, 97, 209, 0.72) 0%, rgba(90, 55, 179, 0.72) 100%) !important;
  box-shadow: none;
}

.scene-sidebar__empty {
  padding: 8px 12px 0;
}

.scene-sidebar__empty-content {
  width: 100%;
}

.scene-roam-form :deep(.el-input__wrapper),
.scene-roam-form :deep(.el-input-number .el-input__wrapper) {
  min-height: 28px;
  border: 1px solid #282e3a !important;
  background: #0f1014 !important;
  box-shadow: none !important;
}

.scene-roam-form :deep(.el-input__inner),
.scene-roam-form :deep(.el-input-number .el-input__inner) {
  font-size: 12px;
  color: #dce4f7 !important;
}

.scene-roam-form :deep(.el-input-number__decrease),
.scene-roam-form :deep(.el-input-number__increase) {
  background: #181b24 !important;
  border-color: #393b4a !important;
  color: #b4b7c1 !important;
}

.scene-collapse :deep(.el-collapse) {
  --el-collapse-content-bg-color: #232630;
  --el-collapse-border-color: transparent;
  --el-collapse-header-bg-color: #232630;
  --el-collapse-header-text-color: #b4b7c1;
}

.scene-collapse :deep(.el-collapse-item__header) {
  height: 36px;
  border-bottom: none;
  padding-right: 104px;
  font-size: 12px;
}

.scene-collapse :deep(.el-collapse-item__wrap) {
  border-bottom: none;
}

.scene-collapse :deep(.el-collapse-item__content) {
  padding-left: 0;
  padding-bottom: 0;
}

.scene-collapse :deep(.el-collapse-item__content::before) {
  display: none;
}

@include common-element-style(".el-input__wrapper");

.gl-scene-editor-empty {
  display: flex;
  min-height: calc(100vh - 100px);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.gl-scene-editor-empty__title {
  font-size: 16px;
  color: #ffffff;
}

@media (max-width: 1280px) {
  .gl-scene-editor-layout {
    grid-template-columns: 1fr;
  }

  .stage-frame,
  .preview-host {
    min-height: 560px;
  }
}
</style>
