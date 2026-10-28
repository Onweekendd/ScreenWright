import { onScopeDispose, watch } from "vue";

import { markComponentEditing, unmarkComponentEditing } from "@/hooks/useEditingComponents";

interface EditingPart {
  type: string;
  toolName?: string;
  state?: string;
  input?: unknown;
}

const EDIT_TOOLS = new Set(["editFilesTool", "edit_files"]);

/** 扫光跟随消息里的工具执行状态，独立于工具卡片是否展开或挂载。 */
export function useEditingToolParts(parts: () => readonly EditingPart[]) {
  let marked = new Set<string>();
  watch(
    () => {
      const ids = new Set<string>();
      for (const part of parts()) {
        if (part.state !== "input-available" || !EDIT_TOOLS.has(part.toolName ?? part.type.replace(/^tool-/, ""))) {
          continue;
        }
        const input = part.input as { path?: unknown; files?: Array<{ path?: unknown }> } | undefined;
        const paths =
          typeof input?.path === "string"
            ? [input.path]
            : Array.isArray(input?.files)
              ? input.files.map((file) => file?.path)
              : [];
        for (const path of paths) {
          if (typeof path !== "string") {
            continue;
          }
          // 只取被编辑文件的 id，不给路径中的父分组也加上扫光。
          const leaf = path.split(/[\\/]/).filter(Boolean).pop();
          const id = leaf?.split("_")[0];
          if (id && /^\d+$/.test(id)) {
            ids.add(id);
          }
        }
      }
      return ids;
    },
    (next) => {
      for (const id of marked) {
        if (!next.has(id)) {
          unmarkComponentEditing(id);
        }
      }
      for (const id of next) {
        if (!marked.has(id)) {
          markComponentEditing(id);
        }
      }
      marked = next;
    },
    { immediate: true }
  );
  onScopeDispose(() => {
    marked.forEach(unmarkComponentEditing);
    marked.clear();
  });
}
