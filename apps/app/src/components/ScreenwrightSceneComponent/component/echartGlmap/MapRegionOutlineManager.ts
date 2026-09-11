import * as THREE from "three";
// @ts-ignore
import { MeshLine, MeshLineMaterial } from "three.meshline";

import { getBlendingMode, getColorString, getNormalizedOpacity, getNumericValue } from "./MapChildRenderUtils";
import { getWorldContinentCodes } from "./worldContinentGroups";

export interface RegionOutlineDataItem {
  targetType?: "region" | "continent";
  adcode?: string | number;
  groupId?: string;
  name?: string;
  [key: string]: any;
}

export interface RegionOutlineOption {
  targetType?: "region" | "continent";
  color?: any;
  opacity?: number;
  lineWidth?: number;
  flow?: boolean;
  flowSpeed?: number;
  zOffset?: number;
  blendingMode?: "NormalBlending" | "AdditiveBlending" | "SubtractiveBlending" | "MultiplyBlending";
}

interface RegionOutlineAnimateState {
  material: any;
  speed: number;
}

interface RegionOutlineSegment {
  id: string;
  startKey: string;
  endKey: string;
  start: THREE.Vector2;
  end: THREE.Vector2;
}

interface RegionOutlineNode {
  key: string;
  point: THREE.Vector2;
  segmentIds: Set<string>;
}

interface RegionOutlineLoop {
  points: THREE.Vector2[];
  closed: boolean;
}

interface RegionOutlineProjectedRing {
  points: THREE.Vector2[];
  segmentKeys: string[];
}

const OUTLINE_POINT_PRECISION = 6;

const toSafeString = (value: any) => (value === undefined || value === null ? "" : String(value));

const cloneVector2 = (point: THREE.Vector2) => new THREE.Vector2(point.x, point.y);

const getFeatureAdcode = (feature: any) =>
  toSafeString(feature?.properties?.adcode || feature?.properties?.ADCODE || feature?.id || "");

const getFeatureName = (feature: any) => toSafeString(feature?.properties?.name || feature?.properties?.NAME || "");

const isWorldRootSource = (geoJsonUrl?: string) => /\/cdn\/geo-world\/world\.json(?:\?.*)?$/i.test(String(geoJsonUrl || ""));

const buildPointKey = (point: THREE.Vector2) =>
  `${point.x.toFixed(OUTLINE_POINT_PRECISION)},${point.y.toFixed(OUTLINE_POINT_PRECISION)}`;

const buildSegmentKey = (startKey: string, endKey: string) =>
  startKey < endKey ? `${startKey}|${endKey}` : `${endKey}|${startKey}`;

const extractFeatureOuterRings = (feature: any): any[][] => {
  const geometry = feature?.geometry;
  if (!geometry?.coordinates) {
    return [];
  }

  if (geometry.type === "Polygon") {
    return Array.isArray(geometry.coordinates) && geometry.coordinates[0] ? [geometry.coordinates[0]] : [];
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates
      .map((polygon: any) => (Array.isArray(polygon) && polygon.length > 0 ? polygon[0] : null))
      .filter(Boolean);
  }

  return [];
};

const ensureClosedRing = (points: THREE.Vector2[]) => {
  if (points.length < 3) {
    return points;
  }

  const first = points[0];
  const last = points[points.length - 1];
  if (first.distanceToSquared(last) <= 1e-12) {
    return points;
  }

  return [...points, cloneVector2(first)];
};

const disposeMaterial = (material: THREE.Material | THREE.Material[] | null | undefined) => {
  if (!material) {
    return;
  }

  const materials = Array.isArray(material) ? material : [material];
  materials.forEach((item: any) => {
    item.dispose?.();
  });
};

