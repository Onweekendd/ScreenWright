import { cloneDeep } from "lodash-es";

import { buildEchartGlmapEditorProps, isEchartGlmapSceneComponent } from "./echartGlmapSceneEditorUtils";

export interface PointEditorPoint {
  id: string;
  name: string;
  customId?: string;
  lnglat: [number, number];
  userData?: Record<string, any>;
}

export interface PointEditorDocument {
  type: "points";
  locateMode: "lnglat";
  path: {
    id: string;
    points: PointEditorPoint[];
  };
}

export interface PointEditorConfig {
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
  point: {
    show: boolean;
    color: string;
    size: number;
    opacity: number;
  };
  dataPanel: {
    show: boolean;
  };
}

const createId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const DEFAULT_POINT_EDITOR_CONFIG: PointEditorConfig = {
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
  point: {
    show: true,
    color: "#7b95ff",
    size: 12,
    opacity: 100
  },
  dataPanel: {
    show: true
  }
};

const normalizeLngLat = (value: any): [number, number] | null => {
  const lng = Number(value?.lng ?? value?.longitude ?? value?.x);
  const lat = Number(value?.lat ?? value?.latitude ?? value?.y);
  if (Number.isFinite(lng) && Number.isFinite(lat)) {
    return [lng, lat];
  }
  return null;
};

const extractPointUserData = (item: any) => {
  if (!item || typeof item !== "object") {
    return {};
  }

  const next = { ...item };
  delete next.id;
  delete next.name;
  delete next.customId;
  delete next.lng;
  delete next.lat;
  delete next.longitude;
  delete next.latitude;
  delete next.x;
  delete next.y;
  return next;
};

export const isSupportedGlPointEditorChild = (child: any) => ["mapScatter", "mapGlIcon"].includes(child?.type);

export const ensurePointEditorConfig = (child: any): PointEditorConfig => {
  if (!child.editorConfig || typeof child.editorConfig !== "object") {
    child.editorConfig = {};
  }

  if (!child.editorConfig.pointEditor || typeof child.editorConfig.pointEditor !== "object") {
    child.editorConfig.pointEditor = cloneDeep(DEFAULT_POINT_EDITOR_CONFIG);
  }

  const config = child.editorConfig.pointEditor;
  if (config.version !== DEFAULT_POINT_EDITOR_CONFIG.version) {
    if (config.grid?.gridSize === undefined || config.grid?.gridSize === 0.01 || config.grid?.gridSize === 1) {
      config.grid = {
        ...(config.grid || {}),
        gridSize: DEFAULT_POINT_EDITOR_CONFIG.grid.gridSize
      };
    }

    if (config.grid?.position?.z === undefined || config.grid?.position?.z === 0) {
      config.grid = {
        ...(config.grid || {}),
        position: {
          ...(config.grid?.position || {}),
          z: DEFAULT_POINT_EDITOR_CONFIG.grid.position.z
        }
      };
    }

    config.version = DEFAULT_POINT_EDITOR_CONFIG.version;
  }

  config.controlMode = config.controlMode === "transform" ? "transform" : "plane";
  config.grid = {
    ...cloneDeep(DEFAULT_POINT_EDITOR_CONFIG.grid),
    ...(config.grid || {}),
    position: {
      ...cloneDeep(DEFAULT_POINT_EDITOR_CONFIG.grid.position),
      ...(config.grid?.position || {})
    }
  };
  config.point = {
    ...cloneDeep(DEFAULT_POINT_EDITOR_CONFIG.point),
    ...(config.point || {})
  };
  config.dataPanel = {
    ...cloneDeep(DEFAULT_POINT_EDITOR_CONFIG.dataPanel),
    ...(config.dataPanel || {})
  };

  return config;
};

export const createPointEditorDocument = (child: any): PointEditorDocument => {
  const points: PointEditorPoint[] = [];
  const sourceData: any[] = Array.isArray(child?.data) ? child.data : [];

  sourceData.forEach((item, index) => {
    const lnglat = normalizeLngLat(item);
    if (!lnglat) {
      return;
    }

    points.push({
      id: item?.id || createId("point"),
      name: item?.name || item?.city || `点位${index + 1}`,
      customId: item?.customId,
      lnglat,
      userData: extractPointUserData(item)
    });
  });

  return {
    type: "points",
    locateMode: "lnglat",
    path: {
      id: "points",
      points
    }
  };
};

export const applyPointEditorDocumentToChild = (child: any, document: PointEditorDocument) => {
  const coordinateKeys =
    child?.type === "mapGlIcon"
      ? {
          lng: "longitude",
          lat: "latitude"
        }
      : {
          lng: "lng",
          lat: "lat"
        };

  child.data = document.path.points.map((point) => ({
    ...cloneDeep(point.userData || {}),
    id: point.id,
    name: point.name,
    customId: point.customId,
    [coordinateKeys.lng]: point.lnglat[0],
    [coordinateKeys.lat]: point.lnglat[1]
  }));
};

export const buildEchartGlmapPointEditorPreviewProps = (component: any) => {
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

export const findPointEditorTargetChild = (component: any, childId: string) => {
  if (!isEchartGlmapSceneComponent(component)) {
    return null;
  }

  const childList = Array.isArray(component?.presetChild) ? component.presetChild : [];
  return childList.find((child: any) => String(child?.id || "") === String(childId)) || null;
};

export const clonePointEditorDocument = (document: PointEditorDocument): PointEditorDocument => cloneDeep(document);

export const clonePointEditorConfig = (config: PointEditorConfig): PointEditorConfig => cloneDeep(config);

export const createEmptyPointEditorPoint = (index: number): PointEditorPoint => ({
  id: createId("point"),
  name: `点位${index + 1}`,
  lnglat: [0, 0],
  userData: {}
});

export const stringifyPointEditorDocument = (document: PointEditorDocument) => JSON.stringify(document, null, 2);
