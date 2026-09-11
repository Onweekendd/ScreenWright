// @ts-check
import Bezier from "./bezier";
import Point from "./point";
import SignatureEventTarget from "./signature_event_target";
import throttle from "./throttle";
import type { FromDataOptions, Options, PointGroup, PointGroupOptions, SignatureEvent, ToSVGOptions } from "./type";

class SignaturePad extends SignatureEventTarget {
  /** 画布元素 */
  canvas: HTMLCanvasElement;

  /** 画布上下文 */
  _ctx: CanvasRenderingContext2D | null;

  /** 是否正在绘制笔画 */
  _drawingStroke: boolean;

  /** 画布是否为空 */
  _isEmpty: boolean;

  /** 最后的点集合 */
  _lastPoints: Point[];

  /** 数据集合 */
  _data: PointGroup[];

  /** 最后的速度 */
  _lastVelocity: number;

  /** 最后的宽度 */
  _lastWidth: number;

  /** 笔画移动更新函数 */
  _strokeMoveUpdate: (event: SignatureEvent) => void;

  /**
   * 处理鼠标按下事件
   * @param event - 鼠标事件
   */
  _handleMouseDown = (event: Event) => {
    const mouseEvent = event as MouseEvent;
    if (!this._isLeftButtonPressed(mouseEvent, true) || this._drawingStroke) {
      return;
    }
    this._strokeBegin(this._pointerEventToSignatureEvent(mouseEvent));
  };

  /**
   * 处理鼠标移动事件
   * @param event - 鼠标事件
   */
  _handleMouseMove = (event: Event) => {
    const mouseEvent = event as MouseEvent;
    if (!this._isLeftButtonPressed(mouseEvent, true) || !this._drawingStroke) {
      this._strokeEnd(this._pointerEventToSignatureEvent(mouseEvent), false);
      return;
    }
    this._strokeMoveUpdate(this._pointerEventToSignatureEvent(mouseEvent));
  };

  /**
   * 处理鼠标抬起事件
   * @param event - 鼠标事件
   */
  _handleMouseUp = (event: Event) => {
    const mouseEvent = event as MouseEvent;
    if (this._isLeftButtonPressed(mouseEvent)) {
      return;
    }
    this._strokeEnd(this._pointerEventToSignatureEvent(mouseEvent));
  };

  /**
   * 处理触摸开始事件
   * @param event - 触摸事件
   */
  _handleTouchStart = (event: Event) => {
    const touchEvent = event as TouchEvent;
    if (touchEvent.targetTouches.length !== 1 || this._drawingStroke) {
      return;
    }
    if (touchEvent.cancelable) {
      touchEvent.preventDefault();
    }
    this._strokeBegin(this._touchEventToSignatureEvent(touchEvent));
  };

  /**
   * 处理触摸移动事件
   * @param event - 触摸事件
   */
  _handleTouchMove = (event: Event) => {
    const touchEvent = event as TouchEvent;
    if (touchEvent.targetTouches.length !== 1) {
      return;
    }
    if (touchEvent.cancelable) {
      touchEvent.preventDefault();
    }
    if (!this._drawingStroke) {
      this._strokeEnd(this._touchEventToSignatureEvent(touchEvent), false);
      return;
    }
    this._strokeMoveUpdate(this._touchEventToSignatureEvent(touchEvent));
  };

  /**
   * 处理触摸结束事件
   * @param event - 触摸事件
   */
  _handleTouchEnd = (event: Event) => {
    const touchEvent = event as TouchEvent;
    if (touchEvent.targetTouches.length !== 0) {
      return;
    }
    if (touchEvent.cancelable) {
      touchEvent.preventDefault();
    }
    this.canvas.removeEventListener("touchmove", this._handleTouchMove);
    this._strokeEnd(this._touchEventToSignatureEvent(touchEvent));
  };

  /**
   * 处理指针按下事件
   * @param event - 指针事件
   */
  _handlePointerDown = (event: Event) => {
    const pointerEvent = event as PointerEvent;
    if (!pointerEvent.isPrimary || !this._isLeftButtonPressed(pointerEvent) || this._drawingStroke) {
      return;
    }
    pointerEvent.preventDefault();
    this._strokeBegin(this._pointerEventToSignatureEvent(pointerEvent));
  };

