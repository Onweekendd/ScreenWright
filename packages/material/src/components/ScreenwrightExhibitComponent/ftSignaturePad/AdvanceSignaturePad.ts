// @ts-check
import SignaturePad from "./signature_pad/index";

export class AdvanceSignaturePad {
  /**
   * @type {SignaturePad | null}
   */
  public signaturePad: SignaturePad | null = null;

  public undoData: any[] = [];

  /**
   * 当前加载的图片URL
   */
  public currentImageUrl: string | null = null;

  /**
   * 当前图片的属性
   */
  public currentImageProperties: {
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
    crossOrigin?: string;
  } | null = null;

  constructor(canvas: HTMLCanvasElement, options?: any, callBack?: () => void) {
    this.signaturePad = new SignaturePad(canvas, options);

    // 添加笔画结束事件监听，清空重做历史
    this.signaturePad.addEventListener("endStroke", () => {
      callBack && callBack();
      this.undoData = [];
    });
  }

  // /**
  //  * @param {HTMLCanvasElement} canvas
  //  * @param {Options} [options]
  //  */
  createNewSignaturePad(canvas: HTMLCanvasElement, options: any) {
    if (this.signaturePad) {
      this.signaturePad.off();
      this.signaturePad = null;
    }

    this.signaturePad = new SignaturePad(canvas, options);

    // 重新添加事件监听
    this.signaturePad.addEventListener("endStroke", () => {
      this.undoData = [];
    });
  }

  /**
   * 撤销上一笔
   * @returns {void}
   */
  undo() {
    if (!this.signaturePad || this.isEmpty()) return;

    const data = this.signaturePad.toData();
    if (data.length > 0) {
      const removed = data.pop();
      if (!removed) return;

      this.undoData.push(removed);
      this.signaturePad.clear();
      if (data.length > 0) {
        this.signaturePad.fromData(data);
      }
    }
  }

  /**
   * 重做上一笔
   * @returns {void}
   */
  redo() {
    if (!this.signaturePad || this.undoData.length === 0) return;

    const data = this.signaturePad.toData();
    const restored = this.undoData.pop();
    if (restored) {
      data.push(restored);
      this.signaturePad.fromData(data);
    }
  }

  /**
   * 检查是否可以撤销
   * @returns {boolean}
   */
  canUndo() {
    return !this.isEmpty();
  }

  /**
   * 检查是否可以重做
   * @returns {boolean}
   */
  canRedo() {
    return this.undoData.length > 0;
  }

  /**
   * 更新画布背景
   * @param {string} backgroundColor - 新的背景颜色
   */
  updateCanvasBackground(backgroundColor: string) {
    if (!this.signaturePad) return;

    // 保存当前数据
    const data = this.signaturePad.toData();

    // 清除画布并设置背景
    const ctx: any = this.signaturePad._ctx;
    const canvas = this.signaturePad.canvas;

    if (!ctx || !canvas || canvas.width === 0 || canvas.height === 0) return;

    // 先清除整个画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 设置背景色
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 更新 SignaturePad 的背景色属性
    this.signaturePad.backgroundColor = backgroundColor;

    // 重新绘制签名
    if (data.length > 0) {
      this.signaturePad.fromData(data);
    }
  }

  /**
   * 更新SignaturePad的配置选项
   * @param {Partial<Options>} options 要更新的选项
   */
  updateSignaturePadOptions(options: Partial<any>): void {
    if (!this.signaturePad) return;

    // 先处理背景色，因为它需要特殊处理
    if (options.backgroundColor && this.signaturePad._ctx) {
      this.updateCanvasBackground(options.backgroundColor);
    }

    // 更新其他属性
    const updatableProps = [
      "velocityFilterWeight",
      "minWidth",
      "maxWidth",
      "throttle",
      "minDistance",
      "dotSize",
      "penColor",
      "compositeOperation",
      "canvasContextOptions",
      "scale"
    ];

    // 遍历并更新属性
    for (const prop of updatableProps) {
      if (prop in options) {
        // @ts-ignore
        this.signaturePad[prop] = options[prop];
      }
    }

    // 如果有存储的图片，重新绘制
    if (this.currentImageProperties && this.signaturePad._ctx) {
      this.redrawStoredImage();
    }
  }

  /**
   * 重新绘制存储的图片
   */
  redrawStoredImage() {
    if (!this.currentImageProperties || !this.signaturePad || !this.signaturePad._ctx) return;

    const image = new Image();
    const props = this.currentImageProperties;
    const ctx: any = this.signaturePad._ctx;
    const canvas = this.signaturePad.canvas;

    // 设置跨域属性以避免canvas被污染
    if (props.crossOrigin) {
      image.crossOrigin = props.crossOrigin;
    }

    image.onload = () => {
      // 保存当前数据，包括撤销历史
      const data = this.signaturePad ? this.signaturePad.toData() : [];
      const undoDataBackup = [...this.undoData]; // 备份撤销历史

      // 先绘制背景
      if (ctx && this.signaturePad && canvas) {
        ctx.fillStyle = this.signaturePad.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制图片 - 这一操作不影响撤销历史
        ctx.drawImage(image, props.x, props.y, props.width, props.height);

        // 重新绘制签名数据
        if (data.length > 0 && this.signaturePad) {
          // 使用 clear:false 选项避免影响撤销历史
          this.signaturePad.fromData(data, { clear: false });
        }

        // 恢复撤销历史
        this.undoData = undoDataBackup;
      }
    };

    // 添加错误处理
    image.onerror = () => {
      console.warn("Failed to load image with CORS. Attempting without CORS.");
      // 尝试不使用跨域加载
      const fallbackImage = new Image();
      fallbackImage.onload = image.onload;
      fallbackImage.src = props.url;
    };

    image.src = props.url;
  }

  /**
   * 清空签名板
   */
  clear() {
    if (this.signaturePad) {
      this.signaturePad.clear();
      // 清除图片相关属性
      this.currentImageUrl = null;
      this.currentImageProperties = null;
    }
  }

  /**
   * 检查签名板是否为空
   * @returns {boolean} 是否为空
   */
  isEmpty() {
    return this.signaturePad ? this.signaturePad.isEmpty() : true;
  }

  /**
   * 获取签名数据的 URL
   * @param {'image/png'|'image/svg+xml'} [type='image/png'] - 图像类型
   * @param {number} [encoderOptions] - 编码选项
   * @returns {string} 数据 URL
   */
  toDataURL(type: "image/png" | "image/svg+xml" = "image/png", encoderOptions?: number) {
    return this.signaturePad ? this.signaturePad.toDataURL(type, encoderOptions) : "";
  }

  /**
   * 获取签名数据
   * @returns {PointGroup[]} 签名数据
   */
  toData() {
    return this.signaturePad ? this.signaturePad.toData() : [];
  }

  /**
   * 从数据加载签名
   * @param {PointGroup[]} data - 签名数据
   * @param {Object} [options] - 加载选项
   */
  fromData(data: any[], options?: { clear?: boolean }): void {
    if (this.signaturePad) {
      this.signaturePad.fromData(data, options);
    }
  }

  /**
   * 从 DataURL 加载签名
   * @param {string} dataUrl - 数据 URL
   * @param {Object} [options] - 加载选项
   * @returns {Promise<void>}
   */
  fromDataURL(dataUrl: string, options: any) {
    return this.signaturePad
      ? this.signaturePad.fromDataURL(dataUrl, options)
      : Promise.reject("SignaturePad not initialized");
  }
}
