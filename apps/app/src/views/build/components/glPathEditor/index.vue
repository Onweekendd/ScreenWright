<template>
  <div class="gl-path-editor-page">
    <button class="gl-path-editor-back" type="button" @click="handleBack">
      <el-icon><ArrowLeft /></el-icon>
      <span>返回主编辑视图</span>
    </button>

    <div v-if="initialized && isPathTarget" class="gl-path-editor-layout">
      <section class="stage-panel">
        <div ref="previewHostRef" class="preview-host" />
        <div ref="overlayHostRef" class="editor-overlay-host" />

        <div v-if="isDrawing" class="stage-draw-hint">绘制中，按 Esc 退出编辑</div>

        <div class="stage-toolbar">
          <button
            class="stage-tool-button"
            :class="{ active: isDrawing }"
            type="button"
            :title="drawActionTitle"
            @click="handleToggleDraw"
          >
            <el-icon><EditPen /></el-icon>
          </button>
          <button class="stage-tool-button" type="button" :title="createActionTitle" @click="handleCreatePath">
            <el-icon><Plus /></el-icon>
          </button>
          <button class="stage-tool-button" type="button" title="聚焦当前选中" @click="handleFocusSelection">
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

          <template v-if="selection.kind !== 'none'">
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
            {{ propertyHelpText }}
          </div>
        </div>
      </section>

      <aside class="path-sidebar">
        <div class="path-sidebar__header">
          <div class="path-sidebar__title">{{ editorTitle }}</div>
          <div class="path-sidebar__subtitle">{{ modeText }}</div>
        </div>

        <section class="path-sidebar__section">
          <div class="path-section-header">
            <div>
              <div class="path-section-title">{{ nodeSectionTitle }}</div>
              <div v-if="pathCount === 0" class="path-empty-tip">{{ emptyTipText }}</div>
              <div v-else class="path-section-hint">{{ selectionHint }}</div>
            </div>

            <div class="path-header-actions">
              <button class="path-header-button" type="button" :title="createActionTitle" @click="handleCreatePath">
                <el-icon><Plus /></el-icon>
              </button>
              <button class="path-header-button" type="button" title="删除当前选中" @click="handleDeleteSelection">
                <el-icon><Delete /></el-icon>
              </button>
            </div>
          </div>
        </section>

        <section class="path-sidebar__section">
          <div class="path-section-title">控制模式</div>
          <el-radio-group
            v-model="editorConfig.controlMode"
            class="control-mode-group"
            @change="handleControlModeChange"
          >
            <el-radio label="plane">平面移动</el-radio>
            <el-radio label="transform">3D控制器</el-radio>
          </el-radio-group>
        </section>

        <section class="path-sidebar__section">
          <div class="path-section-title">网格线</div>
          <el-form label-position="left" label-width="64px" class="path-form">
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

        <section class="path-sidebar__section">
          <div class="path-section-title">线段辅助</div>
          <el-form label-position="left" label-width="64px" class="path-form">
            <el-form-item label="显示">
              <el-checkbox v-model="editorConfig.line.show" @change="handleLineConfigChange" />
            </el-form-item>

            <el-form-item label="颜色">
              <div class="color-row">
                <ScreenwrightColorPicker
                  v-model="editorConfig.line.color"
                  :options="{ colorTypeOption: 'single', hideInputer: true, hideOpacity: true }"
                  @change="handleLineConfigChange"
                />
                <SwInputNumber
                  v-model="editorConfig.line.opacity"
                  :min="0"
                  :max="100"
                  @change="handleLineConfigChange"
                />
              </div>
            </el-form-item>
          </el-form>
        </section>

        <section v-if="editorConfig.dataPanel.show" class="path-sidebar__section">
          <div class="path-section-title">数据</div>
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

    <div v-else-if="initialized" class="gl-path-editor-empty">
      <div class="gl-path-editor-empty__title">{{ emptyStateTitle }}</div>
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
  applyPathEditorDocumentToChild,
  buildEchartGlmapPathEditorPreviewProps,
  clonePathEditorConfig,
  clonePathEditorDocument,
  createPathEditorDocument,
  ensurePathEditorConfig,
  findPathEditorTargetChild,
  getPathEditorProfile,
  isSupportedGlPathEditorChild,
  type PathEditorConfig,
  type PathEditorDocument,
  type PathEditorProfile,
  stringifyPathEditorDocument
} from "../buildConfig/sceneComponent/sceneGlobal/echartGlmapPathEditorUtils";
import { GlMapPathEditorSession, type PathEditorSelectionSnapshot } from "./GlMapPathEditorSession";

