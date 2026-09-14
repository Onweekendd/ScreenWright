<template>
  <div class="gl-point-editor-page">
    <button class="gl-point-editor-back" type="button" @click="handleBack">
      <el-icon><ArrowLeft /></el-icon>
      <span>返回主编辑视图</span>
    </button>

    <div v-if="initialized && isPointTarget" class="gl-point-editor-layout">
      <section class="stage-panel">
        <div ref="previewHostRef" class="preview-host" />
        <div ref="overlayHostRef" class="editor-overlay-host" />

        <div v-if="isDrawing" class="stage-draw-hint">绘制中，按 Esc 退出编辑</div>

        <div class="stage-toolbar">
          <button
            class="stage-tool-button"
            :class="{ active: isDrawing }"
            type="button"
            title="绘制 / 结束绘制"
            @click="handleToggleDraw"
          >
            <el-icon><EditPen /></el-icon>
          </button>
          <button class="stage-tool-button" type="button" title="新增点位" @click="handleCreatePoint">
            <el-icon><Plus /></el-icon>
          </button>
          <button class="stage-tool-button" type="button" title="定位当前选中" @click="handleFocusSelection">
            <el-icon><Aim /></el-icon>
          </button>
          <button
            class="stage-tool-button"
            :class="{ active: editorConfig.dataPanel.show }"
            type="button"
            title="切换数据面板"
            @click="toggleDataPanel"
          >
            <el-icon><Memo /></el-icon>
          </button>
          <button class="stage-tool-button danger" type="button" title="删除当前选中" @click="handleDeleteSelection">
            <el-icon><Delete /></el-icon>
          </button>
        </div>

        <div class="property-panel">
          <div class="property-panel__title">属性面板</div>

          <template v-if="selection.kind === 'point'">
            <div class="property-row">
              <label>UUID</label>
              <div class="property-text">{{ selection.uuid }}</div>
            </div>

            <div class="property-row">
              <label>ID</label>
              <div class="property-text">{{ selection.id }}</div>
            </div>

            <div class="property-row">
              <label>名称</label>
              <input v-model="selectionName" class="property-input" type="text" @blur="handleSelectionNameBlur" />
            </div>

            <div v-if="selection.lnglat" class="property-row">
              <label>经纬度</label>
              <div class="property-text">
                {{ selection.lnglat[0].toFixed(6) }}, {{ selection.lnglat[1].toFixed(6) }}
              </div>
            </div>

            <div class="property-row property-row--column">
              <label>数据</label>
              <textarea
                v-model="selectionDataText"
                class="property-textarea"
                spellcheck="false"
                @blur="handleSelectionDataBlur"
              />
            </div>
          </template>

          <div v-else class="property-empty">
            在场景中点击点位开始编辑。绘制模式下点击地图即可新增点位。按 <code>Delete</code> 删除，按
            <code>F</code> 聚焦。
          </div>
        </div>
      </section>

      <aside class="point-sidebar">
        <div class="point-sidebar__header">
          <div class="point-sidebar__title">{{ editorTitle }}</div>
          <div class="point-sidebar__subtitle">{{ modeText }}</div>
        </div>

        <section class="point-sidebar__section">
          <div class="point-section-header">
            <div>
              <div class="point-section-title">{{ pointSectionTitle }}</div>
              <div v-if="pointCount === 0" class="point-empty-tip">当前还没有可编辑点位，点击右上方加号创建。</div>
              <div v-else class="point-section-hint">{{ selectionHint }}</div>
            </div>

            <div class="point-header-actions">
              <button class="point-header-button" type="button" title="新增点位" @click="handleCreatePoint">
                <el-icon><Plus /></el-icon>
              </button>
              <button class="point-header-button" type="button" title="删除当前选中" @click="handleDeleteSelection">
                <el-icon><Delete /></el-icon>
              </button>
            </div>
          </div>
        </section>

        <section class="point-sidebar__section">
          <div class="point-section-title">控制模式</div>
          <el-radio-group
            v-model="editorConfig.controlMode"
            class="control-mode-group"
            @change="handleControlModeChange"
          >
            <el-radio label="plane">平面移动</el-radio>
            <el-radio label="transform">3D控制器</el-radio>
          </el-radio-group>
        </section>

        <section class="point-sidebar__section">
          <div class="point-section-title">网格线</div>
          <el-form label-position="left" label-width="64px" class="point-form">
            <el-form-item label="显示">
              <el-checkbox v-model="editorConfig.grid.show" @change="handleGridConfigChange" />
            </el-form-item>

            <el-form-item label="位置">
              <div class="triple-inputs">
                <SwInputNumber
                  v-model="editorConfig.grid.position.x"
                  :controls="false"
                  @change="handleGridConfigChange"
                />
                <SwInputNumber
                  v-model="editorConfig.grid.position.y"
                  :controls="false"
                  @change="handleGridConfigChange"
                />
                <SwInputNumber
                  v-model="editorConfig.grid.position.z"
                  :controls="false"
                  @change="handleGridConfigChange"
                />
              </div>
            </el-form-item>

            <el-form-item label="范围">
              <SwInputNumber v-model="editorConfig.grid.range" :min="1" @change="handleGridConfigChange" />
            </el-form-item>

            <el-form-item label="单元格">
              <SwInputNumber
                v-model="editorConfig.grid.gridSize"
                :min="0.01"
                :step="0.01"
                :precision="2"
                @change="handleGridConfigChange"
              />
            </el-form-item>

            <el-form-item label="颜色">
              <div class="color-row">
                <ScreenwrightColorPicker
                  v-model="editorConfig.grid.color"
                  :options="{ colorTypeOption: 'single', hideInputer: true, hideOpacity: true }"
                  @change="handleGridConfigChange"
                />
                <SwInputNumber
                  v-model="editorConfig.grid.opacity"
                  :min="0"
                  :max="100"
                  @change="handleGridConfigChange"
                />
              </div>
            </el-form-item>
          </el-form>
        </section>

        <section class="point-sidebar__section">
          <div class="point-section-title">点位</div>
          <el-form label-position="left" label-width="64px" class="point-form">
            <el-form-item label="显示">
              <el-checkbox v-model="editorConfig.point.show" @change="handlePointConfigChange" />
            </el-form-item>

            <el-form-item label="大小">
              <SwInputNumber v-model="editorConfig.point.size" :min="8" :max="28" @change="handlePointConfigChange" />
            </el-form-item>

            <el-form-item label="颜色">
              <div class="color-row">
                <ScreenwrightColorPicker
                  v-model="editorConfig.point.color"
                  :options="{ colorTypeOption: 'single', hideInputer: true, hideOpacity: true }"
                  @change="handlePointConfigChange"
                />
                <SwInputNumber
                  v-model="editorConfig.point.opacity"
                  :min="0"
                  :max="100"
                  @change="handlePointConfigChange"
                />
              </div>
            </el-form-item>
          </el-form>
        </section>

        <section v-if="editorConfig.dataPanel.show" class="point-sidebar__section">
          <div class="point-section-title">数据</div>
          <div class="document-editor">
            <MonacoEditor
              language="json"
              theme="sw-config-dark"
              :model-value="documentText"
              :read-only="true"
              :options="jsonEditorOptions"
            />
          </div>
        </section>
      </aside>
    </div>

    <div v-else-if="initialized" class="gl-point-editor-empty">
      <div class="gl-point-editor-empty__title">{{ emptyTitle }}</div>
      <el-button type="primary" @click="handleBack">返回编辑器</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";

