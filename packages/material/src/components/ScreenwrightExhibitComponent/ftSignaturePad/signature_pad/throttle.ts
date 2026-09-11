type ThrottleFunction = <T extends (...args: any[]) => any>(
  fn: T,
  wait?: number
) => (...args: Parameters<T>) => ReturnType<T>;

/**
 * 函数节流，限制函数的执行频率
 * @param fn - 要节流的函数
 * @param wait - 节流等待时间(毫秒)
 * @returns 节流后的函数
 */
const throttle: ThrottleFunction = (fn, wait = 250) => {
  let previous = 0;
  let timeout: number | null = null;
  let result: any;
  let storedContext: any = null;
  let storedArgs: any[];

  /**
   * 延迟执行函数
   * @private
   */
  const later = () => {
    previous = Date.now();
    timeout = null;
    result = fn.apply(storedContext, storedArgs);
    if (!timeout) {
      storedContext = null;
      storedArgs = [];
    }
  };

  return function wrapper(this: any, ...args: Parameters<typeof fn>): ReturnType<typeof fn> {
    const now = Date.now();
    const remaining = wait - (now - previous);
    storedContext = this;
    storedArgs = args;

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = fn.apply(storedContext, storedArgs);
      if (!timeout) {
        storedContext = null;
        storedArgs = [];
      }
    } else if (!timeout) {
      timeout = window.setTimeout(later, remaining);
    }
    return result;
  };
};

export default throttle;
