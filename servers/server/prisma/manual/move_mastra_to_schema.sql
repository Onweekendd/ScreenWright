-- 将 Mastra 自管表与 PgVector 表从 public 搬到独立的 mastra schema。
--
-- 执行前必须停止所有 funAI 实例，避免运行中的 Mastra 在 public 创建或写入表。
-- ALTER TABLE ... SET SCHEMA 只调整元数据，不重写表数据，但需要 ACCESS EXCLUSIVE 锁。
--
-- 执行：
--   prisma db execute --schema prisma/schema.prisma --file prisma/manual/move_mastra_to_schema.sql

BEGIN;

SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '5min';

CREATE SCHEMA IF NOT EXISTS "mastra";

DO $$
DECLARE
  source_table TEXT;
  tables_to_move CONSTANT TEXT[] := ARRAY[
    'component_docs',
    'templates_bge'
  ];
BEGIN
  -- 防止目标 schema 已存在同名表时覆盖或混合两套数据。
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_tables source
    JOIN pg_catalog.pg_tables target
      ON target.schemaname = 'mastra'
     AND target.tablename = source.tablename
    WHERE source.schemaname = 'public'
      AND (
        source.tablename LIKE 'mastra\_%' ESCAPE '\'
        OR source.tablename = ANY(tables_to_move)
      )
  ) THEN
    RAISE EXCEPTION 'Mastra schema migration aborted: duplicate table exists in public and mastra';
  END IF;

  FOR source_table IN
    SELECT tablename
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
      AND (
        tablename LIKE 'mastra\_%' ESCAPE '\'
        OR tablename = ANY(tables_to_move)
      )
    ORDER BY tablename
  LOOP
    EXECUTE format('ALTER TABLE public.%I SET SCHEMA mastra', source_table);
  END LOOP;
END
$$;

-- Mastra 在自定义 schema 下会把 schema 名加入部分约束名。
-- SET SCHEMA 会保留旧的 public_ 前缀，需要同步重命名，否则启动时会误判约束缺失。
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE connamespace = 'mastra'::regnamespace
      AND conname = 'public_mastra_ai_spans_traceid_spanid_pk'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE connamespace = 'mastra'::regnamespace
        AND conname = 'mastra_mastra_ai_spans_traceid_spanid_pk'
    ) THEN
      ALTER TABLE mastra.mastra_ai_spans
        DROP CONSTRAINT public_mastra_ai_spans_traceid_spanid_pk;
    ELSE
      ALTER TABLE mastra.mastra_ai_spans
        RENAME CONSTRAINT public_mastra_ai_spans_traceid_spanid_pk
        TO mastra_mastra_ai_spans_traceid_spanid_pk;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE connamespace = 'mastra'::regnamespace
      AND conname = 'public_mastra_workflow_snapshot_workflow_name_run_id_key'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE connamespace = 'mastra'::regnamespace
        AND conname = 'mastra_mastra_workflow_snapshot_workflow_name_run_id_key'
    ) THEN
      ALTER TABLE mastra.mastra_workflow_snapshot
        DROP CONSTRAINT public_mastra_workflow_snapshot_workflow_name_run_id_key;
    ELSE
      ALTER TABLE mastra.mastra_workflow_snapshot
        RENAME CONSTRAINT public_mastra_workflow_snapshot_workflow_name_run_id_key
        TO mastra_mastra_workflow_snapshot_workflow_name_run_id_key;
    END IF;
  END IF;
END
$$;

COMMIT;
