# Mocean 接口测试规范

目录：
- [测试目录结构](#测试目录结构)
- [测试框架和工具](#测试框架和工具)
- [集成测试完整示例](#集成测试完整示例)
- [单元测试完整示例](#单元测试完整示例)
- [Schema 单元测试](#schema-单元测试)
- [数据工厂模式](#数据工厂模式)
- [断言模式速查](#断言模式速查)

---

## 测试目录结构

```
__tests__/
├── setup/
│   ├── database.ts          # 数据库初始化、清理、连接管理
│   └── vitest.setup.ts      # 全局钩子 + vi.mock prisma
├── helpers/
│   ├── factories.ts         # 数据工厂（build + create 模式）
│   └── test-app.ts          # createTestApp() 工具函数
├── integration/
│   └── router/
│       └── xxx.test.ts      # 路由集成测试（含真实数据库）
└── unit/
    ├── schema/
    │   └── xxx.test.ts      # Schema 验证单元测试
    └── server/
        └── xxx.test.ts      # 业务逻辑单元测试（Mock）
```

新模块需添加：
- `integration/router/xxx.test.ts`（必须）
- `unit/schema/xxx.test.ts`（推荐）
- `unit/server/xxx.test.ts`（有复杂业务逻辑时添加）

---

## 测试框架和工具

- **框架**：vitest 2.x（全局 `describe/it/expect`，无需导入）
- **HTTP**：Hono 原生 API（不用 supertest）
- **数据库**：每个测试文件独立 SQLite 文件，`beforeEach` 清空所有表
- **并发**：`fileParallelism: false` + `singleFork: true`（串行，避免数据竞争）

---

## 集成测试完整示例

文件：`__tests__/integration/router/xxx.test.ts`

```typescript
import { beforeEach, describe, expect, it } from "vitest";

import { xxxRouter } from "../../../router/xxx";
import { xxxFactory } from "../../helpers/factories";
import { createTestApp } from "../../helpers/test-app";
import { getTestPrisma } from "../../setup/database";

const BASE = "/customApi/xxx";  // 与 router/type.ts 中的 path 一致

describe("Xxx Router", () => {
  let prisma: Awaited<ReturnType<typeof getTestPrisma>>;
  const app = createTestApp(xxxRouter);

  beforeEach(async () => {
    prisma = await getTestPrisma();
  });

  /** 构造创建请求体，支持 overrides */
  function buildCreateBody(overrides?: Partial<Record<string, unknown>>) {
    return {
      name: "Test Xxx",
      // ... 其他必填字段
      ...overrides
    };
  }

  /** 通过 API 创建并返回响应 */
  async function createViaApi(overrides?: Partial<Record<string, unknown>>) {
    const res = await app.request(BASE, {
      method: "POST",
      body: JSON.stringify(buildCreateBody(overrides)),
      headers: { "Content-Type": "application/json" }
    });
    return { res, body: (await res.json()) as Record<string, unknown> };
  }

  // ─── GET 列表 ─────────────────────────────────────────
  describe("获取列表", () => {
    it("没有数据时应返回空数组", async () => {
      const res = await app.request(BASE);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([]);
    });

    it("应返回所有已创建的数据", async () => {
      await xxxFactory.create(prisma, { name: "Xxx A" });
      await xxxFactory.create(prisma, { name: "Xxx B" });

      const res = await app.request(BASE);
      expect(res.status).toBe(200);

      const body = (await res.json()) as Array<Record<string, unknown>>;
      expect(body).toHaveLength(2);
      expect(body.map((x) => x.name)).toContain("Xxx A");
    });
  });

  // ─── GET 单个 ─────────────────────────────────────────
  describe("根据 ID 获取", () => {
    it("应返回指定数据的详细信息", async () => {
      const { body: created } = await createViaApi();
      const id = created.id as string;

      const res = await app.request(`${BASE}/${id}`);
      expect(res.status).toBe(200);

      const body = (await res.json()) as Record<string, unknown>;
      expect(body.id).toBe(id);
    });

    it("不存在的 ID 应返回 404", async () => {
      const res = await app.request(`${BASE}/non-existent-id`);
      expect(res.status).toBe(404);
    });
  });

  // ─── POST 创建 ────────────────────────────────────────
  describe("创建", () => {
    it("应成功创建并返回 201", async () => {
      const { res, body } = await createViaApi();

      expect(res.status).toBe(201);
      expect(body).toMatchObject({ name: "Test Xxx" });
      expect(body.id).toBeDefined();
      expect(body.createdAt).toBeDefined();
    });

    it("名称为空时应返回 400", async () => {
      const res = await app.request(BASE, {
        method: "POST",
        body: JSON.stringify(buildCreateBody({ name: "" })),
        headers: { "Content-Type": "application/json" }
      });
      expect(res.status).toBe(400);
    });

    it("缺少必填字段时应返回 400", async () => {
      const res = await app.request(BASE, {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" }
      });
      expect(res.status).toBe(400);
    });
  });

  // ─── PUT 更新 ─────────────────────────────────────────
  describe("更新", () => {
    it("应成功更新字段", async () => {
      const { body: created } = await createViaApi();
      const id = created.id as string;

      const res = await app.request(`${BASE}/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name: "Updated Name" }),
        headers: { "Content-Type": "application/json" }
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.name).toBe("Updated Name");
    });
  });

  // ─── DELETE ──────────────────────────────────────────
  describe("删除", () => {
    it("应成功删除并返回被删除的数据", async () => {
      const { body: created } = await createViaApi();
      const id = created.id as string;

      const res = await app.request(`${BASE}/${id}`, { method: "DELETE" });

      expect(res.status).toBe(200);
      expect(((await res.json()) as Record<string, unknown>).id).toBe(id);
    });

    it("删除后应无法再获取该数据", async () => {
      const { body: created } = await createViaApi();
      const id = created.id as string;

      await app.request(`${BASE}/${id}`, { method: "DELETE" });

      const getRes = await app.request(`${BASE}/${id}`);
      expect(getRes.status).toBe(404);
    });
  });
});
```

---

## 单元测试完整示例

适用于有复杂业务逻辑的服务函数（如带约束的删除、状态切换等）。

文件：`__tests__/unit/server/xxx.test.ts`

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createXxxService } from "../../../server/xxx";

function createMockPrisma() {
  return {
    xxx: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  };
}

describe("Xxx Service - 单元测试", () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let service: ReturnType<typeof createXxxService>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = createXxxService(mockPrisma);
  });

  describe("deleteXxx", () => {
    it("有关联数据时应抛出错误", async () => {
      mockPrisma.xxx.findUnique.mockResolvedValue({
        id: "x1",
        _count: { relatedItems: 3 }
      });

      await expect(service.deleteXxx("x1")).rejects.toThrow("无法删除");
      expect(mockPrisma.xxx.delete).not.toHaveBeenCalled();
    });

    it("无关联数据时应成功删除", async () => {
      mockPrisma.xxx.findUnique.mockResolvedValue({
        id: "x1",
        _count: { relatedItems: 0 }
      });
      mockPrisma.xxx.delete.mockResolvedValue({ id: "x1" });

      const result = await service.deleteXxx("x1");

      expect(result.id).toBe("x1");
      expect(mockPrisma.xxx.delete).toHaveBeenCalledWith({ where: { id: "x1" } });
    });
  });
});
```

