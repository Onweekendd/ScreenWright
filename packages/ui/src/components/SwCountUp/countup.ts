export interface CountUpOptions {
  // (default)
  startVal?: number; // number to start at (0)
  decimalPlaces?: number; // number of decimal places (0)
  duration?: number; // animation duration in seconds (2)
  useGrouping?: boolean; // example: 1,000 vs 1000 (true)
  useIndianSeparators?: boolean; // example: 1,00,000 vs 100,000 (false)
  useEasing?: boolean; // ease animation (true)
  smartEasingThreshold?: number; // smooth easing for large numbers above this if useEasing (999)
  smartEasingAmount?: number; // amount to be eased for numbers above threshold (333)
  separator?: string; // grouping separator (,)
  decimal?: string; // decimal (.)
  // easingFn: easing function for animation (easeOutExpo)
  easingFn?: (t: number, b: number, c: number, d: number) => number;
  formattingFn?: (n: number) => string; // this function formats result
  prefix?: string; // text prepended to result
  suffix?: string; // text appended to result
  numerals?: string[]; // numeral glyph substitution
  enableScrollSpy?: boolean; // start animation when target is in view
  scrollSpyDelay?: number; // delay (ms) after target comes into view
  scrollSpyOnce?: boolean; // run only once
  onCompleteCallback?: () => any; // gets called when animation completes
  onStartCallback?: () => any; // gets called when animation starts
  plugin?: CountUpPlugin; // for alternate animations
}

export declare interface CountUpPlugin {
  render(elem: HTMLElement, formatted: string): void;
}

// playground: stackblitz.com/edit/countup-typescript
export class CountUp {
  version = "2.8.0";
  private defaults: CountUpOptions = {
    startVal: 0,
    decimalPlaces: 0,
    duration: 2,
    useEasing: true,
    useGrouping: true,
    useIndianSeparators: false,
    smartEasingThreshold: 999,
    smartEasingAmount: 333,
    separator: ",",
    decimal: ".",
    prefix: "",
    suffix: "",
    enableScrollSpy: false,
    scrollSpyDelay: 200,
    scrollSpyOnce: false
  };
  private rAF: any;
  private startTime!: number | null;
  private remaining!: number | null;
  private finalEndVal: number | null = null; // 修改类型为 number | null
  private useEasing = true;
  private countDown = false;
  el: HTMLElement | HTMLInputElement;
  formattingFn: (num: number) => string;
  easingFn?: (t: number, b: number, c: number, d: number) => number;
  error = "";
  startVal = 0;
  duration!: number;
  paused = true;
  frameVal: number;
  once = false;

  constructor(
    target: string | HTMLElement | HTMLInputElement,
    private endVal: number,
    public options?: CountUpOptions
  ) {
    this.options = {
      ...this.defaults,
      ...options
    };
    this.formattingFn = this.options.formattingFn ? this.options.formattingFn : this.formatNumber;
    this.easingFn = this.options.easingFn ? this.options.easingFn : this.easeOutExpo;

    this.startVal = this.validateValue(this.options.startVal ?? 0);
    this.frameVal = this.startVal;
    this.endVal = this.validateValue(endVal);
    this.options.decimalPlaces = Math.max(0, this.options.decimalPlaces ?? 0);
    this.resetDuration();
    this.options.separator = String(this.options.separator);
    this.useEasing = this.options.useEasing ?? true;
    if (this.options.separator === "") {
      this.options.useGrouping = false;
    }
    this.el =
      typeof target === "string"
        ? (document.getElementById(target) as HTMLElement | HTMLInputElement)
        : (target as HTMLElement | HTMLInputElement);

    if (this.el) {
      this.printValue(this.startVal);
    } else {
      this.error = "[CountUp] target is null or undefined";
    }

    // scroll spy
    if (typeof window !== "undefined" && this.options.enableScrollSpy) {
      if (!this.error) {
        // 修复数组初始化和push操作
        if (!(window as any)["onScrollFns"]) {
          (window as any)["onScrollFns"] = [];
        }
        (window as any)["onScrollFns"].push(() => this.handleScroll(this));
        window.onscroll = () => {
          (window as any)["onScrollFns"].forEach((fn: any) => fn());
        };
        this.handleScroll(this);
      } else {
        console.error(this.error, target);
      }
    }
  }

  handleScroll(self: CountUp): void {
    if (!self || !window || self.once) return;
    const bottomOfScroll = window.innerHeight + window.scrollY;
    const rect = self.el.getBoundingClientRect();
    const topOfEl = rect.top + window.pageYOffset;
    const bottomOfEl = rect.top + rect.height + window.pageYOffset;
    if (bottomOfEl < bottomOfScroll && bottomOfEl > window.scrollY && self.paused) {
      // in view
      self.paused = false;
      setTimeout(() => self.start(), self.options?.scrollSpyDelay || 200);
      if (self.options?.scrollSpyOnce) self.once = true;
    } else if ((window.scrollY > bottomOfEl || topOfEl > bottomOfScroll) && !self.paused) {
      // out of view
      self.reset();
    }
  }

