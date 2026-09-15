// @ts-check
import { merge } from "lodash-es";

/**
 * @typedef {any} Particle
 * @typedef {any} EventListenerItem
 * @typedef {any} MouseEvent
 * @typedef {any} RGBColor
 */

/**
 * 粒子动画库 - 基于对象的实现
 *
 * 这个文件提供了一个面向对象的粒子动画实现，
 * 用于创建交互式的粒子背景。
 */

/**
 * 粒子动画的实现类
 */
class ParticlesImpl {
  private tagId: string | HTMLElement;
  private params: any;
  private option: { screenScale: number };
  private pxratio: number;
  private canvasEl: HTMLCanvasElement | null;
  private ctx: CanvasRenderingContext2D | null;
  private particles: any[];
  private animationFrame: number | null;
  private drawAnimFrame: ((time: number) => void) | null = null;
  private mouseX: number;
  private mouseY: number;
  private isMouseDown: boolean;
  private eventListeners: any[];

  /**
   * 创建一个新的粒子实例
   * @param {string} tagId - 要附加canvas的DOM元素的ID
   * @param {ParticlesParams} [params] - 粒子的配置参数
   * @param {{screenScale:number}} [option] - 粒子的配置参数
   */
  constructor(tagId: string | HTMLElement, params: any, option: any = { screenScale: 1 }) {
    this.tagId = tagId;

    /** @type {ParticlesParams} */
    this.params = params || {};

    /** @type {{screenScale:number}} */
    this.option = option;

    this.pxratio = window.devicePixelRatio || 1;

    /** @type {HTMLCanvasElement|null} */
    this.canvasEl = null;

    /** @type {CanvasRenderingContext2D|null} */
    this.ctx = null;

    /** @type {Particle[]} */
    this.particles = [];

    /** @type {number|null} */
    this.animationFrame = null;

    this.mouseX = 0;
    this.mouseY = 0;
    this.isMouseDown = false;

    /** @type {EventListenerItem[]} */
    this.eventListeners = [];

    this.init();
  }
  getElement() {
    if (typeof this.tagId === "string") {
      return document.getElementById(this.tagId);
    } else if (this.tagId instanceof HTMLElement) {
      return this.tagId;
    }
    return null;
  }

  /**
   * 初始化粒子动画
   * @private
   */
  init() {
    const el = this.getElement();
    if (!el) {
      console.error(`Element with id "${this.tagId}" not found`);
      return;
    }

    // 创建canvas元素
    this.canvasEl = document.createElement("canvas");
    this.canvasEl.className = "particles-js-canvas-el";
    this.canvasEl.style.width = "100%";
    this.canvasEl.style.height = "100%";
    el.appendChild(this.canvasEl);

    this.ctx = this.canvasEl.getContext("2d");

    // 设置canvas大小
    this.canvasSize();

    // 启动粒子动画
    this.launchParticlesJS();

    // 处理窗口大小变化
    const resizeListener = () => this.canvasSize();
    window.addEventListener("resize", resizeListener);
    this.eventListeners.push({ target: window, type: "resize", listener: resizeListener });

    // 处理鼠标移动
    if (this.params.interactivity && this.params.interactivity.enable) {
      const detectTarget = this.params.interactivity.detect_on === "window" ? window : this.canvasEl;
      if (!detectTarget) return;

      const mouseMoveListener = (e: Event) => {
        const mouseEvent = e as MouseEvent;
        const pos = this.getMousePosition(mouseEvent, detectTarget);

        this.mouseX = pos.x;
        this.mouseY = pos.y;
      };
      detectTarget.addEventListener("mousemove", mouseMoveListener);
      this.eventListeners.push({
        target: detectTarget,
        type: "mousemove",
        listener: mouseMoveListener
      });

      // 处理鼠标点击
      if (
        this.params.interactivity.events &&
        this.params.interactivity.events.onclick &&
        this.params.interactivity.events.onclick.enable
      ) {
        const clickListener = () => {
          this.isMouseDown = true;
          if (this.params.interactivity?.events?.onclick?.mode === "push") {
            this.pushParticles(this.params.interactivity?.events?.onclick?.nb || 1);
          } else if (this.params.interactivity?.events?.onclick?.mode === "remove") {
            this.removeParticles(this.params.interactivity?.events?.onclick?.nb || 1);
          }
          this.isMouseDown = false;
        };
        detectTarget.addEventListener("click", clickListener);
        this.eventListeners.push({ target: detectTarget, type: "click", listener: clickListener });
      }
    }
  }

