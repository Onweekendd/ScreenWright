export type ReleaseAppWriteLock = () => void;

/**
 * 限制同一个 App 在当前进程中只能存在一个写任务。
 *
 * 该锁只负责进程内互斥，不作为跨进程或跨机器的分布式锁。
 */
export class InMemoryAppWriteLock {
  private readonly lockedAppIds = new Set<string>();

  /**
   * 尝试取得 App 写锁。
   *
   * @param appId 要写入的 App ID。
   * @returns 成功时返回幂等释放函数；App 已被占用时返回 undefined。
   */
  tryAcquire(appId: string): ReleaseAppWriteLock | undefined {
    if (this.lockedAppIds.has(appId)) {
      return undefined;
    }

    this.lockedAppIds.add(appId);
    let released = false;

    return () => {
      if (released) {
        return;
      }

      released = true;
      this.lockedAppIds.delete(appId);
    };
  }
}
