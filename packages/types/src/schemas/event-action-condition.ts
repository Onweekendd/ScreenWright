import { z } from "zod";

import type { Action, ActionAnimation, Condition, EncodeAction } from "../types";
import {
  ActionAnimationTypeEnum,
  ActionTypeEnum,
  ConditionCompareEnum,
  ConditionLogicTypeEnum,
  ConditionTypeEnum,
  EncodeEventTypeEnum,
  EventTypeEnum,
  tcpudpDataTypeEnum
} from "../types";
import { DataSourceTypeSchema } from "./data";

// ============================================
// Event Action & Condition Schemas
// ============================================

/** 组件引用格式校验：$类型(ID)，如 $component(1305156) */
const ComponentRefSchema = z
  .string()
  .regex(/^\$component\(\d+\)$/, "组件引用格式必须为 $component(数字ID)，如 $component(1305156)");

/** 条件类型枚举 Schema */
export const ConditionTypeEnumSchema = z
  .enum(ConditionTypeEnum)

  .describe("条件类型: field-字段条件, custom-自定义条件");

/** 条件比较枚举 Schema */
export const ConditionCompareEnumSchema = z.enum(ConditionCompareEnum).describe("条件比较类型");

/** 条件逻辑类型枚举 Schema */
export const ConditionLogicTypeEnumSchema = z
  .enum(ConditionLogicTypeEnum)
  .describe("条件逻辑类型: one-任一满足, and-全部满足, all-所有");

/** 完整条件 Schema */
export const ConditionSchema: z.ZodSchema<Condition> = z.object({
  /** 条件唯一标识符 */
  id: z.string().describe("条件唯一标识符"),
  /** 条件名称 */
  name: z.string().describe("条件名称"),
  /** 条件代码 - 可执行的条件判断逻辑 */
  code: z.string().describe("条件代码，如 { return data }"),
  /** 条件类型 */
  type: z.enum(ConditionTypeEnum).describe("条件类型：field=字段条件，custom=自定义条件"),
  /** 比较类型 */
  compare: z.enum(ConditionCompareEnum).describe("比较类型"),
  /** 预期值 */
  expected: z.string().describe("预期值"),
  /** 字段 */
  field: z.string().describe("字段"),
  /** 是否未保存 */
  notSaved: z.boolean().describe("是否未保存"),
  /** 是否存在 */
  isExists: z.boolean().describe("是否存在"),
  /** 临时池 */
  tempPool: z.any().describe("临时池")
});

/** 动作动画配置 Schema */
export const ActionAnimationSchema: z.ZodSchema<ActionAnimation> = z.object({
  /** 动画延迟时间（毫秒） */
  delay: z.number().describe("动画延迟时间（毫秒）"),
  /** 动画持续时间（毫秒） */
  duration: z.number().describe("动画持续时间（毫秒）"),
  /** 时间函数/缓动效果 */
  timingFunction: z
    .enum(["none", "linear", "ease", "ease-in", "ease-out", "ease-in-out"])
    .describe("时间函数/缓动效果"),
  /** 动画类型 */
  type: z.enum(ActionAnimationTypeEnum).describe("动画类型"),
  /** 索引值 */
  idxValue: z.union([z.number(), z.string()]).describe("索引值"),
  /** 是否重命名（可选） */
  isRename: z.boolean().optional().describe("是否重命名")
});

