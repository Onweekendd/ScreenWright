import * as THREE from "three";

import { cloneMapMaterial } from "./materialEffects";

interface ColorMapLayer {
  id: string;
  data: any[];
  option: any;
}

interface ColorMapContext {
  mapMeshes: THREE.Mesh[];
  meshOriginalMaterial: Map<THREE.Mesh, THREE.Material[]>;
}

interface PiecewiseEntry<TColor = THREE.Color> {
  min: number;
  max: number;
  color: TColor;
}

export class MapColorMapManager {
  private baseMaterials: Map<THREE.Mesh, THREE.Material[]> = new Map();
  private layers: Map<string, ColorMapLayer> = new Map();
  private appliedTopMaterials: Map<THREE.Mesh, THREE.Material> = new Map();

  public update(id: string, data: any[], option: any, context: ColorMapContext): void {
    if (!context.mapMeshes.length) return;

    if (!data || data.length === 0) {
      this.layers.delete(id);
      this.apply(context);
      return;
    }

    this.layers.delete(id);
    this.layers.set(id, {
      id,
      data,
      option
    });

    this.apply(context);
  }

  public reapply(context: ColorMapContext, forceRebuildBase: boolean = false): void {
    this.apply(context, forceRebuildBase);
  }

  public dispose(): void {
    this.disposeManagedMaterials();
    this.baseMaterials.clear();
    this.layers.clear();
  }

  private apply(context: ColorMapContext, forceRebuildBase: boolean = false): void {
    this.syncBaseMaterials(context, forceRebuildBase);

    const activeLayer = this.getActiveLayer();
    if (!activeLayer) {
      this.restoreBaseMaterials(context);
      return;
    }

    const dataMap = this.buildDataMap(activeLayer.data);
    const actualRange = this.getActualRange(activeLayer.data);
    const min = this.resolveRangeValue(activeLayer.option?.visualMapMin, actualRange.min);
    const max = this.resolveRangeValue(activeLayer.option?.visualMapMax, actualRange.max);
    const colorStops = this.getColorStops(activeLayer.option?.fillColor ?? activeLayer.option?.visualMapColor);
    const noDataColor = this.getNoDataColor(activeLayer.option?.noDataColor);
    const noDataOpacity = this.getNormalizedOpacity(activeLayer.option?.noDataOpacity, 20);
    const colorMode = activeLayer.option?.colorMode === "piecewise" ? "piecewise" : "continuous";
    const piecewiseEntries = this.getPiecewiseEntries(activeLayer.option, min, max, colorStops);

    context.mapMeshes.forEach((mesh) => {
      const baseMaterials = this.baseMaterials.get(mesh);
      if (!baseMaterials || baseMaterials.length === 0) {
        return;
      }

      const value = this.resolveMeshValue(mesh, dataMap);
      if (value === undefined || value === null || Number.isNaN(Number(value))) {
        if (noDataOpacity <= 0) {
          this.applyMeshMaterials(mesh, baseMaterials, context.meshOriginalMaterial);
          return;
        }

        const topMaterial = this.cloneMaterial(baseMaterials[0]);
        this.tintTopMaterial(topMaterial, noDataColor, noDataOpacity);
        this.applyMeshMaterials(mesh, [topMaterial, ...baseMaterials.slice(1)], context.meshOriginalMaterial, true);
        return;
      }

      const targetColor = this.getColorByValue(Number(value), min, max, colorStops, colorMode, piecewiseEntries);
      if (!targetColor) {
        if (noDataOpacity <= 0) {
          this.applyMeshMaterials(mesh, baseMaterials, context.meshOriginalMaterial);
          return;
        }

        const topMaterial = this.cloneMaterial(baseMaterials[0]);
        this.tintTopMaterial(topMaterial, noDataColor, noDataOpacity);
        this.applyMeshMaterials(mesh, [topMaterial, ...baseMaterials.slice(1)], context.meshOriginalMaterial, true);
        return;
      }

      const topMaterial = this.cloneMaterial(baseMaterials[0]);
      this.tintTopMaterial(topMaterial, targetColor, 1);
      this.applyMeshMaterials(mesh, [topMaterial, ...baseMaterials.slice(1)], context.meshOriginalMaterial, true);
    });
  }

