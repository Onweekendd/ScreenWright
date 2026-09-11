import * as THREE from "three";

import { getPointByProj4 } from "../echartcommonMap/utils";
import { ClusteringHeatAlphaPass } from "./ClusteringHeatAlphaPass";
import { ClusteringHeatColorPass } from "./ClusteringHeatColorPass";
import { applyClusteringHeatEffect, clearClusteringHeatEffect } from "./materialEffects";

interface HeatmapLayer {
  id: string;
  data: any[];
  option: any;
}

interface HeatmapContext {
  renderer: THREE.WebGLRenderer | null;
  mapMeshes: THREE.Mesh[];
  geoJson: { features?: any[] } | null;
  uvReferenceBounds: { minX: number; maxX: number; minY: number; maxY: number } | null;
  uvOffset: THREE.Vector2;
  uvScale: THREE.Vector2;
}

interface PointItem {
  lng: number;
  lat: number;
  value: number;
}

interface GradientStop {
  color: string;
}

export class MapClusteringHeatManager {
  private layers: Map<string, HeatmapLayer> = new Map();
  private alphaPass: ClusteringHeatAlphaPass | null = null;
  private colorPass: ClusteringHeatColorPass | null = null;
  private resolution = 2048;
  private uniforms = {
    texture: { value: null as THREE.Texture | null },
    enabled: { value: 0 },
    minOpacity: { value: 0 },
    maxOpacity: { value: 1 }
  };

  public update(id: string, data: any[], option: any, context: HeatmapContext): void {
    if (!data || data.length === 0) {
      this.layers.delete(id);
      this.apply(context);
      return;
    }

    this.layers.delete(id);
    this.layers.set(id, { id, data, option });
    this.apply(context);
  }

  public remove(id: string, context: HeatmapContext): void {
    this.layers.delete(id);
    this.apply(context);
  }

  public reapply(context: HeatmapContext): void {
    this.apply(context);
  }

  public dispose(context?: HeatmapContext): void {
    if (context) {
      this.clear(context.mapMeshes);
    } else {
      this.uniforms.texture.value = null;
      this.uniforms.enabled.value = 0;
    }
    this.alphaPass?.dispose();
    this.colorPass?.dispose();
    this.alphaPass = null;
    this.colorPass = null;
    this.layers.clear();
  }

  private apply(context: HeatmapContext): void {
    this.attachToMaterials(context.mapMeshes);

    const activeLayer = this.getActiveLayer();
    if (!activeLayer || !context.renderer || !context.uvReferenceBounds) {
      this.clear(context.mapMeshes);
      return;
    }

    const points = this.normalizePoints(activeLayer.data, context.geoJson);
    if (points.length === 0) {
      this.clear(context.mapMeshes);
      return;
    }

    const resolution = this.resolveResolution(activeLayer.option?.resolution);
    this.ensurePasses(context.renderer, resolution);

    const valueRange = this.resolveValueRange(points, activeLayer.option);
    const positions = this.buildPixelPositions(
      points,
      context.uvReferenceBounds,
      context.uvOffset,
      context.uvScale,
      resolution
    );
    const values = points.map((item) => this.normalizeValue(item.value, valueRange.min, valueRange.max));

    this.alphaPass!.setPointDatas(positions, values);
    this.alphaPass!.setUniforms(Number(activeLayer.option?.pointSize) || 80, this.getBlurFactor(activeLayer.option));
    this.alphaPass!.render();

    this.colorPass!.setMap(this.alphaPass!.texture);
    this.colorPass!.setColors(this.getColorStops(activeLayer.option));
    this.colorPass!.render();

    this.uniforms.texture.value = this.colorPass!.texture;
    this.uniforms.enabled.value = 1;
    this.uniforms.minOpacity.value = this.getOpacity(activeLayer.option?.minOpacity, 0);
    this.uniforms.maxOpacity.value = this.getOpacity(activeLayer.option?.maxOpacity, 1);

    context.mapMeshes.forEach((mesh) => {
      const topMaterial = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      if (topMaterial) {
        applyClusteringHeatEffect(topMaterial, this.uniforms);
      }
    });
  }

  private clear(mapMeshes: THREE.Mesh[]): void {
    this.uniforms.texture.value = null;
    this.uniforms.enabled.value = 0;

    mapMeshes.forEach((mesh) => {
      const topMaterial = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      if (topMaterial) {
        clearClusteringHeatEffect(topMaterial);
      }
    });
  }

  private attachToMaterials(mapMeshes: THREE.Mesh[]): void {
    mapMeshes.forEach((mesh) => {
      const topMaterial = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      if (topMaterial) {
        applyClusteringHeatEffect(topMaterial, this.uniforms);
      }
    });
  }

  private getActiveLayer(): HeatmapLayer | null {
    const layers = Array.from(this.layers.values());
    return layers.length > 0 ? layers[layers.length - 1] : null;
  }

  private ensurePasses(renderer: THREE.WebGLRenderer, resolution: number): void {
    if (this.alphaPass && this.colorPass && this.resolution === resolution) {
      return;
    }

    this.alphaPass?.dispose();
    this.colorPass?.dispose();

    this.resolution = resolution;
    this.alphaPass = new ClusteringHeatAlphaPass(renderer, resolution);
    this.colorPass = new ClusteringHeatColorPass(renderer, resolution);
  }