**注意**：单元测试需要业务逻辑函数支持依赖注入（接受 prisma 参数），当前项目 provider 模块已采用此模式（`createProviderService(prisma)`），新模块如有复杂逻辑推荐同样处理。

---

## Schema 单元测试

文件：`__tests__/unit/schema/xxx.test.ts`

```typescript
import { describe, expect, it } from "vitest";
import { createXxxSchema, updateXxxSchema, xxxIdParamSchema } from "../../../schema/xxx";

describe("Xxx Schema 验证", () => {
  describe("createXxxSchema", () => {
    const valid = { name: "Test Xxx", prompt: "..." };

    it("应通过最小有效数据", () => {
      expect(createXxxSchema.safeParse(valid).success).toBe(true);
    });

    it("应填充默认值", () => {
      const result = createXxxSchema.parse(valid);
      expect(result.enabled).toBe(true);  // 验证 .default() 是否生效
    });

    it("name 为空时应失败", () => {
      const result = createXxxSchema.safeParse({ ...valid, name: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        const err = result.error.issues.find((i) => i.path.includes("name"));
        expect(err?.message).toBe("名称不能为空");
      }
    });

    it("缺少必填字段时应失败", () => {
      expect(createXxxSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("updateXxxSchema", () => {
    it("空对象应通过（所有字段可选）", () => {
      expect(updateXxxSchema.safeParse({}).success).toBe(true);
    });

    it("部分字段应通过", () => {
      const result = updateXxxSchema.safeParse({ name: "New Name" });
      expect(result.success).toBe(true);
    });
  });

  describe("xxxIdParamSchema", () => {
    it("有效 id 应通过", () => {
      expect(xxxIdParamSchema.safeParse({ xxxId: "abc-123" }).success).toBe(true);
    });

    it("空字符串 id 应失败", () => {
      expect(xxxIdParamSchema.safeParse({ xxxId: "" }).success).toBe(false);
    });
  });
});
```

---

## 数据工厂模式

在 `helpers/factories.ts` 中为新模块添加工厂：

```typescript
export const xxxFactory = {
  /** 构建请求体（不入库）- 用于 POST body */
  build: (overrides?: Partial<Parameters<PrismaClient["xxx"]["create"]>[0]["data"]>) => ({
    name: "Test Xxx",
    description: "Test description",
    enabled: true,
    ...overrides
  }),

  /** 创建并入库 - 用于测试前置数据 */
  create: async (
    prisma: PrismaClient,
    overrides?: Partial<Parameters<PrismaClient["xxx"]["create"]>[0]["data"]>
  ) => {
    return prisma.xxx.create({
      data: xxxFactory.build(overrides),
      include: { model: true }  // 按需添加 include
    });
  }
};
```

---

## 断言模式速查

### 状态码

| 场景 | 状态码 |
|------|--------|
| GET 成功 | 200 |
| POST 创建成功 | 201 |
| PUT/DELETE 成功 | 200 |
| 验证错误（Zod） | 400 |
| 资源不存在 | 404 |
| 业务约束冲突 | 409 |

### 响应断言

```typescript
// 基本
expect(res.status).toBe(200);
expect(await res.json()).toEqual([]);

// 对象匹配（忽略额外字段）
expect(body).toMatchObject({ name: "Test", type: "xxx" });

// 属性存在
expect(body.id).toBeDefined();
expect(body).toHaveProperty("settings");

// 数组
expect(body).toHaveLength(2);
expect(body.map(x => x.name)).toContain("Xxx A");

// 错误消息（文本响应）
expect(await res.text()).toContain("不存在");

// Mock 调用验证
expect(mockPrisma.xxx.delete).toHaveBeenCalledWith({ where: { id: "x1" } });
expect(mockPrisma.xxx.delete).not.toHaveBeenCalled();
```