export class MapRegionOutlineManager {
  private scene: THREE.Scene;
  private groupMap: Map<string, THREE.Group> = new Map();
  private animateMap: Map<string, RegionOutlineAnimateState[]> = new Map();
  private clock: THREE.Clock = new THREE.Clock();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public update(
    id: string,
    data: RegionOutlineDataItem[],
    option: RegionOutlineOption,
    mapParams: {
      centerX: number;
      centerY: number;
      scale: number;
      baseHeight: number;
      mapSize: number;
      mapGroup: THREE.Group | null;
      geoJsonUrl?: string;
      features?: any[];
      projectPoint?: (point: [number, number]) => [number, number] | null;
    }
  ) {
    this.remove(id);

    const targetFeatures = this.resolveTargetFeatures(data, option, mapParams.features || [], mapParams.geoJsonUrl);
    if (!targetFeatures.length) {
      return;
    }

    const loops = this.buildOuterLoops(targetFeatures, mapParams);
    if (!loops.length) {
      return;
    }

    const group = new THREE.Group();
    group.name = `regionOutline_${id}`;
    group.renderOrder = 304;

    this.groupMap.set(id, group);
    this.animateMap.set(id, []);

    if (mapParams.mapGroup) {
      mapParams.mapGroup.add(group);
    } else {
      this.scene.add(group);
    }

    const lineWidth = Math.max(0.0002, getNumericValue(option.lineWidth, 3) * 0.0005);
    const opacity = getNormalizedOpacity(option.opacity, 100);
    const color = getColorString(option.color, "#3FEFFF");
    const flow = option.flow === true;
    const flowSpeed = Math.max(0.1, getNumericValue(option.flowSpeed, 1));
    const zOffset = Math.max(0.001, (mapParams.mapSize || 1) * 0.00015 + getNumericValue(option.zOffset, 0.15) * 0.001);
    const blending = getBlendingMode(option.blendingMode || "AdditiveBlending");

    loops.forEach((loop, index) => {
      if (loop.points.length < 2) {
        return;
      }

      const positions: number[] = [];
      loop.points.forEach((point) => {
        positions.push(point.x, point.y, mapParams.baseHeight + zOffset + index * 0.000001);
      });

      if (positions.length < 6) {
        return;
      }

      const meshLine = new MeshLine();
      meshLine.setPoints(positions);

      const material = new MeshLineMaterial({
        color: new THREE.Color(color),
        lineWidth,
        transparent: true,
        opacity,
        sizeAttenuation: 1,
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
        depthTest: false,
        depthWrite: false,
        blending,
        dashArray: flow ? 0.12 : 0,
        dashRatio: flow ? 0.55 : 0,
        dashOffset: 0,
        useMap: false
      });
      (material as any).toneMapped = false;

      const mesh = new THREE.Mesh(meshLine.geometry, material);
      mesh.renderOrder = 304;
      mesh.userData = {
        isRegionOutline: true,
        componentId: id,
        closed: loop.closed
      };
      group.add(mesh);

      if (flow) {
        this.animateMap.get(id)?.push({
          material,
          speed: flowSpeed
        });
      }
    });

    if (group.children.length === 0) {
      this.remove(id);
    }
  }

  public animate() {
    const delta = this.clock.getDelta();

    this.animateMap.forEach((states) => {
      states.forEach((state) => {
        if (!state.material) {
          return;
        }

        state.material.dashOffset -= delta * 0.25 * state.speed;
      });
    });
  }

  public remove(id: string) {
    const group = this.groupMap.get(id);
    if (group) {
      if (group.parent) {
        group.parent.remove(group);
      }
      group.traverse((obj: any) => {
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          disposeMaterial(obj.material);
        }
      });
      this.groupMap.delete(id);
    }

