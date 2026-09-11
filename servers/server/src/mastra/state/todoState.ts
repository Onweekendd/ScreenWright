import type { MastraDBMessage } from "@mastra/core/agent";

import type { TodoList, TodoMap } from "../tools/todo/types";
import { TodoListSchema } from "../tools/todo/types";
import type { IValueStore } from "./stateManager";

/**
 * Todo 状态存储
 *
 * 以 agentId（或 sessionId）为 key，存储各 agent 独立的 todo 列表。
 * 采用全量替换语义：每次写入都替换该 agent 的完整列表。
 */
export class TodoState implements IValueStore<TodoMap> {
  private store: TodoMap = {};

  get(): TodoMap {
    return this.store;
  }

  set(value: TodoMap): void {
    this.store = value;
  }

  update(updater: (prev: TodoMap | undefined) => TodoMap): void {
    this.store = updater(this.store);
  }

  hasValue(): boolean {
    return Object.keys(this.store).length > 0;
  }

  clear(): void {
    this.store = {};
  }

  /** 获取指定 agent 的 todo 列表，不存在时返回空数组 */
  getTodos(agentId: string): TodoList {
    return this.store[agentId] ?? [];
  }

  /**
   * 全量替换指定 agent 的 todo 列表。
   * 所有任务均已 completed 时自动存储空数组。
   */
  setTodos(agentId: string, todos: TodoList): void {
    const allDone = todos.length > 0 && todos.every((t) => t.status === "completed");
    this.store = { ...this.store, [agentId]: allDone ? [] : todos };
  }

  /**
   * 从对话历史中恢复 todo 状态。
   *
   * 倒序遍历消息，找到最后一次调用 todo-write 工具的参数，
   * 校验后还原到状态中。
   *
   * @param agentId - agent 标识
   * @param messages - Mastra 消息列表
   * @returns 是否成功恢复（找到且校验通过）
   */
  restoreFromTranscript(agentId: string, messages: MastraDBMessage[]): boolean {
    const todos = extractTodosFromTranscript(messages);
    if (todos.length === 0) {
      return false;
    }
    this.setTodos(agentId, todos);
    return true;
  }
}

/**
 * 从 Mastra 消息历史中提取最后一次 TodoWrite 调用的 todos。
 * 倒序扫描 assistant 消息的 tool-invocation parts，
 * 找到 toolName 为 "todo-write" 的调用，提取并校验其 args.todos。
 */
function extractTodosFromTranscript(messages: MastraDBMessage[]): TodoList {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "assistant") {
      continue;
    }

    const parts = msg.content?.parts;
    if (!Array.isArray(parts)) {
      continue;
    }

    for (let j = parts.length - 1; j >= 0; j--) {
      const part = parts[j] as { type: string; toolInvocation?: { toolName?: string; args?: unknown } };
      if (part.type !== "tool-invocation") {
        continue;
      }
      if (part.toolInvocation?.toolName !== "todo-write") {
        continue;
      }

      const args = part.toolInvocation.args as Record<string, unknown> | undefined;
      if (!args || !args.todos) {
        continue;
      }

      const parsed = TodoListSchema.safeParse(args.todos);
      return parsed.success ? parsed.data : [];
    }
  }
  return [];
}
