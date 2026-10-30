# 大屏数据完整性改造

每完成一项，跑一遍集成测试，对应的红灯变绿就算完成，然后找 Claude 讲这一项的知识点。

```bash
cd servers/server
# 集成测试（连 5434 端口的测试库 funbi-test-pg）
TEST_DATABASE_URL=postgresql://funbi:funbi_test@localhost:5434/funbi_test npx vitest --run tests/db
# 原有的单元测试（mock 的那些），改完也要保持全绿
npx vitest --run tests/services
npx tsc --noEmit -p tsconfig.json
```

测试库容器没了就重建（数据在内存里，重启即清空）：

```bash
MSYS_NO_PATHCONV=1 docker run -d --name funbi-test-pg -e POSTGRES_USER=funbi -e POSTGRES_PASSWORD=funbi_test \
  -e POSTGRES_DB=funbi_test -p 5434:5432 --tmpfs /var/lib/postgresql/data pgvector/pgvector:pg16
PRISMA_DATABASE_URL=postgresql://funbi:funbi_test@localhost:5434/funbi_test npx prisma migrate deploy
```

---

## 1. 索引

- [x] `prisma/schema.prisma` 的 `Layers`：加「大屏 + 版本」的联合索引。想清楚原来的 `@@index([largeId])` 还要不要留
- [x] 找出另外两个重复索引并删掉（一个在 `LargeScreenVersion`，一个在 `MinioFile`）
- [x] 改完 schema 告诉 Claude：生成迁移 SQL，你核对一遍再应用到测试库

变绿：`索引 › 图层表按「大屏 + 版本」查询有联合索引`

知识点：B+ 树、联合索引、最左前缀、索引对写入的代价、`EXPLAIN ANALYZE`

## 2. 去掉大屏访问密码

功能不用了：明文存、明文返回、打开时也不校验。前端只在类型定义里出现，没有设置入口。

- [x] `src/mastra/types/large-screen.ts`：新建、修改大屏的请求不再接收 `password`
- [x] `src/mastra/services/screen/large-screen.server.ts`：
  - 新建、修改时不再写 `password`
  - `toScreenItem` 等返回给前端的结构里去掉 `password`（`hasPassword` 留不留你决定）
  - `openScreen` / `openCheck` 的 `_password` 参数
- [x] `src/mastra/services/version/version.server.ts`：`VERSION_SCOPED_FIELDS` 和 `VersionVo` 里的 `password`
- [x] 前端类型 `apps/app/src/model/{Library,Version,Visual}.ts`
- [x] 数据库列也删了：迁移 `20261030000000_drop_screen_password`

验证：`tests/services` 全绿（有用例断言了 password 的要跟着改）

知识点：接口最小暴露、过度获取、上线时「先停用代码、再删列」

## 3. 事务：中途失败要整体回滚

先做准备，再逐个函数改。

- [ ] **准备**：辅助函数要能在事务里用。`version.server.ts` 里的 `ensureVersionRow`、`mirrorVersionToScreen`、`patchVersionConfig`、`nextVersionCode`、`cloneLayers` 现在写死了 `prismaClient`，改成可以传入一个客户端参数（默认还是 `prismaClient`）。类型用 `Prisma.TransactionClient`
- [ ] `createFromVersion`（复制版本）用 `prismaClient.$transaction(async (tx) => { ... })` 包起来，里面所有读写都用 `tx`
  - 注意交互式事务**默认 5 秒超时**，300 个组件要发 600 次查询。想想怎么办（调超时？批量插入 `createManyAndReturn`？）
- [ ] `saveLayer`、`deleteLayer`（`layers.server.ts`）
- [ ] `createScreen`、`updateScreen`、`deleteGroup`（`large-screen.server.ts`）

变绿：`事务：中途失败要整体回滚` 下的 4 个

知识点：ACID 里的原子性、批量事务 vs 交互式事务、为什么 `tx` 要一路往下传、长事务的危害、连接池

## 4. 丢失更新

- [ ] **先别改**：第 3 步做完后跑一遍并发测试，确认它**还是红的**。想想为什么包了事务还会丢
- [ ] 修 `patchVersionConfig` 的「读 → 改 → 写」。三种做法任选，最好想清楚三种的区别再选：
  - 悲观锁：事务里先 `SELECT ... FOR UPDATE` 锁住版本行，再读、再写
  - 乐观锁：写的时候带上读到的版本号或更新时间，对不上就重试
  - 不读直接改：用一条 SQL 在数据库里原地追加 / 删除数组元素（`jsonb` 操作符）

变绿：`并发 › 同一版本并发新增 5 个组件，组件列表里一个都不能少（丢失更新）`

知识点：隔离级别（PostgreSQL 默认读已提交）、丢失更新、悲观锁 vs 乐观锁、死锁和加锁顺序、可串行化 + 重试

## 5. 外键与级联删除

- [ ] `schema.prisma`：`LargeScreenVersion.largeId`、`Layers.largeId` 加上指向 `LargeScreen` 的外键关系，删除时级联（`onDelete: Cascade`）
- [ ] **迁移里先清孤儿数据，再加外键**：已经存在「大屏没了、版本和图层还在」的行，直接加外键迁移会失败。写出找孤儿和删孤儿的 SQL
  - 上线前先在生产库**只读地**数一下有多少孤儿行
- [ ] `deleteGroup`、`deleteScreen`：有了级联，哪些手动删除可以去掉？

变绿：`级联删除 › 删除分组并连带删除大屏`

知识点：外键约束、`CASCADE` / `RESTRICT` / `SET NULL` 怎么选、PostgreSQL **不会**自动给外键列建索引、大表加外键会锁表（`NOT VALID` + `VALIDATE`）

---

## 之后再做

- [ ] 3 个用 GET 改数据的版本接口改成正确的方法，前端跟着改
- [ ] 日志：轮转 + Dozzle；以后结构化日志 + Loki
- [ ] 大屏和版本字段分离（扩展-收缩）、完整 RESTful