  private resolveResolution(value: any): number {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return 2048;
    }
    return Math.max(256, Math.min(4096, Math.round(numericValue)));
  }

  private resolveValueRange(points: PointItem[], option: any): { min: number; max: number } {
    let min = Infinity;
    let max = -Infinity;

    points.forEach((item) => {
      min = Math.min(min, item.value);
      max = Math.max(max, item.value);
    });

    const fallbackMin = min === Infinity ? 0 : min;
    const fallbackMax = max === -Infinity ? 100 : max;
    const optionMin = Number(option?.visualMapMin);
    const optionMax = Number(option?.visualMapMax);

    return {
      min: Number.isFinite(optionMin) ? optionMin : fallbackMin,
      max: Number.isFinite(optionMax) ? optionMax : fallbackMax
    };
  }

  private normalizeValue(value: number, min: number, max: number): number {
    if (max <= min) {
      return 1;
    }
    return THREE.MathUtils.clamp((value - min) / (max - min), 0, 1);
  }

  private buildPixelPositions(
    points: PointItem[],
    bounds: { minX: number; maxX: number; minY: number; maxY: number },
    uvOffset: THREE.Vector2,
    uvScale: THREE.Vector2,
    resolution: number
  ): number[] {
    const width = bounds.maxX - bounds.minX || 1;
    const height = bounds.maxY - bounds.minY || 1;
    const positions = new Array(points.length * 2);

    points.forEach((point, index) => {
      const [projX, projY] = getPointByProj4([point.lng, point.lat]);
      let u = (projX - bounds.minX) / width;
      let v = (projY - bounds.minY) / height;

      u = u * uvScale.x + uvOffset.x;
      v = v * uvScale.y + uvOffset.y;

      positions[index * 2] = u * resolution - resolution / 2;
      positions[index * 2 + 1] = v * resolution - resolution / 2;
    });

    return positions;
  }

  private normalizePoints(data: any[], geoJson: { features?: any[] } | null): PointItem[] {
    const points: PointItem[] = [];

    data.forEach((item) => {
      const value = Number(item?.value);
      if (!Number.isFinite(value)) {
        return;
      }

      const lng = Number(item?.lng);
      const lat = Number(item?.lat);

      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        points.push({ lng, lat, value });
        return;
      }

      const center = this.getFeatureCenter(item, geoJson);
      if (center) {
        points.push({ lng: center[0], lat: center[1], value });
      }
    });

    return points;
  }

  private getFeatureCenter(item: any, geoJson: { features?: any[] } | null): [number, number] | null {
    const targetAdcode = item?.adcode !== undefined && item?.adcode !== null ? String(item.adcode) : "";
    const targetName = item?.name ? String(item.name) : "";

    const feature = geoJson?.features?.find((entry: any) => {
      const featureAdcode = entry?.properties?.adcode ?? entry?.properties?.ADCODE;
      const featureName = entry?.properties?.name;

      if (targetAdcode && String(featureAdcode) === targetAdcode) {
        return true;
      }

      return targetName ? String(featureName || "") === targetName : false;
    });

    const coords = feature?.properties?.cp || feature?.properties?.center || feature?.properties?.centroid;
    if (Array.isArray(coords) && coords.length >= 2) {
      return [Number(coords[0]), Number(coords[1])];
    }

    return null;
  }

  private extractGradientColors(colorConfig: any): string[] {
    if (Array.isArray(colorConfig) && colorConfig.length > 0) {
      return colorConfig.filter((item) => typeof item === "string");
    }

    if (colorConfig?.type === "linear-gradient" && Array.isArray(colorConfig.colors)) {
      const colors = colorConfig.colors.map((item: GradientStop) => item?.color).filter(Boolean);
      if (colors.length > 0) {
        return colors;
      }
    }

    if (typeof colorConfig === "string") {
      const gradientColors = colorConfig.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g);
      if (gradientColors?.length) {
        return gradientColors;
      }
      return colorConfig ? [colorConfig] : [];
    }

    return [];
  }

  private getColorStops(option: any): string[] {
    const fillColors = this.extractGradientColors(option?.fillColor);
    if (fillColors.length > 0) {
      return fillColors;
    }

    const visualMapColors = this.extractGradientColors(option?.visualMapColor);
    if (visualMapColors.length > 0) {
      return visualMapColors;
    }

    return [
      "#313695",
      "#4575b4",
      "#74add1",
      "#abd9e9",
      "#e0f3f8",
      "#ffffbf",
      "#fee090",
      "#fdae61",
      "#f46d43",
      "#d73027",
      "#a50026"
    ];
  }

  private getBlurFactor(option: any): number {
    const blurFactor = Number(option?.blurFactor);
    if (Number.isFinite(blurFactor)) {
      return THREE.MathUtils.clamp(blurFactor, 0.05, 1);
    }

    const pointSize = Math.max(Number(option?.pointSize) || 80, 1);
    const legacyBlur = Number(option?.blurSize);
    if (Number.isFinite(legacyBlur)) {
      const normalizedBlur = legacyBlur <= 1 ? legacyBlur : legacyBlur / pointSize;
      return THREE.MathUtils.clamp(normalizedBlur, 0.05, 1);
    }

    return 0.613;
  }

  private getOpacity(value: any, fallback: number): number {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return fallback;
    }
    return THREE.MathUtils.clamp(numericValue, 0, 1);
  }
}