const route = useRoute();
const router = useRouter();
const { initLargeScreen } = useInitLargeScreenData();
const { allComponentMap } = useGlobalComponentData();

const previewHostRef = ref<HTMLElement | null>(null);
const overlayHostRef = ref<HTMLElement | null>(null);
const initialized = ref(false);
const hasPendingChanges = ref(false);
const draftDocument = ref<PathEditorDocument>({ type: "path", locateMode: "lnglat", paths: {} });
const editorConfig = ref<PathEditorConfig>(clonePathEditorConfig(ensurePathEditorConfig({ editorConfig: {} })));
const selection = ref<PathEditorSelectionSnapshot>({
  kind: "none",
  pathId: null,
  pointId: null,
  uuid: "",
  id: "",
  name: "",
  lnglat: null,
  closed: false,
  data: {}
});
const selectionName = ref("");
const selectionDataText = ref("{}");
const editorMode = ref<"select" | "preDraw" | "draw">("select");

let previewInstance: geojsonMapInstance | null = null;
let editorSession: GlMapPathEditorSession | null = null;

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
const targetChild = computed(() => findPathEditorTargetChild(targetComponent.value, childId.value) as any);
const editorProfile = computed<PathEditorProfile>(() => getPathEditorProfile(targetChild.value));
const isPathTarget = computed(() => Boolean(targetChild.value && isSupportedGlPathEditorChild(targetChild.value)));
const isDrawing = computed(() => editorMode.value === "draw" || editorMode.value === "preDraw");
const pathCount = computed(() => Object.keys(draftDocument.value.paths).length);
const documentText = computed(() => stringifyPathEditorDocument(draftDocument.value));
const editorTitle = computed(() => (editorProfile.value === "fence" ? "编辑围墙" : "编辑路径"));
const nodeSectionTitle = computed(() => (editorProfile.value === "fence" ? "围墙节点" : "路径节点"));
const createActionTitle = computed(() => (editorProfile.value === "fence" ? "新增围墙" : "新增路径"));
const drawActionTitle = computed(() => (isDrawing.value ? "结束绘制" : createActionTitle.value));
const emptyStateTitle = computed(() =>
  editorProfile.value === "fence" ? "未找到可编辑的围墙子组件" : "未找到可编辑的路径子组件"
);
const emptyTipText = computed(() =>
  editorProfile.value === "fence"
    ? "当前还没有可编辑围墙，点击右上角加号创建。"
    : "当前还没有可编辑路径，点击右上角加号创建。"
);
const propertyHelpText = computed(() =>
  editorProfile.value === "fence"
    ? "在场景中直接点击围墙边界或节点即可开始编辑。按 Delete 删除，按 F 聚焦。"
    : "在场景中直接点击线段或节点即可开始编辑。按 Delete 删除，按 F 聚焦。"
);
const modeText = computed(() => {
  if (editorMode.value === "draw") return editorProfile.value === "fence" ? "正在绘制围墙" : "正在绘制路径";
  if (editorMode.value === "preDraw") return editorProfile.value === "fence" ? "等待围墙落点" : "等待路径落点";
  if (selection.value.kind === "point") return "已选中节点";
  if (selection.value.kind === "path") return editorProfile.value === "fence" ? "已选中围墙" : "已选中路径";
  return editorProfile.value === "fence" ? "在场景中直接编辑围墙" : "在场景中直接编辑路径";
});
const selectionHint = computed(() => {
  if (selection.value.kind === "point") {
    return editorProfile.value === "fence"
      ? "点击节点可拖动围墙边界，双击结束绘制。"
      : "点击节点可拖动路径位置，双击结束绘制。";
  }

  if (selection.value.kind === "path") {
    return editorProfile.value === "fence"
      ? "点击边界线选中围墙，点击中间 + 可插入节点。"
      : "点击线段选中路径，点击中间 + 可插入节点。";
  }

  return editorProfile.value === "fence" ? "在场景中点击围墙边界或节点开始编辑。" : "在场景中点击线段或节点开始编辑。";
});

