-- AlterTable
ALTER TABLE "generated_image" ADD COLUMN "reference_urls" JSONB;

-- AlterTable
ALTER TABLE "minio_file" ADD COLUMN "generated_image_id" TEXT,
ADD COLUMN "reference_file_ids" JSONB;

-- CreateIndex
CREATE INDEX "minio_file_user_id_url_idx" ON "minio_file"("user_id", "url");
