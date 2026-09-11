import * as THREE from "three";

export class ClusteringHeatAlphaPass {
  private renderer: THREE.WebGLRenderer;
  private resolution: number;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private material: THREE.ShaderMaterial;
  private mesh: THREE.Mesh;
  private baseGeometry: THREE.CircleGeometry;
  private output: THREE.WebGLRenderTarget;
  private currentGeometry: THREE.InstancedBufferGeometry | null = null;

  constructor(renderer: THREE.WebGLRenderer, resolution: number) {
    this.renderer = renderer;
    this.resolution = resolution;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-resolution / 2, resolution / 2, resolution / 2, -resolution / 2, -1, 1);
    this.baseGeometry = new THREE.CircleGeometry(1, 24);
    this.output = new THREE.WebGLRenderTarget(resolution, resolution, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false
    });

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        radius: { value: 20 },
        blur: { value: 0.613 }
      },
      vertexShader: `
        uniform float radius;
        attribute vec2 instancePosition;
        attribute float instanceValue;
        varying float vValue;
        varying vec2 vUv;

        void main() {
          vValue = instanceValue;
          vUv = uv;

          mat4 instanceMatrix = mat4(
            max(radius, 0.001), 0.0, 0.0, 0.0,
            0.0, max(radius, 0.001), 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            instancePosition.x, instancePosition.y, 0.0, 1.0
          );

          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float radius;
        uniform float blur;
        varying float vValue;
        varying vec2 vUv;

        void main() {
          float distanceToCenter = length(vUv - vec2(0.5)) / 0.5;
          float alpha = 1.0 - min(distanceToCenter, 1.0);
          alpha = min(alpha / max(blur, 0.0001), 1.0);

          float intensity = max(alpha * vValue, 0.0);
          gl_FragColor = vec4(vec3(intensity), intensity);
        }
      `
    });

    this.mesh = new THREE.Mesh(new THREE.InstancedBufferGeometry(), this.material);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
  }

  public get texture(): THREE.Texture {
    return this.output.texture;
  }

  public setPointDatas(positions: number[], values: number[]): void {
    if (this.currentGeometry) {
      this.currentGeometry.dispose();
      this.currentGeometry = null;
    }

    const geometry = new THREE.InstancedBufferGeometry();
    if (this.baseGeometry.index) {
      geometry.setIndex(this.baseGeometry.index);
    }
    const positionAttribute = this.baseGeometry.getAttribute("position");
    const uvAttribute = this.baseGeometry.getAttribute("uv");
    const normalAttribute = this.baseGeometry.getAttribute("normal");

    if (positionAttribute) {
      geometry.setAttribute("position", positionAttribute);
    }
    if (uvAttribute) {
      geometry.setAttribute("uv", uvAttribute);
    }
    if (normalAttribute) {
      geometry.setAttribute("normal", normalAttribute);
    }
    geometry.instanceCount = values.length;
    geometry.setAttribute("instancePosition", new THREE.InstancedBufferAttribute(new Float32Array(positions), 2));
    geometry.setAttribute("instanceValue", new THREE.InstancedBufferAttribute(new Float32Array(values), 1));

    this.currentGeometry = geometry;
    this.mesh.geometry = geometry;
  }

  public setUniforms(radius: number, blur: number): void {
    this.material.uniforms.radius.value = Math.max(Number(radius) || 0, 0);
    this.material.uniforms.blur.value = THREE.MathUtils.clamp(Number(blur) || 0.613, 0.0001, 1);
  }

  public render(): THREE.Texture {
    const previousTarget = this.renderer.getRenderTarget();
    const previousColor = this.renderer.getClearColor(new THREE.Color());
    const previousAlpha = this.renderer.getClearAlpha();

    this.renderer.setRenderTarget(this.output);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.clear(true, true, true);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(previousTarget);
    this.renderer.setClearColor(previousColor, previousAlpha);

    return this.output.texture;
  }

  public dispose(): void {
    this.currentGeometry?.dispose();
    this.baseGeometry.dispose();
    this.material.dispose();
    this.output.dispose();
  }
}
