import { cloneDeep } from "lodash-es";

import {
  normalizePolylinePoints,
  resolveFenceLngLatLists,
  type LngLatPoint
} from "@/components/ScreenwrightSceneComponent/component/echartGlmap/MapChildRenderUtils";

import { buildEchartGlmapEditorProps, isEchartGlmapSceneComponent } from "./echartGlmapSceneEditorUtils";

export interface PathEditorPoint {
  id: string;
  name: string;
  customId?: string;
  lnglat: [number, number];
  userData?: Record<string, any>;
}

export interface PathEditorPath {
  id: string;
  name: string;
  closed: boolean;
  points: PathEditorPoint[];
  userData?: Record<string, any>;
}

export interface PathEditorDocument {
  type: "path";
  locateMode: "lnglat";
  paths: Record<string, PathEditorPath>;
}

export type PathEditorProfile = "path" | "fence";

export interface PathEditorConfig {
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
const FENCE_EDITOR_MAX_POINTS = 180;

const DEFAULT_PATH_EDITOR_CONFIG: PathEditorConfig = {
  version: 4,
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

const normalizePointLngLat = (point: any): [number, number] | null => {
  if (!point) {
    return null;
  }

  if (Array.isArray(point) && point.length >= 2) {
    const lng = Number(point[0]);
    const lat = Number(point[1]);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      return [lng, lat];
    }
  }

  const lng = Number(point.lng ?? point.longitude ?? point.x);
  const lat = Number(point.lat ?? point.latitude ?? point.y);
  if (Number.isFinite(lng) && Number.isFinite(lat)) {
    return [lng, lat];
  }

  return null;
};

const extractPointUserData = (point: any) => {
  if (!point || Array.isArray(point)) {
    return {};
  }

  const next = { ...point };
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

const extractPathUserData = (item: any) => {
  if (!item || typeof item !== "object") {
    return {};
  }

  const next = { ...item };
  delete next.id;
  delete next.name;
  delete next.points;
  delete next.coords;
  delete next.coordinates;
  delete next.path;
  delete next.closed;
  return next;
};

const normalizePoint = (point: any, index: number): PathEditorPoint | null => {
  const lnglat = normalizePointLngLat(point);
  if (!lnglat) {
    return null;
  }

  return {
    id: point?.id || createId("point"),
    name: point?.name || `Point ${index + 1}`,
    customId: point?.customId,
    lnglat,
    userData: extractPointUserData(point)
  };
};

const getPerpendicularDistance = (point: LngLatPoint, start: LngLatPoint, end: LngLatPoint) => {
  const x = point[0];
  const y = point[1];
  const x1 = start[0];
  const y1 = start[1];
  const x2 = end[0];
  const y2 = end[1];
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
  }

  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  const clampedT = Math.max(0, Math.min(1, t));
  const projX = x1 + clampedT * dx;
  const projY = y1 + clampedT * dy;
  return Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
};

const simplifyLineRdp = (points: LngLatPoint[], tolerance: number): LngLatPoint[] => {
  if (points.length <= 2) {
    return points.slice();
  }

  let maxDistance = 0;
  let maxIndex = -1;
  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = getPerpendicularDistance(points[index], points[0], points[points.length - 1]);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = index;
    }
  }

  if (maxDistance <= tolerance || maxIndex === -1) {
    return [points[0], points[points.length - 1]];
  }

  const left = simplifyLineRdp(points.slice(0, maxIndex + 1), tolerance);
  const right = simplifyLineRdp(points.slice(maxIndex), tolerance);
  return [...left.slice(0, -1), ...right];
};

const thinLineByMaxPoints = (points: LngLatPoint[], maxPoints: number): LngLatPoint[] => {
  if (points.length <= maxPoints) {
    return points.slice();
  }

  const result: LngLatPoint[] = [points[0]];
  const segments = maxPoints - 1;

  for (let index = 1; index < segments; index += 1) {
    const pointIndex = Math.round((index / segments) * (points.length - 1));
    const point = points[pointIndex];
    if (point && point !== result[result.length - 1]) {
      result.push(point);
    }
  }

  const lastPoint = points[points.length - 1];
  if (lastPoint !== result[result.length - 1]) {
    result.push(lastPoint);
  }

  return result;
};

