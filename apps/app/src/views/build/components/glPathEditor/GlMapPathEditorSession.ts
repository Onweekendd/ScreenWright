import { cloneDeep } from "lodash-es";
import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";

import type { GlMapEditorRuntimeContext } from "@/components/ScreenwrightSceneComponent/component/echartGlmap/geojsonMapInstance";
import {
  clonePathEditorConfig,
  clonePathEditorDocument,
  createEmptyPathEditorPath,
  type PathEditorProfile,
  type PathEditorConfig,
  type PathEditorDocument,
  type PathEditorPath,
  type PathEditorPoint
} from "@/views/build/components/buildConfig/sceneComponent/sceneGlobal/echartGlmapPathEditorUtils";

type EditorMode = "select" | "preDraw" | "draw";
const PATH_LINE_Z_OFFSET = 0.01;
const PATH_HANDLE_Z_OFFSET = PATH_LINE_Z_OFFSET;

export interface PathEditorMapApi {
  pickMapLocalPositionFromClient(clientX: number, clientY: number): THREE.Vector3 | null;
  lngLatToMapLocalPosition(point: [number, number], zOffset?: number): THREE.Vector3 | null;
  mapLocalPositionToLngLat(position: THREE.Vector3): [number, number] | null;
}

export interface PathEditorSelectionSnapshot {
  kind: "none" | "path" | "point";
  pathId: string | null;
  pointId: string | null;
  uuid: string;
  id: string;
  name: string;
  lnglat: [number, number] | null;
  closed: boolean;
  data: Record<string, any>;
}

interface PathEditorSessionOptions {
  runtime: GlMapEditorRuntimeContext;
  mapApi: PathEditorMapApi;
  overlayHost: HTMLElement;
  document: PathEditorDocument;
  config: PathEditorConfig;
  profile: PathEditorProfile;
  defaultClosed: boolean;
  onSelectionChange?: (selection: PathEditorSelectionSnapshot) => void;
  onDocumentCommit?: (document: PathEditorDocument) => void;
  onModeChange?: (mode: EditorMode) => void;
}

export class GlMapPathEditorSession {
  private readonly runtime: GlMapEditorRuntimeContext;
  private readonly mapApi: PathEditorMapApi;
  private readonly overlayHost: HTMLElement;
  private readonly rootGroup = new THREE.Group();
  private readonly itemMap = new Map<string, PathEditorItem>();
  private readonly raycaster = new THREE.Raycaster();
  private readonly onSelectionChange?: (selection: PathEditorSelectionSnapshot) => void;
  private readonly onDocumentCommit?: (document: PathEditorDocument) => void;
  private readonly onModeChange?: (mode: EditorMode) => void;
  private documentData: PathEditorDocument;
  private config: PathEditorConfig;
  private profile: PathEditorProfile;
  private defaultClosed: boolean;
  private gridHelper: THREE.GridHelper | null = null;
  private transformControls: TransformControls | null = null;
  private transformHelper: THREE.Object3D | null = null;
  private transformAnchor: THREE.Object3D | null = null;
  private transformChanged = false;
  private selectedPathId: string | null = null;
  private selectedPointId: string | null = null;
  private drawingPathId: string | null = null;
  private previewLocalPoint: THREE.Vector3 | null = null;
  private mode: EditorMode = "select";
  private overlayResizeObserver: ResizeObserver | null = null;
  private originalDampingEnabled: boolean | null = null;
  private originalDampingFactor: number | null = null;
  private overlaySyncFrameId: number | null = null;
  private isCameraNavigating = false;
  private pointDragState: {
    pathId: string;
    pointId: string;
    moved: boolean;
    onMove: (event: MouseEvent) => void;
    onUp: () => void;
  } | null = null;

  constructor(options: PathEditorSessionOptions) {
    this.runtime = options.runtime;
    this.mapApi = options.mapApi;
    this.overlayHost = options.overlayHost;
    this.documentData = clonePathEditorDocument(options.document);
    this.config = clonePathEditorConfig(options.config);
    this.profile = options.profile;
    this.defaultClosed = options.defaultClosed;
    this.onSelectionChange = options.onSelectionChange;
    this.onDocumentCommit = options.onDocumentCommit;
    this.onModeChange = options.onModeChange;
    this.rootGroup.name = "glPathEditorRoot";
    if (this.profile === "fence") {
      Object.values(this.documentData.paths).forEach((path) => {
        path.closed = true;
      });
    }
  }

