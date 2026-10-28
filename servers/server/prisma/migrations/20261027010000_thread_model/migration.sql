-- 对话级模型选择。依赖 20261027000000_ai_model_multi 先把 ai_model 主键换成 id。
CREATE TABLE "thread_model" (
    "thread_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "ai_model_id" TEXT NOT NULL,
    "updated_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "thread_model_pkey" PRIMARY KEY ("thread_id","role")
);

CREATE INDEX "thread_model_ai_model_id_idx" ON "thread_model"("ai_model_id");

ALTER TABLE "thread_model" ADD CONSTRAINT "thread_model_ai_model_id_fkey" FOREIGN KEY ("ai_model_id") REFERENCES "ai_model"("id") ON DELETE CASCADE ON UPDATE CASCADE;
