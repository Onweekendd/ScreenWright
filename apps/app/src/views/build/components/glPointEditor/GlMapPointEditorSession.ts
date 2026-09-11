import { cloneDeep } from "lodash-es";
import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";

import type { GlMapEditorRuntimeContext } from "@/components/ScreenwrightSceneComponent/component/echartGlmap/geojsonMapInstance";
import {
  clonePointEditorConfig,
  clonePointEditorDocument,
  createEmptyPointEditorPoint,
  type PointEditorConfig,
  type PointEditorDocument,
  type PointEditorPoint
} from "@/views/build/components/buildConfig/sceneComponent/sceneGlobal/echartGlmapPointEditorUtils";

type EditorMode = "select" | "draw";

const POINT_Z_OFFSET = 0.01;

export interface PointEditorMapApi {
  pickMapLocalPositionFromClient(clientX: number, clientY: number): THREE.Vector3 | null;
  lngLatToMapLocalPosition(point: [number, number], zOffset?: number): THREE.Vector3 | null;
  mapLocalPositionToLngLat(position: THREE.Vector3): [number, number] | null;
}

export interface PointEditorSelectionSnapshot {
  kind: "none" | "point";
  pointId: string | null;
  uuid: string;
  id: string;
  name: string;
  lnglat: [number, number] | null;
  data: Record<string, any>;
}

interface PointEditorSessionOptions {
  runtime: GlMapEditorRuntimeContext;
  mapApi: PointEditorMapApi;
  overlayHost: HTMLElement;
  document: PointEditorDocument;
  config: PointEditorConfig;
  onSelectionChange?: (selection: PointEditorSelectionSnapshot) => void;
  onDocumentCommit?: (document: PointEditorDocument) => void;
  onModeChange?: (mode: EditorMode) => void;
}

export class GlMapPointEditorSession {
  private readonly runtime: GlMapEditorRuntimeContext;
  private readonly mapApi: PointEditorMapApi;
  private readonly overlayHost: HTMLElement;
  private readonly rootGroup = new THREE.Group();
  private readonly pointHandleMap = new Map<string, PointEditorHandle>();
  private readonly onSelectionChange?: (selection: PointEditorSelectionSnapshot) => void;
  private readonly onDocumentCommit?: (document: PointEditorDocument) => void;
  private readonly onModeChange?: (mode: EditorMode) => void;
  private documentData: PointEditorDocument;
  private config: PointEditorConfig;
  private gridHelper: THREE.GridHelper | null = null;
  private transformControls: TransformControls | null = null;
  private transformHelper: THREE.Object3D | null = null;
  private transformAnchor: THREE.Object3D | null = null;
  private transformChanged = false;
  private isTransformDragging = false;
  private selectedPointId: string | null = null;
  private mode: EditorMode = "select";
  private overlayResizeObserver: ResizeObserver | null = null;
  private originalDampingEnabled: boolean | null = null;
  private originalDampingFactor: number | null = null;
  private overlaySyncFrameId: number | null = null;
  private pointDragState: {
    pointId: string;
    moved: boolean;
    onMove: (event: MouseEvent) => void;
    onUp: () => void;
  } | null = null;