  /**
   * 处理指针移动事件
   * @param event - 指针事件
   */
  _handlePointerMove = (event: Event) => {
    const pointerEvent = event as PointerEvent;
    if (!pointerEvent.isPrimary) {
      return;
    }
    if (!this._isLeftButtonPressed(pointerEvent, true) || !this._drawingStroke) {
      this._strokeEnd(this._pointerEventToSignatureEvent(pointerEvent), false);
      return;
    }
    pointerEvent.preventDefault();
    this._strokeMoveUpdate(this._pointerEventToSignatureEvent(pointerEvent));
  };

  /**
   * 处理指针抬起事件
   * @param event - 指针事件
   */
  _handlePointerUp = (event: Event) => {
    const pointerEvent = event as PointerEvent;
    if (!pointerEvent.isPrimary || this._isLeftButtonPressed(pointerEvent)) {
      return;
    }
    pointerEvent.preventDefault();
    this._strokeEnd(this._pointerEventToSignatureEvent(pointerEvent));
  };
  /** 缩放比例 */
  scale: number;

  /** 速度过滤权重 */
  velocityFilterWeight: number;

  /** 最小宽度 */
  minWidth: number;

  /** 最大宽度 */
  maxWidth: number;

  /** 节流时间 */
  throttle: number;

  /** 最小距离 */
  minDistance: number;

  /** 点的大小 */
  dotSize: number;

  /** 画笔颜色 */
  penColor: string;

  /** 背景颜色 */
  backgroundColor: string;

  /** 全局合成操作 */
  compositeOperation: GlobalCompositeOperation;

  /** Canvas上下文选项 */
  canvasContextOptions: CanvasRenderingContext2DSettings;

  /**
   * 创建一个新的签名板实例
   * @param canvas - Canvas元素
   * @param options - 签名板选项
   */
  constructor(canvas: HTMLCanvasElement, options: Options = {}) {
    super();
    this.canvas = canvas;
    this._drawingStroke = false;
    this._isEmpty = true;
    this._lastPoints = [];
    this._data = [];
    this._lastVelocity = 0;
    this._lastWidth = 0;

    this.velocityFilterWeight = options.velocityFilterWeight || 0.7;
    this.minWidth = options.minWidth || 0.5;
    this.maxWidth = options.maxWidth || 2.5;
    this.throttle = options.throttle ?? 16;
    this.scale = options.scale || 1;
    this.minDistance = options.minDistance ?? 5;
    this.dotSize = options.dotSize || 0;
    this.penColor = options.penColor || "black";
    this.backgroundColor = options.backgroundColor || "rgba(0,0,0,0)";
    this.compositeOperation = options.compositeOperation || "source-over";
    this.canvasContextOptions = options.canvasContextOptions ?? {};

    // 创建节流函数
    this._strokeMoveUpdate = this.throttle
      ? throttle(this._strokeUpdate.bind(this), this.throttle)
      : this._strokeUpdate.bind(this);

    this._ctx = canvas.getContext("2d", this.canvasContextOptions);
    this.clear();
    this.on();
  }

