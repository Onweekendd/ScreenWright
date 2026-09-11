import { cloneDeep } from "lodash-es";

import { buildEchartGlmapEditorProps, isEchartGlmapSceneComponent } from "./echartGlmapSceneEditorUtils";

export interface FlyLineEditorPoint {
  id: string;
  name: string;
  customId?: string;
  lnglat: [number, number];
  userData?: Record<string, any>;
}

export interface FlyLineEditorPath {
  id: string;
  name: string;
  points: FlyLineEditorPoint[];
  userData?: Record<string, any>;
}

export interface FlyLineEditorDocument {
  type: "flyLine";
  locateMode: "lnglat";
  paths: Record<string, FlyLineEditorPath>;
}

export interface FlyLineEditorConfig {
  version?: number;
  controlMode: "plane" | "transform";
  grid: {
    show: boolean;
    position: { x: number; y: number; z: number };
    range: number;
    gridSize: number;
    color: string;
    opacity: number;
  };
  line: {
    show: boolean;
    color: string;
    width: number;
    opacity: number;
  };
  dataPanel: {
    show: boolean;
  };
}

const createId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const DEFAULT_FLY_LINE_EDITOR_CONFIG: FlyLineEditorConfig = {
  version: 2,
  controlMode: "plane",
  grid: {
    show: true,
    position: { x: 0, y: 0, z: -0.1 },
    range: 10,
    gridSize: 0.1,
    color: "#888888",
    opacity: 100
  },
  line: {
    show: true,
    color: "#f4f7ff",
    width: 2,
    opacity: 100
  },
  dataPanel: {
    show: true
  }
};

const normalizeLngLat = (value: any): [number, number] | null => {
  if (Array.isArray(value) && value.length >= 2) {
    const lng = Number(value[0]);
    const lat = Number(value[1]);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      return [lng, lat];
    }
  }

  if (value && typeof value === "object") {
    const lng = Number(value.lng ?? value.longitude ?? value.x);
    const lat = Number(value.lat ?? value.latitude ?? value.y);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      return [lng, lat];
    }
  }

  return null;
};

const extractLineUserData = (item: any) => {
  if (!item || typeof item !== "object") {
    return {};
  }

  const next = { ...item };
  delete next.id;
  delete next.name;
  delete next.from;
  delete next.to;
  delete next.fromName;
  delete next.toName;
  delete next.fromId;
  delete next.toId;
  return next;
};

const flowLineItemToEditorPath = (item: any, index: number): FlyLineEditorPath | null => {
  const from = normalizeLngLat(item?.from);
  const to = normalizeLngLat(item?.to);
  if (!from || !to) {
    return null;
  }

  return {
    id: item?.id || createId("flyLine"),
    name: item?.name || `飞线${index + 1}`,
    points: [
      {
        id: item?.fromId || createId("point"),
        name: item?.fromName || "起点",
        lnglat: from,
        userData: {}
      },
      {
        id: item?.toId || createId("point"),
        name: item?.toName || "终点",
        lnglat: to,
        userData: {}
      }
    ],
    userData: extractLineUserData(item)
  };
};

export const isSupportedGlFlyLineEditorChild = (child: any) => child?.type === "flowLine";