  public mount(): void {
    (this.runtime.mapGroup || this.runtime.scene).add(this.rootGroup);
    if (this.runtime.controls) {
      this.runtime.controls.enablePan = true;
      this.originalDampingEnabled = this.runtime.controls.enableDamping;
      this.originalDampingFactor = this.runtime.controls.dampingFactor;
      this.runtime.controls.enableDamping = false;
      this.runtime.controls.dampingFactor = 0;
    }
    this.runtime.controls?.addEventListener("change", this.handleControlsChange);
    this.runtime.controls?.addEventListener("start", this.handleControlsStart);
    this.runtime.controls?.addEventListener("end", this.handleControlsEnd);
    this.buildGrid();
    this.buildTransformControls();
    this.syncItems();
    this.bindEvents();
    this.observeOverlayResize();
    this.syncAllOverlayProjection();
    this.emitSelectionChange();
    this.emitModeChange();
  }

  public dispose(): void {
    this.cancelPointDrag();
    this.unbindEvents();
    this.overlayResizeObserver?.disconnect();
    this.overlayResizeObserver = null;
    if (this.overlaySyncFrameId) {
      cancelAnimationFrame(this.overlaySyncFrameId);
      this.overlaySyncFrameId = null;
    }
    this.runtime.controls?.removeEventListener("change", this.handleControlsChange);
    this.runtime.controls?.removeEventListener("start", this.handleControlsStart);
    this.runtime.controls?.removeEventListener("end", this.handleControlsEnd);
    this.itemMap.forEach((item) => item.dispose());
    this.itemMap.clear();
    if (this.gridHelper) {
      this.gridHelper.removeFromParent();
      disposeMaterialLike(this.gridHelper.material);
      this.gridHelper = null;
    }
    if (this.transformControls) {
      this.transformControls.detach();
      if (this.transformHelper) {
        this.runtime.scene.remove(this.transformHelper);
        this.transformHelper = null;
      }
      this.transformControls.dispose();
      this.transformControls = null;
    }
    this.transformAnchor?.removeFromParent();
    this.transformAnchor = null;
    this.rootGroup.removeFromParent();
    if (this.runtime.controls) {
      this.runtime.controls.enablePan = true;
      this.runtime.controls.enabled = true;
      if (this.originalDampingEnabled !== null) {
        this.runtime.controls.enableDamping = this.originalDampingEnabled;
      }
      if (this.originalDampingFactor !== null) {
        this.runtime.controls.dampingFactor = this.originalDampingFactor;
      }
    }
  }

  public getRootGroup(): THREE.Group {
    return this.rootGroup;
  }

  public getOverlayHost(): HTMLElement {
    return this.overlayHost;
  }

  public getDocument(): PathEditorDocument {
    return clonePathEditorDocument(this.documentData);
  }

  public getConfig(): PathEditorConfig {
    return clonePathEditorConfig(this.config);
  }

  public getMode(): EditorMode {
    return this.mode;
  }

  public getPath(pathId: string): PathEditorPath | null {
    return this.documentData.paths[pathId] || null;
  }

  public getRenderablePath(pathId: string) {
    const path = this.getPath(pathId);
    if (!path) {
      return null;
    }

    return {
      path,
      localPoints: path.points.map((point) => this.lngLatToLocal(point.lnglat)).filter(Boolean) as THREE.Vector3[],
      previewPoint: this.drawingPathId === pathId ? this.previewLocalPoint : null,
      selectedPointId: this.selectedPathId === pathId ? this.selectedPointId : null,
      selectedPath: this.selectedPathId === pathId
    };
  }

  public getLineStyle(selected: boolean) {
    const opacity = THREE.MathUtils.clamp((this.config.line.opacity ?? 100) / 100, 0, 1);
    return {
      visible: this.config.line.show,
      color: selected ? "#ffffff" : this.config.line.color,
      opacity: selected ? Math.min(1, opacity + 0.15) : opacity
    };
  }

  public isPathSelected(pathId: string): boolean {
    return this.selectedPathId === pathId;
  }

  public shouldShowAddButtons(pathId: string): boolean {
    return (
      this.isPathSelected(pathId) &&
      !this.isCameraNavigating &&
      this.config.controlMode === "plane" &&
      this.mode !== "draw" &&
      this.mode !== "preDraw"
    );
  }

  public getSelectionSnapshot(): PathEditorSelectionSnapshot {
    const selectedPath = this.selectedPathId ? this.documentData.paths[this.selectedPathId] : null;
    const selectedPoint =
      selectedPath && this.selectedPointId
        ? selectedPath.points.find((item) => item.id === this.selectedPointId)
        : null;

    if (selectedPoint && selectedPath) {
      return {
        kind: "point",
        pathId: selectedPath.id,
        pointId: selectedPoint.id,
        uuid: selectedPoint.id,
        id: selectedPoint.customId || selectedPoint.id,
        name: selectedPoint.name,
        lnglat: [...selectedPoint.lnglat] as [number, number],
        closed: selectedPath.closed,
        data: cloneDeep(selectedPoint.userData || {})
      };
    }

    if (selectedPath) {
      return {
        kind: "path",
        pathId: selectedPath.id,
        pointId: null,
        uuid: selectedPath.id,
        id: selectedPath.id,
        name: selectedPath.name,
        lnglat: null,
        closed: selectedPath.closed,
        data: cloneDeep(selectedPath.userData || {})
      };
    }

    return {
      kind: "none",
      pathId: null,
      pointId: null,
      uuid: "",
      id: "",
      name: "",
      lnglat: null,
      closed: false,
      data: {}
    };
  }

