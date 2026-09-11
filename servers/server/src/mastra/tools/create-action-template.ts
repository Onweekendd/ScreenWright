import { createTool } from "@mastra/core/tools";
import type { Action } from "@screenwright/types";
import { ActionTypeEnum } from "@screenwright/types";
import { buildActionFromTemplate } from "@screenwright/types/templates";
import z from "zod";

import { resolveComponentScope } from "./resolve-component-scope";

export const ActionInputSchema = z.object({
  componentId: z.array(z.string()).describe("组件ID列表，支持同时作用于多个组件"),
  actionType: z.enum(ActionTypeEnum).describe("动作类型"),
  config: z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
      "actionType 对应的可选配置字段，浅合并到模板产物上。例如 switchSceneStatus 可传 { stateId, sceneStatusName, switchSceneStatusDelay }；具体字段参见 ActionSchema 与 references/action-config-map.md。id/name/action/component/componentScope 由工具自管，传入也会被覆盖。"
    )
});

const ToolInputSchema = ActionInputSchema.extend({
  sourceComponentId: z
    .string()
    .describe(
      "源组件 ID，即事件所在的组件。仅用于代码内部判定 componentScope（同列=current，跨列=all），**不要手填 scope 字段**。"
    )
});

export { buildActionFromTemplate };

export const createActionTemplate = createTool({
  id: "createActionTemplate",
  description:
    "⚠️ 仅用于向【已有事件】追加 action 时生成模板。**新建事件请直接把 { componentId, actionType } 数组作为 actions[] 传给 createEventTemplate，不要先调本工具预览**——createEventTemplate 内部已自动调用 buildActionFromTemplate，重复调用纯属浪费。注意：当 componentId 包含多个组件时，actionType 仅支持 show / hide / showHide。componentScope 由代码按【源/目标是否同一直接父目录】自动判定，agent 无需关心。",
  inputSchema: ToolInputSchema,
  execute: async ({ componentId, actionType, sourceComponentId, config }) => {
    const scope = resolveComponentScope(sourceComponentId, componentId);
    const built = buildActionFromTemplate({ componentId, actionType, scope });
    if ("error" in built) {
      return built;
    }
    const action = built as Partial<Action>;
    return config
      ? {
          ...action,
          ...config,
          id: action.id,
          name: action.name,
          action: action.action,
          component: action.component,
          componentScope: action.componentScope
        }
      : action;
  }
});
