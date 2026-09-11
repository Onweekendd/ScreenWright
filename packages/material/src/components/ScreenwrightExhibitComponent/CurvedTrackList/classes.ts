import { setMinioUrl } from "@screenwright/composables";
import * as THREE from "three";

import type { CarouselConfig, ImageItem, ImageMesh } from "./types";
import { mod } from "./utils";

/**
 * Shader 配置接口
 */
export interface ShaderConfig {
  vertexShader: string;
  fragmentShader: string;
}

/**
 * 动画状态类
 */
export class AnimationState {
  isAnimating = false;
  targetOffset = 0;
  currentVelocity = 0;
  startOffset = 0;

  reset() {
    this.isAnimating = false;
    this.targetOffset = 0;
    this.currentVelocity = 0;
    this.startOffset = 0;
  }
}

/**
 * 轮播轨道类
 */
export class Carousel {
  private group: THREE.Group;
  private images: ImageMesh[] = [];
  private config: CarouselConfig;
  private animationState: AnimationState;
  private currentScrollVelocity = 0;
  private selectedIndex: number = -1; // 当前选中的索引
  private totalHeight = 0;
  private shaderConfig: ShaderConfig;

  constructor(config: CarouselConfig, shaderConfig: ShaderConfig) {
    this.config = config;
    this.shaderConfig = shaderConfig;
    this.animationState = new AnimationState();
    this.group = new THREE.Group();
    this.group.position.set(
      config.position[0],
      config.position[1],
      config.position[2],
    );
  }

  /**
   * 创建纯色纹理
   */
  private createColorTexture(color: string): THREE.Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const texture = new THREE.CanvasTexture(canvas);
    texture.flipY = false;
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * 创建默认灰色纹理（非选中状态）
   */
  private createDefaultTexture(): THREE.Texture {
    return this.createColorTexture("#808080");
  }

  /**
   * 创建黄色纹理
   */
  private createYellowTexture(): THREE.Texture {
    return this.createColorTexture("#ffff00");
  }

