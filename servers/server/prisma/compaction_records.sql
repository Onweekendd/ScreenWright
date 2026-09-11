-- 历史兼容脚本：compaction_records 现已纳入 Prisma migration，请勿在新环境单独执行。

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

CREATE INDEX "compaction_records_thread_id_idx" ON "compaction_records"("thread_id");