const simplifyFenceEditorLine = (points: LngLatPoint[]): LngLatPoint[] => {
  if (points.length <= FENCE_EDITOR_MAX_POINTS) {
    return points.slice();
  }

  const lngValues = points.map((point) => point[0]);
  const latValues = points.map((point) => point[1]);
  const diagonal = Math.sqrt(
    (Math.max(...lngValues) - Math.min(...lngValues)) ** 2 + (Math.max(...latValues) - Math.min(...latValues)) ** 2
  );

  let tolerance = Math.min(0.05, Math.max(0.0002, diagonal / 400));
  let simplified = simplifyLineRdp(points, tolerance);

  while (simplified.length > FENCE_EDITOR_MAX_POINTS && tolerance < 0.5) {
    tolerance *= 1.6;
    simplified = simplifyLineRdp(points, tolerance);
  }

  simplified = thinLineByMaxPoints(simplified, FENCE_EDITOR_MAX_POINTS);
  return simplified.length >= 3 ? simplified : thinLineByMaxPoints(points, 3);
};

const mapPathItemToEditorPath = (item: any, index: number): PathEditorPath | null => {
  const rawPoints = normalizePolylinePoints(item);
  if (!rawPoints.length) {
    return null;
  }

  const points = rawPoints
    .map((lnglat, pointIndex) =>
      normalizePoint(
        typeof item?.points?.[pointIndex] === "object" ? item.points[pointIndex] : { lng: lnglat[0], lat: lnglat[1] },
        pointIndex
      )
    )
    .filter(Boolean) as PathEditorPoint[];

  if (!points.length) {
    return null;
  }

  return {
    id: item?.id || createId("path"),
    name: item?.name || `路径${index + 1}`,
    closed: item?.closed === true,
    points,
    userData: extractPathUserData(item)
  };
};

const fenceItemToEditorPaths = (item: any, index: number, geoJson?: any): PathEditorPath[] => {
  const lineLists = resolveFenceLngLatLists(item, geoJson);
  return lineLists
    .map((linePoints, lineIndex) => {
      const simplifiedLinePoints = simplifyFenceEditorLine(linePoints);
      const points = simplifiedLinePoints
        .map((lnglat, pointIndex) =>
          normalizePoint(
            typeof item?.points?.[pointIndex] === "object"
              ? item.points[pointIndex]
              : { lng: lnglat[0], lat: lnglat[1] },
            pointIndex
          )
        )
        .filter(Boolean) as PathEditorPoint[];

      if (!points.length) {
        return null;
      }

      return {
        id: item?.id && lineIndex === 0 ? String(item.id) : createId("path"),
        name:
          item?.name && lineLists.length === 1
            ? item.name
            : `${item?.name || `围墙${index + 1}`}${lineLists.length > 1 ? `-${lineIndex + 1}` : ""}`,
        closed: item?.closed !== false,
        points,
        userData: extractPathUserData(item)
      };
    })
    .filter(Boolean) as PathEditorPath[];
};

export const isSupportedGlPathEditorChild = (child: any) => ["mapPath", "fence"].includes(child?.type);

export const getPathEditorProfile = (child: any): PathEditorProfile => (child?.type === "fence" ? "fence" : "path");