import { Aim, ArrowLeft, Delete, EditPen, Memo, Plus } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

import ScreenwrightColorPicker from "@/components/ScreenwrightColorPicker/index.vue";
import { geojsonMapInstance } from "@/components/ScreenwrightSceneComponent/component/echartGlmap/geojsonMapInstance";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import MonacoEditor from "@/components/MonacoEditor/index.vue";
import { saveLayersByType } from "@/views/build/components/buildRender/utils";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
import { useInitLargeScreenData } from "@/views/build/useInitLargeScreenData";

import {
  applyPointEditorDocumentToChild,
  buildEchartGlmapPointEditorPreviewProps,
  clonePointEditorConfig,
  clonePointEditorDocument,
  createPointEditorDocument,
  ensurePointEditorConfig,
  findPointEditorTargetChild,
  isSupportedGlPointEditorChild,
  type PointEditorConfig,
  type PointEditorDocument,
  stringifyPointEditorDocument
} from "../buildConfig/sceneComponent/sceneGlobal/echartGlmapPointEditorUtils";
import { GlMapPointEditorSession, type PointEditorSelectionSnapshot } from "./GlMapPointEditorSession";

const route = useRoute();
const router = useRouter();
const { initLargeScreen } = useInitLargeScreenData();
const { allComponentMap } = useGlobalComponentData();

