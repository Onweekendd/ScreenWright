import { nextTick, ref } from "vue";

/**
 * 画布裁剪的暂停开关。
 *
 * 单独成文件是为了让截图模块能引用它，又不用把整个编辑器状态（useEditStore）带进来。
 */

/** 截图期间暂停裁剪的计数（可能有多个截图并发） */
export const suspendCount = ref(0);

/** 各画布当前被隐藏的组件数；截图前据此决定要不要多等一会儿让组件重新渲染出来 */
export const culledCounts = new Map<symbol, number>();
const totalCulled = () => [...culledCounts.values()].reduce((sum, count) => sum + count, 0);

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * 在 task 执行期间暂停画布裁剪，让所有组件都回到 DOM 里。
 *
 * 截图靠量 DOM、画 DOM，被隐藏的组件会整个丢失（或被当成「找不到」）。
 * 图表等组件靠 ResizeObserver 在重新显示后补一次尺寸，所以真有组件被隐藏过时多等几帧。
 */
export const withCullingSuspended = async <T>(task: () => Promise<T>): Promise<T> => {
  const hadCulled = totalCulled() > 0;
  suspendCount.value += 1;
  try {
    await nextTick();
    if (hadCulled) {
      await nextFrame();
      await nextFrame();
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    return await task();
  } finally {
    suspendCount.value -= 1;
  }
};
