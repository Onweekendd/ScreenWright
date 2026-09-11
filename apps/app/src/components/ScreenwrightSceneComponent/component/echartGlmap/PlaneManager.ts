import * as THREE from "three";

import { setMinioUrl } from "@/utils/config";

// import { getPointByProj4 } from "../echartcommonMap/utils";

export interface PlaneData {
  position?: [number, number];
  [key: string]: any;
}

export interface PlaneItemOption {
  id?: string;
  name?: string;
  visible?: boolean;
  coordinateSystem?: "3D" | "GIS";
  sizeWidth?: number;
  sizeHeight?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  fillMode?: "color" | "picture";
  textureUrl?: string;
  tintColor?: any;
  tintOpacity?: number;
  doubleSide?: boolean;
  depthTest?: boolean;
  transparent?: boolean;
  blending?: "NormalBlending" | "AdditiveBlending" | "SubtractiveBlending" | "MultiplyBlending";
  depthWrite?: boolean;
  opacity?: number;
  renderOrder?: number;
  animationType?: "none" | "rotate" | "spread" | "custom";
  rotateSpeed?: number;
  rotateDirection?: 1 | -1;
  spreadSpeed?: number;
  spreadInterval?: number;
  uvScaleX?: number;
  uvScaleY?: number;
  uvOffsetX?: number;
  uvOffsetY?: number;
  uvRotation?: number;
}

export interface PlaneOption extends PlaneItemOption {
  planeList?: PlaneItemOption[];
}

