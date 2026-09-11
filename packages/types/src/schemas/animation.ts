import { z } from "zod";

import type {
  ActiveAnimationList,
  Animation,
  AnimationDirection,
  AnimationInfo,
  AnimationItem,
  AnimationType
} from "../types";
import type {
  ComponentAnimationConfig,
  ComponentSettingItem,
  StatusAnimationMapping,
  StatusAnimationResponse,
  TimingFunctionType
} from "../types/animation";

// ============================================
// Animation Schemas
// ============================================

/** 组件动画配置 Schema */
export const AnimationSchema: z.ZodSchema<Animation> = z.object({
  /** 动画类型 */
  type: z.string().describe("动画类型"),
  /** 动画方向（可选） */
  direction: z.string().describe("动画方向").optional(),
  /** 动画持续时间（毫秒） */
  duration: z.number().describe("动画持续时间（毫秒）"),
  /** 动画延迟时间（毫秒） */
  delay: z.number().describe("动画延迟时间（毫秒）"),
  /** 时间函数/缓动效果 */
  timingFunction: z.string().describe("时间函数/缓动效果"),
  /** 是否同时做透明度过渡（可选） */
  opacityOpen: z.boolean().describe("是否同时做透明度过渡").optional()
});

/** 动画类型 Schema */
export const AnimationTypeSchema: z.ZodSchema<AnimationType> = z.enum([
  /** 无动画 */
  "",
  /** 无效果 */
  "none",
  /** 小幅度移入 */
  "slide-mini-in",
  /** 移入 */
  "slide-in",
  /** 模糊移入 */
  "slide-in-blurred",
  /** 擦除移入 */
  "slide-clip-in",
  /** 缩放移入 */
  "slide-scale-in",
  /** 渐入 */
  "opacity-in",
  /** 小幅度移出 */
  "slide-mini-out",
  /** 移出 */
  "slide-out",
  /** 模糊移出 */
  "slide-out-blurred",
  /** 擦除移出 */
  "slide-clip-out",
  /** 缩放移出 */
  "slide-scale-out",
  /** 渐出 */
  "opacity-out"
]);

/** 动画方向 Schema */
export const AnimationDirectionSchema: z.ZodSchema<AnimationDirection> = z.enum([
  /** 从左到右 */
  "left",
  /** 从右到左 */
  "right",
  /** 从上到下 */
  "top",
  /** 从下到上 */
  "bottom",
  /** 从中心 */
  "center",
  /** 从左上角 */
  "tl",
  /** 从右上角 */
  "tr",
  /** 从左下角 */
  "bl",
  /** 从右下角 */
  "br",
  /** 无方向 */
  "",
  /** 方向不可用 */
  "none"
]);

/** 时间函数类型 Schema */
export const TimingFunctionTypeSchema: z.ZodSchema<TimingFunctionType> = z.enum([
  /** 无缓动效果 */
  "none",
  /** 匀速运动 */
  "linear",
  /** 慢快慢（默认缓动） */
  "ease",
  /** 慢速开始 */
  "ease-in",
  /** 慢速结束 */
  "ease-out",
  /** 慢速开始和结束 */
  "ease-in-out"
]);

/** 加载卸载类型 Schema */
export const LoadUnloadTypeSchema = z.enum(["load", "unload", "none"]);

/** 组件动画设置项 Schema */
export const ComponentSettingItemSchema: z.ZodSchema<ComponentSettingItem> = z.object({
  /** 组件ID */
  id: z.number().describe("组件ID"),
  /** 动画效果类型 */
  animationType: AnimationTypeSchema.describe("动画效果类型"),
  /** 动画执行方向 */
  direction: AnimationDirectionSchema.describe("动画执行方向"),
  /** 动画速度曲线/时间函数 */
  timingFunction: TimingFunctionTypeSchema.describe("动画速度曲线/时间函数"),
  /** 动画持续时间（单位：毫秒） */
  duration: z.number().describe("动画持续时间（单位：毫秒）"),
  /** 动画开始前的延迟时间（单位：毫秒） */
  delay: z.number().describe("动画开始前的延迟时间（单位：毫秒）"),
  /** 动画迭代次数（可选，默认为 1 次） */
  iterationCount: z.number().describe("动画迭代次数").optional(),
  /** 动画触发时机：加载、卸载或无 */
  type: LoadUnloadTypeSchema.describe("动画触发时机：加载、卸载或无")
});