  /**
   * 加载纹理
   */
  private loadTexture(url: string | null): Promise<THREE.Texture | null> {
    if (!url) {
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        url,
        (texture: THREE.Texture) => {
          texture.flipY = false;
          texture.needsUpdate = true;
          resolve(texture);
        },
        undefined,
        (error: unknown) => {
          console.error("Failed to load texture:", url, error);
          resolve(null);
        },
      );
    });
  }

  private async createPicUrl(url: string) {
    // let picUrl = "";
    const fileUrl = setMinioUrl(url);
    // const resp = await fetch(fileUrl);
    // if (!resp.ok) throw new Error(`fetch fail: ${resp.status}`);
    // const blob = await resp.blob();
    // // 可选：使用文件名
    // const fileName = url.split("/").pop() || "material";
    // const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
    // picUrl = URL.createObjectURL(file);
    return fileUrl;
  }

  /**
   * 创建图片网格
   */
  private async createImageMesh(
    imageItem: ImageItem | null,
    imageSize: [number, number],
    position: [number, number, number],
    curveStrength: number,
    curveFrequency: number,
    index: number,
  ): Promise<ImageMesh> {
    const geometry = new THREE.PlaneGeometry(1, 1, 16, 16);

    // 加载默认纹理和激活纹理
    let defaultTexture: THREE.Texture | null = null;
    let activeTexture: THREE.Texture | null = null;

    if (imageItem) {
      // 如果有图片项，检查是否有配置
      // 如果 defaultImage 有配置，加载图片；否则使用灰色纹理（非选中状态）
      if (imageItem.defaultImage) {
        const defaultUrl = await this.createPicUrl(imageItem.defaultImage);
        const defaultTextureResult = await this.loadTexture(defaultUrl);
        defaultTexture = defaultTextureResult || this.createDefaultTexture();
      } else {
        defaultTexture = this.createDefaultTexture();
      }

      // 如果 activeImage 有配置，加载图片；否则使用黄色纹理（选中状态）
      if (imageItem.activeImage) {
        const activeUrl = await this.createPicUrl(imageItem.activeImage);
        const activeTextureResult = await this.loadTexture(activeUrl);
        activeTexture = activeTextureResult || this.createYellowTexture();
      } else {
        activeTexture = this.createYellowTexture();
      }
    } else {
      // 如果没有图片项，使用灰色纹理（默认/非选中）和黄色纹理（选中）
      defaultTexture = this.createDefaultTexture();
      activeTexture = this.createYellowTexture();
    }

    // 获取当前使用的纹理（默认使用 defaultTexture）
    const currentTexture = defaultTexture;
    const imageWidth = (currentTexture.image as any).width || 1;
    const imageHeight = (currentTexture.image as any).height || 1;
    const imageSizes: [number, number] = [imageWidth, imageHeight];

    // 严格按照指定的尺寸显示（imageSize 已经是世界坐标单位，从px转换而来）
    const finalWidth = imageSize[0];
    const finalHeight = imageSize[1];

    const material = new THREE.ShaderMaterial({
      vertexShader: this.shaderConfig.vertexShader,
      fragmentShader: this.shaderConfig.fragmentShader,
      uniforms: {
        uTexture: { value: currentTexture },
        uScrollSpeed: { value: 0.0 },
        // 传递指定的平面尺寸（世界坐标单位，已从px转换）
        uPlaneSizes: { value: new THREE.Vector2(finalWidth, finalHeight) },
        // 传递图片原始尺寸（像素），用于shader中计算正确的UV映射
        uImageSizes: { value: new THREE.Vector2(imageWidth, imageHeight) },
        uCurveStrength: { value: curveStrength },
        uCurveFrequency: { value: curveFrequency },
      },
    });

    const mesh = new THREE.Mesh(geometry, material);
    // 使用指定的尺寸进行缩放
    mesh.scale.set(finalWidth, finalHeight, 1);
    mesh.position.set(position[0], position[1], position[2]);
    mesh.userData = { index };

    this.group.add(mesh);

    return {
      mesh,
      group: this.group,
      material,
      defaultTexture,
      activeTexture,
      imageSizes,
      isActive: false,
      index,
      imageItem, // 存储原始的图片项配置
    };
  }

  /**
   * 切换材质（选中/未选中）
   * 如果配置了图片，使用图片材质；如果没有配置，使用颜色材质（灰色/黄色）
   */
  private switchMaterial(imageMesh: ImageMesh, isActive: boolean): void {
    imageMesh.isActive = isActive;

    // 根据选中状态选择对应的纹理（在 createImageMesh 中已经根据配置创建好了）
    const targetTexture = isActive
      ? imageMesh.activeTexture
      : imageMesh.defaultTexture;

    if (targetTexture) {
      // 更新纹理
      imageMesh.material.uniforms.uTexture.value = targetTexture;
      // 更新图片尺寸
      const imageWidth = (targetTexture.image as any).width || 1;
      const imageHeight = (targetTexture.image as any).height || 1;
      imageMesh.material.uniforms.uImageSizes.value.set(
        imageWidth,
        imageHeight,
      );
      // 确保材质更新
      imageMesh.material.needsUpdate = true;
    }
  }

  /**
   * 初始化轮播，创建所有图片网格
   */
  async init(imageList: ImageItem[] | null | undefined): Promise<void> {
    // 以 images 的数组长度为准，如果数组没长度则不创建网格
    const count = imageList && imageList.length >= 1 ? imageList.length : 0;

    // 如果 count > 0，则 imageList 一定不为 null
    if (count === 0) {
      this.totalHeight = 0;
      this.updateCenterPosition();
      return;
    }

    for (let i = 0; i < count; i++) {
      const position: [number, number, number] = [
        0,
        i * (this.config.imageSize[1] + this.config.gap),
        0,
      ];
      const imageItem = imageList![i];
      const imageMesh = await this.createImageMesh(
        imageItem,
        this.config.imageSize,
        position,
        this.config.curveStrength,
        this.config.curveFrequency,
        i,
      );
      this.images.push(imageMesh);
    }

    // 计算总高度
    this.totalHeight = count * (this.config.gap + this.config.imageSize[1]);

    // 调整位置保证实时居中
    this.updateCenterPosition();
  }

  /**
   * 更新动画
   */
  update(velocity: number): void {
    // 如果只有一个 mesh，不需要滚动
    if (this.images.length <= 1) {
      // 确保滚动速度为 0
      this.images.forEach((img) => {
        img.material.uniforms.uScrollSpeed.value = 0;
      });
      this.currentScrollVelocity = 0;
      return;
    }

    // 处理点击动画：将选中的图片滚动到中心位置（Y = 0）
    if (this.animationState.isAnimating) {
      const remaining =
        this.animationState.targetOffset - this.animationState.startOffset;
      // 使用缓动函数，让动画更平滑（速度系数可以调整，值越大动画越快）
      const speed = remaining * 0.2;

      if (Math.abs(remaining) > 0.001) {
        // 所有图片同时移动，使得选中的图片逐渐移动到中心（Y = 0）
        this.images.forEach((img) => {
          img.mesh.position.y -= speed;
          img.material.uniforms.uScrollSpeed.value = speed;
        });
        this.animationState.startOffset += speed;
      } else {
        // 动画完成，确保精确到达目标位置
        const finalOffset =
          this.animationState.targetOffset - this.animationState.startOffset;
        if (Math.abs(finalOffset) > 0.0001) {
          this.images.forEach((img) => {
            img.mesh.position.y -= finalOffset;
          });
        }
        this.animationState.isAnimating = false;
        this.animationState.startOffset = this.animationState.targetOffset;
        // 重置滚动速度
        this.images.forEach((img) => {
          img.material.uniforms.uScrollSpeed.value = 0;
        });
      }
    } else {
      // 处理滚轮滚动
      if (Math.abs(velocity) > 0.001) {
        const scrollSpeed =
          ((velocity * 1 * this.config.wheelFactor) / 10) *
          this.config.wheelDirection;
        this.images.forEach((img) => {
          img.mesh.position.y -= scrollSpeed;
          img.material.uniforms.uScrollSpeed.value = scrollSpeed;
        });
      } else {
        // 逐渐减少滚动速度
        this.images.forEach((img) => {
          const currentSpeed = img.material.uniforms.uScrollSpeed.value;
          img.material.uniforms.uScrollSpeed.value = currentSpeed * 0.9;
          if (Math.abs(img.material.uniforms.uScrollSpeed.value) < 0.001) {
            img.material.uniforms.uScrollSpeed.value = 0;
          }
        });
      }
    }

    // 处理循环定位
    this.images.forEach((img) => {
      img.mesh.position.y =
        mod(img.mesh.position.y + this.totalHeight / 2, this.totalHeight) -
        this.totalHeight / 2;
    });

    // 逐帧衰减滚动速度
    this.currentScrollVelocity *= 0.92;
    if (Math.abs(this.currentScrollVelocity) < 0.001) {
      this.currentScrollVelocity = 0;
    }
  }

  /**
   * 处理滚轮事件
   */
  handleWheel(deltaY: number): void {
    // 如果只有一个 mesh，不需要滚动
    if (this.images.length <= 1) {
      return;
    }
    this.currentScrollVelocity += deltaY * 0.002;
  }

  /**
   * 处理图片点击
   */
  handleImageClick(clickedMesh: THREE.Mesh): void {
    const index = clickedMesh.userData.index;
    let disabled = false;
    if (this.images[index].imageItem) {
      disabled = this.images[index].imageItem.disabled;
    }
    if (disabled) {
      return;
    }
    if (index !== undefined && index >= 0 && index < this.images.length) {
      console.log(
        "点击了图片，索引:",
        index,
        "当前Y位置:",
        clickedMesh.position.y,
      );

      // 取消之前选中的材质
      if (this.selectedIndex >= 0 && this.selectedIndex < this.images.length) {
        this.switchMaterial(this.images[this.selectedIndex], false);
      }

      // 设置新的选中索引
      this.selectedIndex = index;

      // 切换当前点击的材质为激活状态
      this.switchMaterial(this.images[this.selectedIndex], true);
      console.log("已切换材质为激活状态，索引:", this.selectedIndex);

      // 如果只有一个 mesh，不需要滚动动画（已经在中心了）
      if (this.images.length <= 1) {
        // 调用回调
        if (this.config.onImageClick) {
          this.config.onImageClick(this.images[index], index);
        }
        return;
      }

      // 执行滚动动画：让选中的图片滚动到中心位置（Y = 0）
      const currentY = clickedMesh.position.y;
      // 要让图片移动到中心（Y = 0），需要移动 currentY 的距离
      // targetOffset 表示需要移动的总距离
      this.animationState.isAnimating = true;
      this.animationState.targetOffset = currentY; // 目标偏移量：需要移动的距离
      this.animationState.startOffset = 0; // 起始偏移量：当前已移动的距离（从0开始）
      console.log(
        "启动滚动动画，目标偏移量:",
        this.animationState.targetOffset,
      );

      // 调用回调
      if (this.config.onImageClick) {
        // 这里可以传递更多信息，暂时传递索引
        this.config.onImageClick(this.images[index], index);
      }
    }
  }

  /**
   * 获取所有网格（用于射线检测）
   */
  getMeshes(): THREE.Mesh[] {
    return this.images.map((img) => img.mesh);
  }

  /**
   * 获取当前滚动速度
   */
  getScrollVelocity(): number {
    return this.currentScrollVelocity;
  }

  /**
   * 获取 Three.js Group
   */
  getGroup(): THREE.Group {
    return this.group;
  }

  /**
   * 更新图片列表（重新加载所有图片）
   */
  async updateImages(imageList: ImageItem[] | null | undefined): Promise<void> {
    // 清理旧的图片资源
    this.images.forEach((img) => {
      if (img.defaultTexture) {
        img.defaultTexture.dispose();
      }
      if (img.activeTexture) {
        img.activeTexture.dispose();
      }
      img.material.dispose();
      img.mesh.geometry.dispose();
      this.group.remove(img.mesh);
    });
    this.images = [];
    this.selectedIndex = -1;

    // 以 images 的数组长度为准，如果数组没长度则不创建网格
    const count = imageList && imageList.length >= 1 ? imageList.length : 0;

    // 如果 count > 0，则 imageList 一定不为 null
    if (count === 0) {
      this.totalHeight = 0;
      this.updateCenterPosition();
      return;
    }

    // 重新创建所有图片网格
    for (let i = 0; i < count; i++) {
      const position: [number, number, number] = [
        0,
        i * (this.config.imageSize[1] + this.config.gap),
        0,
      ];
      const imageItem = imageList![i];
      const imageMesh = await this.createImageMesh(
        imageItem,
        this.config.imageSize,
        position,
        this.config.curveStrength,
        this.config.curveFrequency,
        i,
      );
      this.images.push(imageMesh);
    }

    // 重新计算总高度
    this.totalHeight = count * (this.config.gap + this.config.imageSize[1]);

    // 调整位置保证实时居中
    this.updateCenterPosition();
  }

  /**
   * 更新图片尺寸
   */
  async updateImageSize(
    imageSize: [number, number],
    gap: number,
  ): Promise<void> {
    // 更新配置
    this.config.imageSize = imageSize;
    this.config.gap = gap;

    // 更新每个图片网格的尺寸
    for (let i = 0; i < this.images.length; i++) {
      const img = this.images[i];
      const position: [number, number, number] = [
        0,
        i * (imageSize[1] + gap),
        0,
      ];

      // 更新材质中的尺寸uniform
      img.material.uniforms.uPlaneSizes.value.set(imageSize[0], imageSize[1]);

      // 更新网格缩放
      img.mesh.scale.set(imageSize[0], imageSize[1], 1);

      // 更新位置
      img.mesh.position.set(position[0], position[1], position[2]);
    }

    // 重新计算总高度
    this.totalHeight = this.images.length * (gap + imageSize[1]);

    // 调整位置保证实时居中
    this.updateCenterPosition();
  }

  /**
   * 更新中心位置，保证轨道实时居中
   */
  private updateCenterPosition(): void {
    this.group.position.y = 0;
  }

  /**
   * 更新配置（弧形、滚轮等属性）
   */
  updateConfig(config: Partial<CarouselConfig>): void {
    // 更新配置对象
    Object.assign(this.config, config);

    // 更新弧形相关uniform
    if (
      config.curveStrength !== undefined ||
      config.curveFrequency !== undefined
    ) {
      this.images.forEach((img) => {
        if (config.curveStrength !== undefined) {
          img.material.uniforms.uCurveStrength.value = config.curveStrength;
        }
        if (config.curveFrequency !== undefined) {
          img.material.uniforms.uCurveFrequency.value = config.curveFrequency;
        }
      });
    }

    // 更新回调函数
    if (config.onImageClick !== undefined) {
      this.config.onImageClick = config.onImageClick;
    }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.images.forEach((img) => {
      if (img.defaultTexture) {
        img.defaultTexture.dispose();
      }
      if (img.activeTexture) {
        img.activeTexture.dispose();
      }
      img.material.dispose();
      img.mesh.geometry.dispose();
    });
    this.images = [];
    this.selectedIndex = -1;
    this.animationState.reset();
  }
}