    this.animateMap.delete(id);
  }

  public dispose() {
    Array.from(this.groupMap.keys()).forEach((id) => this.remove(id));
    this.groupMap.clear();
    this.animateMap.clear();
  }

  private resolveTargetFeatures(
    data: RegionOutlineDataItem[],
    option: RegionOutlineOption,
    features: any[],
    geoJsonUrl?: string
  ) {
    if (!Array.isArray(features) || features.length === 0) {
      return [];
    }

    const normalizedItems = Array.isArray(data) ? data : [];
    const targetType = option.targetType === "continent" ? "continent" : "region";
    const regionCodeSet = new Set<string>();
    const regionNameSet = new Set<string>();
    const continentCodeSet = new Set<string>();

    normalizedItems.forEach((item) => {
      const itemType =
        item?.targetType === "continent" || item?.groupId
          ? "continent"
          : item?.targetType === "region" || item?.adcode || item?.name
            ? "region"
            : targetType;

      if (itemType === "continent") {
        const groupId = toSafeString(item?.groupId);
        getWorldContinentCodes(groupId).forEach((code) => continentCodeSet.add(toSafeString(code)));
        return;
      }

      const adcode = toSafeString(item?.adcode);
      const name = toSafeString(item?.name);
      if (adcode) {
        regionCodeSet.add(adcode);
      }
      if (name) {
        regionNameSet.add(name);
      }
    });

    if (targetType === "continent" && continentCodeSet.size === 0 && normalizedItems.length === 0) {
      return [];
    }

    const allowContinent = isWorldRootSource(geoJsonUrl);
    return features.filter((feature) => {
      const adcode = getFeatureAdcode(feature);
      const name = getFeatureName(feature);

      if (allowContinent && continentCodeSet.size > 0 && adcode && continentCodeSet.has(adcode)) {
        return true;
      }

      return (adcode && regionCodeSet.has(adcode)) || (name && regionNameSet.has(name));
    });
  }

  private buildOuterLoops(
    features: any[],
    mapParams: {
      centerX: number;
      centerY: number;
      scale: number;
      projectPoint?: (point: [number, number]) => [number, number] | null;
    }
  ) {
    const segmentCounter = new Map<string, number>();
    const segmentStore = new Map<string, RegionOutlineSegment>();

    features.forEach((feature) => {
      const rings = this.projectFeatureRings(feature, mapParams);
      rings.forEach((ring) => {
        ring.segmentKeys.forEach((segmentKey, index) => {
          segmentCounter.set(segmentKey, (segmentCounter.get(segmentKey) || 0) + 1);
          if (!segmentStore.has(segmentKey) && ring.points[index] && ring.points[index + 1]) {
            segmentStore.set(segmentKey, {
              id: segmentKey,
              startKey: buildPointKey(ring.points[index]),
              endKey: buildPointKey(ring.points[index + 1]),
              start: cloneVector2(ring.points[index]),
              end: cloneVector2(ring.points[index + 1])
            });
          }
        });
      });
    });

    const boundarySegments = Array.from(segmentStore.values()).filter((segment) => segmentCounter.get(segment.id) === 1);
    if (!boundarySegments.length) {
      return [];
    }

    return this.buildLoopsFromSegments(boundarySegments);
  }

  private projectFeatureRings(
    feature: any,
    mapParams: {
      centerX: number;
      centerY: number;
      scale: number;
      projectPoint?: (point: [number, number]) => [number, number] | null;
    }
  ) {
    const rings = extractFeatureOuterRings(feature);
    const projectedRings: RegionOutlineProjectedRing[] = [];

    rings.forEach((ring) => {
      const projectedPoints = ensureClosedRing(
        ring
          .map((point: [number, number]) => {
            const projected = mapParams.projectPoint ? mapParams.projectPoint(point) : point;
            if (!projected) {
              return null;
            }

            return new THREE.Vector2(
              (projected[0] - mapParams.centerX) * mapParams.scale,
              (projected[1] - mapParams.centerY) * mapParams.scale
            );
          })
          .filter((point: THREE.Vector2 | null): point is THREE.Vector2 => Boolean(point))
      );

      if (projectedPoints.length < 4) {
        return;
      }

      const dedupedPoints: THREE.Vector2[] = [];
      projectedPoints.forEach((point) => {
        const prev = dedupedPoints[dedupedPoints.length - 1];
        if (!prev || prev.distanceToSquared(point) > 1e-12) {
          dedupedPoints.push(point);
        }
      });

      const finalPoints = ensureClosedRing(dedupedPoints);
      if (finalPoints.length < 4) {
        return;
      }

      const segmentKeys: string[] = [];
      for (let i = 0; i < finalPoints.length - 1; i++) {
        const start = finalPoints[i];
        const end = finalPoints[i + 1];
        const startKey = buildPointKey(start);
        const endKey = buildPointKey(end);
        if (startKey === endKey) {
          continue;
        }
        segmentKeys.push(buildSegmentKey(startKey, endKey));
      }

      if (segmentKeys.length > 0) {
        projectedRings.push({
          points: finalPoints,
          segmentKeys
        });
      }
    });

    return projectedRings;
  }

  private buildLoopsFromSegments(segments: RegionOutlineSegment[]) {
    const nodeMap = new Map<string, RegionOutlineNode>();
    const segmentMap = new Map<string, RegionOutlineSegment>();
    const unusedSegments = new Set<string>();

    segments.forEach((segment) => {
      segmentMap.set(segment.id, segment);
      unusedSegments.add(segment.id);

      const startNode = nodeMap.get(segment.startKey) || {
        key: segment.startKey,
        point: cloneVector2(segment.start),
        segmentIds: new Set<string>()
      };
      startNode.segmentIds.add(segment.id);
      nodeMap.set(segment.startKey, startNode);

      const endNode = nodeMap.get(segment.endKey) || {
        key: segment.endKey,
        point: cloneVector2(segment.end),
        segmentIds: new Set<string>()
      };
      endNode.segmentIds.add(segment.id);
      nodeMap.set(segment.endKey, endNode);
    });

    const loops: RegionOutlineLoop[] = [];

    segments.forEach((segment) => {
      if (!unusedSegments.has(segment.id)) {
        return;
      }

      unusedSegments.delete(segment.id);

      const points: THREE.Vector2[] = [cloneVector2(segment.start), cloneVector2(segment.end)];
      let startKey = segment.startKey;
      let previousKey = segment.startKey;
      let currentKey = segment.endKey;
      let previousPoint = cloneVector2(segment.start);
      let currentPoint = cloneVector2(segment.end);
      let guard = 0;
      let closed = false;

      while (guard < 20000) {
        guard += 1;
        if (currentKey === startKey) {
          closed = true;
          break;
        }

        const currentNode = nodeMap.get(currentKey);
        if (!currentNode) {
          break;
        }

        const nextSegment = this.pickNextSegment(currentNode, unusedSegments, segmentMap, previousKey, previousPoint, currentPoint);
        if (!nextSegment) {
          break;
        }

        unusedSegments.delete(nextSegment.id);
        const nextKey = nextSegment.startKey === currentKey ? nextSegment.endKey : nextSegment.startKey;
        const nextPoint = nextSegment.startKey === currentKey ? cloneVector2(nextSegment.end) : cloneVector2(nextSegment.start);

        previousKey = currentKey;
        previousPoint = currentPoint;
        currentKey = nextKey;
        currentPoint = nextPoint;
        points.push(nextPoint);
      }

      if (closed && points.length > 2) {
        const first = points[0];
        const last = points[points.length - 1];
        if (first.distanceToSquared(last) > 1e-12) {
          points.push(cloneVector2(first));
        }
      }

      if (points.length >= 2) {
        loops.push({
          points,
          closed
        });
      }
    });

    return loops;
  }

  private pickNextSegment(
    node: RegionOutlineNode,
    unusedSegments: Set<string>,
    segmentMap: Map<string, RegionOutlineSegment>,
    previousKey: string,
    previousPoint: THREE.Vector2,
    currentPoint: THREE.Vector2
  ) {
    const candidates = Array.from(node.segmentIds)
      .filter((segmentId) => unusedSegments.has(segmentId))
      .map((segmentId) => segmentMap.get(segmentId))
      .filter((segment): segment is RegionOutlineSegment => Boolean(segment));

    if (candidates.length === 0) {
      return null;
    }

    if (candidates.length === 1) {
      return candidates[0];
    }

    const incoming = currentPoint.clone().sub(previousPoint);
    if (incoming.lengthSq() <= 1e-12) {
      return candidates[0];
    }
    incoming.normalize();

    let bestSegment: RegionOutlineSegment | null = null;
    let bestScore = Infinity;

    candidates.forEach((segment) => {
      const nextPoint = segment.startKey === node.key ? segment.end : segment.start;
      const nextKey = segment.startKey === node.key ? segment.endKey : segment.startKey;
      if (nextKey === previousKey) {
        return;
      }

      const outgoing = nextPoint.clone().sub(currentPoint);
      if (outgoing.lengthSq() <= 1e-12) {
        return;
      }

      outgoing.normalize();
      const score = 1 - THREE.MathUtils.clamp(incoming.dot(outgoing), -1, 1);

      if (score < bestScore) {
        bestScore = score;
        bestSegment = segment;
      }
    });

    return bestSegment || candidates[0];
  }
}
