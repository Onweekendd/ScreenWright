/**
 * 会话注册表：按 threadId 索引存活中的 BIChatStreamSession，并且是**外部拿会话的唯一入口**。
 *
 * 这条不变式因此能收在一处 ——
 * **一个 threadId 最多对应一条存活会话，且会话一旦进入收尾就必须不在表里**。
 * 增（getOrCreate）、查（find）、删（drop）三个口都在这里，读这一个文件就能确认它成立。
 *
 * 依赖是单向的：注册表建会话、会话收尾时回调 onClosed 通知摘除，
 * stream-session 不反向 import 本模块，所以两边没有循环依赖，会话也能脱离注册表单独测。
 *
 * 进程内内存态，只对单实例部署安全（与 src/recording 的 turn 序号同一性质）。
 */
import { BIChatStreamSession } from "./stream-session";

export class SessionRegistry {
  private readonly sessions = new Map<string, BIChatStreamSession>();

  /**
   * 初始轮用：查不到才建，查表 → 建 → 登记三步原子完成。
   *
   * **命中已有会话时直接返回，不会用本次的 connectionSignal 重绑**——否则一次 resume 之类的
   * 短命请求结束时，它的 signal abort 会把整条长会话拆掉。只有初始连接的 signal 有资格拆会话。
   */
  getOrCreate(threadId: string, resourceId: string, connectionSignal?: AbortSignal): BIChatStreamSession {
    const existing = this.sessions.get(threadId);
    if (existing) {
      return existing;
    }

    const session = BIChatStreamSession.create({
      threadId,
      resourceId,
      connectionSignal,
      onClosed: (closed) => this.drop(threadId, closed)
    });
    this.sessions.set(threadId, session);
    return session;
  }

  /**
   * resume 轮 / 后台续接用：只找已存在的会话，把 turn 灌进同一条 outer。
   * 找不到（断连或进程重启）返回 undefined，调用方据此让前端走重连兜底。
   */
  find(threadId: string): BIChatStreamSession | undefined {
    return this.sessions.get(threadId);
  }

  /**
   * 摘除一条登记，由会话收尾时经 onClosed 回调进来。
   *
   * 带身份校验而非直接 delete：过期实例（已被 close 的旧会话）不会误删后来者
   * 用同一 threadId 注册的新会话。当前 closed 卫语句已经挡住了这种调用，
   * 校验在这里是把这条推理局部化——读这一个方法就能确信，不必再去追 closed。
   */
  drop(threadId: string, session: BIChatStreamSession): void {
    if (this.sessions.get(threadId) === session) {
      this.sessions.delete(threadId);
    }
  }

  /** 仅供测试：清空注册表，避免用例间互相污染 */
  reset(): void {
    this.sessions.clear();
  }
}

/** 进程级单例：整个 Screenwright 进程共用一张会话表 */
export const sessionRegistry = new SessionRegistry();