  /**
   * 清除画布内容
   */
  clear(): void {
    const { _ctx: ctx, canvas } = this;
    if (ctx) {
      if (canvas.width === 0 || canvas.height === 0) return;
      ctx.fillStyle = this.backgroundColor;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    this._data = [];
    this._reset(this._getPointGroupOptions());
    this._isEmpty = true;
  }

  /**
   * 从DataURL加载图像到画布
   * @param dataUrl - 数据URL
   * @param options - 加载选项
   * @returns Promise对象
   */
  fromDataURL(
    dataUrl: string,
    options: {
      ratio?: number;
      width?: number;
      height?: number;
      xOffset?: number;
      yOffset?: number;
    } = {}
  ): Promise<Event> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const ratio = options.ratio || window.devicePixelRatio || 1;
      const width = options.width || this.canvas.width / ratio;
      const height = options.height || this.canvas.height / ratio;
      const xOffset = options.xOffset || 0;
      const yOffset = options.yOffset || 0;
      this._reset(this._getPointGroupOptions());
      image.onload = (res) => {
        if (this._ctx) {
          this._ctx.drawImage(image, xOffset, yOffset, width, height);
        }
        resolve(res);
      };
      image.onerror = (error) => {
        reject(error);
      };
      image.crossOrigin = "anonymous";
      image.src = dataUrl;
      this._isEmpty = false;
    });
  }

  /**
   * 将画布内容转换为DataURL
   * @param type - 图像类型
   * @param encoderOptions - 编码选项
   * @returns DataURL字符串
   */
  toDataURL(type: "image/png" | "image/svg+xml" = "image/png", encoderOptions?: number | ToSVGOptions): string {
    switch (type) {
      case "image/svg+xml":
        if (typeof encoderOptions !== "object") {
          encoderOptions = undefined;
        }
        return `data:image/svg+xml;base64,${btoa(this.toSVG(encoderOptions))}`;
      default:
        if (typeof encoderOptions !== "number") {
          encoderOptions = undefined;
        }

        return this.canvas.toDataURL(type, encoderOptions);
    }
  }

  /**
   * 启用签名板
   */
  on(): void {
    this.canvas.style.touchAction = "none";
    // 使用标准属性替代msTouchAction
    this.canvas.style.touchAction = "none";
    this.canvas.style.userSelect = "none";
    const isIOS = /Macintosh/.test(navigator.userAgent) && "ontouchstart" in document;
    if (window.PointerEvent && !isIOS) {
      this._handlePointerEvents();
    } else {
      this._handleMouseEvents();
      if ("ontouchstart" in window) {
        this._handleTouchEvents();
      }
    }
  }

  /**
   * 禁用签名板
   */
  off(): void {
    this.canvas.style.touchAction = "auto";
    // 使用标准属性替代msTouchAction
    this.canvas.style.touchAction = "auto";
    this.canvas.style.userSelect = "auto";
    this.canvas.removeEventListener("pointerdown", this._handlePointerDown);
    this.canvas.removeEventListener("mousedown", this._handleMouseDown);
    this.canvas.removeEventListener("touchstart", this._handleTouchStart);
    this._removeMoveUpEventListeners();
  }

  /**
   * 获取监听器函数
   * @private
   * @returns 监听器函数对象
   */
  _getListenerFunctions(): {
    addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
    removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
  } {
    const canvasWindow =
      window.document === this.canvas.ownerDocument
        ? window
        : (this.canvas.ownerDocument.defaultView ?? this.canvas.ownerDocument);
    return {
      addEventListener: canvasWindow.addEventListener.bind(canvasWindow),
      removeEventListener: canvasWindow.removeEventListener.bind(canvasWindow)
    };
  }

  /**
   * 移除移动和抬起事件监听器
   * @private
   */
  _removeMoveUpEventListeners(): void {
    const { removeEventListener } = this._getListenerFunctions();
    removeEventListener("pointermove", this._handlePointerMove);
    removeEventListener("pointerup", this._handlePointerUp);
    removeEventListener("mousemove", this._handleMouseMove);
    removeEventListener("mouseup", this._handleMouseUp);
    removeEventListener("touchmove", this._handleTouchMove);
    removeEventListener("touchend", this._handleTouchEnd);
  }

  /**
   * 检查画布是否为空
   * @returns 如果画布为空则返回true
   */
  isEmpty(): boolean {
    return this._isEmpty;
  }

  /**
   * 从点组数据加载签名
   * @param pointGroups - 点组数据
   * @param options - 加载选项
   */
  fromData(pointGroups: PointGroup[], options: FromDataOptions = { clear: true }): void {
    const { clear = true } = options;
    if (clear) {
      this.clear();
    }

    this._fromData(pointGroups, this._drawCurve.bind(this), this._drawDot.bind(this));
    this._data = this._data.concat(pointGroups);
  }

  /**
   * 将签名转换为点组数据
   * @returns 点组数据
   */
  toData(): PointGroup[] {
    return this._data;
  }

  /**
   * 检查是否按下鼠标左键
   * @private
   * @param event - 鼠标事件
   * @param only - 是否只检查左键
   * @returns 如果按下左键则返回true
   */
  _isLeftButtonPressed(event: MouseEvent | PointerEvent, only?: boolean): boolean {
    if (only) {
      return event.buttons === 1;
    }
    return (event.buttons & 1) === 1;
  }

  /**
   * 将指针事件转换为签名事件
   * @private
   * @param event - 指针事件
   * @returns 签名事件
   */
  _pointerEventToSignatureEvent(event: PointerEvent | MouseEvent): SignatureEvent {
    return {
      event: event,
      type: event.type,
      x: event.clientX,
      y: event.clientY,
      pressure: "pressure" in event ? event.pressure : 0
    };
  }

  /**
   * 将触摸事件转换为签名事件
   * @private
   * @param event - 触摸事件
   * @returns 签名事件
   */
  _touchEventToSignatureEvent(event: TouchEvent): SignatureEvent {
    const touch = event.changedTouches[0];
    return {
      event: event,
      type: event.type,
      x: touch.clientX,
      y: touch.clientY,
      pressure: touch.force || 0.5
    };
  }

  /**
   * 获取点组选项
   * @private
   * @param group - 点组
   * @returns 点组选项
   */
  _getPointGroupOptions(group?: PointGroup): PointGroupOptions {
    return {
      penColor: group && "penColor" in group ? group.penColor : this.penColor,
      dotSize: group && "dotSize" in group ? group.dotSize : this.dotSize,
      minWidth: group && "minWidth" in group ? group.minWidth : this.minWidth,
      maxWidth: group && "maxWidth" in group ? group.maxWidth : this.maxWidth,
      velocityFilterWeight:
        group && "velocityFilterWeight" in group ? group.velocityFilterWeight : this.velocityFilterWeight,
      compositeOperation: group && "compositeOperation" in group ? group.compositeOperation : this.compositeOperation
    };
  }

  /**
   * 开始笔画
   * @private
   * @param event - 签名事件
   */
  _strokeBegin(event: SignatureEvent): void {
    const cancelled = !this.dispatchEvent(new CustomEvent("beginStroke", { detail: event, cancelable: true }));
    if (cancelled) {
      return;
    }
    const { addEventListener } = this._getListenerFunctions();
    switch (event.event.type) {
      case "mousedown":
        addEventListener("mousemove", this._handleMouseMove);
        addEventListener("mouseup", this._handleMouseUp);
        break;
      case "touchstart":
        addEventListener("touchmove", this._handleTouchMove);
        addEventListener("touchend", this._handleTouchEnd);
        break;
      case "pointerdown":
        addEventListener("pointermove", this._handlePointerMove);
        addEventListener("pointerup", this._handlePointerUp);
        break;
    }
    this._drawingStroke = true;
    const pointGroupOptions = this._getPointGroupOptions();
    const newPointGroup: PointGroup = { ...pointGroupOptions, points: [] };
    this._data.push(newPointGroup);
    this._reset(pointGroupOptions);
    this._strokeUpdate(event);
  }

  /**
   * 更新笔画
   * @private
   * @param event - 签名事件
   */
  _strokeUpdate(event: SignatureEvent): void {
    if (!this._drawingStroke) {
      return;
    }
    if (this._data.length === 0) {
      this._strokeBegin(event);
      return;
    }
    this.dispatchEvent(new CustomEvent("beforeUpdateStroke", { detail: event }));
    const point = this._createPoint(event.x, event.y, event.pressure);
    const lastPointGroup = this._data[this._data.length - 1];
    const lastPoints = lastPointGroup.points;
    const lastPoint = lastPoints.length > 0 && lastPoints[lastPoints.length - 1];
    const isLastPointTooClose = lastPoint ? point.distanceTo(lastPoint) <= this.minDistance : false;
    const pointGroupOptions = this._getPointGroupOptions(lastPointGroup);
    if (!lastPoint || !(lastPoint && isLastPointTooClose)) {
      const curve = this._addPoint(point, pointGroupOptions);
      if (!lastPoint) {
        this._drawDot(point, pointGroupOptions);
      } else if (curve) {
        this._drawCurve(curve, pointGroupOptions);
      }
      lastPoints.push({
        time: point.time,
        x: point.x,
        y: point.y,
        pressure: point.pressure
      });
    }
    this.dispatchEvent(new CustomEvent("afterUpdateStroke", { detail: event }));
  }

  /**
   * 结束笔画
   * @private
   * @param event - 签名事件
   * @param shouldUpdate - 是否应该更新
   */
  _strokeEnd(event: SignatureEvent, shouldUpdate = true): void {
    this._removeMoveUpEventListeners();
    if (!this._drawingStroke) {
      return;
    }
    if (shouldUpdate) {
      this._strokeUpdate(event);
    }
    this._drawingStroke = false;
    this.dispatchEvent(new CustomEvent("endStroke", { detail: event }));
  }

  /**
   * 处理指针事件
   * @private
   */
  _handlePointerEvents(): void {
    this._drawingStroke = false;
    this.canvas.addEventListener("pointerdown", this._handlePointerDown);
  }

  /**
   * 处理鼠标事件
   * @private
   */
  _handleMouseEvents(): void {
    this._drawingStroke = false;
    this.canvas.addEventListener("mousedown", this._handleMouseDown);
  }

  /**
   * 处理触摸事件
   * @private
   */
  _handleTouchEvents(): void {
    this.canvas.addEventListener("touchstart", this._handleTouchStart);
  }

  /**
   * 重置签名板
   * @private
   * @param options - 点组选项
   */
  _reset(options: PointGroupOptions): void {
    this._lastPoints = [];
    this._lastVelocity = 0;
    this._lastWidth = (options.minWidth + options.maxWidth) / 2;
    if (this._ctx) {
      this._ctx.fillStyle = options.penColor;
      this._ctx.globalCompositeOperation = options.compositeOperation;
    }
  }

  /**
   * 创建点
   * @private
   * @param x - X坐标
   * @param y - Y坐标
   * @param pressure - 压力值
   * @returns 点实例
   */
  _createPoint(x: number, y: number, pressure: number): Point {
    const rect = this.canvas.getBoundingClientRect();

    const newX = (x - rect.left) / this.scale;
    const newY = (y - rect.top) / this.scale;
    return new Point(newX, newY, pressure, new Date().getTime());
  }

  /**
   * 添加点
   * @private
   * @param point - 要添加的点
   * @param options - 点组选项
   * @returns 贝塞尔曲线或null
   */
  _addPoint(point: Point, options: PointGroupOptions): Bezier | null {
    const { _lastPoints } = this;
    _lastPoints.push(point);
    if (_lastPoints.length > 2) {
      if (_lastPoints.length === 3) {
        _lastPoints.unshift(_lastPoints[0]);
      }
      const widths = this._calculateCurveWidths(_lastPoints[1], _lastPoints[2], options);
      const curve = Bezier.fromPoints(_lastPoints, widths);
      _lastPoints.shift();
      return curve;
    }
    return null;
  }

  /**
   * 计算曲线宽度
   * @private
   * @param startPoint - 起始点
   * @param endPoint - 终止点
   * @param options - 点组选项
   * @returns 宽度对象
   */
  _calculateCurveWidths(
    startPoint: Point,
    endPoint: Point,
    options: PointGroupOptions
  ): {
    start: number;
    end: number;
  } {
    const velocity =
      options.velocityFilterWeight * endPoint.velocityFrom(startPoint) +
      (1 - options.velocityFilterWeight) * this._lastVelocity;
    const newWidth = this._strokeWidth(velocity, options);
    const widths = {
      end: newWidth,
      start: this._lastWidth
    };
    this._lastVelocity = velocity;
    this._lastWidth = newWidth;
    return widths;
  }

  /**
   * 计算笔画宽度
   * @private
   * @param velocity - 速度值
   * @param options - 点组选项
   * @returns 宽度值
   */
  _strokeWidth(velocity: number, options: PointGroupOptions): number {
    return Math.max(options.maxWidth / (velocity + 1), options.minWidth);
  }

  /**
   * 绘制曲线段
   * @private
   * @param x - X坐标
   * @param y - Y坐标
   * @param width - 宽度
   */
  _drawCurveSegment(x: number, y: number, width: number): void {
    if (!this._ctx) return;

    this._ctx.moveTo(x, y);
    this._ctx.arc(x, y, width, 0, 2 * Math.PI, false);
    this._isEmpty = false;
  }

  /**
   * 绘制曲线
   * @private
   * @param curve - 贝塞尔曲线
   * @param options - 点组选项
   */
  _drawCurve(curve: Bezier, options: PointGroupOptions): void {
    if (!this._ctx) return;

    const ctx = this._ctx;
    const widthDelta = curve.endWidth - curve.startWidth;
    const drawSteps = Math.ceil(curve.length()) * 2;
    ctx.beginPath();
    ctx.fillStyle = options.penColor;

    for (let i = 0; i < drawSteps; i += 1) {
      const t = i / drawSteps;
      const tt = t * t;
      const ttt = tt * t;
      const u = 1.0 - t;
      const uu = u * u;
      const uuu = uu * u;

      let x = uuu * curve.startPoint.x;
      x += 3 * uu * t * curve.control1.x;
      x += 3 * u * tt * curve.control2.x;
      x += ttt * curve.endPoint.x;

      let y = uuu * curve.startPoint.y;
      y += 3 * uu * t * curve.control1.y;
      y += 3 * u * tt * curve.control2.y;
      y += ttt * curve.endPoint.y;

      const width = Math.min(curve.startWidth + ttt * widthDelta, options.maxWidth);
      this._drawCurveSegment(x, y, width);
    }

    ctx.closePath();
    ctx.fill();
  }

  /**
   * 绘制点
   * @private
   * @param point - 点
   * @param options - 点组选项
   */
  _drawDot(point: Point, options: PointGroupOptions): void {
    if (!this._ctx) return;

    const ctx = this._ctx;
    const width = options.dotSize > 0 ? options.dotSize : (options.minWidth + options.maxWidth) / 2;

    ctx.beginPath();
    this._drawCurveSegment(point.x, point.y, width);
    ctx.closePath();
    ctx.fillStyle = options.penColor;
    ctx.fill();
  }

  /**
   * 从数据加载签名的内部方法
   * @private
   * @param pointGroups - 点组数据
   * @param drawCurve - 绘制曲线的函数
   * @param drawDot - 绘制点的函数
   */
  _fromData(
    pointGroups: PointGroup[],
    drawCurve: (curve: Bezier, options: PointGroupOptions) => void,
    drawDot: (point: Point, options: PointGroupOptions) => void
  ): void {
    for (const group of pointGroups) {
      const { points } = group;
      const pointGroupOptions = this._getPointGroupOptions(group);
      if (points.length > 1) {
        for (let j = 0; j < points.length; j += 1) {
          const basicPoint = points[j];

          const point = new Point(basicPoint.x, basicPoint.y, basicPoint.pressure, basicPoint.time);
          if (j === 0) {
            this._reset(pointGroupOptions);
            drawDot(point, pointGroupOptions);
          }

          const curve = this._addPoint(point, pointGroupOptions);
          if (curve) {
            drawCurve(curve, pointGroupOptions);
          }
        }
      } else {
        this._reset(pointGroupOptions);
        drawDot(new Point(points[0].x, points[0].y, points[0].pressure, points[0].time), pointGroupOptions);
      }
    }
  }

  /**
   * 将签名转换为SVG
   * @param options - SVG选项
   * @returns SVG字符串
   */
  toSVG(options: ToSVGOptions = { includeBackgroundColor: false }): string {
    const { includeBackgroundColor = false } = options;
    const pointGroups = this._data;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const minX = 0;
    const minY = 0;
    const maxX = this.canvas.width / ratio;
    const maxY = this.canvas.height / ratio;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    svg.setAttribute("viewBox", `${minX} ${minY} ${maxX} ${maxY}`);
    svg.setAttribute("width", maxX.toString());
    svg.setAttribute("height", maxY.toString());

    if (includeBackgroundColor && this.backgroundColor) {
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("width", "100%");
      rect.setAttribute("height", "100%");
      rect.setAttribute("fill", this.backgroundColor);
      svg.appendChild(rect);
    }

    this._fromData(
      pointGroups,
      (curve: Bezier, options: PointGroupOptions) => {
        const { penColor } = options;
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        if (
          !isNaN(curve.control1.x) &&
          !isNaN(curve.control1.y) &&
          !isNaN(curve.control2.x) &&
          !isNaN(curve.control2.y)
        ) {
          const attr =
            `M ${curve.startPoint.x.toFixed(3)},${curve.startPoint.y.toFixed(3)} ` +
            `C ${curve.control1.x.toFixed(3)},${curve.control1.y.toFixed(3)} ` +
            `${curve.control2.x.toFixed(3)},${curve.control2.y.toFixed(3)} ` +
            `${curve.endPoint.x.toFixed(3)},${curve.endPoint.y.toFixed(3)}`;
          path.setAttribute("d", attr);
          path.setAttribute("stroke-width", (curve.endWidth * 2.25).toFixed(3));
          path.setAttribute("stroke", penColor);
          path.setAttribute("fill", "none");
          path.setAttribute("stroke-linecap", "round");
          svg.appendChild(path);
        }
      },
      (point: Point, options: PointGroupOptions) => {
        const { penColor, dotSize, minWidth, maxWidth } = options;
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        const size = dotSize > 0 ? dotSize : (minWidth + maxWidth) / 2;
        circle.setAttribute("r", size.toString());
        circle.setAttribute("cx", point.x.toString());
        circle.setAttribute("cy", point.y.toString());
        circle.setAttribute("fill", penColor);
        svg.appendChild(circle);
      }
    );

    return svg.outerHTML;
  }
}

export default SignaturePad;