export const ensureFlyLineEditorConfig = (child: any): FlyLineEditorConfig => {
  if (!child.editorConfig || typeof child.editorConfig !== "object") {
    child.editorConfig = {};
  }

  if (!child.editorConfig.flyLineEditor || typeof child.editorConfig.flyLineEditor !== "object") {
    child.editorConfig.flyLineEditor = cloneDeep(DEFAULT_FLY_LINE_EDITOR_CONFIG);
  }

  const config = child.editorConfig.flyLineEditor;
  if (config.version !== DEFAULT_FLY_LINE_EDITOR_CONFIG.version) {
    if (config.grid?.gridSize === undefined || config.grid?.gridSize === 0.01 || config.grid?.gridSize === 1) {
      config.grid = {
        ...(config.grid || {}),
        gridSize: DEFAULT_FLY_LINE_EDITOR_CONFIG.grid.gridSize
      };
    }

    if (config.grid?.position?.z === undefined || config.grid?.position?.z === 0) {
      config.grid = {
        ...(config.grid || {}),
        position: {
          ...(config.grid?.position || {}),
          z: DEFAULT_FLY_LINE_EDITOR_CONFIG.grid.position.z
        }
      };
    }

    config.version = DEFAULT_FLY_LINE_EDITOR_CONFIG.version;
  }

  config.controlMode = config.controlMode === "transform" ? "transform" : "plane";
  config.grid = {
    ...cloneDeep(DEFAULT_FLY_LINE_EDITOR_CONFIG.grid),
    ...(config.grid || {}),
    position: {
      ...cloneDeep(DEFAULT_FLY_LINE_EDITOR_CONFIG.grid.position),
      ...(config.grid?.position || {})
    }
  };
  config.line = {
    ...cloneDeep(DEFAULT_FLY_LINE_EDITOR_CONFIG.line),
    ...(config.line || {})
  };
  config.dataPanel = {
    ...cloneDeep(DEFAULT_FLY_LINE_EDITOR_CONFIG.dataPanel),
    ...(config.dataPanel || {})
  };

  return config;
};

export const createFlyLineEditorDocument = (child: any): FlyLineEditorDocument => {
  const document: FlyLineEditorDocument = {
    type: "flyLine",
    locateMode: "lnglat",
    paths: {}
  };

  const sourceData: any[] = Array.isArray(child?.data) ? child.data : [];
  sourceData.forEach((item: any, index: number) => {
    const path = flowLineItemToEditorPath(item, index);
    if (path) {
      document.paths[path.id] = path;
    }
  });

  return document;
};

export const applyFlyLineEditorDocumentToChild = (child: any, document: FlyLineEditorDocument) => {
  child.data = Object.values(document.paths)
    .filter((path) => path.points.length >= 2)
    .map((path) => ({
      ...cloneDeep(path.userData || {}),
      id: path.id,
      name: path.name,
      fromId: path.points[0].id,
      toId: path.points[1].id,
      fromName: path.points[0].name,
      toName: path.points[1].name,
      from: [path.points[0].lnglat[0], path.points[0].lnglat[1]],
      to: [path.points[1].lnglat[0], path.points[1].lnglat[1]]
    }));
};

export const buildEchartGlmapFlyLineEditorPreviewProps = (component: any, editingChildId: string) => {
  const props = buildEchartGlmapEditorProps(component);

  return {
    ...props,
    presetChild: [],
    textStyle: {
      ...props.textStyle,
      fontSize: 0
    },
    sceneControl: {
      ...props.sceneControl,
      autoRotate: false,
      bloom: {
        ...(props.sceneControl?.bloom || {}),
        enable: false
      },
      innerShadow: {
        ...(props.sceneControl?.innerShadow || {}),
        enable: false
      }
    },
    fog: false
  };
};

export const findFlyLineEditorTargetChild = (component: any, childId: string) => {
  if (!isEchartGlmapSceneComponent(component)) {
    return null;
  }

  const childList = Array.isArray(component?.presetChild) ? component.presetChild : [];
  return childList.find((child: any) => String(child?.id || "") === String(childId)) || null;
};

export const createEmptyFlyLineEditorPath = (index: number): FlyLineEditorPath => ({
  id: createId("flyLine"),
  name: `飞线${index + 1}`,
  points: [],
  userData: {}
});

export const cloneFlyLineEditorDocument = (document: FlyLineEditorDocument): FlyLineEditorDocument =>
  cloneDeep(document);

export const cloneFlyLineEditorConfig = (config: FlyLineEditorConfig): FlyLineEditorConfig => cloneDeep(config);

export const stringifyFlyLineEditorDocument = (document: FlyLineEditorDocument) => JSON.stringify(document, null, 2);