const syncSelectionPanel = (next: PathEditorSelectionSnapshot) => {
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

  applyPathEditorDocumentToChild(targetChild.value, draftDocument.value);
  targetChild.value.editorConfig = targetChild.value.editorConfig || {};
  targetChild.value.editorConfig.pathEditor = clonePathEditorConfig(editorConfig.value);

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
    new GlMapPathEditorSession({
      runtime,
      mapApi: {
        pickMapLocalPositionFromClient: previewInstance.pickMapLocalPositionFromClient.bind(previewInstance),
        lngLatToMapLocalPosition: previewInstance.lngLatToMapLocalPosition.bind(previewInstance),
        mapLocalPositionToLngLat: previewInstance.mapLocalPositionToLngLat.bind(previewInstance)
      },
      overlayHost: overlayHostRef.value,
      document: draftDocument.value,
      config: editorConfig.value,
      profile: editorProfile.value,
      defaultClosed: editorProfile.value === "fence",
      onSelectionChange: syncSelectionPanel,
      onDocumentCommit: (document) => {
        draftDocument.value = clonePathEditorDocument(document);
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
    buildEchartGlmapPathEditorPreviewProps(targetComponent.value, targetChild.value.id) as any
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

  draftDocument.value = createPathEditorDocument(targetChild.value, previewInstance.getGeoJson());
  editorConfig.value = clonePathEditorConfig(ensurePathEditorConfig(targetChild.value));
  createEditorSession();
};

const initializeEditor = async () => {
  initialized.value = false;

  if (!targetComponent.value) {
    await initLargeScreen(screenId.value);
  }

  if (!isPathTarget.value) {
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

const handleLineConfigChange = () => {
  editorSession?.updateLineConfig(editorConfig.value.line);
  hasPendingChanges.value = true;
};

const handleToggleDraw = () => {
  editorSession?.toggleDrawMode();
};

const handleCreatePath = () => {
  editorSession?.createPathAndBeginDraw();
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

onBeforeRouteLeave(async () => await persistChanges());

onMounted(async () => {
  await initializeEditor();
});

onBeforeUnmount(() => {
  destroyPreview();
});
</script>

<style scoped lang="scss">
.gl-path-editor-page {
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

.gl-path-editor-back {
  align-self: flex-start;
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
}

.gl-path-editor-layout {
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
  background: #232630;
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
  background: rgba(113, 78, 245, 0.28);
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
  background: #232630;
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

.path-sidebar {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid #000;
  background: #232630;
}

.path-sidebar__header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-height: 52px;
  padding: 12px 14px;
  border-bottom: 1px solid #373a47;
}

.path-sidebar__title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.path-sidebar__subtitle {
  font-size: 12px;
  color: #8e97ab;
}

.path-sidebar__section {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.path-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.path-section-title {
  font-size: 12px;
  color: #fff;
}

.path-form :deep(.el-form-item) {
  margin-bottom: 10px;
}

.path-form :deep(.el-form-item__label) {
  padding: 0 !important;
  color: #b4b7c1 !important;
  font-size: 12px;
  font-weight: 400;
}

.path-section-hint,
.path-empty-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #9aa4ba;
  line-height: 1.6;
}

.path-header-actions {
  display: flex;
  gap: 8px;
}

.path-header-button {
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  background: transparent;
  color: #d7dcee;
  cursor: pointer;
}

.control-mode-group {
  display: flex;
  gap: 22px;
  margin-top: 10px;
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
  border-color: #8b5cf6;
}

.control-mode-group :deep(.el-radio__input.is-checked .el-radio__inner) {
  border-color: #8b5cf6;
  background: #8b5cf6;
}

.control-mode-group :deep(.el-radio__input.is-checked + .el-radio__label) {
  color: #8b5cf6;
}

.path-form {
  margin-top: 10px;
}

.triple-inputs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
}

.color-row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
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

.gl-path-editor-empty {
  display: grid;
  flex: 1;
  place-items: center;
  gap: 12px;
}

.gl-path-editor-empty__title {
  color: #eef2ff;
  font-size: 16px;
}
</style>
