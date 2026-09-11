import { describe, expect, it } from "vitest";

import { enqueueCanvasMutation } from "@/views/build/components/agentBI/hooks/useCanvasMutationQueue";

/** 受控 promise：手动 resolve/reject，用于断言执行时序 */
const deferred = <T = void>() => {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe("useCanvasMutationQueue", () => {
  it("串行执行：第二个任务的 task 在第一个 resolve 之后才开始", async () => {
    const order: string[] = [];
    const first = deferred();

    const p1 = enqueueCanvasMutation(async () => {
      order.push("task1-start");
      await first.promise;
      order.push("task1-end");
    });

    const p2 = enqueueCanvasMutation(async () => {
      order.push("task2-start");
    });

    // 让微任务跑一轮：此时 task1 已开始，task2 不应开始（被前一个阻塞）
    await Promise.resolve();
    expect(order).toEqual(["task1-start"]);

    // 放行 task1，task2 才能开始
    first.resolve();
    await Promise.all([p1, p2]);

    expect(order).toEqual(["task1-start", "task1-end", "task2-start"]);
  });

  it("某个任务 reject 不阻塞后续任务，且 reject 透传给调用方", async () => {
    const p1 = enqueueCanvasMutation(async () => {
      throw new Error("boom");
    });
    const p2 = enqueueCanvasMutation(async () => "ok");

    await expect(p1).rejects.toThrow("boom");
    await expect(p2).resolves.toBe("ok");
  });

  it("成功任务的返回值透传给调用方", async () => {
    const result = await enqueueCanvasMutation(async () => 42);
    expect(result).toBe(42);
  });
});
