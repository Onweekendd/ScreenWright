import * as THREE from "three";

import { getPointByProj4 } from "../echartcommonMap/utils";

export interface MapChildProjectParams {
  centerX: number;
  centerY: number;
  scale: number;
  baseHeight: number;
  mapSize?: number;
  geoJson?: any;
}

export interface GradientStop {
  offset: number;
  color: string;
}

export type LngLatPoint = [number, number];

export function getBlendingMode(mode?: string): THREE.Blending {
  return ((THREE as any)[mode || "NormalBlending"] as THREE.Blending) || THREE.NormalBlending;
}

export function getNumericValue(value: any, fallback: number): number {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

export function getNormalizedOpacity(value: any, fallback: number = 100): number {
  return THREE.MathUtils.clamp(getNumericValue(value, fallback) / 100, 0, 1);
}

export function getColorString(colorConfig: any, fallback: string = "#ffffff"): string {
  if (typeof colorConfig === "string" && colorConfig) {
    return colorConfig;
  }

  if (Array.isArray(colorConfig) && colorConfig.length > 0) {
    const first = colorConfig[0];
    if (typeof first === "string") {
      return first;
    }
    if (first?.color) {
      return first.color;
    }
  }

  if (colorConfig?.type === "linear-gradient" && Array.isArray(colorConfig.colors) && colorConfig.colors.length > 0) {
    return colorConfig.colors[0]?.color || fallback;
  }

  if (colorConfig?.color) {
    return colorConfig.color;
  }

  return fallback;
}

export function getGradientStops(colorConfig: any, fallback: string[] = ["#00ffff", "#ffffff"]): GradientStop[] {
  if (Array.isArray(colorConfig) && colorConfig.length > 0) {
    if (typeof colorConfig[0] === "string") {
      return normalizeStops(colorConfig.map((color, index, list) => ({ color, offset: toEvenOffset(index, list.length) })));
    }

    return normalizeStops(
      colorConfig
        .map((item: any, index: number, list: any[]) => ({
          color: item?.color || fallback[Math.min(index, fallback.length - 1)] || "#ffffff",
          offset: item?.per !== undefined ? Number(item.per) / 100 : item?.offset !== undefined ? Number(item.offset) : toEvenOffset(index, list.length)
        }))
        .filter((item) => item.color)
    );
  }

  if (colorConfig?.type === "linear-gradient" && Array.isArray(colorConfig.colors) && colorConfig.colors.length > 0) {
    return normalizeStops(
      colorConfig.colors.map((item: any, index: number, list: any[]) => ({
        color: item?.color || fallback[Math.min(index, fallback.length - 1)] || "#ffffff",
        offset: item?.per !== undefined ? Number(item.per) / 100 : toEvenOffset(index, list.length)
      }))
    );
  }

  if (typeof colorConfig === "string" && colorConfig) {
    if (colorConfig.includes("linear-gradient")) {
      const colors = colorConfig.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g) || [];
      if (colors.length > 0) {
        return normalizeStops(colors.map((color, index, list) => ({ color, offset: toEvenOffset(index, list.length) })));
      }
    }

    return [
      { offset: 0, color: colorConfig },
      { offset: 1, color: colorConfig }
    ];
  }

  const normalizedFallback = fallback.length > 0 ? fallback : ["#00ffff", "#ffffff"];
  return normalizeStops(
    normalizedFallback.map((color, index, list) => ({
      color,
      offset: toEvenOffset(index, list.length)
    }))
  );
}

export function createGradientTexture(
  colorConfig: any,
  fallback: string[] = ["#00ffff", "#ffffff"],
  options?: {
    size?: number;
    horizontal?: boolean;
  }
): THREE.CanvasTexture {
  const size = Math.max(2, Math.floor(options?.size || 256));
  const horizontal = options?.horizontal === true;
  const canvas = document.createElement("canvas");
  canvas.width = horizontal ? size : 1;
  canvas.height = horizontal ? 1 : size;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to create gradient texture context");
  }

  const gradient = horizontal
    ? context.createLinearGradient(0, 0, size, 0)
    : context.createLinearGradient(0, size, 0, 0);

  getGradientStops(colorConfig, fallback).forEach((stop) => {
    gradient.addColorStop(THREE.MathUtils.clamp(stop.offset, 0, 1), stop.color);
  });

  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

export function normalizeLngLatPoint(point: any): LngLatPoint | null {
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
}

export function normalizePolylinePoints(item: any): LngLatPoint[] {
  const rawPoints = item?.points || item?.coords || item?.coordinates || item?.path;

  if (Array.isArray(rawPoints)) {
    return rawPoints.map(normalizeLngLatPoint).filter(Boolean) as LngLatPoint[];
  }

  if (item?.from && item?.to) {
    const from = normalizeLngLatPoint(item.from);
    const to = normalizeLngLatPoint(item.to);
    return [from, to].filter(Boolean) as LngLatPoint[];
  }

  return [];
}

export function resolveFenceLngLatLists(item: any, geoJson?: any): LngLatPoint[][] {
  const points = normalizePolylinePoints(item);
  if (points.length >= 2) {
    return [points];
  }

  const feature = resolveFeatureByItem(item, geoJson);
  if (!feature?.geometry) {
    return [];
  }

  return extractFeatureOuterRings(feature);
}

export function projectLngLatToWorld(
  point: LngLatPoint,
  mapParams: Pick<MapChildProjectParams, "centerX" | "centerY" | "scale" | "baseHeight">,
  zOffset: number = 0
): THREE.Vector3 {
  const projectedPoint = getPointByProj4(point);
  return new THREE.Vector3(
    (projectedPoint[0] - mapParams.centerX) * mapParams.scale,
    (projectedPoint[1] - mapParams.centerY) * mapParams.scale,
    mapParams.baseHeight + zOffset
  );
}

