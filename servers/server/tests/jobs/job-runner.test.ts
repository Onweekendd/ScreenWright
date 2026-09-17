import { describe, expect, it } from "vitest";

import { JobRunner } from "@/jobs/job-runner";
import { MemoryJobStore } from "@/jobs/memory-job-store";

/** 可手动拨动的时钟，用来测退避而不用真的等 */
function makeClock(start = 1_000_000) {
  let current = start;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    }
  };
}

function makeRunner(overrides: Partial<ConstructorParameters<typeof JobRunner>[0]> = {}) {
  const store = new MemoryJobStore();
  const clock = makeClock();
  let seq = 0;
  const runner = new JobRunner({
    store,
    now: clock.now,
    idGenerator: () => `job-${++seq}`,
    backoffMs: (attempt) => attempt * 1000,
    ...overrides
  });
  return { runner, store, clock };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("JobRunner.enqueue", () => {
  it("入队后作业为 pending，字段初始化正确", async () => {
    const { runner, clock } = makeRunner();

    const id = await runner.enqueue("image-gen", { prompt: "a cat" });
    const job = await runner.getJob(id);

    expect(id).toBe("job-1");
    expect(job).toMatchObject({
      type: "image-gen",
      payload: { prompt: "a cat" },
      status: "pending",
      progress: 0,
      attempts: 0,
      maxAttempts: 3,
      runAfter: clock.now()
    });
  });

  it("delayMs 会推迟 runAfter", async () => {
    const { runner, clock } = makeRunner();

    const id = await runner.enqueue("image-gen", {}, { delayMs: 5000 });
    const job = await runner.getJob(id);

    expect(job?.runAfter).toBe(clock.now() + 5000);
  });
});

describe("JobRunner.tick — 正常执行", () => {
  it("领取 pending 作业、执行 handler、写入 completed 和 result", async () => {
    const { runner } = makeRunner();
    runner.register<{ prompt: string }, { url: string }>("image-gen", async (payload) => ({
      url: `https://img/${payload.prompt}`
    }));
    const id = await runner.enqueue("image-gen", { prompt: "cat" });

    const processed = await runner.tick();
    const job = await runner.getJob(id);

    expect(processed).toBe(1);
    expect(job).toMatchObject({
      status: "completed",
      progress: 100,
      attempts: 1,
      result: { url: "https://img/cat" }
    });
  });

  it("队列为空时返回 0", async () => {
    const { runner } = makeRunner();
    expect(await runner.tick()).toBe(0);
  });

  it("runAfter 未到的作业不会被领取", async () => {
    const { runner, clock } = makeRunner();
    runner.register("image-gen", async () => "ok");
    const id = await runner.enqueue("image-gen", {}, { delayMs: 5000 });

    expect(await runner.tick()).toBe(0);
    expect((await runner.getJob(id))?.status).toBe("pending");

    clock.advance(5000);
    expect(await runner.tick()).toBe(1);
    expect((await runner.getJob(id))?.status).toBe("completed");
  });

  it("handler 可以上报进度，进度实时可查", async () => {
    const { runner } = makeRunner();
    const seen: number[] = [];
    runner.register("image-gen", async (_payload, ctx) => {
      await ctx.reportProgress(30);
      seen.push((await runner.getJob(ctx.job.id))!.progress);
      await ctx.reportProgress(70);
      seen.push((await runner.getJob(ctx.job.id))!.progress);
      return "done";
    });
    await runner.enqueue("image-gen", {});

    await runner.tick();

    expect(seen).toEqual([30, 70]);
  });
});

describe("JobRunner.tick — 失败与重试", () => {
  it("失败后 attempts < maxAttempts：回到 pending 并按退避推迟 runAfter", async () => {
    const { runner, clock } = makeRunner();
    runner.register("image-gen", async () => {
      throw new Error("API timeout");
    });
    const id = await runner.enqueue("image-gen", {}, { maxAttempts: 3 });

    await runner.tick();
    const job = await runner.getJob(id);

    expect(job).toMatchObject({
      status: "pending",
      attempts: 1,
      lastError: "API timeout",
      runAfter: clock.now() + 1000 // backoffMs(1)
    });
  });

  it("退避期间不会被再次领取，时间到了才重试", async () => {
    const { runner, clock } = makeRunner();
    let calls = 0;
    runner.register("image-gen", async () => {
      calls += 1;
      if (calls === 1) {
        throw new Error("flaky");
      }
      return "recovered";
    });
    const id = await runner.enqueue("image-gen", {});

    await runner.tick(); // 第 1 次失败
    expect(await runner.tick()).toBe(0); // 退避中，不领
    expect(calls).toBe(1);

    clock.advance(1000);
    await runner.tick(); // 第 2 次成功

    expect(calls).toBe(2);
    expect(await runner.getJob(id)).toMatchObject({ status: "completed", attempts: 2, result: "recovered" });
  });

  it("重试用尽后标记为 failed", async () => {
    const { runner, clock } = makeRunner();
    runner.register("image-gen", async () => {
      throw new Error("always broken");
    });
    const id = await runner.enqueue("image-gen", {}, { maxAttempts: 2 });

    await runner.tick();
    clock.advance(1000);
    await runner.tick();

    expect(await runner.getJob(id)).toMatchObject({
      status: "failed",
      attempts: 2,
      lastError: "always broken"
    });
  });

  it("handler 抛出非 Error 值时 lastError 也要是字符串", async () => {
    const { runner } = makeRunner();
    runner.register("image-gen", async () => {
      throw "raw string error";
    });
    const id = await runner.enqueue("image-gen", {}, { maxAttempts: 1 });

    await runner.tick();

    expect((await runner.getJob(id))?.lastError).toBe("raw string error");
  });

  it("没有注册 handler 的作业类型直接 failed，不重试", async () => {
    const { runner } = makeRunner();
    const id = await runner.enqueue("unknown-type", {}, { maxAttempts: 3 });

    await runner.tick();
    const job = await runner.getJob(id);

    expect(job?.status).toBe("failed");
    expect(job?.lastError).toContain("unknown-type");
  });
});

describe("JobRunner.tick — 并发上限", () => {
  it("同时执行的作业数不超过 concurrency", async () => {
    const { runner } = makeRunner({ concurrency: 2 });
    let inFlight = 0;
    let peak = 0;
    runner.register("image-gen", async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await sleep(5);
      inFlight -= 1;
      return "ok";
    });
    for (let i = 0; i < 5; i++) {
      await runner.enqueue("image-gen", { i });
    }

    const rounds = [await runner.tick(), await runner.tick(), await runner.tick()];

    expect(rounds).toEqual([2, 2, 1]);
    expect(peak).toBe(2);
    expect(await runner.tick()).toBe(0);
  });
});