  constructor(options: PointEditorSessionOptions) {
    this.runtime = options.runtime;
    this.mapApi = options.mapApi;
    this.overlayHost = options.overlayHost;
    this.documentData = clonePointEditorDocument(options.document);
    this.config = clonePointEditorConfig(options.config);
    this.onSelectionChange = options.onSelectionChange;
    this.onDocumentCommit = options.onDocumentCommit;
    this.onModeChange = options.onModeChange;
    this.rootGroup.name = "glPointEditorRoot";
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
    this.buildGrid();
    this.buildTransformControls();
    this.syncHandles();
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
    this.pointHandleMap.forEach((item) => item.dispose());
    this.pointHandleMap.clear();
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

  public getDocument(): PointEditorDocument {
    return clonePointEditorDocument(this.documentData);
  }

  public getConfig(): PointEditorConfig {
    return clonePointEditorConfig(this.config);
  }

  public getMode(): EditorMode {
    return this.mode;
  }

  public getRuntime(): GlMapEditorRuntimeContext {
    return this.runtime;
  }

  public getOverlayHost(): HTMLElement {
    return this.overlayHost;
  }

  public getPoint(pointId: string): PointEditorPoint | null {
    return this.documentData.path.points.find((item) => item.id === pointId) || null;
  }

  public isPointSelected(pointId: string): boolean {
    return this.selectedPointId === pointId;
  }

  public getPointStyle(): PointEditorConfig["point"] {
    return this.config.point;
  }

  public projectPointLngLatToLocal(point: [number, number]): THREE.Vector3 | null {
    return this.lngLatToLocal(point);
  }

  public getSelectionSnapshot(): PointEditorSelectionSnapshot {
    const point = this.getSelectedPoint();
    if (!point) {
      return {
        kind: "none",
        pointId: null,
        uuid: "",
        id: "",
        name: "",
        lnglat: null,
        data: {}
      };
    }

    return {
      kind: "point",
      pointId: point.id,
      uuid: point.id,
      id: point.customId || point.id,
      name: point.name,
      lnglat: [...point.lnglat] as [number, number],
      data: cloneDeep(point.userData || {})
    };
  }

  public createPointAndBeginDraw(): void {
    this.mode = "draw";
    this.emitModeChange();
  }

  public toggleDrawMode(): void {
    this.mode = this.mode === "draw" ? "select" : "draw";
    this.emitModeChange();
  }

  public setControlMode(mode: "plane" | "transform"): void {
    this.config.controlMode = mode;
    this.syncTransformSelection();
    this.syncHandles();
    this.requestOverlaySync();
  }

  public updateGridConfig(grid: PointEditorConfig["grid"]): void {
    this.config.grid = cloneDeep(grid);
    this.buildGrid();
    this.requestOverlaySync();
  }

  public updatePointConfig(point: PointEditorConfig["point"]): void {
    this.config.point = cloneDeep(point);
    this.syncHandles();
    this.requestOverlaySync();
  }

  public updateSelectedName(name: string): void {
    const point = this.getSelectedPoint();
    if (!point) return;
    point.name = name;
    this.emitSelectionChange();
    this.commitDocument();
  }

  public updateSelectedUserDataText(text: string): void {
    const point = this.getSelectedPoint();
    if (!point) return;
    point.userData = text.trim() ? JSON.parse(text) : {};
    this.emitSelectionChange();
    this.commitDocument();
  }

  public deleteSelection(): void {
    if (!this.selectedPointId) return;
    const nextPoints = this.documentData.path.points.filter((item) => item.id !== this.selectedPointId);
    if (nextPoints.length === this.documentData.path.points.length) {
      return;
    }

    this.documentData.path.points = nextPoints;
    this.selectedPointId = null;
    this.syncHandles();
    this.syncTransformSelection();
    this.emitSelectionChange();
    this.commitDocument();
  }

  public focusSelection(): void {
    if (!this.runtime.controls || !this.runtime.camera) return;
    const point = this.getSelectedPoint();
    if (!point) return;

    const local = this.lngLatToLocal(point.lnglat);
    if (!local) return;

    const worldPoint = this.runtime.mapGroup ? this.runtime.mapGroup.localToWorld(local.clone()) : local.clone();
    const offset = this.runtime.camera.position.clone().sub(this.runtime.controls.target);
    this.runtime.controls.target.copy(worldPoint);
    this.runtime.camera.position.copy(worldPoint.clone().add(offset));
    this.runtime.controls.update();
    this.requestOverlaySync();
  }

  public handlePointClick(pointId: string): void {
    this.selectedPointId = pointId;
    this.mode = "select";
    this.syncHandles();
    this.syncTransformSelection();
    this.emitSelectionChange();
    this.emitModeChange();
  }

  public handlePointPointerDown(pointId: string, event: MouseEvent): void {
    if (event.button !== 0) return;
    if (this.config.controlMode !== "plane") {
      this.handlePointClick(pointId);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.handlePointClick(pointId);
    this.cancelPointDrag();
    this.runtime.controls && (this.runtime.controls.enabled = false);

    const onMove = (moveEvent: MouseEvent) => {
      const local = this.mapApi.pickMapLocalPositionFromClient(moveEvent.clientX, moveEvent.clientY);
      if (!local) return;
      if (this.updatePointFromLocal(pointId, local)) {
        this.pointDragState && (this.pointDragState.moved = true);
        this.refreshPoint(pointId);
        this.emitSelectionChange();
      }
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      this.runtime.controls && (this.runtime.controls.enabled = true);
      const moved = this.pointDragState?.moved;
      this.pointDragState = null;
      if (moved) {
        this.commitDocument();
      }
    };

    this.pointDragState = {
      pointId,
      moved: false,
      onMove,
      onUp
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  private getSelectedPoint(): PointEditorPoint | null {
    return this.documentData.path.points.find((item) => item.id === this.selectedPointId) || null;
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

    const divisions = Math.max(1, Math.round(this.config.grid.range / Math.max(this.config.grid.gridSize, 0.01)));
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
    this.transformControls.size = 0.55;
    this.transformControls.addEventListener("dragging-changed", (event: any) => {
      this.isTransformDragging = Boolean(event.value);
      if (this.runtime.controls) {
        this.runtime.controls.enabled = !event.value;
      }
      if (!event.value && this.transformChanged) {
        this.transformChanged = false;
        this.commitDocument();
        this.emitSelectionChange();
      }
    });
    this.transformControls.addEventListener("objectChange", () => {
      if (!this.transformAnchor || !this.selectedPointId) return;
      if (this.updatePointFromLocal(this.selectedPointId, this.transformAnchor.position)) {
        this.transformChanged = true;
        this.refreshPoint(this.selectedPointId);
        this.emitSelectionChange();
      }
    });
    this.transformHelper = this.transformControls.getHelper();
    this.runtime.scene.add(this.transformHelper);
    this.syncTransformSelection();
  }

  private syncTransformSelection(): void {
    if (!this.transformControls || !this.transformAnchor) return;

    if (this.config.controlMode !== "transform" || !this.selectedPointId) {
      this.transformControls.detach();
      return;
    }

    const point = this.getSelectedPoint();
    const local = point ? this.lngLatToLocal(point.lnglat) : null;
    if (!local) {
      this.transformControls.detach();
      return;
    }

    this.transformAnchor.position.copy(local);
    this.transformControls.attach(this.transformAnchor);
  }

  private syncHandles(): void {
    const nextIds = new Set(this.documentData.path.points.map((item) => item.id));
    this.pointHandleMap.forEach((handle, pointId) => {
      if (!nextIds.has(pointId)) {
        handle.dispose();
        this.pointHandleMap.delete(pointId);
      }
    });

    this.documentData.path.points.forEach((point) => {
      let handle = this.pointHandleMap.get(point.id);
      if (!handle) {
        handle = new PointEditorHandle(this, point.id);
        this.pointHandleMap.set(point.id, handle);
      }
      handle.refresh();
    });

    this.syncTransformSelection();
    this.requestOverlaySync();
  }

  private refreshPoint(pointId: string): void {
    this.pointHandleMap.get(pointId)?.refresh();
    this.syncTransformSelection();
    this.requestOverlaySync();
  }

  private addPointFromLocal(local: THREE.Vector3): void {
    const lnglat = this.localToLngLat(local);
    if (!lnglat) return;

    const point = createEmptyPointEditorPoint(this.documentData.path.points.length);
    point.lnglat = lnglat;
    this.documentData.path.points.push(point);
    this.selectedPointId = point.id;
    this.mode = "select";
    this.syncHandles();
    this.emitSelectionChange();
    this.emitModeChange();
    this.commitDocument();
  }

  private updatePointFromLocal(pointId: string, local: THREE.Vector3): boolean {
    const point = this.documentData.path.points.find((item) => item.id === pointId);
    const lnglat = this.localToLngLat(local);
    if (!point || !lnglat) {
      return false;
    }

    if (point.lnglat[0] === lnglat[0] && point.lnglat[1] === lnglat[1]) {
      return false;
    }

    point.lnglat = lnglat;
    return true;
  }

  private clearSelection(): void {
    if (!this.selectedPointId) return;
    this.selectedPointId = null;
    this.syncHandles();
    this.emitSelectionChange();
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

  private bindEvents(): void {
    this.runtime.domElement?.addEventListener("click", this.handleCanvasClick);
    document.addEventListener("keydown", this.handleKeyDown);
  }

  private unbindEvents(): void {
    this.runtime.domElement?.removeEventListener("click", this.handleCanvasClick);
    document.removeEventListener("keydown", this.handleKeyDown);
  }

  private observeOverlayResize(): void {
    this.overlayResizeObserver = new ResizeObserver(() => this.requestOverlaySync());
    this.overlayResizeObserver.observe(this.overlayHost);
  }

  private requestOverlaySync(): void {
    if (this.overlaySyncFrameId) {
      return;
    }

    this.overlaySyncFrameId = requestAnimationFrame(() => {
      this.overlaySyncFrameId = null;
      this.syncAllOverlayProjection();
    });
  }

  private syncAllOverlayProjection(): void {
    this.pointHandleMap.forEach((handle) => handle.syncProjection());
  }

  private lngLatToLocal(point: [number, number]): THREE.Vector3 | null {
    return this.mapApi.lngLatToMapLocalPosition(point, POINT_Z_OFFSET);
  }

  private localToLngLat(point: THREE.Vector3): [number, number] | null {
    return this.mapApi.mapLocalPositionToLngLat(point);
  }

  private cancelPointDrag(): void {
    if (!this.pointDragState) {
      return;
    }

    document.removeEventListener("mousemove", this.pointDragState.onMove);
    document.removeEventListener("mouseup", this.pointDragState.onUp);
    this.runtime.controls && (this.runtime.controls.enabled = true);
    this.pointDragState = null;
  }

  private readonly handleCanvasClick = (event: MouseEvent) => {
    if (event.button !== 0 || this.pointDragState || this.isTransformDragging) {
      return;
    }

    if (this.mode === "draw") {
      const local = this.mapApi.pickMapLocalPositionFromClient(event.clientX, event.clientY);
      if (!local) {
        return;
      }
      this.addPointFromLocal(local);
      return;
    }

    this.clearSelection();
  };

  private readonly handleControlsChange = () => {
    this.requestOverlaySync();
  };

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === "Escape" && this.mode === "draw") {
      event.preventDefault();
      this.toggleDrawMode();
    } else if (event.code === "Delete" || event.code === "Backspace") {
      this.deleteSelection();
    } else if (event.code === "KeyF") {
      this.focusSelection();
    }
  };
}

class PointEditorHandle {
  private readonly session: GlMapPointEditorSession;
  private readonly pointId: string;
  private readonly element: HTMLButtonElement;

  constructor(session: GlMapPointEditorSession, pointId: string) {
    this.session = session;
    this.pointId = pointId;
    this.element = document.createElement("button");
    this.element.type = "button";
    Object.assign(this.element.style, {
      position: "absolute",
      left: "0",
      top: "0",
      width: "12px",
      height: "12px",
      padding: "0",
      borderRadius: "999px",
      border: "2px solid rgba(255,255,255,0.92)",
      background: "#7b95ff",
      boxShadow: "0 0 0 2px rgba(123,149,255,0.24)",
      pointerEvents: "auto",
      cursor: "pointer",
      transformOrigin: "center center",
      transition: "none",
      zIndex: "2"
    });
    this.element.addEventListener("click", this.handleClick);
    this.element.addEventListener("mousedown", this.handlePointerDown);
    this.session.getOverlayHost().appendChild(this.element);
  }

  public refresh(): void {
    const point = this.session.getPoint(this.pointId);
    const config = this.session.getPointStyle();
    const selected = this.session.isPointSelected(this.pointId);
    const visible = config.show || selected;

    if (!point || !visible) {
      this.element.style.display = "none";
      return;
    }

    const size = Math.max(8, Number(config.size) || 12);
    this.element.style.display = "block";
    this.element.style.width = `${size}px`;
    this.element.style.height = `${size}px`;
    this.element.style.background = selected ? "#ff9d43" : config.color;
    this.element.style.opacity = `${THREE.MathUtils.clamp((config.opacity ?? 100) / 100, 0, 1)}`;
    this.element.style.boxShadow = selected
      ? "0 0 0 3px rgba(255,157,67,0.24)"
      : `0 0 0 2px ${hexToRgba(config.color, 0.24)}`;
    this.syncProjection();
  }

  public syncProjection(): void {
    const point = this.session.getPoint(this.pointId);
    if (!point) {
      this.element.style.display = "none";
      return;
    }

    const local = this.session.projectPointLngLatToLocal(point.lnglat);
    if (!local) {
      this.element.style.display = "none";
      return;
    }

    const projected = projectLocalPointToOverlay(this.session, local, 0);
    if (!projected.visible) {
      this.element.style.display = "none";
      return;
    }

    const selected = this.session.isPointSelected(this.pointId);
    const scale = selected ? " scale(1.12)" : "";
    this.element.style.display = "block";
    this.element.style.transform = `translate3d(${projected.x}px, ${projected.y}px, 0) translate(-50%, -50%)${scale}`;
  }

  public dispose(): void {
    this.element.removeEventListener("click", this.handleClick);
    this.element.removeEventListener("mousedown", this.handlePointerDown);
    this.element.remove();
  }

  private readonly handleClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    this.session.handlePointClick(this.pointId);
  };

  private readonly handlePointerDown = (event: MouseEvent) => {
    this.session.handlePointPointerDown(this.pointId, event);
  };
}

const projectLocalPointToOverlay = (session: GlMapPointEditorSession, local: THREE.Vector3, zOffset = 0) => {
  const runtime = session.getRuntime();
  const overlayHost = session.getOverlayHost();
  const world = runtime.mapGroup
    ? runtime.mapGroup.localToWorld(local.clone().setZ(local.z + zOffset))
    : local.clone().setZ(local.z + zOffset);
  const projected = world.project(runtime.camera);

  const x = ((projected.x + 1) / 2) * overlayHost.clientWidth;
  const y = ((-projected.y + 1) / 2) * overlayHost.clientHeight;

  return {
    x,
    y,
    visible:
      projected.z <= 1 &&
      projected.z >= -1 &&
      x >= -64 &&
      y >= -64 &&
      x <= overlayHost.clientWidth + 64 &&
      y <= overlayHost.clientHeight + 64
  };
};

const disposeMaterialLike = (material: THREE.Material | THREE.Material[]) => {
  const list = Array.isArray(material) ? material : [material];
  list.forEach((item) => item.dispose());
};

const hexToRgba = (color: string, alpha: number) => {
  const match = color.replace("#", "");
  if (![3, 6].includes(match.length)) {
    return `rgba(123,149,255,${alpha})`;
  }

  const hex =
    match.length === 3
      ? match
          .split("")
          .map((item) => item + item)
          .join("")
      : match;
  const intValue = Number.parseInt(hex, 16);
  const r = (intValue >> 16) & 255;
  const g = (intValue >> 8) & 255;
  const b = intValue & 255;
  return `rgba(${r},${g},${b},${alpha})`;
};