/** 完整动作 Schema */
export const ActionSchema: z.ZodSchema<Action> = z.object({
  /** 动作唯一标识符 */
  id: z.string().describe("动作唯一标识符"),
  /** 动作显示名称 */
  name: z.string().describe("动作显示名称"),
  /** 动作类型 */
  action: z.enum(ActionTypeEnum).describe("动作类型"),
  /** 关联的组件ID列表 */
  component: z.array(ComponentRefSchema).describe('关联的组件ID列表，如 ["$component(1305156)"]'),
  /** 动作关联的扩展配置数据 */
  actionData: z.record(z.string(), z.any()).optional().describe("动作关联的扩展配置数据"),
  /** 动画配置 */
  animation: ActionAnimationSchema.optional().describe("动画配置"),
  /** 地图坐标相关配置 */
  mapBox: z
    .object({
      /** X轴偏移量 */
      boxOffsetX: z.number().describe("X轴偏移量"),
      /** Y轴偏移量 */
      boxOffsetY: z.number().describe("Y轴偏移量")
    })
    .optional()
    .describe("地图坐标配置"),
  /** 图层信息配置 */
  layerInfo: z
    .object({
      /** 图层颜色 */
      color: z.string().describe("图层颜色"),
      /** 图层名称 */
      name: z.string().describe("图层名称"),
      /** 回调字段 */
      callBackField: z.string().describe("回调字段"),
      /** 子节点字段 */
      childNodeField: z.string().describe("子节点字段")
    })
    .optional()
    .describe("图层信息配置"),
  /** 组件配置参数 */
  componentConfig: z.any().optional().describe("组件配置参数"),
  /** 组件作用域 */
  componentScope: z.string().optional().describe("组件作用域"),
  /** 状态面板ID */
  stateId: z.string().optional().describe("状态面板ID，用于状态切换"),
  /** 场景状态名称 */
  sceneStatusName: z.string().optional().describe("场景状态名称"),
  /** 场景状态切换延迟（毫秒） */
  switchSceneStatusDelay: z.number().optional().describe("场景状态切换延迟（毫秒）"),
  /** 快进时间（毫秒） */
  timeFastIn: z.number().optional().describe("快进时间（毫秒）"),
  /** 后退时间（毫秒） */
  timeRewind: z.number().optional().describe("后退时间（毫秒）"),
  /** 场景关卡ID */
  sceneLevelId: z.number().optional().describe("场景关卡ID"),
  /** 关键帧动画名称 */
  keyframesName: z.string().optional().describe("关键帧动画名称"),
  /** 关键帧播放延迟（毫秒） */
  keyframesPlayDelay: z.number().optional().describe("关键帧播放延迟（毫秒）"),
  /** 状态动画名称 */
  stateAnimationName: z.string().optional().describe("状态动画名称"),
  /** 动画状态 */
  animationState: z.number().optional().describe("动画状态"),
  /** 状态动画播放延迟（毫秒） */
  stateAnimationPlayDelay: z.number().optional().describe("状态动画播放延迟（毫秒）"),
  /** 场景对象配置 */
  sceneObject: z
    .object({
      /** 对象名称列表 */
      nameList: z.array(z.string()).describe("对象名称列表"),
      /** 对象名称（可选） */
      name: z.string().optional().describe("对象名称"),
      /** 对象信息列表 */
      objInfoList: z.array(z.any()).describe("对象信息列表"),
      /** 可见性状态 */
      visible: z.string().describe("可见性状态")
    })
    .optional()
    .describe("场景对象配置"),
  /** 场景对象爆炸配置 */
  sceneObjectExplosion: z
    .object({
      /** 对象ID */
      index: z.string().describe("对象ID"),
      /** 机盖名称 */
      lidName: z.string().describe("机盖名称"),
      /** 机底名称 */
      baseName: z.string().describe("机底名称"),
      /** 爆炸类型 */
      type: z.string().describe("爆炸类型")
    })
    .optional()
    .describe("场景对象爆炸配置"),
  /** 场景子组件配置 */
  sceneChildComponent: z
    .object({
      /** 子组件名称列表 */
      nameList: z.array(z.string()).describe("子组件名称列表"),
      /** 子组件信息列表 */
      childComponentInfoList: z.array(z.any()).describe("子组件信息列表"),
      /** 可见性状态 */
      visible: z.string().describe("可见性状态")
    })
    .optional()
    .describe("场景子组件配置"),
  /** 地图子组件配置 */
  mapChildComponent: z
    .object({
      /** 子组件名称列表 */
      nameList: z.array(z.string()).describe("子组件名称列表"),
      /** 子组件信息列表 */
      childComponentInfoList: z.array(z.any()).describe("子组件信息列表"),
      /** 可见性状态 */
      visible: z.string().describe("可见性状态")
    })
    .optional()
    .describe("地图子组件配置"),
  /** 2.5D 地图地块抬升配置 */
  glMapRegionLift: z
    .object({
      /** 地块选项 ID，当前与 adcode 保持一致 */
      regionId: z.string().describe("地块选项 ID，当前与 adcode 保持一致"),
      /** 地块行政编码/区域编码 */
      adcode: z.string().describe("地块行政编码/区域编码"),
      /** 地块显示名称 */
      name: z.string().describe("地块显示名称"),
      /** 抬升高度，语义与地图配置的悬停抬升一致 */
      height: z.number().describe("抬升高度"),
      /** 抬升动画间隔/时长，单位毫秒 */
      duration: z.number().describe("抬升动画间隔/时长（毫秒）")
    })
    .optional()
    .describe("2.5D 地图地块抬升配置"),
  /** 2.5D 地图视角漫游配置 */
  glMapSceneRoam: z
    .object({
      /** 场景管理中的场景 ID */
      sceneId: z.string().describe("场景管理中的场景 ID")
    })
    .optional()
    .describe("2.5D 地图视角漫游配置"),
  /** API指令详情 */
  apiInstructionDetail: z.string().optional().describe("API指令详情"),
  /** API指令延迟（毫秒） */
  apiInstructionDelay: z.number().optional().describe("API指令延迟（毫秒）"),
  /** 缩放配置 */
  scale: z
    .object({
      /** 是否锁定缩放 */
      lock: z.boolean().describe("是否锁定缩放"),
      /** 缩放原点 */
      origin: z.string().describe("缩放原点"),
      /** 原点网格位置 */
      originGrid: z
        .object({
          /** 左边距 */
          left: z.string().describe("左边距"),
          /** 顶边距 */
          top: z.string().describe("顶边距")
        })
        .describe("原点网格位置"),
      /** X轴缩放比例 */
      x: z.number().describe("X轴缩放比例"),
      /** Y轴缩放比例 */
      y: z.number().describe("Y轴缩放比例")
    })
    .optional()
    .describe("缩放配置"),
  /** 位移配置 */
  translate: z
    .object({
      /** X轴目标位置 */
      toX: z.number().describe("X轴目标位置"),
      /** Y轴目标位置 */
      toY: z.number().describe("Y轴目标位置")
    })
    .optional()
    .describe("位移配置"),
  /** 加密密钥（可为空） */
  encodeKey: z.string().nullable().optional().describe("加密密钥"),
  /** UE4引擎配置 */
  ue4Config: z
    .object({
      /** 消息名称 */
      messageName: z.string().describe("消息名称"),
      /** 消息JSON */
      messageJson: z.string().describe("消息JSON"),
      /** 消息内容 */
      messageContent: z.string().describe("消息内容"),
      /** 消息类型 */
      messageType: z.string().describe("消息类型")
    })
    .optional()
    .describe("UE4引擎配置"),
  /** UE4 蓝图 key，用于切换蓝图 */
  blueprintKey: z.string().optional().describe("UE4 蓝图 key，用于切换蓝图"),
  /** 自定义动作类型标识 */
  customActionType: z.enum(["component", "message", "statusAnimation"]).optional().describe("自定义动作类型标识"),
  /** 面板状态动画ID */
  panelStatusAnimationId: z.string().optional().describe("面板状态动画ID"),
  /** 面板状态ID */
  panelStatusId: z.string().optional().describe("面板状态ID"),
  /** TCP/UDP协议配置 */
  tcpudpConfig: z
    .object({
      /** 数据类型 */
      dataType: z.enum(tcpudpDataTypeEnum).describe("数据类型"),
      /** 数据源ID */
      dataSourceId: z.string().describe("数据源ID"),
      /** 数据源对象 */
      dataSourceObj: z
        .lazy(() => DataSourceTypeSchema)
        .nullable()
        .describe("数据源对象"),
      /** 发送数据 */
      sendData: z.string().describe("发送数据"),
      /** 发送类型 */
      sendType: z.string().describe("发送类型"),
      /** 数据延迟（毫秒） */
      dataDelay: z.number().describe("数据延迟（毫秒）")
    })
    .optional()
    .describe("TCP/UDP协议配置"),
  /** 项目函数名称 */
  projectFunName: z.string().optional().describe("项目函数名称"),
  /** 项目参数列表 */
  projectParamList: z.array(z.any()).optional().describe("项目参数列表"),
  /** 项目参数类型 */
  projectParamType: z.string().optional().describe("项目参数类型"),
  /** 项目参数键值对 */
  projectParamValue: z.record(z.string(), z.any()).optional().describe("项目参数键值对"),
  /** 项目参数代码 */
  projectParamCode: z.string().optional().describe("项目参数代码"),
  /** 轮播卡片标签名称 */
  swiperCardTabsName: z.string().optional().describe("轮播卡片标签名称"),
  /** 数字人消息内容 */
  aiManMsgContent: z.string().optional().describe("数字人消息内容"),
  /** 广播ID（可为空） */
  setBroadcastId: z.string().nullable().optional().describe("广播ID"),
  /** 视频开始时间（秒） */
  videoStartTime: z.number().optional().describe("视频开始时间（秒）"),
  /** 视频结束时间（秒） */
  videoEndTime: z.number().optional().describe("视频结束时间（秒）"),
  /** 事件选择模型集合 */
  option: z.record(z.string(), z.any()).optional().describe("事件选择模型集合"),
  /** 当前页码 */
  /** 译文转换 */
  translation: z.string().optional().describe("译文转换"),
  /** 2.5D 地图标牌选中状态切换配置 */
  glMapIconActive: z
    .object({
      childId: z.string().describe("标牌子组件 ID，空字符串表示匹配所有标牌子组件"),
      matchField: z.string().describe("标牌数据匹配字段"),
      matchValue: z.string().describe("标牌数据匹配值"),
      matchValueSource: z.enum(["static", "event"]).describe("匹配值来源"),
      eventField: z.string().describe("从事件抛出值里读取的字段路径"),
      action: z.enum(["select", "unselect", "toggle"]).describe("选中状态操作"),
      exclusive: z.boolean().describe("是否排他选中"),
      clearWhenMiss: z.boolean().describe("未匹配时是否清空选中")
    })
    .optional()
    .describe("2.5D 地图标牌选中状态切换配置")
});