  public setControlMode(mode: "plane" | "transform"): void {
    this.config.controlMode = mode;
    this.syncTransformSelection();
  }

  public updateGridConfig(grid: PathEditorConfig["grid"]): void {
    this.config.grid = cloneDeep(grid);
    this.buildGrid();
    this.syncAllOverlayProjection();
  }

  public updateLineConfig(line: PathEditorConfig["line"]): void {
    this.config.line = cloneDeep(line);
    this.itemMap.forEach((item) => item.refresh());
    this.syncAllOverlayProjection();
  }

  public updateSelectedName(name: string): void {
    const path = this.selectedPathId ? this.documentData.paths[this.selectedPathId] : null;
    if (!path) return;
    if (this.selectedPointId) {
      const point = path.points.find((item) => item.id === this.selectedPointId);
      if (!point) return;
      point.name = name;
    } else {
      path.name = name;
    }
    this.commitDocument();
    this.emitSelectionChange();
  }

  public updateSelectedUserDataText(text: string): boolean {
    const parsed = text.trim() ? JSON.parse(text) : {};
    const path = this.selectedPathId ? this.documentData.paths[this.selectedPathId] : null;
    if (!path) return true;
    if (this.selectedPointId) {
      const point = path.points.find((item) => item.id === this.selectedPointId);
      if (!point) return true;
      point.userData = parsed;
    } else {
      path.userData = parsed;
    }
    this.commitDocument();
    this.emitSelectionChange();
    return true;
  }

  public setSelectedPathClosed(closed: boolean): void {
    if (!this.selectedPathId || !this.documentData.paths[this.selectedPathId]) return;
    this.documentData.paths[this.selectedPathId].closed = this.profile === "fence" ? true : closed;
    this.refreshPath(this.selectedPathId);
    this.commitDocument();
    this.emitSelectionChange();
  }

  public createPathAndBeginDraw(): void {
    const path = createEmptyPathEditorPath(
      Object.keys(this.documentData.paths).length,
      this.profile === "fence" ? "围墙" : "路径"
    );
    path.closed = this.defaultClosed;
    this.documentData.paths[path.id] = path;
    this.selectedPathId = path.id;
    this.selectedPointId = null;
    this.drawingPathId = path.id;
    this.previewLocalPoint = null;
    this.mode = "preDraw";
    this.syncItems();
    this.syncAllOverlayProjection();
    this.commitDocument();
    this.emitSelectionChange();
    this.emitModeChange();
  }

  public toggleDrawMode(): void {
    if (this.mode === "draw" || this.mode === "preDraw") {
      const currentPathId = this.drawingPathId ?? this.selectedPathId;
      const currentPath = currentPathId ? this.documentData.paths[currentPathId] : null;
      const minimumPointCount = this.profile === "fence" ? 3 : 2;

      if (currentPath && currentPath.points.length < minimumPointCount) {
        delete this.documentData.paths[currentPath.id];
        if (this.selectedPathId === currentPath.id) {
          this.selectedPathId = null;
        }
        this.selectedPointId = null;
        this.commitDocument();
        this.emitSelectionChange();
      }

      this.previewLocalPoint = null;
      this.drawingPathId = null;
      this.mode = "select";
      this.syncItems();
      this.syncAllOverlayProjection();
      this.syncTransformSelection();
      this.emitModeChange();
      return;
    }

    if (!this.selectedPathId) {
      this.createPathAndBeginDraw();
      return;
    }

    this.drawingPathId = this.selectedPathId;
    this.mode = this.documentData.paths[this.selectedPathId]?.points.length ? "draw" : "preDraw";
    this.refreshPath(this.selectedPathId);
    this.syncAllOverlayProjection();
    this.emitModeChange();
  }

  public deleteSelection(): void {
    const path = this.selectedPathId ? this.documentData.paths[this.selectedPathId] : null;
    if (!path) return;
    const minimumPointCount = this.profile === "fence" ? 3 : 2;

    if (this.selectedPointId) {
      if (path.points.length <= minimumPointCount) {
        delete this.documentData.paths[path.id];
        this.selectedPathId = null;
        this.selectedPointId = null;
        if (this.drawingPathId === path.id) {
          this.drawingPathId = null;
          this.previewLocalPoint = null;
          this.mode = "select";
          this.emitModeChange();
        }
        this.syncItems();
        this.syncAllOverlayProjection();
      } else {
        path.points = path.points.filter((item) => item.id !== this.selectedPointId);
        this.selectedPointId = null;
        this.refreshPath(path.id);
        this.syncAllOverlayProjection();
      }
    } else {
      delete this.documentData.paths[path.id];
      this.selectedPathId = null;
      if (this.drawingPathId === path.id) {
        this.drawingPathId = null;
        this.previewLocalPoint = null;
        this.mode = "select";
        this.emitModeChange();
      }
      this.syncItems();
      this.syncAllOverlayProjection();
    }

    this.syncTransformSelection();
    this.commitDocument();
    this.emitSelectionChange();
  }

