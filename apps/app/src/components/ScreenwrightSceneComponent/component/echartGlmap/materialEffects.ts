import type * as THREE from "three";

type MaterialWithRuntimeEffects = THREE.Material & {
  customProgramCacheKey?: () => string;
  defines?: Record<string, unknown>;
};

interface ClusteringHeatUniformState {
  texture: { value: THREE.Texture | null };
  enabled: { value: number };
  minOpacity: { value: number };
  maxOpacity: { value: number };
}

interface RuntimeShader {
  uniforms: Record<string, unknown>;
  vertexShader: string;
  fragmentShader: string;
}

const HEAT_EFFECT_FLAG = "__clusteringHeatEffectEnabled";
const HEAT_BASE_BEFORE_COMPILE = "__clusteringHeatBaseOnBeforeCompile";
const HEAT_BASE_CACHE_KEY = "__clusteringHeatBaseProgramCacheKey";

const ensureUvSupport = (material: MaterialWithRuntimeEffects) => {
  material.defines = material.defines || {};
  material.defines.USE_UV = "";
};

export const applyClusteringHeatEffect = (
  material: THREE.Material,
  uniforms: ClusteringHeatUniformState
): THREE.Material => {
  const target = material as MaterialWithRuntimeEffects;
  ensureUvSupport(target);

  material.userData.clusteringHeatMap = uniforms.texture;
  material.userData.clusteringHeatEnabled = uniforms.enabled;
  material.userData.clusteringHeatMinOpacity = uniforms.minOpacity;
  material.userData.clusteringHeatMaxOpacity = uniforms.maxOpacity;

  if (!material.userData[HEAT_BASE_BEFORE_COMPILE]) {
    material.userData[HEAT_BASE_BEFORE_COMPILE] = material.onBeforeCompile;
  }
  if (!material.userData[HEAT_BASE_CACHE_KEY]) {
    material.userData[HEAT_BASE_CACHE_KEY] = target.customProgramCacheKey;
  }

  material.userData[HEAT_EFFECT_FLAG] = true;

  target.onBeforeCompile = (shader: RuntimeShader) => {
    const baseOnBeforeCompile = material.userData[HEAT_BASE_BEFORE_COMPILE];
    if (typeof baseOnBeforeCompile === "function") {
      baseOnBeforeCompile(shader);
    }

    shader.uniforms.clusteringHeatMap = material.userData.clusteringHeatMap;
    shader.uniforms.clusteringHeatEnabled = material.userData.clusteringHeatEnabled;
    shader.uniforms.clusteringHeatMinOpacity = material.userData.clusteringHeatMinOpacity;
    shader.uniforms.clusteringHeatMaxOpacity = material.userData.clusteringHeatMaxOpacity;

    if (!shader.vertexShader.includes("varying vec2 vClusteringHeatUv;")) {
      shader.vertexShader = `
        varying vec2 vClusteringHeatUv;
        ${shader.vertexShader}
      `.replace(
        "#include <uv_vertex>",
        `
        #include <uv_vertex>
        vClusteringHeatUv = uv;
        `
      );
    }

    if (!shader.fragmentShader.includes("uniform sampler2D clusteringHeatMap;")) {
      const fragmentHook = shader.fragmentShader.includes("#include <output_fragment>")
        ? "#include <output_fragment>"
        : "#include <opaque_fragment>";

      shader.fragmentShader = `
        uniform sampler2D clusteringHeatMap;
        uniform float clusteringHeatEnabled;
        uniform float clusteringHeatMinOpacity;
        uniform float clusteringHeatMaxOpacity;
        varying vec2 vClusteringHeatUv;
        ${shader.fragmentShader}
      `.replace(
        fragmentHook,
        `
        ${fragmentHook}
        if (clusteringHeatEnabled > 0.5) {
          vec4 clusteringHeatTexel = texture2D(clusteringHeatMap, vClusteringHeatUv);
          float heatAlpha = clamp(clusteringHeatTexel.a, 0.0, 1.0);
          if (heatAlpha > 0.0) {
            heatAlpha = mix(clusteringHeatMinOpacity, clusteringHeatMaxOpacity, heatAlpha);
          }
          vec4 clusteringHeatColor = vec4(clusteringHeatTexel.rgb, heatAlpha);
          gl_FragColor = mix(gl_FragColor, clusteringHeatColor, clusteringHeatColor.a);
        }
        `
      );
    }
  };

  target.customProgramCacheKey = () => {
    const baseCacheKey = material.userData[HEAT_BASE_CACHE_KEY];
    const resolvedBaseKey = typeof baseCacheKey === "function" ? baseCacheKey.call(material) : "";
    return `${resolvedBaseKey}|clusteringHeat`;
  };

  material.needsUpdate = true;
  return material;
};

export const clearClusteringHeatEffect = (material: THREE.Material): void => {
  if (!material?.userData?.[HEAT_EFFECT_FLAG]) {
    return;
  }

  if (material.userData.clusteringHeatMap) {
    material.userData.clusteringHeatMap.value = null;
  }
  if (material.userData.clusteringHeatEnabled) {
    material.userData.clusteringHeatEnabled.value = 0;
  }
};

export const cloneMapMaterial = (material: THREE.Material): THREE.Material => {
  const target = material as MaterialWithRuntimeEffects;
  const cloned = material.clone() as MaterialWithRuntimeEffects;

  if (target.defines) {
    cloned.defines = { ...target.defines };
  }

  cloned.userData = {
    ...material.userData
  };

  cloned.onBeforeCompile = material.onBeforeCompile;
  if (typeof target.customProgramCacheKey === "function") {
    cloned.customProgramCacheKey = target.customProgramCacheKey;
  }

  if (cloned.userData?.[HEAT_EFFECT_FLAG]) {
    applyClusteringHeatEffect(cloned, {
      texture: cloned.userData.clusteringHeatMap,
      enabled: cloned.userData.clusteringHeatEnabled,
      minOpacity: cloned.userData.clusteringHeatMinOpacity,
      maxOpacity: cloned.userData.clusteringHeatMaxOpacity
    });
  }

  return cloned;
};