const previewHostRef = ref<HTMLElement | null>(null);
const overlayHostRef = ref<HTMLElement | null>(null);
const initialized = ref(false);
const hasPendingChanges = ref(false);
const draftDocument = ref<PointEditorDocument>({
  type: "points",
  locateMode: "lnglat",
  path: { id: "points", points: [] }
});
const editorConfig = ref<PointEditorConfig>(clonePointEditorConfig(ensurePointEditorConfig({ editorConfig: {} })));
const selection = ref<PointEditorSelectionSnapshot>({
  kind: "none",
  pointId: null,
  uuid: "",
  id: "",
  name: "",
  lnglat: null,
  data: {}
});
const selectionName = ref("");
const selectionDataText = ref("{}");
const editorMode = ref<"select" | "draw">("select");

let previewInstance: geojsonMapInstance | null = null;
let editorSession: GlMapPointEditorSession | null = null;

const jsonEditorOptions = {
  fontSize: 11,
  lineNumbers: "on" as const,
  lineNumbersMinChars: 3,
  scrollBeyondLastLine: false,
  wordWrap: "on" as const,
  minimap: {
    enabled: false
  }
};

const screenId = computed(() => Number(route.params.id));
const componentId = computed(() => String(route.params.cid || ""));
const childId = computed(() => String(route.query.childId || ""));
const targetComponent = computed(() => allComponentMap.value.get(componentId.value) as any);
const targetChild = computed(() => findPointEditorTargetChild(targetComponent.value, childId.value) as any);
const isPointTarget = computed(() => Boolean(targetChild.value && isSupportedGlPointEditorChild(targetChild.value)));
const editorTargetLabel = computed(() => (targetChild.value?.type === "mapGlIcon" ? "标牌" : "散点"));
const editorTitle = computed(() => `编辑${editorTargetLabel.value}`);
const pointSectionTitle = computed(() => `${editorTargetLabel.value}点位`);
const emptyTitle = computed(() => `未找到可编辑的${editorTargetLabel.value}子组件`);
const isDrawing = computed(() => editorMode.value === "draw");
const pointCount = computed(() => draftDocument.value.path.points.length);
const documentText = computed(() => stringifyPointEditorDocument(draftDocument.value));
const modeText = computed(() => {
  if (editorMode.value === "draw") return "正在绘制";
  if (selection.value.kind === "point") return "已选中点位";
  return "在场景中直接编辑";
});
const selectionHint = computed(() => {
  if (selection.value.kind === "point") {
    return "点击点位即可拖动位置，Delete 删除，F 聚焦。";
  }
  return "在场景中点击点位开始编辑，切到绘制模式后点击地图新增点位。";
});

const syncSelectionPanel = (next: PointEditorSelectionSnapshot) => {
  selection.value = next;
  selectionName.value = next.name || "";
  selectionDataText.value = JSON.stringify(next.data || {}, null, 2);
};

const destroyEditorSession = () => {
  editorSession?.dispose();
  editorSession = null;
};

const destroyPreview = () => {
  destroyEditorSession();
  previewInstance?.dispose();
  previewInstance = null;
};

const persistChanges = async () => {
  if (!targetComponent.value || !targetChild.value) {
    return true;
  }

  applyPointEditorDocumentToChild(targetChild.value, draftDocument.value);
  targetChild.value.editorConfig = targetChild.value.editorConfig || {};
  targetChild.value.editorConfig.pointEditor = clonePointEditorConfig(editorConfig.value);

  if (!hasPendingChanges.value) {
    return true;
  }

  const result = await saveLayersByType(
    targetComponent.value,
    Boolean(targetComponent.value.parentDynamicPanelId?.length)
  );
  const success = !(result && typeof result === "object" && "success" in result && result.success === false);
  if (success) {
    hasPendingChanges.value = false;
  }
  return success;
};

