-- 把 public 中残留的 Mastra 旧表归档到 legacy_mastra schema。
--
-- 背景：切换到 `schemaName: "mastra"` 时，新代码先于 move_mastra_to_schema.sql 启动，
-- Mastra 在 mastra schema 里重新初始化了全套表，public 的旧表就此搁浅——
-- 同名冲突又让 move_mastra_to_schema.sql 的防重复检查永久中止，脚本再也跑不动。
--
-- 这些旧表最后写入停留在切换当天，之后所有读写都在 mastra schema。
-- 留着它们唯一的作用是让 `prisma migrate dev` 每次都判定 drift 并要求 reset 整个 public。
--
-- 为什么是搬不是删：SET SCHEMA 只改元数据、不重写数据，秒级完成且可逆；
-- prisma 只看 public，搬走即等效于删（drift 消失，migrate dev 恢复正常）。
-- 观察一段时间确认无碍后，再执行下面这行彻底清理：
--   DROP SCHEMA legacy_mastra CASCADE;
--
-- 执行：
--   prisma db execute --file prisma/manual/archive_legacy_public_mastra_tables.sql

BEGIN;

SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '5min';

CREATE SCHEMA IF NOT EXISTS "legacy_mastra";

DO $$
DECLARE
  legacy_table TEXT;
  -- 不带 mastra_ 前缀、但同属 Mastra 侧的表（PgVector 用）
  extra_tables CONSTANT TEXT[] := ARRAY['component_docs', 'templates_bge'];
  moved INT := 0;
BEGIN
  -- 守卫 1：mastra schema 必须已经接管，否则说明搬迁根本没发生，此时动 public 会丢数据。
  IF (SELECT count(*) FROM pg_catalog.pg_tables
      WHERE schemaname = 'mastra' AND tablename LIKE 'mastra\_%' ESCAPE '\') < 10 THEN
    RAISE EXCEPTION '中止：mastra schema 下的 Mastra 表不足 10 张，看不出它已接管';
  END IF;

  -- 守卫 2：新库会话数必须不少于旧库，防止方向搞反（把活数据当残留搬走）。
  IF (SELECT count(*) FROM mastra.mastra_threads)
     < (SELECT count(*) FROM public.mastra_threads) THEN
    RAISE EXCEPTION '中止：mastra.mastra_threads 比 public 还少，public 可能仍是活数据';
  END IF;

  FOR legacy_table IN
    SELECT tablename FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
      AND (tablename LIKE 'mastra\_%' ESCAPE '\' OR tablename = ANY(extra_tables))
    ORDER BY tablename
  LOOP
    EXECUTE format('ALTER TABLE public.%I SET SCHEMA legacy_mastra', legacy_table);
    moved := moved + 1;
  END LOOP;

  RAISE NOTICE '已归档 % 张 Mastra 遗留表到 legacy_mastra', moved;
END
$$;

COMMIT;