  /**
   * 启动粒子动画系统
   * @private
   */
  launchParticlesJS() {
    // 默认值
    const defaultParams = {
      particles: {
        color: "#fff",
        shape: "circle",
        opacity: 1,
        size: 2.5,
        size_random: true,
        nb: 200,
        line_linked: {
          enable_auto: true,
          distance: 100,
          color: "#ff0000",
          opacity: 1,
          width: 1,
          condensed_mode: {
            enable: false,
            rotateX: 3000,
            rotateY: 3000
          }
        },
        anim: {
          enable: true,
          speed: 1
        }
      },
      interactivity: {
        enable: true,
        mouse: {
          distance: 100
        },
        detect_on: "canvas",
        mode: "grab",
        line_linked: {
          opacity: 1
        },
        events: {
          onclick: {
            enable: true,
            mode: "push",
            nb: 4
          }
        }
      },
      retina_detect: false
    };

    // 合并用户参数与默认参数
    /** @type {ParticlesParams} */
    const params = merge(defaultParams, this.params);
    this.params = params;

    // 检测视网膜显示
    if (params.retina_detect && this.pxratio > 1) {
      if (params.particles) {
        if (params.particles.size) {
          params.particles.size = params.particles.size * this.pxratio;
        }
        if (params.particles.line_linked && params.particles.line_linked.width) {
          params.particles.line_linked.width = params.particles.line_linked.width * this.pxratio;
        }
      }
    }

    // 创建粒子
    this.createParticles();

    // 开始绘制动画
    this.drawAnimFrame = (_time: number) => this.draw();
    this.animationFrame = requestAnimationFrame(this.drawAnimFrame);
  }

  /**
   * 设置canvas大小
   * @private
   */
  canvasSize() {
    if (!this.canvasEl) return;

    const el = this.getElement();
    if (!el) return;

    this.canvasEl.width = el.offsetWidth;
    this.canvasEl.height = el.offsetHeight;
  }

  /**
   * 创建粒子
   * @private
   */
  createParticles() {
    if (!this.canvasEl) return;

    const particlesConfig = this.params.particles;
    if (!particlesConfig) return;

    this.particles = [];

    const particlesNb = particlesConfig.nb || 0;
    for (let i = 0; i < particlesNb; i++) {
      this.particles.push({
        color: particlesConfig.color || "#fff",
        x: Math.random() * this.canvasEl.width,
        y: Math.random() * this.canvasEl.height,
        vx: (Math.random() - 0.5) * (particlesConfig.anim?.speed || 1),
        vy: (Math.random() - 0.5) * (particlesConfig.anim?.speed || 1),
        radius: particlesConfig.size_random
          ? Math.random() * (particlesConfig.size || 2.5)
          : particlesConfig.size || 2.5
      });
    }
  }

  /**
   * 添加粒子
   * @param {number} nb - 要添加的粒子数量
   * @private
   */
  pushParticles(nb: number) {
    if (!this.canvasEl) return;

    const particlesConfig = this.params.particles;
    if (!particlesConfig) return;

    for (let i = 0; i < nb; i++) {
      this.particles.push({
        color: particlesConfig.color || "#fff",
        x: this.mouseX,
        y: this.mouseY,
        vx: (Math.random() - 0.5) * (particlesConfig.anim?.speed || 1),
        vy: (Math.random() - 0.5) * (particlesConfig.anim?.speed || 1),
        radius: particlesConfig.size_random
          ? Math.random() * (particlesConfig.size || 2.5)
          : particlesConfig.size || 2.5
      });
    }
  }