  public focusSelection(): void {
    if (!this.runtime.controls || !this.runtime.camera) return;
    const focusPoint = this.getSelectionFocusPoint();
    if (!focusPoint) return;
    const worldPoint = this.runtime.mapGroup
      ? this.runtime.mapGroup.localToWorld(focusPoint.clone())
      : focusPoint.clone();
    const offset = this.runtime.camera.position.clone().sub(this.runtime.controls.target);
    this.runtime.controls.target.copy(worldPoint);
    this.runtime.camera.position.copy(worldPoint.clone().add(offset));
    this.runtime.controls.update();
  }

  public handlePointClick(pathId: string, pointId: string): void {
    this.selectedPathId = pathId;
    this.selectedPointId = pointId;
    this.syncItems();
    this.syncTransformSelection();
    this.emitSelectionChange();
  }

  public beginPointDrag(pathId: string, pointId: string, event: MouseEvent): void {
    this.handlePointClick(pathId, pointId);
    if (this.config.controlMode === "transform") return;
    event.preventDefault();
    event.stopPropagation();
    this.cancelPointDrag();
    this.runtime.controls && (this.runtime.controls.enabled = false);
    this.pointDragState = {
      pathId,
      pointId,
      moved: false,
      onMove: (moveEvent: MouseEvent) => {
        const local = this.pickMapLocal(moveEvent.clientX, moveEvent.clientY);
        if (!local) return;
        if (this.updatePointFromLocal(pathId, pointId, local)) {
          this.pointDragState!.moved = true;
          this.refreshPath(pathId);
          this.syncTransformSelection();
          this.syncAllOverlayProjection();
        }
      },
      onUp: () => {
        const moved = this.pointDragState?.moved;
        this.cancelPointDrag();
        if (moved) {
          this.commitDocument();
          this.emitSelectionChange();
        }
      }
    };
    document.addEventListener("mousemove", this.pointDragState.onMove);
    document.addEventListener("mouseup", this.pointDragState.onUp, { once: true });
  }

