-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "ai_model" (
    "role" TEXT NOT NULL,
    "base_url" TEXT NOT NULL DEFAULT '',
    "api_key" TEXT NOT NULL DEFAULT '',
    "model_id" TEXT NOT NULL DEFAULT '',
    "context_length" INTEGER,
    "dimensions" INTEGER,
    "updated_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_model_pkey" PRIMARY KEY ("role")
);

-- CreateTable
CREATE TABLE "generated_image" (
    "id" TEXT NOT NULL,
    "prompt_hash" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "seed" INTEGER,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "figma_keys" (
    "id" TEXT NOT NULL,
    "keyValue" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRateLimited" BOOLEAN NOT NULL DEFAULT false,
    "rateLimitStart" TIMESTAMP(3),
    "rateLimitEnd" TIMESTAMP(3),
    "consecutive429Count" INTEGER NOT NULL DEFAULT 0,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "successRequests" INTEGER NOT NULL DEFAULT 0,
    "failedRequests" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "figma_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" TEXT NOT NULL,
    "module_id" INTEGER,
    "user_id" INTEGER,
    "type" INTEGER DEFAULT 0,
    "java_script" TEXT,
    "level" INTEGER,
    "second_level_menu" TEXT,
    "first_level_menu" TEXT,
    "name" TEXT,
    "thumbnail" TEXT,
    "created_by" TEXT,
    "created_time" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_time" TIMESTAMP(3),
    "template" TEXT,
    "status" INTEGER DEFAULT 0,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "figma_node_assets" (
    "id" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "node_name" TEXT,
    "bucket" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "url" TEXT,
    "mime_type" TEXT,
    "file_size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "figma_node_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compaction_records" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "compacted_message_ids" JSONB NOT NULL,
    "summary_message_id" TEXT NOT NULL,
    "message_count_before" INTEGER,
    "message_count_after" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compaction_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "figma_node_json" (
    "id" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "node_name" TEXT,
    "bucket" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "url" TEXT,
    "mime_type" TEXT,
    "file_size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "figma_node_json_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "llm_exchange_records" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "run_id" TEXT,
    "turn_index" INTEGER NOT NULL,
    "step" INTEGER NOT NULL,
    "url" TEXT,
    "model" TEXT,
    "status" INTEGER,
    "ok" BOOLEAN,
    "tool_names" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tool_call_count" INTEGER NOT NULL DEFAULT 0,
    "tool_failures" INTEGER,
    "at" TIMESTAMP(3),
    "generation_time_ms" INTEGER,
    "prompt_tokens" INTEGER,
    "completion_tokens" INTEGER,
    "total_tokens" INTEGER,
    "cached_prompt_tokens" INTEGER,
    "reasoning_tokens" INTEGER,
    "branch_key" TEXT,
    "eval_run_id" TEXT,
    "bucket" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llm_exchange_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eval_runs" (
    "id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "finished_at" TIMESTAMP(3) NOT NULL,
    "total_cases" INTEGER NOT NULL,
    "passed_cases" INTEGER NOT NULL,
    "uploaded" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eval_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eval_cases" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "thread_id" TEXT,
    "timed_out" BOOLEAN NOT NULL DEFAULT false,
    "error_message" TEXT,
    "elapsed_ms" INTEGER NOT NULL,
    "steps" INTEGER NOT NULL DEFAULT 0,
    "tool_calls" INTEGER NOT NULL DEFAULT 0,
    "tool_failures" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "invariants" JSONB NOT NULL,
    "assertions" JSONB NOT NULL,
    "suspends" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eval_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bi_user" (
    "id" SERIAL NOT NULL,
    "user_name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "type" INTEGER NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 1,
    "role" INTEGER NOT NULL DEFAULT 1,
    "stock_type" INTEGER NOT NULL DEFAULT 1,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "company_id" INTEGER,
    "email" TEXT,
    "phone" TEXT,
    "realname" TEXT,
    "region" TEXT,
    "temporary_company_name" TEXT,
    "forbidden" BOOLEAN NOT NULL DEFAULT false,
    "expiration_time" TIMESTAMP(3),
    "avatar" TEXT,
    "invited_by" TEXT,
    "create_large" JSONB,
    "create_scene" JSONB,
    "export_large" JSONB,
    "export_scene" JSONB,
    "create_city" JSONB,
    "export_city" JSONB,
    "created_by" TEXT,
    "created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bi_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "large_screen" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "module_id" INTEGER,
    "name" TEXT NOT NULL,
    "config" JSONB,
    "detail" JSONB,
    "background_url" TEXT,
    "scene_info" TEXT,
    "type" INTEGER NOT NULL DEFAULT 1,
    "stock_type" INTEGER NOT NULL DEFAULT 1,
    "group_id" INTEGER NOT NULL DEFAULT 0,
    "password" TEXT,
    "invitation_code" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "expiration_time" TIMESTAMP(3),
    "sort" INTEGER NOT NULL DEFAULT 0,
    "version_code" TEXT,
    "version_desc" TEXT,
    "minio_ids" JSONB,
    "data_filter_arr" JSONB,
    "ani_frame_set" JSONB,
    "encoded_control" JSONB,
    "status_animation" JSONB,
    "publish_info" TEXT,
    "path" TEXT,
    "new_application" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "large_screen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "large_screen_version" (
    "id" SERIAL NOT NULL,
    "large_id" INTEGER NOT NULL,
    "version_code" TEXT NOT NULL,
    "version_desc" TEXT,
    "config" JSONB,
    "detail" JSONB,
    "background_url" TEXT,
    "scene_info" TEXT,
    "status_animation" JSONB,
    "ani_frame_set" JSONB,
    "data_filter_arr" JSONB,
    "encoded_control" JSONB,
    "minio_ids" JSONB,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT,
    "expiration_time" TIMESTAMP(3),
    "publish_info" TEXT,
    "created_by" TEXT,
    "created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "large_screen_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "large_group" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" INTEGER NOT NULL DEFAULT 0,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "large_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "layers" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "module_id" INTEGER,
    "large_id" INTEGER NOT NULL,
    "config" JSONB,
    "minio_ids" JSONB,
    "data_json" JSONB,
    "version_code" TEXT,
    "created_by" TEXT,
    "created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "layers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_group" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "name" TEXT NOT NULL,
    "created_by" TEXT,
    "created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_source" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "type" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "config" JSONB,
    "data_group_id" INTEGER,
    "layer_ids" JSONB,
    "created_by" TEXT,
    "created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_local" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "url" TEXT,
    "data_group_id" INTEGER,
    "file_name" TEXT,
    "size" INTEGER,
    "charset_name" TEXT,
    "content" JSONB,
    "layer_ids" JSONB,
    "created_by" TEXT,
    "created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_local_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "minio_file" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "name" TEXT NOT NULL,
    "file_name" TEXT,
    "url" TEXT,
    "blob_key" TEXT,
    "resource_type" INTEGER,
    "file_type" INTEGER,
    "auth" INTEGER,
    "large_id" INTEGER,
    "group_id" INTEGER,
    "cover" TEXT,
    "cover_name" TEXT,
    "resource_size" INTEGER,
    "layer_ids" JSONB,
    "large_use_ids" JSONB,
    "created_by" TEXT,
    "created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "minio_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "minio_group" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "name" TEXT NOT NULL,
    "type" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "minio_group_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "generated_image_prompt_hash_key" ON "generated_image"("prompt_hash");

-- CreateIndex
CREATE UNIQUE INDEX "figma_keys_keyValue_key" ON "figma_keys"("keyValue");

-- CreateIndex
CREATE INDEX "figma_keys_isActive_isRateLimited_idx" ON "figma_keys"("isActive", "isRateLimited");

-- CreateIndex
CREATE INDEX "figma_keys_rateLimitEnd_idx" ON "figma_keys"("rateLimitEnd");

-- CreateIndex
CREATE INDEX "figma_keys_totalRequests_idx" ON "figma_keys"("totalRequests");

-- CreateIndex
CREATE UNIQUE INDEX "modules_name_key" ON "modules"("name");

-- CreateIndex
CREATE INDEX "modules_module_id_idx" ON "modules"("module_id");

-- CreateIndex
CREATE INDEX "figma_node_assets_file_key_idx" ON "figma_node_assets"("file_key");

-- CreateIndex
CREATE INDEX "figma_node_assets_node_id_idx" ON "figma_node_assets"("node_id");

-- CreateIndex
CREATE UNIQUE INDEX "figma_node_assets_file_key_node_id_key" ON "figma_node_assets"("file_key", "node_id");

-- CreateIndex
CREATE INDEX "compaction_records_thread_id_idx" ON "compaction_records"("thread_id");

-- CreateIndex
CREATE INDEX "figma_node_json_file_key_idx" ON "figma_node_json"("file_key");

-- CreateIndex
CREATE INDEX "figma_node_json_node_id_idx" ON "figma_node_json"("node_id");

-- CreateIndex
CREATE UNIQUE INDEX "figma_node_json_file_key_node_id_key" ON "figma_node_json"("file_key", "node_id");

-- CreateIndex
CREATE INDEX "llm_exchange_records_thread_id_idx" ON "llm_exchange_records"("thread_id");

-- CreateIndex
CREATE INDEX "llm_exchange_records_ok_idx" ON "llm_exchange_records"("ok");

-- CreateIndex
CREATE INDEX "llm_exchange_records_model_idx" ON "llm_exchange_records"("model");

-- CreateIndex
CREATE INDEX "llm_exchange_records_branch_key_idx" ON "llm_exchange_records"("branch_key");

-- CreateIndex
CREATE INDEX "llm_exchange_records_eval_run_id_idx" ON "llm_exchange_records"("eval_run_id");

-- CreateIndex
CREATE UNIQUE INDEX "llm_exchange_records_thread_id_turn_index_step_key" ON "llm_exchange_records"("thread_id", "turn_index", "step");

-- CreateIndex
CREATE INDEX "eval_runs_started_at_idx" ON "eval_runs"("started_at");

-- CreateIndex
CREATE INDEX "eval_cases_case_id_idx" ON "eval_cases"("case_id");

-- CreateIndex
CREATE INDEX "eval_cases_run_id_idx" ON "eval_cases"("run_id");

-- CreateIndex
CREATE UNIQUE INDEX "eval_cases_run_id_case_id_attempt_key" ON "eval_cases"("run_id", "case_id", "attempt");

-- CreateIndex
CREATE UNIQUE INDEX "bi_user_user_name_key" ON "bi_user"("user_name");

-- CreateIndex
CREATE INDEX "large_screen_user_id_idx" ON "large_screen"("user_id");

-- CreateIndex
CREATE INDEX "large_screen_group_id_idx" ON "large_screen"("group_id");

-- CreateIndex
CREATE INDEX "large_screen_version_large_id_idx" ON "large_screen_version"("large_id");

-- CreateIndex
CREATE UNIQUE INDEX "large_screen_version_large_id_version_code_key" ON "large_screen_version"("large_id", "version_code");

-- CreateIndex
CREATE INDEX "large_group_user_id_idx" ON "large_group"("user_id");

-- CreateIndex
CREATE INDEX "layers_large_id_idx" ON "layers"("large_id");

-- CreateIndex
CREATE INDEX "data_group_user_id_idx" ON "data_group"("user_id");

-- CreateIndex
CREATE INDEX "data_source_user_id_idx" ON "data_source"("user_id");

-- CreateIndex
CREATE INDEX "data_source_data_group_id_idx" ON "data_source"("data_group_id");

-- CreateIndex
CREATE INDEX "data_local_user_id_idx" ON "data_local"("user_id");

-- CreateIndex
CREATE INDEX "data_local_data_group_id_idx" ON "data_local"("data_group_id");

-- CreateIndex
CREATE INDEX "minio_file_user_id_idx" ON "minio_file"("user_id");

-- CreateIndex
CREATE INDEX "minio_file_group_id_idx" ON "minio_file"("group_id");

-- CreateIndex
CREATE INDEX "minio_group_user_id_idx" ON "minio_group"("user_id");

-- AddForeignKey
ALTER TABLE "eval_cases" ADD CONSTRAINT "eval_cases_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "eval_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

