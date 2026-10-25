-- CreateTable
CREATE TABLE "design_blueprint" (
    "screen_key" TEXT NOT NULL,
    "thread_id" TEXT,
    "data" JSONB NOT NULL,
    "created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "design_blueprint_pkey" PRIMARY KEY ("screen_key")
);
