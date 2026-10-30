-- DropIndex
DROP INDEX "large_screen_version_large_id_idx";

-- DropIndex
DROP INDEX "layers_large_id_idx";

-- DropIndex
DROP INDEX "minio_file_user_id_idx";

-- CreateIndex
CREATE INDEX "layers_large_id_version_code_idx" ON "layers"("large_id", "version_code");