  public insertPointAtSegment(pathId: string, segmentIndex: number, startEvent?: MouseEvent): void {
    const path = this.documentData.paths[pathId];
    if (!path || path.points.length < 2) return;
    const locals = path.points.map((point) => this.lngLatToLocal(point.lnglat)).filter(Boolean) as THREE.Vector3[];
    const current = locals[segmentIndex];
    const next = locals[(segmentIndex + 1) % locals.length];
    if (!current || !next) return;
    const middle = current.clone().add(next).multiplyScalar(0.5);
    const lnglat = this.localToLngLat(middle);
    if (!lnglat) return;
    const point: PathEditorPoint = {
      id: `point_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: `Point ${path.points.length + 1}`,
      lnglat,
      userData: {}
    };
    path.points.splice(segmentIndex + 1, 0, point);
    this.handlePointClick(pathId, point.id);
    this.refreshPath(pathId);
    this.syncAllOverlayProjection();
    this.commitDocument();
    if (startEvent && this.config.controlMode === "plane") {
      this.beginPointDrag(pathId, point.id, startEvent);
    }
  }

  private bindEvents(): void {
    this.runtime.domElement?.addEventListener("click", this.handleCanvasClick);
    this.runtime.domElement?.addEventListener("dblclick", this.handleCanvasDoubleClick);
    this.runtime.domElement?.addEventListener("mousemove", this.handleCanvasMouseMove);
    window.addEventListener("keydown", this.handleKeyDown);
  }

  private unbindEvents(): void {
    this.runtime.domElement?.removeEventListener("click", this.handleCanvasClick);
    this.runtime.domElement?.removeEventListener("dblclick", this.handleCanvasDoubleClick);
    this.runtime.domElement?.removeEventListener("mousemove", this.handleCanvasMouseMove);
    window.removeEventListener("keydown", this.handleKeyDown);
  }

  private observeOverlayResize(): void {
    if (typeof ResizeObserver === "undefined") {
      return;
    }

    this.overlayResizeObserver?.disconnect();
    this.overlayResizeObserver = new ResizeObserver(() => {
      this.syncAllOverlayProjection();
    });
    this.overlayResizeObserver.observe(this.overlayHost);
  }

  private readonly handleCanvasClick = (event: MouseEvent) => {
    if (event.defaultPrevented || this.pointDragState) {
      return;
    }

    if (this.mode === "preDraw" || this.mode === "draw") {
      const local = this.pickMapLocal(event.clientX, event.clientY);
      if (!local || !this.drawingPathId) return;
      this.addPointToPath(this.drawingPathId, local);
      this.previewLocalPoint = local.clone();
      this.mode = "draw";
      this.selectedPathId = this.drawingPathId;
      this.selectedPointId = this.getLastPointId(this.drawingPathId);
      this.commitDocument();
      this.refreshPath(this.drawingPathId);
      this.syncAllOverlayProjection();
      this.emitModeChange();
      this.emitSelectionChange();
      return;
    }

    const hitPathId = this.pickLinePathId(event.clientX, event.clientY);
    if (hitPathId) {
      this.selectedPathId = hitPathId;
      this.selectedPointId = null;
      this.syncItems();
      this.syncAllOverlayProjection();
      this.syncTransformSelection();
      this.emitSelectionChange();
      return;
    }

    this.selectedPointId = null;
    this.selectedPathId = null;
    this.syncItems();
    this.syncAllOverlayProjection();
    this.syncTransformSelection();
    this.emitSelectionChange();
  };

  private readonly handleCanvasDoubleClick = (event: MouseEvent) => {
    if (event.defaultPrevented || this.mode !== "draw") {
      return;
    }

    this.previewLocalPoint = null;
    if (this.drawingPathId) {
      this.refreshPath(this.drawingPathId);
      this.syncAllOverlayProjection();
    }
    this.drawingPathId = null;
    this.mode = "select";
    this.emitModeChange();
  };

  private readonly handleCanvasMouseMove = (event: MouseEvent) => {
    if (this.mode !== "draw" || !this.drawingPathId || this.pointDragState) {
      return;
    }

    const local = this.pickMapLocal(event.clientX, event.clientY);
    if (!local) return;
    this.previewLocalPoint = local;
    this.refreshPath(this.drawingPathId);
    this.syncAllOverlayProjection();
  };

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === "Escape" && (this.mode === "preDraw" || this.mode === "draw")) {
      event.preventDefault();
      this.toggleDrawMode();
    } else if (event.key === "Delete" || event.key === "Backspace") {
      this.deleteSelection();
    } else if (event.code === "KeyF") {
      this.focusSelection();
    }
  };

  private readonly handleControlsChange = () => {
    this.syncAllOverlayProjection();
  };

  private readonly handleControlsStart = () => {
    this.isCameraNavigating = true;
    this.syncItems();
    this.syncAllOverlayProjection();
  };

  private readonly handleControlsEnd = () => {
    this.isCameraNavigating = false;
    this.syncItems();
    this.syncAllOverlayProjection();
  };

  private syncAllOverlayProjection(): void {
    if (this.overlaySyncFrameId) {
      return;
    }

    this.overlaySyncFrameId = requestAnimationFrame(() => {
      this.overlaySyncFrameId = null;
      this.itemMap.forEach((item) => item.syncOverlayProjection());
    });
  }

  private buildGrid(): void {
    if (this.gridHelper) {
      this.gridHelper.removeFromParent();
      disposeMaterialLike(this.gridHelper.material);
      this.gridHelper = null;
    }

    if (!this.config.grid.show) {
      return;
    }

    const divisions = Math.max(1, Math.round(this.config.grid.range / Math.max(this.config.grid.gridSize, 1)));
    this.gridHelper = new THREE.GridHelper(
      this.config.grid.range,
      divisions,
      this.config.grid.color,
      this.config.grid.color
    );
    this.gridHelper.rotation.x = Math.PI / 2;
    this.gridHelper.position.set(
      this.config.grid.position.x,
      this.config.grid.position.y,
      this.runtime.baseHeight + this.config.grid.position.z + 0.002
    );
    const materials = Array.isArray(this.gridHelper.material) ? this.gridHelper.material : [this.gridHelper.material];
    materials.forEach((material) => {
      material.transparent = true;
      material.opacity = THREE.MathUtils.clamp((this.config.grid.opacity ?? 100) / 100, 0, 1);
      material.depthWrite = false;
    });
    this.rootGroup.add(this.gridHelper);
  }

  private buildTransformControls(): void {
    if (this.transformControls) {
      return;
    }

    this.transformAnchor = new THREE.Object3D();
    this.rootGroup.add(this.transformAnchor);
    this.transformControls = new TransformControls(this.runtime.camera, this.runtime.renderer.domElement);
    this.transformControls.setMode("translate");
    this.transformControls.showZ = false;
    this.transformControls.size = 0.6;
    this.transformControls.addEventListener("dragging-changed", (event: any) => {
      this.runtime.controls && (this.runtime.controls.enabled = !event.value);
      if (!event.value && this.transformChanged) {
        this.transformChanged = false;
        this.commitDocument();
        this.emitSelectionChange();
      }
    });
    this.transformControls.addEventListener("objectChange", () => {
      if (!this.transformAnchor || !this.selectedPathId || !this.selectedPointId) return;
      if (this.updatePointFromLocal(this.selectedPathId, this.selectedPointId, this.transformAnchor.position)) {
        this.transformChanged = true;
        this.refreshPath(this.selectedPathId);
        this.syncAllOverlayProjection();
      }
    });
    this.transformHelper = this.transformControls.getHelper();
    this.runtime.scene.add(this.transformHelper);
    this.syncTransformSelection();
  }

  private syncTransformSelection(): void {
    if (!this.transformControls || !this.transformAnchor) return;

    if (this.config.controlMode !== "transform" || !this.selectedPathId || !this.selectedPointId) {
      this.transformControls.detach();
      return;
    }

    const path = this.documentData.paths[this.selectedPathId];
    const point = path?.points.find((item) => item.id === this.selectedPointId);
    const local = point ? this.lngLatToLocal(point.lnglat) : null;
    if (!local) {
      this.transformControls.detach();
      return;
    }

    this.transformAnchor.position.copy(local);
    this.transformControls.attach(this.transformAnchor);
  }

  private syncItems(): void {
    const nextIds = new Set(Object.keys(this.documentData.paths));
    this.itemMap.forEach((item, pathId) => {
      if (!nextIds.has(pathId)) {
        item.dispose();
        this.itemMap.delete(pathId);
      }
    });

    Object.keys(this.documentData.paths).forEach((pathId) => {
      if (!this.itemMap.has(pathId)) {
        this.itemMap.set(pathId, new PathEditorItem(this, pathId));
      }
    });

    this.itemMap.forEach((item) => item.refresh());
    this.syncAllOverlayProjection();
  }

  private refreshPath(pathId: string): void {
    this.itemMap.get(pathId)?.refresh();
    this.syncAllOverlayProjection();
  }

  private addPointToPath(pathId: string, local: THREE.Vector3): void {
    const path = this.documentData.paths[pathId];
    const lnglat = this.localToLngLat(local);
    if (!path || !lnglat) return;
    path.points.push({
      id: `point_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: `Point ${path.points.length + 1}`,
      lnglat,
      userData: {}
    });
  }

  private updatePointFromLocal(pathId: string, pointId: string, local: THREE.Vector3): boolean {
    const path = this.documentData.paths[pathId];
    const point = path?.points.find((item) => item.id === pointId);
    const lnglat = this.localToLngLat(local);
    if (!path || !point || !lnglat) return false;
    if (point.lnglat[0] === lnglat[0] && point.lnglat[1] === lnglat[1]) {
      return false;
    }
    point.lnglat = lnglat;
    return true;
  }

  private pickLinePathId(clientX: number, clientY: number): string | null {
    const rect = this.runtime.renderer.domElement.getBoundingClientRect();
    this.raycaster.setFromCamera(
      new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1),
      this.runtime.camera
    );
    (this.raycaster.params.Line as any).threshold = Math.max(0.015, this.runtime.mapSize * 0.01);
    const lines = Array.from(this.itemMap.values())
      .map((item) => item.getLineObject())
      .filter(Boolean) as THREE.Object3D[];
    const intersects = this.raycaster.intersectObjects(lines, false);
    return intersects.length ? String(intersects[0].object.userData.pathId || "") : null;
  }

  private pickMapLocal(clientX: number, clientY: number): THREE.Vector3 | null {
    return this.mapApi.pickMapLocalPositionFromClient(clientX, clientY);
  }

  private lngLatToLocal(lnglat: [number, number]): THREE.Vector3 | null {
    return this.mapApi.lngLatToMapLocalPosition(lnglat);
  }

  private localToLngLat(local: THREE.Vector3): [number, number] | null {
    return this.mapApi.mapLocalPositionToLngLat(local);
  }

  private getLastPointId(pathId: string): string | null {
    const path = this.documentData.paths[pathId];
    return path?.points[path.points.length - 1]?.id || null;
  }

  private getSelectionFocusPoint(): THREE.Vector3 | null {
    if (!this.selectedPathId) return null;
    const path = this.documentData.paths[this.selectedPathId];
    if (this.selectedPointId) {
      const point = path?.points.find((item) => item.id === this.selectedPointId);
      return point ? this.lngLatToLocal(point.lnglat) : null;
    }
    const locals = path?.points.map((item) => this.lngLatToLocal(item.lnglat)).filter(Boolean) as THREE.Vector3[];
    if (!locals.length) return null;
    const center = new THREE.Vector3();
    locals.forEach((item) => center.add(item));
    return center.multiplyScalar(1 / locals.length);
  }

  private cancelPointDrag(): void {
    if (!this.pointDragState) return;
    document.removeEventListener("mousemove", this.pointDragState.onMove);
    document.removeEventListener("mouseup", this.pointDragState.onUp);
    this.pointDragState = null;
    this.runtime.controls && (this.runtime.controls.enabled = true);
  }

  private commitDocument(): void {
    this.onDocumentCommit?.(this.getDocument());
  }

  private emitSelectionChange(): void {
    this.onSelectionChange?.(this.getSelectionSnapshot());
  }

  private emitModeChange(): void {
    this.onModeChange?.(this.mode);
  }
}

