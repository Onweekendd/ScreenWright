<template>
  <div class="gl-fly-line-editor-page">
    <button class="gl-fly-line-editor-back" type="button" @click="handleBack">
      <el-icon><ArrowLeft /></el-icon>
      <span>返回主编辑视图</span>
    </button>

    <div v-if="initialized && isFlyLineTarget" class="gl-fly-line-editor-layout">
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
          <button class="stage-tool-button" type="button" title="新增飞线" @click="handleCreateFlyLine">
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

            <div v-if="selection.pointRole" class="property-row">
              <label>端点</label>
              <div class="property-text">{{ selection.pointRole === "from" ? "起点" : "终点" }}</div>
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
            在场景中直接点击飞线或端点即可开始编辑。按 <code>Delete</code> 删除，按 <code>F</code> 聚焦。
          </div>
        </div>
      </section>

      <aside class="fly-line-sidebar">
        <div class="fly-line-sidebar__header">
          <div class="fly-line-sidebar__title">编辑飞线</div>
          <div class="fly-line-sidebar__subtitle">{{ modeText }}</div>
        </div>

        <section class="fly-line-sidebar__section">
          <div class="fly-line-section-header">
            <div>
              <div class="fly-line-section-title">飞线节点</div>
              <div v-if="lineCount === 0" class="fly-line-empty-tip">当前还没有可编辑飞线，点击右上方加号创建。</div>
              <div v-else class="fly-line-section-hint">{{ selectionHint }}</div>
            </div>

            <div class="fly-line-header-actions">
              <button class="fly-line-header-button" type="button" title="新增飞线" @click="handleCreateFlyLine">
                <el-icon><Plus /></el-icon>
              </button>
              <button class="fly-line-header-button" type="button" title="删除当前选中" @click="handleDeleteSelection">
                <el-icon><Delete /></el-icon>
              </button>
            </div>
          </div>
        </section>

        <section class="fly-line-sidebar__section">
          <div class="fly-line-section-title">控制模式</div>
          <el-radio-group
            v-model="editorConfig.controlMode"
            class="control-mode-group"
            @change="handleControlModeChange"
          >
            <el-radio label="plane">平面移动</el-radio>
            <el-radio label="transform">3D控制器</el-radio>
          </el-radio-group>
        </section>

        <section class="fly-line-sidebar__section">
          <div class="fly-line-section-title">网格线</div>
          <el-form label-position="left" label-width="64px" class="fly-line-form">
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

        <section class="fly-line-sidebar__section">
          <div class="fly-line-section-title">线段</div>
          <el-form label-position="left" label-width="64px" class="fly-line-form">
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

        <section v-if="editorConfig.dataPanel.show" class="fly-line-sidebar__section">
          <div class="fly-line-section-title">数据</div>
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

    <div v-else-if="initialized" class="gl-fly-line-editor-empty">
      <div class="gl-fly-line-editor-empty__title">未找到可编辑的飞线子组件</div>
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
  applyFlyLineEditorDocumentToChild,
  buildEchartGlmapFlyLineEditorPreviewProps,
  cloneFlyLineEditorConfig,
  cloneFlyLineEditorDocument,
  createFlyLineEditorDocument,
  ensureFlyLineEditorConfig,
  findFlyLineEditorTargetChild,
  isSupportedGlFlyLineEditorChild,
  stringifyFlyLineEditorDocument,
  type FlyLineEditorConfig,
  type FlyLineEditorDocument
} from "../buildConfig/sceneComponent/sceneGlobal/echartGlmapFlyLineEditorUtils";
import { GlMapFlyLineEditorSession, type FlyLineEditorSelectionSnapshot } from "./GlMapFlyLineEditorSession";

const route = useRoute();
const router = useRouter();
const { initLargeScreen } = useInitLargeScreenData();
const { allComponentMap } = useGlobalComponentData();

const previewHostRef = ref<HTMLElement | null>(null);
const overlayHostRef = ref<HTMLElement | null>(null);
const initialized = ref(false);
const hasPendingChanges = ref(false);
const draftDocument = ref<FlyLineEditorDocument>({ type: "flyLine", locateMode: "lnglat", paths: {} });
const editorConfig = ref<FlyLineEditorConfig>(
  cloneFlyLineEditorConfig(ensureFlyLineEditorConfig({ editorConfig: {} }))
);
const selection = ref<FlyLineEditorSelectionSnapshot>({
  kind: "none",
  pathId: null,
  pointId: null,
  uuid: "",
  id: "",
  name: "",
  lnglat: null,
  pointRole: null,
  data: {}
});
const selectionName = ref("");
const selectionDataText = ref("{}");
const editorMode = ref<"select" | "preDraw" | "draw">("select");

