/*
  Warnings:

  - You are about to drop the column `filter_type` on the `large_screen` table. All the data in the column will be lost.
  - You are about to drop the column `filter_type` on the `large_screen_version` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_large_screen" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "expiration_time" DATETIME,
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
    "created_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_time" DATETIME NOT NULL
);
INSERT INTO "new_large_screen" ("ani_frame_set", "background_url", "config", "created_by", "created_time", "data_filter_arr", "detail", "encoded_control", "expiration_time", "group_id", "id", "invitation_code", "minio_ids", "module_id", "name", "new_application", "password", "path", "publish_info", "scene_info", "sort", "status", "status_animation", "stock_type", "type", "updated_by", "updated_time", "user_id", "version_code", "version_desc") SELECT "ani_frame_set", "background_url", "config", "created_by", "created_time", "data_filter_arr", "detail", "encoded_control", "expiration_time", "group_id", "id", "invitation_code", "minio_ids", "module_id", "name", "new_application", "password", "path", "publish_info", "scene_info", "sort", "status", "status_animation", "stock_type", "type", "updated_by", "updated_time", "user_id", "version_code", "version_desc" FROM "large_screen";
DROP TABLE "large_screen";
ALTER TABLE "new_large_screen" RENAME TO "large_screen";
CREATE INDEX "large_screen_user_id_idx" ON "large_screen"("user_id");
CREATE INDEX "large_screen_group_id_idx" ON "large_screen"("group_id");
CREATE TABLE "new_large_screen_version" (
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
INSERT INTO "new_large_screen_version" ("ani_frame_set", "background_url", "config", "created_by", "created_time", "data_filter_arr", "detail", "encoded_control", "expiration_time", "id", "large_id", "minio_ids", "password", "publish_info", "scene_info", "status", "status_animation", "updated_by", "updated_time", "version_code", "version_desc") SELECT "ani_frame_set", "background_url", "config", "created_by", "created_time", "data_filter_arr", "detail", "encoded_control", "expiration_time", "id", "large_id", "minio_ids", "password", "publish_info", "scene_info", "status", "status_animation", "updated_by", "updated_time", "version_code", "version_desc" FROM "large_screen_version";
DROP TABLE "large_screen_version";
ALTER TABLE "new_large_screen_version" RENAME TO "large_screen_version";
CREATE INDEX "large_screen_version_large_id_idx" ON "large_screen_version"("large_id");
CREATE UNIQUE INDEX "large_screen_version_large_id_version_code_key" ON "large_screen_version"("large_id", "version_code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