export function buildRibbonGeometry(points: THREE.Vector3[], lineWidth: number): THREE.BufferGeometry | null {
  if (points.length < 2 || lineWidth <= 0) {
    return null;
  }

  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const cumulativeLengths = getCumulativeLengths(points);
  const totalLength = cumulativeLengths[cumulativeLengths.length - 1] || 1;
  const halfWidth = lineWidth / 2;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];

    const dirPrev = point.clone().sub(prev).setZ(0);
    const dirNext = next.clone().sub(point).setZ(0);

    if (dirPrev.lengthSq() > 0) {
      dirPrev.normalize();
    }
    if (dirNext.lengthSq() > 0) {
      dirNext.normalize();
    }

    let tangent = dirPrev.clone().add(dirNext);
    if (tangent.lengthSq() === 0) {
      tangent = dirNext.lengthSq() > 0 ? dirNext.clone() : dirPrev.clone();
    }
    if (tangent.lengthSq() === 0) {
      tangent = new THREE.Vector3(1, 0, 0);
    }
    tangent.normalize();

    const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
    const prevNormal = dirPrev.lengthSq() > 0 ? new THREE.Vector3(-dirPrev.y, dirPrev.x, 0).normalize() : normal.clone();
    const dot = Math.abs(normal.dot(prevNormal));
    const miterScale = THREE.MathUtils.clamp(dot > 1e-4 ? 1 / dot : 1, 1, 2);
    const offset = normal.multiplyScalar(halfWidth * miterScale);

    const left = point.clone().add(offset);
    const right = point.clone().sub(offset);
    const u = cumulativeLengths[i] / totalLength;

    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    uvs.push(u, 0, u, 1);

    if (i < points.length - 1) {
      const index = i * 2;
      indices.push(index, index + 1, index + 2);
      indices.push(index + 1, index + 3, index + 2);
    }
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

export function buildWallGeometry(points: THREE.Vector3[], height: number, closeLoop: boolean = false): THREE.BufferGeometry | null {
  if (points.length < 2 || height <= 0) {
    return null;
  }

  const resolvedPoints = closeLoop && !points[0].equals(points[points.length - 1]) ? [...points, points[0].clone()] : points;
  if (resolvedPoints.length < 2) {
    return null;
  }

  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let currentLength = 0;

  resolvedPoints.forEach((point, index) => {
    if (index > 0) {
      currentLength += point.clone().setZ(0).distanceTo(resolvedPoints[index - 1].clone().setZ(0));
    }

    const u = currentLength / Math.max(height, 1e-6);
    positions.push(point.x, point.y, point.z, point.x, point.y, point.z + height);
    uvs.push(u, 0, u, 1);

    if (index < resolvedPoints.length - 1) {
      const baseIndex = index * 2;
      indices.push(baseIndex, baseIndex + 2, baseIndex + 1);
      indices.push(baseIndex + 1, baseIndex + 2, baseIndex + 3);
    }
  });

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

function getCumulativeLengths(points: THREE.Vector3[]): number[] {
  const lengths = [0];

  for (let i = 1; i < points.length; i++) {
    lengths[i] = lengths[i - 1] + points[i].distanceTo(points[i - 1]);
  }

  return lengths;
}

function normalizeStops(stops: GradientStop[]): GradientStop[] {
  if (stops.length === 0) {
    return [
      { offset: 0, color: "#ffffff" },
      { offset: 1, color: "#ffffff" }
    ];
  }

  const sortedStops = stops
    .map((item) => ({
      color: item.color,
      offset: THREE.MathUtils.clamp(Number.isFinite(item.offset) ? item.offset : 0, 0, 1)
    }))
    .sort((a, b) => a.offset - b.offset);

  if (sortedStops.length === 1) {
    return [
      { offset: 0, color: sortedStops[0].color },
      { offset: 1, color: sortedStops[0].color }
    ];
  }

  if (sortedStops[0].offset > 0) {
    sortedStops.unshift({ offset: 0, color: sortedStops[0].color });
  }
  if (sortedStops[sortedStops.length - 1].offset < 1) {
    sortedStops.push({ offset: 1, color: sortedStops[sortedStops.length - 1].color });
  }

  return sortedStops;
}

function toEvenOffset(index: number, total: number): number {
  return total <= 1 ? 0 : index / (total - 1);
}

function resolveFeatureByItem(item: any, geoJson?: any): any | null {
  if (!geoJson?.features?.length) {
    return null;
  }

  const targetAdcode = item?.adcode !== undefined && item?.adcode !== null ? String(item.adcode) : "";
  const targetName = item?.name ? String(item.name) : "";

  return (
    geoJson.features.find((feature: any) => {
      const featureAdcode = feature?.properties?.adcode !== undefined ? String(feature.properties.adcode) : "";
      const featureName = feature?.properties?.name ? String(feature.properties.name) : "";
      return (targetAdcode && targetAdcode === featureAdcode) || (targetName && targetName === featureName);
    }) || null
  );
}

function extractFeatureOuterRings(feature: any): LngLatPoint[][] {
  const geometry = feature?.geometry;
  if (!geometry?.coordinates) {
    return [];
  }

  if (geometry.type === "Polygon") {
    return geometry.coordinates.length > 0 ? [geometry.coordinates[0].map(normalizeLngLatPoint).filter(Boolean)] : [];
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates
      .map((polygon: any) => (Array.isArray(polygon) && polygon.length > 0 ? polygon[0] : []))
      .map((ring: any[]) => ring.map(normalizeLngLatPoint).filter(Boolean))
      .filter((ring: LngLatPoint[]) => ring.length > 1);
  }

  return [];
}
