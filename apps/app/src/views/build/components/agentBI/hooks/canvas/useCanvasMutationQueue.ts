/**
 * 画布写入串行队列（模块级单例）。
 *
 * 多个对话 tab 共享同一块画布（组件树 / 路由 / 大屏配置只有一份）。无论哪个 tab 触发
 * Figma 转换、创建/删除组件、更新大屏配置等「真正修改画布」的操作，都必须串行执行，
 * 避免并发写入互相破坏（路由跳转打断、组件树并发写坏）。
 *
 * 实现是一条单向增长的 Promise 链：每个新任务都挂在上一个任务之后执行；
 * 链上某个任务 reject 不会阻塞后续任务（chain 用 catch 兜底吞掉错误，
 * 但 enqueue 的调用方仍能通过返回的 promise 拿到真实结果/异常）。
 */
let chain: Promise<unknown> = Promise.resolve();

/**
 * 把一个画布写入任务入队，保证它在前面所有已入队任务完成后才开始执行。
 * @param task - 实际执行画布写入的异步函数
 * @returns 该任务的执行结果（resolve/reject 透传给调用方）
 */
export function enqueueCanvasMutation<T>(task: () => Promise<T>): Promise<T> {
  const result = chain.then(task);
  // 链本身吞掉错误，防止一个任务失败后令后续任务被 reject 连锁中断；
  // 真实的成功/失败由返回给调用方的 result 承载。
  chain = result.catch(() => {});
  return result;
}
