import * as THREE from "three";

export class ClusteringHeatColorPass {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private material: THREE.ShaderMaterial;
  private mesh: THREE.Mesh;
  private geometry: THREE.BufferGeometry;
  private output: THREE.WebGLRenderTarget;
  private gradientTexture: THREE.CanvasTexture;
  private gradientCanvas: HTMLCanvasElement;
  private gradientContext: CanvasRenderingContext2D;

  constructor(renderer: THREE.WebGLRenderer, resolution: number) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.output = new THREE.WebGLRenderTarget(resolution, resolution, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false
    });

    this.gradientCanvas = document.createElement("canvas");
    this.gradientCanvas.width = 256;
    this.gradientCanvas.height = 1;
    const context = this.gradientCanvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to create clustering heat gradient canvas");
    }
    this.gradientContext = context;
    this.gradientTexture = new THREE.CanvasTexture(this.gradientCanvas);
    this.gradientTexture.minFilter = THREE.LinearFilter;
    this.gradientTexture.magFilter = THREE.LinearFilter;
    this.gradientTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.gradientTexture.wrapT = THREE.ClampToEdgeWrapping;

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute("position", new THREE.Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3));
    this.geometry.setAttribute("uv", new THREE.Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        alphaMap: { value: null as THREE.Texture | null },
        gradientMap: { value: this.gradientTexture }
      },
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 1.0, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D alphaMap;
        uniform sampler2D gradientMap;

        void main() {
          float intensity = clamp(texture2D(alphaMap, vUv).a, 0.0, 1.0);
          vec4 color = texture2D(gradientMap, vec2(intensity, 0.5));
          color.a *= intensity;
          gl_FragColor = color;
        }
      `
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
  }

  public get texture(): THREE.Texture {
    return this.output.texture;
  }

  public setMap(texture: THREE.Texture | null): void {
    this.material.uniforms.alphaMap.value = texture;
  }

  public setColors(colors: string[]): void {
    const safeColors = colors.length > 0 ? colors : ["rgba(49,57,149,1)", "rgba(165,0,38,1)"];
    const gradient = this.gradientContext.createLinearGradient(0, 0, this.gradientCanvas.width, 0);
    const lastIndex = Math.max(safeColors.length - 1, 1);

    safeColors.forEach((color, index) => {
      gradient.addColorStop(index / lastIndex, color);
    });

    this.gradientContext.clearRect(0, 0, this.gradientCanvas.width, this.gradientCanvas.height);
    this.gradientContext.fillStyle = gradient;
    this.gradientContext.fillRect(0, 0, this.gradientCanvas.width, this.gradientCanvas.height);
    this.gradientTexture.needsUpdate = true;
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
    this.material.dispose();
    this.geometry.dispose();
    this.gradientTexture.dispose();
    this.output.dispose();
  }
}