/**
 * 主渲染器类
 */
export class CurvedTrackRenderer {
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private carousel: Carousel | null = null;
  private animationFrameId: number | null = null;
  private canvas: HTMLCanvasElement;
  private resizeObserver: ResizeObserver | null = null;
  private disabledScroll: boolean;
  private shaderConfig: ShaderConfig;

  // 事件处理函数绑定（用于移除监听器）
  private boundHandleResize = () => this.handleResize();
  private boundHandleWheel = (event: WheelEvent) => this.handleWheel(event);
  private boundHandleClick = (event: MouseEvent) =>
    this.handleImageClick(event);

  constructor(
    canvas: HTMLCanvasElement,
    shaderConfig: ShaderConfig,
    disabledScroll: boolean = false,
  ) {
    this.canvas = canvas;
    this.shaderConfig = shaderConfig;
    this.disabledScroll = disabledScroll;
  }

  /**
   * 初始化 Three.js 场景
   */
  async init(
    config: CarouselConfig,
    imageList: ImageItem[] | null | undefined,
  ): Promise<void> {
    // 创建场景
    this.scene = new THREE.Scene();

    // 获取容器尺寸
    const parent = (this.canvas.parentElement || this.canvas) as HTMLElement;
    const width = parent.offsetWidth || window.innerWidth;
    const height = parent.offsetHeight || window.innerHeight;

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 3);