let previewInstance: geojsonMapInstance | null = null;
let editorSession: GlMapFlyLineEditorSession | null = null;

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
const targetChild = computed(() => findFlyLineEditorTargetChild(targetComponent.value, childId.value) as any);
const isFlyLineTarget = computed(() =>
  Boolean(targetChild.value && isSupportedGlFlyLineEditorChild(targetChild.value))
);
const isDrawing = computed(() => editorMode.value === "draw" || editorMode.value === "preDraw");
const lineCount = computed(() => Object.keys(draftDocument.value.paths).length);
const documentText = computed(() => stringifyFlyLineEditorDocument(draftDocument.value));
const modeText = computed(() => {
  if (editorMode.value === "draw") return "正在绘制";
  if (editorMode.value === "preDraw") return "等待起点";
  if (selection.value.kind === "point") return "已选中端点";
  if (selection.value.kind === "path") return "已选中飞线";
  return "在场景中直接编辑";
});
const selectionHint = computed(() => {
  if (selection.value.kind === "point") {
    return "点击端点可拖动位置。飞线只有起点和终点两个端点。";
  }
  if (selection.value.kind === "path") {
    return "点击飞线选中对象，重新绘制时只需依次点击起点和终点。";
  }
  return "在场景中点击飞线或端点开始编辑。";
});

const syncSelectionPanel = (next: FlyLineEditorSelectionSnapshot) => {
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

  applyFlyLineEditorDocumentToChild(targetChild.value, draftDocument.value);
  targetChild.value.editorConfig = targetChild.value.editorConfig || {};
  targetChild.value.editorConfig.flyLineEditor = cloneFlyLineEditorConfig(editorConfig.value);

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
    new GlMapFlyLineEditorSession({
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
        draftDocument.value = cloneFlyLineEditorDocument(document);
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
    buildEchartGlmapFlyLineEditorPreviewProps(targetComponent.value, targetChild.value.id) as any
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

  draftDocument.value = createFlyLineEditorDocument(targetChild.value);
  editorConfig.value = cloneFlyLineEditorConfig(ensureFlyLineEditorConfig(targetChild.value));
  createEditorSession();
};

const initializeEditor = async () => {
  initialized.value = false;

  if (!targetComponent.value) {
    await initLargeScreen(screenId.value);
  }

  if (!isFlyLineTarget.value) {
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

const handleCreateFlyLine = () => {
  editorSession?.createFlyLineAndBeginDraw();
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
.gl-fly-line-editor-page {
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

.gl-fly-line-editor-back {
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

.gl-fly-line-editor-layout {
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

.property-empty code {
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  color: #f5f7ff;
}

.fly-line-sidebar {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid #000;
  background: #232630;
}

.fly-line-sidebar__header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-height: 52px;
  padding: 12px 14px;
  border-bottom: 1px solid #373a47;
}

.fly-line-sidebar__title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.fly-line-sidebar__subtitle {
  font-size: 12px;
  color: #8e97ab;
}

.fly-line-sidebar__section {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.fly-line-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.fly-line-section-title {
  font-size: 12px;
  color: #fff;
}

.fly-line-form :deep(.el-form-item__label) {
  padding: 0 !important;
  color: #b4b7c1 !important;
  font-size: 12px;
  font-weight: 400;
}

.fly-line-section-hint,
.fly-line-empty-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #9aa4ba;
  line-height: 1.6;
}

.fly-line-header-actions {
  display: flex;
  gap: 8px;
}

.fly-line-header-button {
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: #cbd4ea;
  cursor: pointer;
}

.control-mode-group {
  display: flex;
  gap: 18px;
  margin-top: 8px;
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

.fly-line-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.fly-line-form :deep(.el-form-item__label),
.control-mode-group :deep(.el-radio__label) {
  color: #dce4f7;
  font-size: 12px;
}

.triple-inputs,
.color-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
}

.color-row {
  grid-template-columns: 24px 86px;
  align-items: center;
  justify-content: start;
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

.gl-fly-line-editor-empty {
  display: flex;
  min-height: calc(100vh - 100px);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.gl-fly-line-editor-empty__title {
  font-size: 16px;
  color: #f4f7ff;
}
</style>