class PathEditorItem {
  private readonly lineGeometry = new THREE.BufferGeometry();
  private readonly lineMaterial = new THREE.LineBasicMaterial({
    color: "#f4f7ff",
    transparent: true,
    opacity: 1,
    depthWrite: false
  });
  private readonly line = new THREE.Line(this.lineGeometry, this.lineMaterial);
  private readonly pointHandleMap = new Map<string, PathEditorPointHandle>();
  private readonly addButtons: PathEditorAddButton[] = [];

  constructor(
    readonly session: GlMapPathEditorSession,
    readonly pathId: string
  ) {
    this.line.userData.pathId = pathId;
    this.session.getRootGroup().add(this.line);
  }

  public getLineObject(): THREE.Line {
    return this.line;
  }

  public refresh(): void {
    const renderable = this.session.getRenderablePath(this.pathId);
    if (!renderable) {
      return;
    }

    const { path, localPoints, previewPoint, selectedPointId, selectedPath } = renderable;
    const style = this.session.getLineStyle(selectedPath);
    this.line.visible = style.visible && localPoints.length >= 2;
    this.lineMaterial.color.set(style.color);
    this.lineMaterial.opacity = style.opacity;

    const renderPoints = previewPoint ? [...localPoints, previewPoint] : localPoints;
    const positions: number[] = [];
    renderPoints.forEach((point) => positions.push(point.x, point.y, point.z + PATH_LINE_Z_OFFSET));
    if (path.closed && localPoints.length > 2) {
      positions.push(localPoints[0].x, localPoints[0].y, localPoints[0].z + PATH_LINE_Z_OFFSET);
    }
    this.lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    this.lineGeometry.computeBoundingSphere();

    this.syncPointHandles(path, localPoints, selectedPointId);
    this.syncAddButtons(path, localPoints, !previewPoint && this.session.shouldShowAddButtons(path.id));
  }