export const ensurePathEditorConfig = (child: any): PathEditorConfig => {
  if (!child.editorConfig || typeof child.editorConfig !== "object") {
    child.editorConfig = {};
  }

  if (!child.editorConfig.pathEditor || typeof child.editorConfig.pathEditor !== "object") {
    child.editorConfig.pathEditor = cloneDeep(DEFAULT_PATH_EDITOR_CONFIG);
  }

  const config = child.editorConfig.pathEditor;
  if (config.version !== DEFAULT_PATH_EDITOR_CONFIG.version) {
    if (config.grid?.range === undefined || config.grid?.range === 1000) {
      config.grid = {
        ...(config.grid || {}),
        range: DEFAULT_PATH_EDITOR_CONFIG.grid.range
      };
    }

    if (
      config.grid?.gridSize === undefined ||
      config.grid?.gridSize === 20 ||
      config.grid?.gridSize === 0.01 ||
      config.grid?.gridSize === 1
    ) {
      config.grid = {
        ...(config.grid || {}),
        gridSize: DEFAULT_PATH_EDITOR_CONFIG.grid.gridSize
      };
    }

    if (config.grid?.position?.z === undefined || config.grid?.position?.z === 0) {
      config.grid = {
        ...(config.grid || {}),
        position: {
          ...(config.grid?.position || {}),
          z: DEFAULT_PATH_EDITOR_CONFIG.grid.position.z
        }
      };
    }

    config.version = DEFAULT_PATH_EDITOR_CONFIG.version;
  }

  config.controlMode = config.controlMode === "transform" ? "transform" : "plane";
  config.grid = {
    ...cloneDeep(DEFAULT_PATH_EDITOR_CONFIG.grid),
    ...(config.grid || {}),
    position: {
      ...cloneDeep(DEFAULT_PATH_EDITOR_CONFIG.grid.position),
      ...(config.grid?.position || {})
    }
  };
  config.line = {
    ...cloneDeep(DEFAULT_PATH_EDITOR_CONFIG.line),
    ...(config.line || {})
  };
  config.dataPanel = {
    ...cloneDeep(DEFAULT_PATH_EDITOR_CONFIG.dataPanel),
    ...(config.dataPanel || {})
  };

  return config;
};

export const createPathEditorDocument = (child: any, geoJson?: any): PathEditorDocument => {
  const document: PathEditorDocument = {
    type: "path",
    locateMode: "lnglat",
    paths: {}
  };

  const sourceData = Array.isArray(child?.data) ? child.data : [];

  if (child?.type === "mapPath") {
    sourceData.forEach((item: any, index: number) => {
      const path = mapPathItemToEditorPath(item, index);
      if (path) {
        document.paths[path.id] = path;
      }
    });
  } else if (child?.type === "fence") {
    sourceData.forEach((item: any, index: number) => {
      fenceItemToEditorPaths(item, index, geoJson).forEach((path) => {
        document.paths[path.id] = path;
      });
    });
  }

  return document;
};

export const applyPathEditorDocumentToChild = (child: any, document: PathEditorDocument) => {
  const paths = Object.values(document.paths);

  if (child?.type === "mapPath") {
    child.data = paths.map((path) => ({
      ...cloneDeep(path.userData || {}),
      id: path.id,
      name: path.name,
      closed: path.closed,
      points: path.points.map((point) => [point.lnglat[0], point.lnglat[1]])
    }));
    return;
  }

  if (child?.type === "fence") {
    child.data = paths.map((path) => ({
      ...cloneDeep(path.userData || {}),
      id: path.id,
      name: path.name,
      closed: true,
      points: path.points.map((point) => [point.lnglat[0], point.lnglat[1]])
    }));
  }
};

export const buildEchartGlmapPathEditorPreviewProps = (component: any, editingChildId: string) => {
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

export const findPathEditorTargetChild = (component: any, childId: string) => {
  if (!isEchartGlmapSceneComponent(component)) {
    return null;
  }

  const childList = Array.isArray(component?.presetChild) ? component.presetChild : [];
  return childList.find((child: any) => String(child?.id || "") === String(childId)) || null;
};

export const createEmptyPathEditorPath = (index: number, namePrefix = "路径"): PathEditorPath => ({
  id: createId("path"),
  name: `${namePrefix}${index + 1}`,
  closed: false,
  points: [],
  userData: {}
});

export const clonePathEditorDocument = (document: PathEditorDocument): PathEditorDocument => cloneDeep(document);

export const clonePathEditorConfig = (config: PathEditorConfig): PathEditorConfig => cloneDeep(config);

export const stringifyPathEditorDocument = (document: PathEditorDocument) => JSON.stringify(document, null, 2);

export const lngLatToPlainObject = (lnglat: LngLatPoint) => ({
  lng: lnglat[0],
  lat: lnglat[1]
});