  /**
   * 移除粒子
   * @param {number} nb - 要移除的粒子数量
   * @private
   */
  removeParticles(nb: number) {
    this.particles.splice(0, nb);
  }

  /**
   * 绘制粒子
   * @private
   */
  draw() {
    if (!this.ctx || !this.canvasEl) return;

    this.ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);
    this.updateParticles();
    this.drawParticles();
    this.drawLines();
    if (this.drawAnimFrame) {
      this.animationFrame = requestAnimationFrame(this.drawAnimFrame);
    }
  }

  /**
   * 更新粒子位置
   * @private
   */
  updateParticles() {
    if (!this.canvasEl) return;

    const particlesConfig = this.params.particles;
    if (!particlesConfig) return;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // 移动粒子
      if (particlesConfig.anim?.enable) {
        p.x += p.vx;
        p.y += p.vy;
      }

      // 边界检查
      if (p.x - p.radius > this.canvasEl.width) {
        p.x = p.radius;
      } else if (p.x + p.radius < 0) {
        p.x = this.canvasEl.width + p.radius;
      }

      if (p.y - p.radius > this.canvasEl.height) {
        p.y = p.radius;
      } else if (p.y + p.radius < 0) {
        p.y = this.canvasEl.height + p.radius;
      }
    }
  }

  /**
   * 绘制粒子
   * @private
   */
  drawParticles() {
    if (!this.ctx) return;

    const particlesConfig = this.params.particles;
    if (!particlesConfig) return;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      this.ctx.fillStyle = particlesConfig.color || "#fff";
      this.ctx.beginPath();

      if (particlesConfig.shape === "circle") {
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2, false);
      } else if (particlesConfig.shape === "edge") {
        this.ctx.rect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
      } else if (particlesConfig.shape === "triangle") {
        this.ctx.moveTo(p.x, p.y - p.radius);
        this.ctx.lineTo(p.x + p.radius, p.y + p.radius);
        this.ctx.lineTo(p.x - p.radius, p.y + p.radius);
        this.ctx.closePath();
      }

      this.ctx.fill();
    }
  }

  /**
   * 绘制粒子之间的连线
   * @private
   */
  drawLines() {
    if (!this.ctx) return;
    const particlesConfig = this.params.particles;
    if (!particlesConfig) return;

    const interactivityConfig = this.params.interactivity;

    // 粒子之间的连线
    if (particlesConfig.line_linked?.enable_auto) {
      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const p1 = this.particles[i];
          const p2 = this.particles[j];

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (particlesConfig.line_linked?.distance && dist <= particlesConfig.line_linked.distance) {
            const lineOpacity = particlesConfig.line_linked.opacity || 1;
            const lineDistance = particlesConfig.line_linked.distance || 100;

            const opacity_line = lineOpacity * (1 - dist / lineDistance);

            if (opacity_line > 0 && particlesConfig.line_linked?.color) {
              const rgb = this.hexToRgb(particlesConfig.line_linked.color);
              this.ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity_line})`;
              this.ctx.lineWidth = particlesConfig.line_linked.width || 1;
              this.ctx.beginPath();
              this.ctx.moveTo(p1.x, p1.y);
              this.ctx.lineTo(p2.x, p2.y);
              this.ctx.stroke();
              this.ctx.closePath();
            }
          }
        }
      }
    }

    // 鼠标交互
    if (interactivityConfig?.enable && interactivityConfig.mode === "grab") {
      const grabRadius = interactivityConfig.mouse?.distance || 100;

      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        const dx = p.x - this.mouseX;
        const dy = p.y - this.mouseY;
        const mouseDistance = Math.sqrt(dx * dx + dy * dy);

        if (mouseDistance <= grabRadius) {
          const lineOpacity = interactivityConfig.line_linked?.opacity || 1;
          const grabRadius = interactivityConfig.mouse?.distance || 100;

          const opacity_line = lineOpacity * (1 - mouseDistance / grabRadius);

          if (opacity_line > 0 && particlesConfig.line_linked?.color) {
            const rgb = this.hexToRgb(particlesConfig.line_linked.color);

            this.ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity_line})`;
            this.ctx.lineWidth = particlesConfig.line_linked.width || 1;
            this.ctx.beginPath();
            this.ctx.moveTo(p.x, p.y);
            this.ctx.lineTo(this.mouseX, this.mouseY);
            this.ctx.stroke();
            this.ctx.closePath();
          }
        }
      }
    }
  }

  /**
   * 获取鼠标位置
   * @param {MouseEvent} event - 鼠标事件
   * @param {Element|Window} target - 事件目标
   * @returns {{x: number, y: number}} 鼠标位置 {x, y}
   * @private
   */
  getMousePosition(event: MouseEvent, target: Element | Window) {
    let posX = 0;
    let posY = 0;

    if (target === window) {
      posX = event.clientX;
      posY = event.clientY;
    } else if (target instanceof Element) {
      const rect = target.getBoundingClientRect();
      posX = (event.clientX - rect.left) / this.option.screenScale;
      posY = (event.clientY - rect.top) / this.option.screenScale;
    }

    return { x: posX, y: posY };
  }

  /**
   * 将十六进制颜色或rgba颜色转换为RGB
   * @param {string} color - 十六进制颜色或rgba颜色
   * @returns {RGBColor} RGB颜色 {r, g, b}
   * @private
   */
  hexToRgb(color: string) {
    // 处理rgba格式
    if (color.startsWith("rgba(") || color.startsWith("rgb(")) {
      const rgbaMatch = color.match(/rgba?\(([^)]+)\)/);
      if (rgbaMatch) {
        const values = rgbaMatch[1].split(",").map((v) => parseFloat(v.trim()));
        if (values.length >= 3) {
          return {
            r: Math.round(values[0]),
            g: Math.round(values[1]),
            b: Math.round(values[2])
          };
        }
      }
    }

    // 处理十六进制格式
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    color = color.replace(shorthandRegex, (_m: string, r: string, g: string, b: string) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 0, g: 0, b: 0 };
  }

  /**
   * 销毁粒子实例，移除canvas并清理资源
   */
  destroy() {
    // 停止动画
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // 移除事件监听器
    this.eventListeners.forEach(({ target, type, listener }) => {
      target.removeEventListener(type, listener);
    });
    this.eventListeners = [];

    // 移除canvas
    if (this.canvasEl && this.canvasEl.parentNode) {
      this.canvasEl.parentNode.removeChild(this.canvasEl);
    }

    this.canvasEl = null;
    this.ctx = null;
    this.particles = [];
  }

  /**
   * 更新粒子参数并重绘
   * @param {ParticlesParams} newParams - 新的配置参数
   * @param {{screenScale:number}} [option] - 粒子的配置参数
   */
  updateParams(newParams: any, option: { screenScale: number }) {
    // 更新参数
    this.params = merge(this.params, newParams);
    this.option = merge(this.option, option);
  }

  /**
   * 创建一个新的粒子实例
   * @param {string} tagId - 要附加canvas的DOM元素的ID
   * @param {ParticlesParams} [params] - 粒子的配置参数
   * @param {{screenScale:number}} [option] - 粒子的配置参数
   * @returns {InstanceType<typeof ParticlesImpl>} 一个新的粒子实例
   * @static
   */
  static init(tagId: string | HTMLElement, params: any, option: { screenScale: number }) {
    return new ParticlesImpl(tagId, params, option);
  }
}

/**
 * 创建粒子实例的传统函数（向后兼容）
 * @param {string} tagId - 要附加canvas的DOM元素的ID
 * @param {ParticlesParams} [params] - 粒子的配置参数
 * @param {{screenScale:number}} [option] - 粒子的配置参数
 * @returns {InstanceType<typeof ParticlesImpl>} 一个新的粒子实例
 */
function particlesJS(
  tagId: string | HTMLElement,
  params?: any,
  option: { screenScale: number } = { screenScale: 1 }
): InstanceType<typeof ParticlesImpl> {
  const instance = ParticlesImpl.init(tagId, params, option);
  return instance;
}

// 导出模块
export { ParticlesImpl, particlesJS };