    // 创建渲染器，设置背景透明
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true, // 启用透明背景
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // 设置渲染器背景为透明
    this.renderer.setClearColor(0x000000, 0); // 黑色，透明度为0（完全透明）

    // 创建轮播轨道
    this.carousel = new Carousel(config, this.shaderConfig);
    await this.carousel.init(imageList);
    const carouselGroup = this.carousel.getGroup();
    carouselGroup.position.set(0, 0, 0);
    this.scene.add(carouselGroup);

    // 启动动画循环
    this.animate();

    // 监听事件
    this.setupEventListeners(parent);
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(parent: HTMLElement): void {
    window.addEventListener("resize", this.boundHandleResize);
    // 在 canvas 上监听滚轮事件，只有悬停在 canvas 上时才响应
    this.canvas.addEventListener("wheel", this.boundHandleWheel, {
      passive: true,
    });
    // 直接在 canvas 上监听点击事件
    this.canvas.addEventListener("click", this.boundHandleClick);
    console.log("事件监听器已绑定，canvas:", this.canvas);

    // 监听容器尺寸变化
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(parent);
    // 存储 observer 引用以便清理
    const canvasWithObserver = this.canvas as HTMLCanvasElement & {
      __resizeObserver__?: ResizeObserver;
    };
    canvasWithObserver.__resizeObserver__ = this.resizeObserver;
  }

