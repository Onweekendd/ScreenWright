-- AlterTable
ALTER TABLE "ai_model" DROP CONSTRAINT "ai_model_pkey",

ADD COLUMN     "created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT,
ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT NOT NULL DEFAULT '';

UPDATE "ai_model" SET "id" = 'seed_' || "role", "is_default" = true;

ALTER TABLE "ai_model" ALTER COLUMN "id" SET NOT NULL,
ADD CONSTRAINT "ai_model_pkey" PRIMARY KEY ("id");

CREATE INDEX "ai_model_role_idx" ON "ai_model"("role");