  private syncBaseMaterials(context: ColorMapContext, forceRebuildBase: boolean): void {
    const needsRebuild =
      forceRebuildBase ||
      this.baseMaterials.size !== context.mapMeshes.length ||
      context.mapMeshes.some((mesh) => !this.baseMaterials.has(mesh));

    if (!needsRebuild) {
      return;
    }

    this.disposeManagedMaterials();
    this.baseMaterials.clear();

    context.mapMeshes.forEach((mesh) => {
      const baseMaterials = context.meshOriginalMaterial.get(mesh) || this.toMaterialArray(mesh.material);
      this.baseMaterials.set(mesh, baseMaterials);
    });
  }

  private getActiveLayer(): ColorMapLayer | null {
    const layers = Array.from(this.layers.values());
    return layers.length > 0 ? layers[layers.length - 1] : null;
  }

  private buildDataMap(data: any[]): Map<string, number> {
    const result = new Map<string, number>();

    data.forEach((item) => {
      const value = Number(item?.value);
      if (Number.isNaN(value)) {
        return;
      }

      const adcode = item?.adcode !== undefined && item?.adcode !== null ? String(item.adcode) : "";
      const name = item?.name ? String(item.name) : "";

      if (adcode) {
        result.set(`adcode:${adcode}`, value);
      }
      if (name) {
        result.set(`name:${name}`, value);
      }
    });

    return result;
  }

  private resolveMeshValue(mesh: THREE.Mesh, dataMap: Map<string, number>): number | undefined {
    const adcode = mesh.userData?.adcode ? String(mesh.userData.adcode) : "";
    const name = mesh.userData?.name ? String(mesh.userData.name) : "";

    if (adcode && dataMap.has(`adcode:${adcode}`)) {
      return dataMap.get(`adcode:${adcode}`);
    }

    if (name && dataMap.has(`name:${name}`)) {
      return dataMap.get(`name:${name}`);
    }

    return undefined;
  }

  private getActualRange(data: any[]): { min: number; max: number } {
    let min = Infinity;
    let max = -Infinity;

    data.forEach((item) => {
      const value = Number(item?.value);
      if (Number.isNaN(value)) {
        return;
      }
      min = Math.min(min, value);
      max = Math.max(max, value);
    });

    if (min === Infinity || max === -Infinity) {
      return { min: 0, max: 100 };
    }

    return { min, max };
  }

  private resolveRangeValue(value: any, fallback: number): number {
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? fallback : numericValue;
  }

  private getNormalizedOpacity(value: any, fallback: number): number {
    const numericValue = Number(value);
    const opacity = Number.isNaN(numericValue) ? fallback : numericValue;
    return THREE.MathUtils.clamp(opacity / 100, 0, 1);
  }

  private getNoDataColor(color: any): THREE.Color {
    return new THREE.Color(typeof color === "string" && color ? color : "#A09E9E");
  }

