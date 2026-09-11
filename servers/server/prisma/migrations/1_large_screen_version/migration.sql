-- CreateTable
CREATE TABLE "large_screen_version" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "filter_type" TEXT,
    "encoded_control" JSONB,
    "minio_ids" JSONB,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT,
    "expiration_time" DATETIME,
    "publish_info" TEXT,
    "created_by" TEXT,
    "created_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_time" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "large_screen_version_large_id_version_code_key" ON "large_screen_version"("large_id", "version_code");

-- CreateIndex
CREATE INDEX "large_screen_version_large_id_idx" ON "large_screen_version"("large_id");

-- Backfill: 每个已有大屏 → 一条 v1（或其现有 version_code）版本行，拷贝当前版本作用域字段
UPDATE "large_screen" SET "version_code" = '1' WHERE "version_code" IS NULL OR "version_code" = '';
UPDATE "layers" SET "version_code" = '1' WHERE "version_code" IS NULL OR "version_code" = '';

INSERT INTO "large_screen_version" (
    "large_id", "version_code", "version_desc",
    "config", "detail", "background_url", "scene_info",
    "status_animation", "ani_frame_set", "data_filter_arr", "filter_type",
    "encoded_control", "minio_ids", "status", "password", "expiration_time", "publish_info",
    "created_by", "created_time", "updated_by", "updated_time"
)
SELECT
    "id", "version_code", "version_desc",
    "config", "detail", "background_url", "scene_info",
    "status_animation", "ani_frame_set", "data_filter_arr", "filter_type",
    "encoded_control", "minio_ids", "status", "password", "expiration_time", "publish_info",
    "created_by", "created_time", "updated_by", "updated_time"
FROM "large_screen";