const createEditorSession = () => {
  if (!previewInstance || !targetChild.value || !overlayHostRef.value) {
    return;
  }

  const runtime = previewInstance.getEditorRuntimeContext();
  if (!runtime) {
    return;
  }

  destroyEditorSession();
  previewInstance.setMouseInteractionEnabled(false);
  previewInstance.setEditorNavigationMode(true);
  previewInstance.setNavigationEnabled(true);

  editorSession = markRaw(
    new GlMapPointEditorSession({
      runtime,
      mapApi: {
        pickMapLocalPositionFromClient: previewInstance.pickMapLocalPositionFromClient.bind(previewInstance),
        lngLatToMapLocalPosition: previewInstance.lngLatToMapLocalPosition.bind(previewInstance),
        mapLocalPositionToLngLat: previewInstance.mapLocalPositionToLngLat.bind(previewInstance)
      },
      overlayHost: overlayHostRef.value,
      document: draftDocument.value,
      config: editorConfig.value,
      onSelectionChange: syncSelectionPanel,
      onDocumentCommit: (document) => {
        draftDocument.value = clonePointEditorDocument(document);
        hasPendingChanges.value = true;
      },
      onModeChange: (mode) => {
        editorMode.value = mode;
      }
    })
  );

  editorSession.mount();
};

const initPreview = async () => {
  if (!previewHostRef.value || !overlayHostRef.value || !targetComponent.value || !targetChild.value) {
    return;
  }

  previewInstance = markRaw(new geojsonMapInstance());
  await previewInstance.updateDraw(
    previewHostRef.value,
    buildEchartGlmapPointEditorPreviewProps(targetComponent.value) as any
  );

  const runtime = previewInstance.getEditorRuntimeContext();
  if (runtime) {
    runtime.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1));
    runtime.renderer.shadowMap.enabled = false;
    if (runtime.controls) {
      runtime.controls.enableDamping = false;
      runtime.controls.dampingFactor = 0;
      runtime.controls.update();
    }
  }

  draftDocument.value = createPointEditorDocument(targetChild.value);
  editorConfig.value = clonePointEditorConfig(ensurePointEditorConfig(targetChild.value));
  createEditorSession();
};

const initializeEditor = async () => {
  initialized.value = false;

  if (!targetComponent.value) {
    await initLargeScreen(screenId.value);
  }

  if (!isPointTarget.value) {
    initialized.value = true;
    return;
  }

  initialized.value = true;
  await nextTick();
  await initPreview();
};

const handleBack = async () => {
  const success = await persistChanges();
  if (!success) {
    return;
  }

  router.push({ name: "build", params: { id: screenId.value } });
};

const handleSelectionNameBlur = () => {
  editorSession?.updateSelectedName(selectionName.value);
};

const handleSelectionDataBlur = () => {
  try {
    editorSession?.updateSelectedUserDataText(selectionDataText.value);
  } catch {
    ElMessage.error("数据必须是合法 JSON");
    selectionDataText.value = JSON.stringify(selection.value.data || {}, null, 2);
  }
};

const handleControlModeChange = () => {
  editorSession?.setControlMode(editorConfig.value.controlMode);
  hasPendingChanges.value = true;
};

const handleGridConfigChange = () => {
  editorSession?.updateGridConfig(editorConfig.value.grid);
  hasPendingChanges.value = true;
};

const handlePointConfigChange = () => {
  editorSession?.updatePointConfig(editorConfig.value.point);
  hasPendingChanges.value = true;
};

const handleToggleDraw = () => {
  editorSession?.toggleDrawMode();
};

const handleCreatePoint = () => {
  editorSession?.createPointAndBeginDraw();
};

const handleDeleteSelection = () => {
  editorSession?.deleteSelection();
};

const handleFocusSelection = () => {
  editorSession?.focusSelection();
};

const toggleDataPanel = () => {
  editorConfig.value.dataPanel.show = !editorConfig.value.dataPanel.show;
  hasPendingChanges.value = true;
};

onBeforeRouteLeave(async () => {
  return await persistChanges();
});

onMounted(async () => {
  await initializeEditor();
});

onBeforeUnmount(() => {
  destroyPreview();
});
</script>

<style scoped lang="scss">
.gl-point-editor-page {
  display: flex;
  min-height: 100vh;
  height: 100vh;
  flex-direction: column;
  padding: 14px 16px 16px;
  box-sizing: border-box;
  overflow: hidden;
  background: #1c1f29;
  color: #eef2ff;
}

.gl-point-editor-back {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  margin-bottom: 8px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--sw-theme-color) 35%, transparent);
  border-radius: 6px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--sw-theme-color) 20%, transparent) 0%, color-mix(in srgb, var(--sw-theme-color) 14%, transparent) 100%);
  color: #d8cfff;
  font-size: 12px;
  cursor: pointer;
}

