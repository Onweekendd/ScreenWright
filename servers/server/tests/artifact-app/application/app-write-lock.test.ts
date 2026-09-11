import { describe, expect, it } from "vitest";

import { InMemoryAppWriteLock } from "@/artifact-app/application/app-write-lock";

describe("InMemoryAppWriteLock", () => {
  it("tryAcquire：同一 App 已被占用时，应拒绝第二个写任务", () => {
    // Arrange
    const lock = new InMemoryAppWriteLock();
    lock.tryAcquire("app-001");

    // Act
    const secondRelease = lock.tryAcquire("app-001");

    // Assert
    expect(secondRelease).toBeUndefined();
  });

  it("tryAcquire：不同 App 同时申请时，应分别获得写锁", () => {
    // Arrange
    const lock = new InMemoryAppWriteLock();

    // Act
    const firstRelease = lock.tryAcquire("app-001");
    const secondRelease = lock.tryAcquire("app-002");

    // Assert
    expect([typeof firstRelease, typeof secondRelease]).toEqual(["function", "function"]);
  });

  it("tryAcquire：释放写锁后，应允许同一 App 再次申请", () => {
    // Arrange
    const lock = new InMemoryAppWriteLock();
    const release = lock.tryAcquire("app-001");
    release?.();

    // Act
    const nextRelease = lock.tryAcquire("app-001");

    // Assert
    expect(typeof nextRelease).toBe("function");
  });
});
