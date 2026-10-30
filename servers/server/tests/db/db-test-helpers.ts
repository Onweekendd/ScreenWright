/**
 * 连真 PostgreSQL 的集成测试的公共部分。只在设置了 TEST_DATABASE_URL 时运行：
 *
 *   docker run -d --name funbi-test-pg -e POSTGRES_USER=funbi -e POSTGRES_PASSWORD=funbi_test \
 *     -e POSTGRES_DB=funbi_test -p 5434:5432 --tmpfs /var/lib/postgresql/data pgvector/pgvector:pg16
 *   PRISMA_DATABASE_URL=postgresql://funbi:funbi_test@localhost:5434/funbi_test npx prisma migrate deploy
 *   TEST_DATABASE_URL=postgresql://funbi:funbi_test@localhost:5434/funbi_test npx vitest --run tests/db
 *
 * 事务、锁、并发这类行为 mock 测不出来（mock 的 $transaction 只是 Promise.all），必须连真库。
 * 每个用例自己建数据、只断言自己建的行，不清业务表：多个文件并行跑也互不干扰。
 *
 * 测试文件要在导入 prismaClient 之前把 PRISMA_DATABASE_URL 换成 TEST_DATABASE_URL（用 vi.hoisted），
 * prisma.ts 里的 dotenv 不会覆盖已经设置的环境变量。
 */
import { prismaClient } from "@/mastra/storage/prisma";

export const hasTestDatabase = Boolean(process.env.TEST_DATABASE_URL);

/** 防呆：库名不以 _test 结尾就拒绝运行，免得连到开发库或线上库上写数据、装触发器 */
export function assertTestDatabase(): void {
  const url = process.env.PRISMA_DATABASE_URL;
  const database = url ? new URL(url).pathname.replace(/^\//, "") : "";
  if (!database.endsWith("_test")) {
    throw new Error(`集成测试只能连库名以 _test 结尾的数据库，当前是「${database || "未设置"}」`);
  }
}

/** 故障点会挂在这几张表上：表名 → 要拦截的写操作 */
const FAILPOINT_TABLES = ["layers", "large_screen_version"] as const;
type FailpointTable = (typeof FAILPOINT_TABLES)[number];

/**
 * 装故障注入的触发器：登记一条故障点后，匹配的写入会在数据库里直接报错，
 * 用来精确模拟「执行到某一步时失败」，不需要改业务代码。只装在测试库里。
 */
export async function installFailpoints(): Promise<void> {
  await prismaClient.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS test_failpoints (
      tbl text NOT NULL,
      op text NOT NULL,
      large_id int,
      version_code text
    )`);
  await prismaClient.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION test_failpoint() RETURNS trigger AS $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM test_failpoints f
        WHERE f.tbl = TG_TABLE_NAME AND f.op = TG_OP
          AND (f.large_id IS NULL OR f.large_id = NEW.large_id)
          AND (f.version_code IS NULL OR f.version_code = NEW.version_code)
      ) THEN
        RAISE EXCEPTION 'test failpoint: % % large_id=% version_code=%',
          TG_OP, TG_TABLE_NAME, NEW.large_id, NEW.version_code;
      END IF;
      RETURN NEW;
    END $$ LANGUAGE plpgsql`);
  for (const table of FAILPOINT_TABLES) {
    await prismaClient.$executeRawUnsafe(`DROP TRIGGER IF EXISTS test_failpoint ON ${table}`);
    await prismaClient.$executeRawUnsafe(
      `CREATE TRIGGER test_failpoint BEFORE INSERT OR UPDATE ON ${table} FOR EACH ROW EXECUTE FUNCTION test_failpoint()`
    );
  }
}

/**
 * 登记一个故障点：之后对 table 的 op 写入，只要 large_id / version_code 匹配（不传表示不限）就报错。
 * 用例结束记得 clearFailpoints。
 */
export async function armFailpoint(
  table: FailpointTable,
  op: "INSERT" | "UPDATE",
  match: { largeId?: number; versionCode?: string } = {}
): Promise<void> {
  await prismaClient.$executeRaw`
    INSERT INTO test_failpoints (tbl, op, large_id, version_code)
    VALUES (${table}, ${op}, ${match.largeId ?? null}::int, ${match.versionCode ?? null}::text)`;
}

export async function clearFailpoints(): Promise<void> {
  await prismaClient.$executeRawUnsafe("DELETE FROM test_failpoints");
}