export class PlaneManager {
  private scene: THREE.Scene;
  private planesMap: Map<string, THREE.Group> = new Map();
  private textureLoader: THREE.TextureLoader;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.textureLoader = new THREE.TextureLoader();
  }

  private getHexColor(color: any) {
    if (typeof color === "string") return color;
    if (color && color.colors && color.colors.length > 0) {
      return color.colors[0].color;
    }
    return "#ffffff";
  }

  public update(
    id: string,
    visible: boolean,
    option: PlaneOption,
    mapParams: { centerX: number; centerY: number; scale: number; baseHeight: number; mapGroup: THREE.Group | null }
  ) {
    // 仅移除当前 ID 对应的面片组
    this.remove(id);

    const planeGroup = new THREE.Group();
    planeGroup.name = `planeGroup_${id}`;
    planeGroup.visible = visible;
    this.planesMap.set(id, planeGroup);

    if (mapParams.mapGroup) {
      mapParams.mapGroup.add(planeGroup);
    } else {
      this.scene.add(planeGroup);
    }

    // 处理多面片还是单面片
    const planeList = option.planeList && option.planeList.length > 0 ? option.planeList : [option];

    planeList.forEach((itemOption, index) => {
      const {
        visible = true, // Default to true if not specified
        sizeWidth = 100,
        sizeHeight = 100,
        position = [0, 0, 0],
        rotation = [0, 0, 0],
        fillMode = "color",
        textureUrl = "",
        tintColor = "#ffffff",
        tintOpacity = 100,
        doubleSide = true,
        depthTest = true,
        transparent = true,
        blending = "NormalBlending",
        depthWrite = false,
        opacity = 100,
        renderOrder = 10,
        animationType = "none",
        rotateSpeed = 0,
        rotateDirection = 1,
        spreadSpeed = 0,
        spreadInterval = 0,
        uvScaleX = 1,
        uvScaleY = 1,
        uvOffsetX = 0,
        uvOffsetY = 0,
        uvRotation = 0
      } = itemOption;

      // const { centerX, centerY, scale, baseHeight } = mapParams;
      const color = new THREE.Color(this.getHexColor(tintColor));
      const blendMode = (THREE as any)[blending] || THREE.NormalBlending;

      // 使用固定的逻辑缩放系数，使 100 约等于地图宽度的 10%
      const unitScale = 0.005;
      const [offsetX, offsetY, offsetZ] = position || [0, 0, 0];
      const [rotationX, rotationY, rotationZ] = rotation || [0, 0, 0];

      const geometry = new THREE.PlaneGeometry(sizeWidth * unitScale, sizeHeight * unitScale);

      let material: THREE.Material;
      const commonProps = {
        color: color,
        opacity: (opacity / 100) * (tintOpacity / 100),
        transparent: transparent,
        side: doubleSide ? THREE.DoubleSide : THREE.FrontSide,
        depthTest: depthTest,
        depthWrite: depthWrite,
        blending: blendMode,
        premultipliedAlpha: true, // 必须设置为 true，否则会报错
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1 - index // 每个面片稍微偏移一点，防止重叠
      };

      if (fillMode === "picture" && textureUrl) {
        const url = setMinioUrl(textureUrl);
        const isVideo = url.match(/\.(mp4|webm|ogv)(\?.*)?$/i);
        let texture: THREE.Texture;

        if (isVideo) {
          const video = document.createElement("video");
          video.src = url;
          video.loop = true;
          video.muted = true;
          video.autoplay = true;
          video.setAttribute("webkit-playsinline", "true");
          video.setAttribute("playsinline", "true");
          video.crossOrigin = "anonymous";
          video.play().catch((err) => {
            console.warn("面片视频自动播放受限:", err);
          });
          texture = new THREE.VideoTexture(video);
        } else {
          texture = this.textureLoader.load(url);
        }

        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(uvScaleX, uvScaleY);
        texture.offset.set(uvOffsetX, uvOffsetY);
        texture.rotation = THREE.MathUtils.degToRad(uvRotation);
        material = new THREE.MeshBasicMaterial({
          ...commonProps,
          map: texture
        });
      } else {
        material = new THREE.MeshBasicMaterial(commonProps);
      }

      const mesh = new THREE.Mesh(geometry, material);
      (mesh as any).visible = visible; // Apply visibility
      (mesh as any).isPlane = true;
      mesh.renderOrder = renderOrder;

      // 计算基准位置
      const basePos = new THREE.Vector3(0, 0, 0);
      // 后续可扩展 GIS 支持

      // 偏移量应用逻辑缩放
      mesh.position.set(
        basePos.x + offsetX * unitScale,
        basePos.y + offsetY * unitScale,
        basePos.z + offsetZ * unitScale + 0.001 + index * 0.0001
      );

      // 设置旋转 (角度转弧度)
      mesh.rotation.set(
        THREE.MathUtils.degToRad(rotationX),
        THREE.MathUtils.degToRad(rotationY),
        THREE.MathUtils.degToRad(rotationZ)
      );

      // 存储动画参数
      mesh.userData.animation = {
        animationType,
        rotateSpeed: rotateSpeed * 0.05,
        rotateDirection,
        spreadSpeed: spreadSpeed * 0.01,
        spreadInterval: spreadInterval * 60,
        waitingFrames: 0,
        baseOpacity: (opacity / 100) * (tintOpacity / 100)
      };

      planeGroup.add(mesh);
    });
  }

  public animate() {
    // 遍历所有生效的组
    this.planesMap.forEach((group) => {
      group.children.forEach((obj: any) => {
        if (obj instanceof THREE.Mesh && obj.userData.animation) {
          const { animationType, rotateSpeed, rotateDirection, spreadSpeed } = obj.userData.animation;
          if (animationType === "rotate" && rotateSpeed > 0) {
            // 绕 Z 轴中心旋转 (面片平面内旋转)
            obj.rotation.z += rotateSpeed * rotateDirection;
          } else if (animationType === "spread" && spreadSpeed > 0) {
            // 中心扩散：从 0 到 1 循环缩放
            if (obj.userData.animation.waitingFrames > 0) {
              obj.userData.animation.waitingFrames--;
              obj.scale.set(0, 0, 1);
            } else {
              obj.scale.x += spreadSpeed;
              obj.scale.y += spreadSpeed;

              // 根据 scale 计算透明度：0->0.5 (淡入), 0.5->1.0 (淡出)
              if (obj.material) {
                const s = obj.scale.x;
                const baseOpacity = obj.userData.animation.baseOpacity ?? 1;
                let targetOpacity = 0;

                if (s <= 0.5) {
                  // 0 -> 0.5: 0 -> baseOpacity
                  targetOpacity = baseOpacity * (s / 0.5);
                } else {
                  // 0.5 -> 1.0: baseOpacity -> 0
                  targetOpacity = baseOpacity * (1 - (s - 0.5) / 0.5);
                }
                obj.material.opacity = Math.max(0, Math.min(baseOpacity, targetOpacity));
              }

              if (obj.scale.x > 1.0) {
                obj.scale.set(0, 0, 1);
                obj.userData.animation.waitingFrames = obj.userData.animation.spreadInterval;
              }
            }
          }
        }
      });
    });
  }

  public remove(id: string) {
    const group = this.planesMap.get(id);
    if (group) {
      if (group.parent) {
        group.parent.remove(group);
      }
      group.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          materials.forEach((m: any) => {
            if (m.map) {
              // 如果是视频贴图，需要停止视频播放并释放资源
              if (m.map instanceof THREE.VideoTexture && m.map.image instanceof HTMLVideoElement) {
                const video = m.map.image;
                video.pause();
                video.src = "";
                video.load();
              }
              m.map.dispose();
            }
            m.dispose();
          });
        }
      });
      this.planesMap.delete(id);
    }
  }

  public dispose() {
    this.planesMap.forEach((_, id) => {
      this.remove(id);
    });
    this.planesMap.clear();
  }
}
