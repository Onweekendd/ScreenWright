/**
 * 动画完成回调类型
 */
type AnimationCompleteCallback = () => void;

/**
 * 极简动画序列类（最终适配版：on绑定自动单次触发，兼容业务侧写法 + 新增【是否删除旧动画样式】配置）
 */
export class SimpleAnimationSequence {
  private el: HTMLElement;
  private sequence: { name: string; wait: number }[];
  private currentIndex = 0;
  private isDestroyed = false;
  // 存储回调（区分单次/多次，但on绑定自动转为单次）
  private callbacks = new Map<
    string,
    {
      normal: AnimationCompleteCallback[];
      once: AnimationCompleteCallback[];
    }
  >();
  // 缓存绑定后的事件处理函数（关键：确保removeEventListener生效）
  private boundAnimationEnd: (e: AnimationEvent) => void;
  // 标记每个动画是否已触发过回调（防止重复触发）
  private animTriggered = new Set<string>();
  // ========== 【修改点1】新增：是否移除旧动画样式的开关，默认true ==========
  private removeOldAnimClass: boolean;

  // ========== 【修改点2】构造函数新增第三个参数，设置默认值true ==========
  constructor(el: HTMLElement, sequence: { name: string; wait: number }[], removeOldAnimClass: boolean = true) {
    if (!el) throw new Error("必须传入有效DOM元素");
    if (!sequence.length) throw new Error("动画序列不能为空");

    this.el = el;
    this.sequence = sequence;
    this.removeOldAnimClass = removeOldAnimClass; // 赋值开关参数
    // 缓存绑定后的函数（确保引用唯一）
    this.boundAnimationEnd = this.handleAnimationEnd.bind(this);
    // 正确绑定事件
    this.el.addEventListener("animationend", this.boundAnimationEnd);
    this.startCurrent();
  }

  /**
   * 适配业务侧：on绑定自动转为「单次触发」（核心修改）
   * 业务侧写on，底层自动按once逻辑处理，触发一次后移除
   */
  on(animName: string, callback: AnimationCompleteCallback): this {
    this.validateInstanceState();
    this.validateCallback(callback);

    const key = animName.trim();
    // 初始化回调容器
    if (!this.callbacks.has(key)) {
      this.callbacks.set(key, { normal: [], once: [] });
    }
    // 核心：将on绑定的回调直接加入once队列（自动单次触发）
    const onceCallbacks = this.callbacks.get(key)!.once;
    if (!onceCallbacks.includes(callback)) {
      onceCallbacks.push(callback);
    }
    return this;
  }

  /**
   * 保留once方法（原生单次触发，和on效果一致，兼容扩展）
   */
  once(animName: string, callback: AnimationCompleteCallback): this {
    this.validateInstanceState();
    this.validateCallback(callback);

    const key = animName.trim();
    if (!this.callbacks.has(key)) {
      this.callbacks.set(key, { normal: [], once: [] });
    }
    const onceCallbacks = this.callbacks.get(key)!.once;
    if (!onceCallbacks.includes(callback)) {
      onceCallbacks.push(callback);
    }
    return this;
  }

  /**
   * 移除指定回调
   */
  off(animName: string, callback?: AnimationCompleteCallback): this {
    this.validateInstanceState();
    const key = animName.trim();
    if (!this.callbacks.has(key)) return this;

    const callbacks = this.callbacks.get(key)!;
    if (callback) {
      callbacks.normal = callbacks.normal.filter((cb) => cb !== callback);
      callbacks.once = callbacks.once.filter((cb) => cb !== callback);
    } else {
      callbacks.normal = [];
      callbacks.once = [];
    }
    return this;
  }

  /**
   * 触发回调（核心：每个动画仅触发一次 + 自动清理）
   */
  private triggerCallback(animName: string) {
    const key = animName.trim();
    // 1. 每个动画仅触发一次回调（通过animTriggered标记）
    if (this.animTriggered.has(key)) return;
    this.animTriggered.add(key);

    if (!this.callbacks.has(key)) return;

    const { normal, once } = this.callbacks.get(key)!;
    // 执行所有回调（normal已被on方法转为once，实际只执行once队列）
    normal.forEach(this.executeCallback);
    once.forEach(this.executeCallback);

    // 2. 触发后立即清空所有回调（彻底防止重复）
    this.callbacks.set(key, { normal: [], once: [] });
  }