  /**
   * Smart easing works by breaking the animation into 2 parts, the second part being the
   * smartEasingAmount and first part being the total amount minus the smartEasingAmount. It works
   * by disabling easing for the first part and enabling it on the second part. It is used if
   * useEasing is true and the total animation amount exceeds the smartEasingThreshold.
   */
  private determineDirectionAndSmartEasing(): void {
    const end = this.finalEndVal ? this.finalEndVal : this.endVal;
    this.countDown = this.startVal > end;
    const animateAmount = end - this.startVal;
    if (Math.abs(animateAmount) > (this.options?.smartEasingThreshold || 999) && this.options?.useEasing) {
      this.finalEndVal = end;
      const up = this.countDown ? 1 : -1;
      this.endVal = end + up * (this.options?.smartEasingAmount || 333);
      this.duration = this.duration / 2;
    } else {
      this.endVal = end;
      this.finalEndVal = null;
    }
    if (this.finalEndVal !== null) {
      this.useEasing = false;
    } else {
      this.useEasing = this.options?.useEasing ?? true;
    }
  }

  // start animation
  start(callback?: (args?: any) => any): void {
    if (this.error) {
      return;
    }
    if (this.options?.onStartCallback) {
      this.options.onStartCallback();
    }
    if (callback && this.options) {
      this.options.onCompleteCallback = callback;
    }
    if (this.duration > 0) {
      this.determineDirectionAndSmartEasing();
      this.paused = false;
      this.rAF = requestAnimationFrame(this.count);
    } else {
      this.printValue(this.endVal);
    }
  }

  // pause/resume animation
  pauseResume(): void {
    if (!this.paused) {
      cancelAnimationFrame(this.rAF);
    } else {
      this.startTime = null;
      this.duration = this.remaining || 0;
      this.startVal = this.frameVal;
      this.determineDirectionAndSmartEasing();
      this.rAF = requestAnimationFrame(this.count);
    }
    this.paused = !this.paused;
  }

  // reset to startVal so animation can be run again
  reset(): void {
    cancelAnimationFrame(this.rAF);
    this.paused = true;
    this.resetDuration();
    this.startVal = this.validateValue(this.options?.startVal ?? 0);
    this.frameVal = this.startVal;
    this.printValue(this.startVal);
  }

  // pass a new endVal and start animation
  update(newEndVal: string | number, useAnimation?: boolean, incrementDuration?: number): void {
    // const timestamp = new Date().toLocaleTimeString();

    cancelAnimationFrame(this.rAF);
    this.startTime = null;
    const newValue = this.validateValue(newEndVal);

    // 如果新值和当前值相同，且不需要动画，直接返回
    const optionDuration = Number(this.options?.duration ?? 0);
    if (newValue === this.endVal && newValue === this.frameVal && !useAnimation && optionDuration === 0) {
      return;
    }

    this.endVal = newValue;

    // 如果需要动画（自增动画），使用独立的动画时长
    // 自增动画和启动动画完全隔离，自增动画使用独立的 duration
    if (useAnimation) {
      // 如果提供了自增动画时长，使用它；否则使用默认的 2 秒（和启动动画一致）
      const animDuration = incrementDuration ?? 2000; // 默认 2 秒，和启动动画一致
      this.duration = animDuration;
      this.remaining = this.duration;
      // 确保自增动画从当前值开始
      this.startVal = this.frameVal;
      this.finalEndVal = null;
      // 自增动画使用线性动画，让翻滚效果更明显
      // 不使用 easing，让数字均匀变化，翻滚效果更清晰
      this.useEasing = false;
      this.countDown = this.startVal > this.endVal;
      // 确保 easingFn 已初始化（虽然不使用，但保持一致性）
      if (!this.easingFn) {
        this.easingFn = this.options?.easingFn ? this.options.easingFn : this.easeOutExpo;
      }
      // 重置 startTime，确保动画从当前时间开始
      this.startTime = null;
      // 自增动画不使用 determineDirectionAndSmartEasing，直接启动
    } else if (optionDuration > 0) {
      // 如果原本有 duration（启动动画），重置它
      if (this.finalEndVal == null) {
        this.resetDuration();
      }
      this.startVal = this.frameVal;
      this.finalEndVal = null;
      this.determineDirectionAndSmartEasing();
    } else {
      // 如果 duration 为 0 且不需要动画，直接设置值
      this.frameVal = this.endVal;
      this.startVal = this.endVal;
      this.duration = 0;
      this.printValue(this.endVal);
      return;
    }

    // 启动动画
    this.paused = false;
    this.rAF = requestAnimationFrame(this.count);
  }