  public dispose(): void {
    this.pointHandleMap.forEach((item) => item.dispose());
    this.pointHandleMap.clear();
    this.addButtons.forEach((item) => item.dispose());
    this.line.removeFromParent();
    this.lineGeometry.dispose();
    this.lineMaterial.dispose();
  }

  public syncOverlayProjection(): void {
    this.pointHandleMap.forEach((handle) => handle.syncProjection());
    this.addButtons.forEach((button) => button.syncProjection());
  }

  private syncPointHandles(path: PathEditorPath, localPoints: THREE.Vector3[], selectedPointId: string | null) {
    const nextIds = new Set(path.points.map((point) => point.id));

    this.pointHandleMap.forEach((handle, pointId) => {
      if (!nextIds.has(pointId)) {
        handle.dispose();
        this.pointHandleMap.delete(pointId);
      }
    });

    path.points.forEach((point, index) => {
      if (!this.pointHandleMap.has(point.id)) {
        this.pointHandleMap.set(point.id, new PathEditorPointHandle(this.session, path.id, point.id));
      }
      const handle = this.pointHandleMap.get(point.id)!;
      if (localPoints[index]) {
        handle.setPosition(localPoints[index]);
      }
      handle.setSelected(selectedPointId === point.id);
    });
  }

  private syncAddButtons(path: PathEditorPath, localPoints: THREE.Vector3[], showButtons: boolean) {
    const segmentCount =
      path.closed && localPoints.length > 1 ? localPoints.length : Math.max(localPoints.length - 1, 0);
    while (this.addButtons.length > segmentCount) {
      this.addButtons.pop()?.dispose();
    }

    for (let index = 0; index < segmentCount; index += 1) {
      if (!this.addButtons[index]) {
        this.addButtons[index] = new PathEditorAddButton(this.session, path.id, index);
      }

      const current = localPoints[index];
      const next = localPoints[(index + 1) % localPoints.length];
      if (!current || !next || !showButtons) {
        this.addButtons[index].setVisible(false);
        continue;
      }

      this.addButtons[index].setPosition(current.clone().add(next).multiplyScalar(0.5));
      this.addButtons[index].setVisible(true);
    }
  }
}

class PathEditorPointHandle {
  private readonly element: HTMLButtonElement;
  private position = new THREE.Vector3();

