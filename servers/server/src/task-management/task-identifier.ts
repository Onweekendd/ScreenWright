import z from "zod";

/**
 * Identifies a task within a task list.
 *
 * Task IDs are only unique inside their task list, so both fields are
 * required whenever a task crosses a module or agent boundary.
 */
export const TaskIdentifierSchema = z.object({
  taskListId: z.string().min(1),
  taskId: z.string().min(1)
});

export type TaskIdentifier = z.infer<typeof TaskIdentifierSchema>;
