/**
 * 签名事件目标类，封装事件处理功能
 */
class SignatureEventTarget {
  private _et: EventTarget | Document;

  /**
   * 创建一个新的事件目标实例
   */
  constructor() {
    try {
      this._et = new EventTarget();
    } catch (_a) {
      this._et = document;
    }
  }

  /**
   * 添加事件监听器
   * @param type - 事件类型
   * @param listener - 事件监听器
   * @param options - 事件监听选项
   */
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void {
    if (listener) {
      this._et.addEventListener(type, listener, options);
    }
  }

  /**
   * 分发事件
   * @param event - 要分发的事件
   * @returns 事件是否被取消
   */
  dispatchEvent(event: Event): boolean {
    return this._et.dispatchEvent(event);
  }

  /**
   * 移除事件监听器
   * @param type - 事件类型
   * @param callback - 事件回调
   * @param options - 事件监听选项
   */
  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions
  ): void {
    if (callback) {
      this._et.removeEventListener(type, callback, options);
    }
  }
}

export default SignatureEventTarget;