/** 加密动作接口 Schema */
export const EncodeActionSchema: z.ZodSchema<EncodeAction> = z.object({
  /** 动作唯一标识符 */
  id: z.string().describe("动作唯一标识符"),
  /** 动作显示名称 */
  name: z.string().describe("动作显示名称"),
  /** 动作类型 */
  action: z.string().describe("动作类型"),
  /** 动作关联的扩展配置数据 */
  actionData: z.record(z.string(), z.any()).describe("动作关联的扩展配置数据"),
  /** 关联的组件ID列表 */
  component: z.array(ComponentRefSchema).describe('关联的组件ID列表，如 ["$component(1305156)"]'),
  /** 组件配置参数 */
  componentConfig: z.any().describe("组件配置参数"),
  /** 组件作用域 */
  componentScope: z.string().describe("组件作用域"),
  /** 标签（可为空） */
  encodeLabel: z.string().nullable().describe("标签"),
  /** 键值（可为空） */
  encodeKey: z.string().nullable().describe("键值"),
  /** 数值数组 */
  encodeValue: z.array(z.number()).describe("数值数组")
});

/** 事件接口 Schema */
export const EventSchema = z.lazy(() =>
  z
    .object({
      /** 触发器 */
      trigger: z.enum(EventTypeEnum).describe("触发器"),
      /** 事件名称 */
      name: z.string().describe("事件名称"),
      /** 事件ID */
      id: z.string().describe("事件ID"),
      /** 条件类型 */
      conditionType: ConditionLogicTypeEnumSchema,
      /** 条件列表 */
      conditions: z.array(ConditionSchema).describe("条件列表"),
      /** 操作列表 */
      actions: z.array(ActionSchema).describe("操作列表"),
      /** 按钮对象列表 */
      btnObjs: z.array(z.any().describe("按钮对象"))
    })
    .catchall(z.any().describe("其他任意属性"))
);

/** 加密事件接口 Schema */
export const EncodeEventSchema = z.object({
  /** 触发器 */
  trigger: z.enum(EncodeEventTypeEnum).describe("触发器"),
  /** 事件名称 */
  name: z.string().describe("事件名称"),
  /** 事件ID */
  id: z.string().describe("事件ID"),
  /** 条件类型 */
  conditionType: ConditionLogicTypeEnumSchema,
  /** 条件列表 */
  conditions: z.array(ConditionSchema).describe("条件列表"),
  /** 操作列表 */
  actions: z.array(EncodeActionSchema).describe("操作列表")
});
