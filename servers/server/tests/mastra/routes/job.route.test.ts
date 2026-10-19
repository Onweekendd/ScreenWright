import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getImageJobInfo: vi.fn(), getQueueMode: vi.fn() }));

vi.mock("@/queue/image-client", () => ({ getImageJobInfo: mocks.getImageJobInfo }));
vi.mock("@/queue/config", () => ({ getQueueMode: mocks.getQueueMode }));

import { jobRouter } from "@/mastra/routes/job.route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getQueueMode.mockReturnValue("redis");
});

describe("GET /image/:id", () => {
  it("返回任务状态与结果", async () => {
    mocks.getImageJobInfo.mockResolvedValue({ id: "j1", state: "completed", progress: 100, result: { id: "img" } });

    const res = await jobRouter.request("/image/j1");

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: "j1", state: "completed", result: { id: "img" } });
    expect(mocks.getImageJobInfo).toHaveBeenCalledWith("j1");
  });

  it("任务不存在 → 404", async () => {
    mocks.getImageJobInfo.mockResolvedValue(null);
    expect((await jobRouter.request("/image/nope")).status).toBe(404);
  });

  it("inline 模式没有队列 → 404，且不会去连 Redis", async () => {
    mocks.getQueueMode.mockReturnValue("inline");

    const res = await jobRouter.request("/image/j1");

    expect(res.status).toBe(404);
    expect(mocks.getImageJobInfo).not.toHaveBeenCalled();
  });
});