/** 动画项 Schema */
export const AnimationItemSchema: z.ZodSchema<AnimationItem> = z.object({
  /** 动画唯一标识符（UUID 格式） */
  id: z.string().describe("动画唯一标识符（UUID 格式）"),
  /** 动画组标题/名称 */
  name: z.string().describe("动画组标题/名称"),
  /** 组件动画设置列表 */
  componentSetting: z.array(ComponentSettingItemSchema).describe("组件动画设置列表"),
  /** 是否启用该动画（可选） */
  isEnable: z.boolean().describe("是否启用该动画").optional(),
  /** 关联的动态面板 ID（可选） */
  panelId: z.number().describe("关联的动态面板ID").optional(),
  /** 关联的状态 ID（可选） */
  statusId: z.string().describe("关联的状态ID").optional(),
  /** 是否正在重命名（本地 UI 状态，不保存到后端） */
  isRename: z.boolean().describe("是否正在重命名").optional()
});

/** 激活的动画列表 Schema */
export const ActiveAnimationListSchema: z.ZodSchema<ActiveAnimationList> = z.array(
  z.object({
    /** 动态面板 ID（可选） */
    panelId: z.number().describe("动态面板ID").optional(),
    /** 状态 ID（可选） */
    statusId: z.string().describe("状态ID").optional(),
    /** 动画唯一标识符 */
    animationId: z.string().describe("动画唯一标识符"),
    /** 动画触发类型：加载时或卸载时 */
    type: z.enum(["load", "unload"]).describe("动画触发类型：加载时或卸载时")
  })
);

/** 动画帧设置解析 Schema */
export const AniFrameSetParsedSchema: z.ZodSchema<any> = z.object({
  /** 动画列表：所有可用的动画项（可选） */
  animationList: z.array(AnimationItemSchema).describe("动画列表").optional(),
  /** 激活动画列表：当前激活的动画配置（可选） */
  activeAnimationList: ActiveAnimationListSchema.describe("激活动画列表").optional()
});

/** 组件动画配置 Schema */
export const ComponentAnimationConfigSchema: z.ZodSchema<ComponentAnimationConfig> = z.object({
  /** 组件id */
  componentId: z.string().describe("组件id"),
  /** 横坐标 */
  left: z.number().describe("横坐标"),
  /** 纵坐标 */
  top: z.number().describe("纵坐标"),
  /** 宽度 */
  width: z.number().describe("宽度"),
  /** 高度 */
  height: z.number().describe("高度"),
  /** 透明度 */
  opacity: z.number().describe("透明度"),
  /** 旋转x */
  rotateX: z.number().describe("旋转x"),
  /** 旋转y */
  rotateY: z.number().describe("旋转y"),
  /** 旋转z */
  rotateZ: z.number().describe("旋转z"),
  /** 显示 */
  display: z.boolean().describe("显示"),
  /** 图片 */
  image: z.string().describe("图片").optional(),
  /** 字体大小 */
  fontSize: z.number().describe("字体大小").optional(),
  /** 层级 */
  zIndex: z.number().describe("层级"),
  /** 视频 */
  video: z.string().describe("视频").optional()
});

/** 动画组基本信息 Schema */
export const AnimationInfoSchema: z.ZodSchema<AnimationInfo> = z.object({
  /** 动画组id */
  id: z.string().describe("动画组id"),
  /** 动画组名称 */
  name: z.string().describe("动画组名称"),
  /** 动画组持续时间 */
  duration: z.number().describe("动画组持续时间"),
  /** 动态面板id */
  panelId: z.number().describe("动态面板id").optional(),
  /** 状态id */
  statusId: z.string().describe("状态id").optional()
});

/** 状态动画项映射 Schema */
export const StatusAnimationMappingSchema: z.ZodSchema<StatusAnimationMapping> = z.object({
  /** 状态id */
  statusId: z.string().describe("状态id"),
  /** 状态名称 */
  statusName: z.string().describe("状态名称")
});

/** 状态动画响应解析 Schema */
export const StatusAnimationResponseParsedSchema: z.ZodSchema<StatusAnimationResponse> = z.object({
  /** 存储所有动画组的基本信息 */
  animations: z
    .record(z.string().describe("动画组ID"), AnimationInfoSchema)
    .describe("存储所有动画组的基本信息")
    .optional(),
  /** 存储状态动画项的映射关系 */
  statusAnimations: z
    .record(z.string().describe("动画组ID"), z.record(z.string().describe("状态ID"), StatusAnimationMappingSchema))
    .describe("存储状态动画项的映射关系")
    .optional(),
  /** 存储组件动画的具体配置 */
  componentAnimations: z
    .record(
      z.string().describe("动画组ID"),
      z.record(z.string().describe("状态ID"), z.record(z.string().describe("组件ID"), ComponentAnimationConfigSchema))
    )
    .describe("存储组件动画的具体配置")
    .optional()
});