  count = (timestamp: number): void => {
    if (!this.startTime) {
      this.startTime = timestamp;
    }

    const progress = timestamp - this.startTime;
    this.remaining = this.duration - progress;

    // to ease or not to ease
    if (this.useEasing) {
      if (this.countDown) {
        this.frameVal =
          this.startVal - (this.easingFn ? this.easingFn(progress, 0, this.startVal - this.endVal, this.duration) : 0);
      } else {
        this.frameVal = this.easingFn
          ? this.easingFn(progress, this.startVal, this.endVal - this.startVal, this.duration)
          : this.startVal;
      }
    } else {
      this.frameVal = this.startVal + (this.endVal - this.startVal) * (progress / this.duration);
    }

    // don't go past endVal since progress can exceed duration in the last frame
    const wentPast = this.countDown ? this.frameVal < this.endVal : this.frameVal > this.endVal;
    this.frameVal = wentPast ? this.endVal : this.frameVal;

    // 确保 frameVal 不是 NaN
    if (isNaN(this.frameVal)) {
      this.frameVal = this.endVal;
    }

    // decimal
    this.frameVal = Number(this.frameVal.toFixed(this.options?.decimalPlaces));

    // 再次检查，确保格式化后不是 NaN
    if (isNaN(this.frameVal)) {
      this.frameVal = this.endVal;
    }

    // format and print value
    this.printValue(this.frameVal);

    // whether to continue
    if (progress < this.duration) {
      // 继续动画
      this.rAF = requestAnimationFrame(this.count);
    } else if (this.finalEndVal !== null) {
      // smart easing
      this.update(this.finalEndVal);
    } else {
      // const timestamp = new Date().toLocaleTimeString();
      // const isIncrementAnimation = this.duration > 0 && this.duration <= 1000; // 自增动画通常 <= 1秒

      if (this.options?.onCompleteCallback) {
        this.options.onCompleteCallback();
      }
    }
  };

  printValue(val: number): void {
    if (!this.el) return;
    // 确保 val 是有效数字
    if (isNaN(val)) {
      val = 0;
    }
    const result = this.formattingFn(val);
    if (this.options?.plugin?.render) {
      this.options.plugin.render(this.el, result);
      return;
    }
    if (this.el.tagName === "INPUT") {
      const input = this.el as HTMLInputElement;
      input.value = result;
    } else if (this.el.tagName === "text" || this.el.tagName === "tspan") {
      this.el.textContent = result;
    } else {
      this.el.innerHTML = result;
    }
  }

  ensureNumber(n: any): boolean {
    return typeof n === "number" && !isNaN(n);
  }

  validateValue(value: string | number): number {
    const newValue = Number(value);
    if (!this.ensureNumber(newValue)) {
      this.error = `[CountUp] invalid start or end value: ${value}`;
      return 0; // 返回默认值而不是 null
    }
    return newValue;
  }

  private resetDuration(): void {
    this.startTime = null;
    const durationValue = Number(this.options?.duration ?? 0);
    this.duration = isNaN(durationValue) ? 0 : durationValue * 1000;
    this.remaining = this.duration;
  }

  // default format and easing functions

  formatNumber = (num: number): string => {
    // 如果 num 是 NaN，使用 0 作为默认值
    if (isNaN(num)) {
      num = 0;
    }
    const neg = num < 0 ? "-" : "";
    let result: string, x1: string, x2: string, x3: string;
    result = Math.abs(num).toFixed(this.options?.decimalPlaces ?? 0);
    result += "";
    const x = result.split(".");
    x1 = x[0];
    x2 = x.length > 1 ? (this.options?.decimal ?? "") + x[1] : "";
    if (this.options?.useGrouping) {
      x3 = "";
      let factor = 3,
        j = 0;
      for (let i = 0, len = x1.length; i < len; ++i) {
        if (this.options?.useIndianSeparators && i === 4) {
          factor = 2;
          j = 1;
        }
        if (i !== 0 && j % factor === 0) {
          x3 = (this.options?.separator ?? "") + x3;
        }
        j++;
        x3 = x1[len - i - 1] + x3;
      }
      x1 = x3;
    }
    // 修复 numerals 替换
    if (this.options?.numerals?.length) {
      x1 = x1.replace(/[0-9]/g, (w) => this.options?.numerals?.[+w] || w);
      x2 = x2.replace(/[0-9]/g, (w) => this.options?.numerals?.[+w] || w);
    }
    return neg + (this.options?.prefix ?? "") + x1 + x2 + (this.options?.suffix ?? "");
  };

  // t: current time, b: beginning value, c: change in value, d: duration
  easeOutExpo = (t: number, b: number, c: number, d: number): number =>
    (c * (-Math.pow(2, (-10 * t) / d) + 1) * 1024) / 1023 + b;
}