  private extractGradientColors(gradient: string): string[] {
    if (!gradient.includes("linear-gradient")) {
      return [];
    }

    return gradient.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g) || [];
  }

  private getColorStops(colorConfig: any): THREE.Color[] {
    if (Array.isArray(colorConfig) && colorConfig.length > 0) {
      return colorConfig.map((color) => new THREE.Color(color));
    }

    if (colorConfig?.type === "linear-gradient" && Array.isArray(colorConfig.colors) && colorConfig.colors.length > 0) {
      return colorConfig.colors.map((item: any) => new THREE.Color(item.color));
    }

    if (typeof colorConfig === "string" && colorConfig) {
      const gradientColors = this.extractGradientColors(colorConfig);
      if (gradientColors.length > 0) {
        return gradientColors.map((color) => new THREE.Color(color));
      }

      return [new THREE.Color(colorConfig)];
    }

    return [new THREE.Color("#171a24"), new THREE.Color("#2d5dfd")];
  }

  private getColorByValue(
    value: number,
    min: number,
    max: number,
    stops: THREE.Color[],
    mode: "continuous" | "piecewise",
    piecewiseEntries: PiecewiseEntry[] = []
  ): THREE.Color | null {
    if (mode === "piecewise") {
      return this.getPiecewiseColorByValue(value, min, max, stops, piecewiseEntries);
    }

    if (stops.length === 1 || max <= min) {
      return stops[stops.length - 1].clone();
    }

    const ratio = THREE.MathUtils.clamp((value - min) / (max - min), 0, 1);
    const scaled = ratio * (stops.length - 1);
    const lowerIndex = Math.floor(scaled);
    const upperIndex = Math.min(stops.length - 1, lowerIndex + 1);
    const mixRatio = scaled - lowerIndex;

    return stops[lowerIndex].clone().lerp(stops[upperIndex], mixRatio);
  }

  private getPiecewiseColorByValue(
    value: number,
    min: number,
    max: number,
    stops: THREE.Color[],
    piecewiseEntries: PiecewiseEntry[]
  ): THREE.Color | null {
    if (piecewiseEntries.length > 0) {
      const match = piecewiseEntries.find((item) => value >= item.min && value <= item.max);
      return match ? match.color.clone() : null;
    }

    if (stops.length === 1 || max <= min) {
      return stops[stops.length - 1].clone();
    }

    const ratio = THREE.MathUtils.clamp((value - min) / (max - min), 0, 1);
    const pieceIndex = Math.min(stops.length - 1, Math.floor(ratio * stops.length));

    return stops[pieceIndex].clone();
  }

  private getPiecewiseEntries(option: any, min: number, max: number, stops: THREE.Color[]): PiecewiseEntry[] {
    if (Array.isArray(option?.piecewiseList) && option.piecewiseList.length > 0) {
      return option.piecewiseList
        .map((item: any, index: number) => {
          const color = item?.color || option?.visualMapColor?.[index];
          if (!color) {
            return null;
          }

          return {
            min: this.resolveRangeValue(item?.min, min),
            max: this.resolveRangeValue(item?.max, max),
            color: new THREE.Color(color)
          };
        })
        .filter(Boolean) as PiecewiseEntry[];
    }

    if (stops.length === 0) {
      return [];
    }

    const safeMax = max > min ? max : min + 1;
    const step = (safeMax - min) / Math.max(stops.length, 1);

    return stops.map((color, index) => ({
      min: min + step * index,
      max: index === stops.length - 1 ? safeMax : min + step * (index + 1),
      color
    }));
  }

  private cloneMaterial(material: THREE.Material): THREE.Material {
    return cloneMapMaterial(material);
  }

  private tintTopMaterial(material: THREE.Material, color: THREE.Color, opacity: number): void {
    material.transparent = opacity < 1 || material.transparent;
    material.opacity = opacity;

    if (material instanceof THREE.MeshStandardMaterial) {
      material.color.copy(color);
      material.emissive.copy(color).multiplyScalar(material.map ? 0.15 : 0.25);
      material.emissiveIntensity = 1;
      material.needsUpdate = true;
      return;
    }

    if (material instanceof THREE.ShaderMaterial) {
      if (material.uniforms.uColor) {
        material.uniforms.uColor.value.copy(color);
      }
      material.needsUpdate = true;
    }
  }

  private applyMeshMaterials(
    mesh: THREE.Mesh,
    materials: THREE.Material[],
    meshOriginalMaterial: Map<THREE.Mesh, THREE.Material[]>,
    managedTopMaterial: boolean = false
  ): void {
    const previousManagedMaterial = this.appliedTopMaterials.get(mesh);
    const nextTopMaterial = materials[0];

    if (previousManagedMaterial && previousManagedMaterial !== nextTopMaterial) {
      previousManagedMaterial.dispose();
    }

    if (managedTopMaterial) {
      this.appliedTopMaterials.set(mesh, nextTopMaterial);
    } else {
      this.appliedTopMaterials.delete(mesh);
    }

    if (materials.length > 1 && mesh.geometry.groups && mesh.geometry.groups.length > 0) {
      mesh.material = materials;
    } else {
      mesh.material = materials[0];
    }

    meshOriginalMaterial.set(mesh, materials);
  }

  private restoreBaseMaterials(context: ColorMapContext): void {
    context.mapMeshes.forEach((mesh) => {
      const baseMaterials = this.baseMaterials.get(mesh);
      if (!baseMaterials || baseMaterials.length === 0) {
        return;
      }

      this.applyMeshMaterials(mesh, baseMaterials, context.meshOriginalMaterial);
    });
  }

  private disposeManagedMaterials(): void {
    this.appliedTopMaterials.forEach((material) => {
      material.dispose();
    });
    this.appliedTopMaterials.clear();
  }

  private toMaterialArray(material: THREE.Material | THREE.Material[]): THREE.Material[] {
    return Array.isArray(material) ? material : [material];
  }
}
