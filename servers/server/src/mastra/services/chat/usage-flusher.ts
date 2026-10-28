/**
 * stream 期间在多个闭包间共享的 usage，避免裸的可变变量跨作用域读写。
 * 类型保持 unknown：原样透传给前端的 data-usage，本模块不解读其字段。
 */
export interface UsageRef {
  current: unknown;
}

/**
 * usage 一变就补发一帧 data-usage，而不是只在流末尾发一次：
 * 用户中途停止时流末尾那帧到不了前端，进度条会一直停在上一轮（含压缩前）的旧值。
 */
export const createUsageFlusher = (usageRef: UsageRef, enqueue: (chunk: unknown) => void): (() => void) => {
  let sent: unknown;
  return () => {
    if (usageRef.current && usageRef.current !== sent) {
      sent = usageRef.current;
      enqueue({ type: "data-usage", data: sent });
    }
  };
};