  /**
   * 动画循环
   */
  private animate = (): void => {
    if (!this.renderer || !this.scene || !this.camera || !this.carousel) {
      return;
    }

    const velocity = this.carousel.getScrollVelocity();
    this.carousel.update(velocity);

    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  /**
   * 处理窗口/容器大小变化
   */
  private handleResize(): void {
    if (!this.camera || !this.renderer || !this.canvas) {
      return;
    }
    const parent = (this.canvas.parentElement || this.canvas) as HTMLElement;
    const width = parent.offsetWidth || 1;
    const height = parent.offsetHeight || 1;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * 处理滚轮事件
   */
  private handleWheel(event: WheelEvent): void {
    if (this.disabledScroll || !this.carousel) {
      return;
    }
    this.carousel.handleWheel(event.deltaY);
  }

  /**
   * 处理图片点击事件
   */
  private handleImageClick(event: MouseEvent): void {
    console.log("Canvas 点击事件触发", event);

    if (!this.camera || !this.renderer || !this.carousel) {
      console.log("点击事件处理失败：缺少必要对象", {
        camera: !!this.camera,
        renderer: !!this.renderer,
        carousel: !!this.carousel,
      });
      return;
    }

    // 获取 canvas 的边界矩形，用于计算正确的鼠标坐标
    const rect = this.canvas.getBoundingClientRect();
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // 计算相对于 canvas 的标准化设备坐标
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    console.log("鼠标坐标:", {
      x: mouse.x,
      y: mouse.y,
      clientX: event.clientX,
      clientY: event.clientY,
    });

    raycaster.setFromCamera(mouse, this.camera);
    const allMeshes = this.carousel.getMeshes();
    console.log("检测网格数量:", allMeshes.length);

    const intersects = raycaster.intersectObjects(allMeshes, false);
    console.log("射线检测结果:", intersects.length, intersects);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object as THREE.Mesh;
      console.log("点击到网格，调用 carousel.handleImageClick");
      this.carousel.handleImageClick(clickedMesh);
    } else {
      console.log("未检测到网格交点");
    }
  }

  /**
   * 更新禁用滚动状态
   */
  updateDisabledScroll(disabled: boolean): void {
    this.disabledScroll = disabled;
  }

  /**
   * 更新图片列表（重新加载所有图片）
   */
  async updateImages(imageList: ImageItem[] | null | undefined): Promise<void> {
    if (!this.carousel) {
      return;
    }
    await this.carousel.updateImages(imageList);
  }

  /**
   * 更新图片尺寸
   */
  async updateImageSize(
    imageSize: [number, number],
    gap: number,
  ): Promise<void> {
    if (!this.carousel) {
      return;
    }
    await this.carousel.updateImageSize(imageSize, gap);
  }

  /**
   * 更新配置（弧形、滚轮等属性）
   */
  updateConfig(config: Partial<CarouselConfig>): void {
    if (!this.carousel) {
      return;
    }
    this.carousel.updateConfig(config);
  }

  /**
   * 清理资源
   */
  dispose(): void {
    // 停止动画循环
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // 清理轮播资源
    if (this.carousel) {
      this.carousel.dispose();
      this.carousel = null;
    }

    // 清理渲染器
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    // 移除事件监听
    window.removeEventListener("resize", this.boundHandleResize);
    // 从 canvas 上移除滚轮和点击事件监听
    if (this.canvas) {
      this.canvas.removeEventListener("wheel", this.boundHandleWheel);
      this.canvas.removeEventListener("click", this.boundHandleClick);
      console.log("已移除 canvas 事件监听");
    }

    // 移除 ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    const canvasWithObserver = this.canvas as HTMLCanvasElement & {
      __resizeObserver__?: ResizeObserver;
    };
    if (canvasWithObserver && canvasWithObserver.__resizeObserver__) {
      delete canvasWithObserver.__resizeObserver__;
    }

    this.scene = null;
    this.camera = null;
  }
}
