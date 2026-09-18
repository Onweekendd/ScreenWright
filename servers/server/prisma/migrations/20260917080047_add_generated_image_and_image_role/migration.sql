-- CreateTable
CREATE TABLE "generated_image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prompt_hash" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "seed" INTEGER,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "created_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "generated_image_prompt_hash_key" ON "generated_image"("prompt_hash");
