/**
 * 大屏 / 版本 / 图层的数据完整性：事务、并发、级联删除、索引。连真 PostgreSQL，用法见 ./db-test-helpers.ts。
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  // 必须在导入 prismaClient 之前换掉连接串
  if (process.env.TEST_DATABASE_URL) {
    process.env.PRISMA_DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

import { createScreen, deleteGroup } from "@/mastra/services/screen/large-screen.server";
import { deleteLayer, saveLayer } from "@/mastra/services/screen/layers.server";
import { copyVersion } from "@/mastra/services/version/version.server";
import { prismaClient } from "@/mastra/storage/prisma";
import type { ScreenSaveReq } from "@/mastra/types/large-screen";

import {
  armFailpoint,
  assertTestDatabase,
  clearFailpoints,
  hasTestDatabase,
  installFailpoints
} from "./db-test-helpers";

const USER_ID = 1;
const USER_NAME = "集成测试";

async function newScreen(over: Partial<ScreenSaveReq> = {}): Promise<number> {
  const { result } = await createScreen(USER_ID, USER_NAME, { name: "集成测试大屏", ...over });
  return result.id;
}

/** 直接插一个图层（不走 saveLayer，不碰版本的组件列表） */
async function insertLayer(largeId: number, versionCode = "1"): Promise<number> {
  const layer = await prismaClient.layers.create({ data: { largeId, versionCode, config: {} } });
  return layer.id;
}

async function versionConfig(largeId: number, versionCode = "1"): Promise<unknown> {
  const version = await prismaClient.largeScreenVersion.findUniqueOrThrow({
    where: { largeId_versionCode: { largeId, versionCode } }
  });
  return version.config;
}

describe.skipIf(!hasTestDatabase)("大屏数据完整性（真 PostgreSQL）", () => {
  beforeAll(async () => {
    assertTestDatabase();
    await installFailpoints();
  });
  afterEach(() => clearFailpoints());
  afterAll(() => prismaClient.$disconnect());

  describe("事务：中途失败要整体回滚", () => {
    it("复制版本：复制到一半失败，不留下半个版本", async () => {
      const largeId = await newScreen();
      await insertLayer(largeId);
      await insertLayer(largeId);
      await insertLayer(largeId);
      // 复制出来的图层第二遍回写引用时失败：此时版本行和三个图层都已经插进去了
      await armFailpoint("layers", "UPDATE", { largeId, versionCode: "2" });

      await expect(copyVersion(largeId, "1", USER_NAME)).rejects.toThrow();

      expect(await prismaClient.largeScreenVersion.count({ where: { largeId } })).toBe(1);
      expect(await prismaClient.layers.count({ where: { largeId, versionCode: "2" } })).toBe(0);
    });

    it("新增组件：加进组件列表时失败，不留下孤儿图层", async () => {
      const largeId = await newScreen();
      await armFailpoint("large_screen_version", "UPDATE", { largeId });

      await expect(saveLayer(USER_ID, USER_NAME, { largeId, config: { name: "新组件" } })).rejects.toThrow();

      expect(await prismaClient.layers.count({ where: { largeId } })).toBe(0);
    });

    it("删除组件：从组件列表移除时失败，图层不能已经被删", async () => {
      const largeId = await newScreen();
      const { result } = await saveLayer(USER_ID, USER_NAME, { largeId, config: { name: "要删的组件" } });
      await armFailpoint("large_screen_version", "UPDATE", { largeId });

      await expect(deleteLayer(result.id)).rejects.toThrow();

      expect(await prismaClient.layers.count({ where: { id: result.id } })).toBe(1);
      expect(await versionConfig(largeId)).toEqual([result.id]);
    });

    it("新建大屏：建版本行失败时，大屏行也不留下", async () => {
      const name = `建版本失败-${Date.now()}`;
      await armFailpoint("large_screen_version", "INSERT", { versionCode: "fail-on-create" });

      await expect(newScreen({ name, versionCode: "fail-on-create" })).rejects.toThrow();

      expect(await prismaClient.largeScreen.count({ where: { name } })).toBe(0);
    });
  });

  describe("级联删除", () => {
    it("删除分组并连带删除大屏：大屏的版本和图层一起删掉，不留孤儿数据", async () => {
      const group = await prismaClient.largeGroup.create({ data: { userId: USER_ID, name: "要删的分组" } });
      const largeId = await newScreen({ groupId: group.id });
      await insertLayer(largeId);

      await deleteGroup(USER_ID, 1, group.id, true);

      expect(await prismaClient.largeScreen.count({ where: { id: largeId } })).toBe(0);
      expect(await prismaClient.largeScreenVersion.count({ where: { largeId } })).toBe(0);
      expect(await prismaClient.layers.count({ where: { largeId } })).toBe(0);
    });
  });

  describe("并发", () => {
    it("同一版本并发新增 5 个组件，组件列表里一个都不能少（丢失更新）", async () => {
      const largeId = await newScreen();

      const saved = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          saveLayer(USER_ID, USER_NAME, { largeId, config: { name: `并发组件${i}` } })
        )
      );

      const ids = saved.map(({ result }) => result.id).sort((a, b) => a - b);
      const config = (await versionConfig(largeId)) as number[];
      expect([...config].sort((a, b) => a - b)).toEqual(ids);
    });
  });

  describe("索引", () => {
    it("图层表按「大屏 + 版本」查询有联合索引", async () => {
      const indexes = await prismaClient.$queryRaw<{ indexdef: string }[]>`
        SELECT indexdef FROM pg_indexes WHERE tablename = 'layers'`;

      expect(indexes.some(({ indexdef }) => indexdef.includes("(large_id, version_code)"))).toBe(true);
    });
  });
});
