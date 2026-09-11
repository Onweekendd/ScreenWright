import z from "zod";

export const ARTIFACT_APP_CODE_TASK_KIND = "artifact-app-code" as const;

/** 通用任务交给 Artifact App 执行时必须携带的 metadata。 */
export const ArtifactAppTaskMetadataSchema = z.object({
  task_kind: z.literal(ARTIFACT_APP_CODE_TASK_KIND),
  appId: z.string().min(1),
  screenId: z.string().min(1),
  resourceId: z.string().min(1).optional(),
  acceptanceCriteria: z.array(z.string().min(1))
});

export type ArtifactAppTaskMetadata = z.infer<typeof ArtifactAppTaskMetadataSchema>;
