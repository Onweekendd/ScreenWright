-- CreateTable
CREATE TABLE "generated_video" (
    "id" TEXT NOT NULL,
    "prompt_hash" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "duration_sec" INTEGER NOT NULL,
    "resolution" TEXT NOT NULL,
    "ratio" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "first_frame_url" TEXT,
    "task_id" TEXT,
    "created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_video_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "generated_video_prompt_hash_key" ON "generated_video"("prompt_hash");