describe("JobRunner.recover", () => {
  it("启动时把遗留的 running 作业重置为 pending", async () => {
    const { runner, store } = makeRunner();
    runner.register("image-gen", async () => "ok");
    const id = await runner.enqueue("image-gen", {});
    // 模拟：上一次进程在执行中崩溃，作业卡在 running
    await store.update(id, { status: "running", attempts: 1 });

    const recovered = await runner.recover();

    expect(recovered).toBe(1);
    expect((await runner.getJob(id))?.status).toBe("pending");
    // 恢复后可以正常被领取执行
    expect(await runner.tick()).toBe(1);
    expect((await runner.getJob(id))?.status).toBe("completed");
  });
});

describe("JobRunner.start / stop", () => {
  it("start 后自动消费队列，stop 等待进行中的作业结束", async () => {
    const { runner } = makeRunner({ pollIntervalMs: 1 });
    const finished: string[] = [];
    runner.register("image-gen", async (payload: { name: string }) => {
      await sleep(10);
      finished.push(payload.name);
      return payload.name;
    });

    runner.start();
    runner.start(); // 重复调用应幂等，不应起第二个循环
    await runner.enqueue("image-gen", { name: "a" });
    await runner.enqueue("image-gen", { name: "b" });

    // 等到 a 开始执行但尚未结束时调用 stop
    await sleep(8);
    await runner.stop();

    // stop 返回时，正在执行的作业必须已经完成（不能被丢在 running）
    const running = await runner.getJob("job-1");
    expect(running?.status).not.toBe("running");
    expect(finished).toContain("a");

    // stop 之后不再消费新作业
    const before = finished.length;
    await runner.enqueue("image-gen", { name: "c" });
    await sleep(30);
    expect(finished.length).toBe(before);
  });
});
