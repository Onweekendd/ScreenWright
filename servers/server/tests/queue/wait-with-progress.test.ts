import { EventEmitter } from "node:events";

import type { QueueEvents } from "bullmq";
import { describe, expect, it, vi } from "vitest";

import { waitWithProgress } from "@/queue/wait-with-progress";

/** 队列事件的替身：只用到 on / off，progress 事件的形态与 BullMQ 一致 { jobId, data } */
const fakeEvents = () => new EventEmitter() as unknown as QueueEvents & EventEmitter;

const jobThatFinishesAfter = (emit: () => void, id = "job-1") => ({
  id,
  waitUntilFinished: async () => {
    emit();
    return "结果";
  }
});

describe("waitWithProgress", () => {
  it("把自己这个任务的进度事件转给 onProgress，并返回结果", async () => {
    const events = fakeEvents();
    const onProgress = vi.fn();
    const job = jobThatFinishesAfter(() => {
      events.emit("progress", { jobId: "job-1", data: 10 });
      events.emit("progress", { jobId: "job-1", data: 75 });
    });

    await expect(waitWithProgress(job, events, 1000, onProgress)).resolves.toBe("结果");

    expect(onProgress.mock.calls).toEqual([[10], [75]]);
  });

  it("别的任务的进度不混进来：同一个队列里同时有别的任务在跑", async () => {
    const events = fakeEvents();
    const onProgress = vi.fn();
    const job = jobThatFinishesAfter(() => events.emit("progress", { jobId: "other", data: 50 }));

    await waitWithProgress(job, events, 1000, onProgress);

    expect(onProgress).not.toHaveBeenCalled();
  });

  it("进度不是数字（BullMQ 的 progress 也可以是对象）时忽略", async () => {
    const events = fakeEvents();
    const onProgress = vi.fn();
    const job = jobThatFinishesAfter(() => events.emit("progress", { jobId: "job-1", data: { a: 1 } }));

    await waitWithProgress(job, events, 1000, onProgress);

    expect(onProgress).not.toHaveBeenCalled();
  });

  it("结束后（无论成败）摘掉监听，不泄漏", async () => {
    const events = fakeEvents();
    const failing = {
      id: "job-1",
      waitUntilFinished: async () => {
        throw new Error("任务失败");
      }
    };

    await expect(waitWithProgress(failing, events, 1000, vi.fn())).rejects.toThrow("任务失败");

    expect(events.listenerCount("progress")).toBe(0);
  });

  it("没有 onProgress 时不挂监听", async () => {
    const events = fakeEvents();
    const job = {
      id: "job-1",
      waitUntilFinished: async () => {
        expect(events.listenerCount("progress")).toBe(0);
        return "结果";
      }
    };

    await expect(waitWithProgress(job, events, 1000)).resolves.toBe("结果");
  });
});