  constructor(
    private readonly session: GlMapPathEditorSession,
    private readonly pathId: string,
    private readonly pointId: string
  ) {
    this.element = document.createElement("button");
    this.element.type = "button";
    Object.assign(this.element.style, {
      position: "absolute",
      left: "0",
      top: "0",
      width: "12px",
      height: "12px",
      borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.95)",
      background: "#5e8cff",
      boxShadow: "0 0 0 2px rgba(94,140,255,0.18)",
      pointerEvents: "auto",
      cursor: "pointer",
      padding: "0",
      outline: "none",
      willChange: "transform",
      transition: "background 0.15s ease, box-shadow 0.15s ease"
    } as CSSStyleDeclaration);
    this.element.addEventListener("click", (event) => {
      event.stopPropagation();
      this.session.handlePointClick(this.pathId, this.pointId);
    });
    this.element.addEventListener("mousedown", (event) => {
      this.session.beginPointDrag(this.pathId, this.pointId, event);
    });
    this.session.getOverlayHost().appendChild(this.element);
  }

  public setPosition(position: THREE.Vector3): void {
    this.position.copy(position);
    this.syncProjection();
  }

  public setSelected(selected: boolean): void {
    this.element.style.background = selected ? "#ff8a3d" : "#5e8cff";
    this.element.dataset.selected = selected ? "true" : "false";
    this.element.style.boxShadow = selected ? "0 0 0 3px rgba(255,138,61,0.24)" : "0 0 0 2px rgba(94,140,255,0.18)";
    this.syncProjection();
  }

  public syncProjection(): void {
    const projected = projectLocalPointToOverlay(this.session, this.position, PATH_HANDLE_Z_OFFSET);
    if (!projected.visible) {
      this.element.style.display = "none";
      return;
    }

    const scale = this.element.dataset.selected === "true" ? " scale(1.15)" : "";
    this.element.style.display = "block";
    this.element.style.transform = `translate3d(${projected.x}px, ${projected.y}px, 0) translate(-50%, -50%)${scale}`;
  }

  public dispose(): void {
    this.element.remove();
  }
}

class PathEditorAddButton {
  private readonly element: HTMLButtonElement;
  private position = new THREE.Vector3();

  constructor(
    private readonly session: GlMapPathEditorSession,
    private readonly pathId: string,
    private readonly segmentIndex: number
  ) {
    this.element = document.createElement("button");
    this.element.type = "button";
    this.element.textContent = "+";
    Object.assign(this.element.style, {
      position: "absolute",
      left: "0",
      top: "0",
      width: "16px",
      height: "16px",
      borderRadius: "50%",
      border: "1px solid rgba(255,255,255,0.68)",
      background: "rgba(20,24,33,0.92)",
      color: "#ffffff",
      fontSize: "12px",
      lineHeight: "14px",
      padding: "0",
      pointerEvents: "auto",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 4px 10px rgba(0,0,0,0.22)",
      willChange: "transform"
    } as CSSStyleDeclaration);
    this.element.addEventListener("click", (event) => {
      event.stopPropagation();
      this.session.insertPointAtSegment(this.pathId, this.segmentIndex, event as MouseEvent);
    });
    this.session.getOverlayHost().appendChild(this.element);
  }

  public setPosition(position: THREE.Vector3): void {
    this.position.copy(position);
    this.syncProjection();
  }

  public setVisible(visible: boolean): void {
    this.element.style.display = visible ? "inline-flex" : "none";
  }

  public syncProjection(): void {
    if (this.element.style.display === "none") {
      return;
    }

    const projected = projectLocalPointToOverlay(this.session, this.position, PATH_HANDLE_Z_OFFSET);
    if (!projected.visible) {
      this.element.style.display = "none";
      return;
    }

    this.element.style.display = "inline-flex";
    this.element.style.transform = `translate3d(${projected.x}px, ${projected.y}px, 0) translate(-50%, -50%)`;
  }

  public dispose(): void {
    this.element.remove();
  }
}

const projectLocalPointToOverlay = (session: GlMapPathEditorSession, local: THREE.Vector3, zOffset = 0) => {
  const runtime = (session as any).runtime as GlMapEditorRuntimeContext;
  const overlayHost = session.getOverlayHost();
  const projectedLocal = local.clone();
  projectedLocal.z += zOffset;
  const world = runtime.mapGroup ? runtime.mapGroup.localToWorld(projectedLocal) : projectedLocal;
  const projected = world.project(runtime.camera);

  return {
    visible: projected.z >= -1 && projected.z <= 1,
    x: (projected.x + 1) * 0.5 * overlayHost.clientWidth,
    y: (-projected.y + 1) * 0.5 * overlayHost.clientHeight
  };
};

const disposeMaterialLike = (material: THREE.Material | THREE.Material[] | undefined) => {
  if (!material) return;
  const materials = Array.isArray(material) ? material : [material];
  materials.forEach((item) => item.dispose());
};
