import z from "zod";

export const TodoStatusSchema = z.enum(["pending", "in_progress", "completed"]);

export const TodoItemSchema = z.object({
  content: z.string().min(1).describe("任务描述（祈使句），例如 'Fix the login bug'"),
  status: TodoStatusSchema.describe("任务状态"),
  activeForm: z.string().min(1).describe("进行时形式，用于 UI 展示，例如 'Fixing the login bug'")
});

export const TodoListSchema = z.array(TodoItemSchema);

export type TodoItem = z.infer<typeof TodoItemSchema>;
export type TodoList = z.infer<typeof TodoListSchema>;

/** agentId（或 sessionId）→ TodoList 的映射 */
export type TodoMap = Record<string, TodoList>;