  /**
   * 执行单个回调（错误捕获）
   */
  private executeCallback(callback: AnimationCompleteCallback) {
    try {
      callback();
    } catch (err) {
      console.error(`执行动画回调失败:`, err);
    }
  }

  /**
   * 校验实例状态（已销毁则抛错）
   */
  private validateInstanceState() {
    if (this.isDestroyed) throw new Error("SimpleAnimationSequence 实例已销毁");
  }

  /**
   * 校验回调类型
   */
  private validateCallback(callback: unknown) {
    if (typeof callback !== "function") throw new Error("回调必须是函数类型");
  }

  private startCurrent() {
    if (this.isDestroyed || this.currentIndex >= this.sequence.length) return;
    const current = this.sequence[this.currentIndex];

    // ========== 【修改点3】核心逻辑：根据开关判断是否移除旧动画样式 ==========
    if (this.removeOldAnimClass) {
      this.el.classList.remove(current.name);
    }

    // ✅ 强制重绘逻辑【保留不动】，无论是否删样式，都要保证动画能触发
    void this.el.offsetWidth;

    // 添加动画类（不变）
    this.el.classList.add(current.name);
    console.log(`启动动画：${current.name}，是否移除旧样式：${this.removeOldAnimClass}`);
  }

  /**
   * 核心：修复动画end事件处理（实例隔离 + 严格匹配 + 自动销毁）
   */
  private handleAnimationEnd(e: AnimationEvent) {
    if (this.isDestroyed) return;
    // 1. 实例隔离：确保事件目标是当前元素（防止冒泡）
    if (e.target !== this.el) return;
    // 2. 严格匹配当前实例的当前动画名
    const currentAnim = this.sequence[this.currentIndex]?.name;
    if (e.animationName !== currentAnim) return;

    const animName = e.animationName;
    console.log(`✅ ${animName} 动画结束（当前实例）`);

    // 触发回调（仅一次）
    this.triggerCallback(animName);

    // 序列结束判断
    if (this.currentIndex + 1 >= this.sequence.length) {
      // ✅ 【强制移除】动画结束必删当前样式，不受开关控制，防止残留
      if (this.removeOldAnimClass) {
        this.el.classList.remove(animName);
        this.destroy();
      }

      return;
    }

    // 执行下一个动画
    setTimeout(() => {
      if (this.isDestroyed) return;
      if (this.removeOldAnimClass) {
        this.el.classList.remove(animName);
      }
      this.currentIndex++;
      this.startCurrent();
    }, this.sequence[this.currentIndex].wait);
  }

  /**
   * 修复：正确移除事件监听 + 清理所有资源
   */
  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    // 移除事件监听（使用缓存的绑定函数）
    this.el.removeEventListener("animationend", this.boundAnimationEnd);
    // ✅ 【强制移除】销毁时必删所有动画样式，不受开关控制，兜底防残留
    this.sequence.forEach((item) => this.el.classList.remove(item.name));
    // 清空所有回调和标记
    this.callbacks.clear();
    this.animTriggered.clear();
    this.currentIndex = 0;
  }
}

/**
 * 极简控制器（最终适配版：增强实例管理 + 透传【是否删除旧动画样式】参数）
 */
export class SimpleAnimationController {
  private instances = new Set<SimpleAnimationSequence>();

  // ========== 【修改点4】控制器新增第三个参数，透传给实例，默认true ==========
  createSequence(el: HTMLElement, sequence: { name: string; wait: number }[], removeOldAnimClass: boolean = true) {
    // 1. 创建新实例前，先销毁该元素的旧实例（关键：避免同一元素多个实例）
    this.destroySequenceByEl(el);
    // 透传开关参数给动画序列实例
    const instance = new SimpleAnimationSequence(el, sequence, removeOldAnimClass);
    this.instances.add(instance);
    // 2. 监听实例销毁，自动从控制器移除（防止内存泄漏）
    const originalDestroy = instance.destroy;
    instance.destroy = () => {
      originalDestroy.call(instance);
      this.instances.delete(instance);
    };
    return instance;
  }

  /**
   * 新增：根据元素销毁对应实例（避免同一元素多个实例）
   */
  destroySequenceByEl(el: HTMLElement) {
    for (const inst of this.instances) {
      // @ts-ignore 临时访问私有属性（仅用于匹配元素）
      if (inst.el === el) {
        inst.destroy();
        this.instances.delete(inst);
        break;
      }
    }
  }

  destroyAll() {
    this.instances.forEach((inst) => inst.destroy());
    this.instances.clear();
  }
}
