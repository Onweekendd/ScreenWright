/**
 * 计算平滑过渡的动画
 * @param {Object} params - 过渡参数
 * @param {number} params.start - 起始索引
 * @param {number} params.end - 结束索引
 * @param {number} params.totalCount - 总数量
 * @param {(current: number) => void} params.onProgress - 进度回调
 * @param {() => void} params.onComplete - 完成回调
 */
interface SmoothTransitionParams {
  start: number;
  end: number;
  totalCount: number;
  onProgress: (current: number) => void;
  onComplete?: () => void;
}
export function smoothTransitionUtils({ start, end, totalCount, onProgress, onComplete }: SmoothTransitionParams) {
  let distance = Math.abs(end - start);

  // 计算最短路径
  const alternateDistance = totalCount - distance;
  if (alternateDistance < distance) {
    distance = alternateDistance;
    if (end > start) {
      end = start - alternateDistance;
    } else {
      end = start + alternateDistance;
    }
  }

  let current = start;
  const startTime = performance.now();
  const duration = Math.max(distance * 50, 300);

  /**
   * 动画步骤函数
   * @param {number} currentTime - 当前时间戳
   */
  const step = (currentTime: number) => {
    if (current === end) {
      onComplete?.();
      return;
    }

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // 使用缓动函数使动画更平滑
    const easeProgress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    const targetPosition = start + (end - start) * easeProgress;
    const newCurrent = Math.round(targetPosition);

    if (newCurrent !== current) {
      current = newCurrent;
      onProgress(((current % totalCount) + totalCount) % totalCount);
    }

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}