.gl-point-editor-layout {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 336px;
  gap: 12px;
  min-height: 0;
  overflow: hidden;
}

.stage-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid #000;
  background: var(--sw-panel-bg);
  min-height: 0;
}

.preview-host {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 96px);
}

.editor-overlay-host {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 12;
}

.stage-draw-hint {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  height: 30px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(35, 38, 48, 0.92);
  color: #dce4f7;
  font-size: 12px;
  line-height: 30px;
  letter-spacing: 0.2px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
  z-index: 20;
}

.stage-toolbar {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 8px;
  border-radius: 14px;
  background: rgba(10, 13, 18, 0.88);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
  z-index: 20;
}

.stage-tool-button {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #dce4f7;
  cursor: pointer;
}

.stage-tool-button.active {
  background: color-mix(in srgb, var(--sw-theme-color) 28%, transparent);
  color: #ffffff;
}

.stage-tool-button.danger {
  color: #ff8a8a;
}

.property-panel {
  position: absolute;
  left: 18px;
  bottom: 18px;
  width: 332px;
  padding: 14px;
  border: 1px solid #000;
  border-radius: 8px;
  background: var(--sw-panel-bg);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.16);
  z-index: 20;
}

.property-panel__title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.property-row {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.property-row--column {
  align-items: start;
}

.property-row label {
  font-size: 12px;
  color: #b4b7c1;
}

.property-text,
.property-input,
.property-textarea {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  background: #181b24;
  color: #eef2ff;
  box-sizing: border-box;
}

.property-text {
  min-height: 18px;
  padding: 8px 10px;
  font-size: 12px;
}

.property-input {
  height: 34px;
  padding: 0 10px;
}

.property-textarea {
  min-height: 110px;
  padding: 10px;
  resize: vertical;
}

.property-empty {
  font-size: 12px;
  color: #8e97ab;
  line-height: 1.7;
}

.property-empty code {
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  color: #f5f7ff;
}

.point-sidebar {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid #000;
  background: var(--sw-panel-bg);
}

.point-sidebar__header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-height: 52px;
  padding: 12px 14px;
  border-bottom: 1px solid #373a47;
}

.point-sidebar__title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.point-sidebar__subtitle {
  font-size: 12px;
  color: #8e97ab;
}

.point-sidebar__section {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.point-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.point-section-title {
  margin-bottom: 0;
  font-size: 12px;
  font-weight: 400;
  color: #fff;
}

.point-empty-tip,
.point-section-hint {
  font-size: 12px;
  line-height: 1.6;
  color: #8e97ab;
}

.point-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.point-header-button {
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: #dce4f7;
  cursor: pointer;
}

.point-form :deep(.el-form-item) {
  margin-bottom: 10px;
}

.point-form :deep(.el-form-item__label) {
  padding: 0 !important;
  color: #b4b7c1 !important;
  font-size: 12px;
  font-weight: 400;
}

.control-mode-group {
  display: flex;
  gap: 18px;
}

.control-mode-group :deep(.el-radio) {
  margin-right: 0;
}

.control-mode-group :deep(.el-radio__inner) {
  border-color: rgba(255, 255, 255, 0.45);
  background: transparent;
}

.control-mode-group :deep(.el-radio__inner:hover),
.control-mode-group :deep(.el-radio__input.is-focus .el-radio__inner) {
  border-color: var(--sw-theme-color);
}

.control-mode-group :deep(.el-radio__input.is-checked .el-radio__inner) {
  border-color: var(--sw-theme-color);
  background: var(--sw-theme-color);
}

.control-mode-group :deep(.el-radio__input.is-checked + .el-radio__label) {
  color: var(--sw-theme-color);
}

.triple-inputs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
}

.color-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 86px;
  gap: 8px;
  width: 100%;
}

.document-editor {
  width: 100%;
  height: 220px;
  min-height: 180px;
  max-height: min(280px, 36vh);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: #0f131c;
}

.document-editor :deep(.monaco-editor-sw) {
  height: 100%;
}

.gl-point-editor-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  border: 1px dashed rgba(255, 255, 255, 0.16);
  background: rgba(19, 23, 31, 0.4);
}

.gl-point-editor-empty__title {
  font-size: 14px;
  color: #b7bfd5;
}
</style>
