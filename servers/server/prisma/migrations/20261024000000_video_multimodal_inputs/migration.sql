ALTER TABLE "generated_video"
  ADD COLUMN "last_frame_url" TEXT,
  ADD COLUMN "reference_image_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "reference_video_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "reference_audio_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
