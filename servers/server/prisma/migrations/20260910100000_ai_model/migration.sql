-- CreateTable
CREATE TABLE "ai_model" (
    "role" TEXT NOT NULL PRIMARY KEY,
    "base_url" TEXT NOT NULL DEFAULT '',
    "api_key" TEXT NOT NULL DEFAULT '',
    "model_id" TEXT NOT NULL DEFAULT '',
    "context_length" INTEGER,
    "dimensions" INTEGER,
    "updated_time" DATETIME NOT NULL
);
