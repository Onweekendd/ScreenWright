-- 历史兼容脚本：llm_exchange_records 现已纳入 Prisma migration，请勿在新环境单独执行。

CREATE TABLE IF NOT EXISTS "llm_exchange_records" (
  "id"              TEXT      NOT NULL,
  "thread_id"       TEXT      NOT NULL,
  "run_id"          TEXT,
  "turn_index"      INTEGER   NOT NULL,
  "step"            INTEGER   NOT NULL,
  "url"             TEXT,
  "model"           TEXT,
  "status"          INTEGER,
  "ok"              BOOLEAN,
  "tool_names"      TEXT[]    NOT NULL DEFAULT ARRAY[]::TEXT[],
  "tool_call_count" INTEGER   NOT NULL DEFAULT 0,
  "at"              TIMESTAMP(3),
  "generation_time_ms" INTEGER,
  "prompt_tokens"       INTEGER,
  "completion_tokens"   INTEGER,
  "total_tokens"        INTEGER,
  "cached_prompt_tokens" INTEGER,
  "reasoning_tokens"    INTEGER,
  "bucket"          TEXT      NOT NULL,
  "object_key"      TEXT      NOT NULL,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "llm_exchange_records_pkey" PRIMARY KEY ("id")
);

-- 兼容已经执行过本脚本的环境。
ALTER TABLE "llm_exchange_records"
  ADD COLUMN IF NOT EXISTS "generation_time_ms" INTEGER,
  ADD COLUMN IF NOT EXISTS "prompt_tokens" INTEGER,
  ADD COLUMN IF NOT EXISTS "completion_tokens" INTEGER,
  ADD COLUMN IF NOT EXISTS "total_tokens" INTEGER,
  ADD COLUMN IF NOT EXISTS "cached_prompt_tokens" INTEGER,
  ADD COLUMN IF NOT EXISTS "reasoning_tokens" INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS "llm_exchange_records_thread_id_turn_index_step_key"
  ON "llm_exchange_records" ("thread_id", "turn_index", "step");

CREATE INDEX IF NOT EXISTS "llm_exchange_records_thread_id_idx"
  ON "llm_exchange_records" ("thread_id");

CREATE INDEX IF NOT EXISTS "llm_exchange_records_ok_idx"
  ON "llm_exchange_records" ("ok");

CREATE INDEX IF NOT EXISTS "llm_exchange_records_model_idx"
  ON "llm_exchange_records" ("model");
