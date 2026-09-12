import { z } from "zod";

import type { BindComponent, ComponentType, DataSourceType, Filter } from "../types";
import { AnimationSchema } from "./animation";
import { CallbackSchema, DataRemarkSchema, DataSourceTypeSchema, DataTypeSchema, ListenArgSchema } from "./data";
import { allComponentTypeSchema } from "./enums";
import { EncodeEventSchema, EventSchema } from "./event-action-condition";
import { ComponentMinioAssetSchema } from "./minio";

// ============================================
// Component Related Schemas
// ============================================

/** 绑定组件 Schema */
export const BindComponentSchema: z.ZodSchema<BindComponent> = z.object({
  /** 标签显示文本 */
  label: z.string().describe("标签显示文本"),
  /** 组件ID */
  id: z.union([z.number().describe("数字类型ID"), z.string().describe("字符串类型ID")])
});

/** 临时池 Schema */
export const TempPoolSchema = z.object({
  /** 回调函数列表 */
  callBack: z.array(z.any().describe("回调函数")).describe("回调函数列表"),
  /** 数据格式化器 */
  dataFormatter: z.string().describe("数据格式化器")
});

/** 过滤器 Schema */
export const FilterSchema: z.ZodSchema<Filter> = z.object({
  /** 回调函数列表 */
  callBack: z.array(z.string().describe("回调函数名")).describe("回调函数列表"),
  /** 回调状态 */
  callBackStatus: z.boolean().describe("回调状态"),
  /** 数据格式化器 */
  dataFormatter: z.string().describe("数据格式化器"),
  /** 绑定组件列表 */
  bindComponent: z.array(BindComponentSchema).describe("绑定组件列表"),
  /** 是否已选中 */
  checked: z.boolean().describe("是否已选中"),
  /** 是否未保存 */
  notSaved: z.boolean().describe("是否未保存"),
  /** 临时池 */
  tempPool: TempPoolSchema.describe("临时池"),
  /** 过滤器名称 */
  name: z.string().describe("过滤器名称"),
  /** 是否显示（可选） */
  show: z.boolean().describe("是否显示").optional(),
  /** 过滤器ID（可选） */
  id: z.string().describe("过滤器ID").optional()
});

/** 面板状态 Flat Schema（config 为组件ID数组，用于 ComponentFlatSchema） */
export const PanelStateFlatSchema = z.object({
  /** 状态ID */
  id: z.string().describe("状态ID"),
  /** 状态标题 */
  title: z.string().describe("状态标题"),
  /** 状态名称 */
  name: z.string().describe("状态名称"),
  /** 动态面板内部组件ID列表 */
  config: z.array(z.number()).describe("动态面板内部组件ID列表"),
  /** 背景颜色 */
  backgroundColor: z.string().describe("背景颜色"),
  /** 是否显示背景图片 */
  showBackgroundImage: z.boolean().describe("是否显示背景图片"),
  /** 背景图片 */
  backgroundImage: z.string().describe("背景图片"),
  /** 是否显示屏幕适配 */
  showScreenAdaptation: z.boolean().describe("是否显示屏幕适配"),
  /** 资源ID（可选） */
  minioIds: z
    .array(z.union([z.number(), z.null()]))
    .describe("资源ID")
    .optional(),
  /** 屏幕适配规范 */
  adaptationNorm: z.string().describe("屏幕适配规范"),
  /** 适配类型 */
  adaptationType: z.number().describe("适配类型")
});

/** 标准组件类型（无嵌套版）Schema - children/presetChild/panelData 以 z.any() 表示，可直接用于工具入参等无需递归的场景 */
export const ComponentFlatSchema = z
  .object({
    /** 组件ID */
    id: z.number().describe("组件ID"),
    /** 组件基础配置 */
    component: z
      .object({
        /** 组件属性 */
        prop: allComponentTypeSchema.describe("组件属性"),
        /** 宽度 */
        width: z.number().describe("宽度"),
        /** 高度 */
        height: z.number().describe("高度"),
        /** 组件名称 */
        name: z.string().describe("组件名称")
      })
      .strict()
      .describe("组件基础配置"),
    /** 是否为分组（可选） */
    group: z.boolean().describe("是否为分组").optional(),
    /** 是否被选中（可选） */
    selected: z.boolean().describe("是否被选中").optional(),
    /** 组件名称 */
    name: z.string().describe("组件名称"),
    /** 左边距 */
    left: z.number().describe("左边距"),
    /** 顶边距 */
    top: z.number().describe("顶边距"),
    /** 是否锁定（可选，部分组件未设置） */
    isLock: z.boolean().describe("是否锁定").optional(),
    /** Z轴层级 */
    zIndex: z.number().describe("Z轴层级"),
    /** 是否显示 */
    display: z.boolean().describe("是否显示"),
    /** 组件选项配置 */
    option: z.any().optional().describe("组件选项配置"),
    /** 组件数据 */
    data: z.any().optional().describe("组件数据"),
    /** 组件图片 */
    img: z.string().describe("组件图片").optional().default(""),
    /** 组件标题 */
    title: z.string().describe("组件标题"),
    /** 监听参数列表 */
    listenArgs: z.array(ListenArgSchema).describe("监听参数列表").optional().default([]),
    /** 回调参数列表（可选，缺省为空数组：内联子组件 / 旧数据可能未写该字段，递归校验时自动补齐） */
    cbArgs: z.array(CallbackSchema).describe("回调参数列表").optional().default([]),
    /** 是否开启过滤器（可选，部分组件未设置） */
    openFilter: z.boolean().describe("是否开启过滤器").optional(),
    /** 子组件 */
    children: z.array(z.number().describe("子组件ID")).optional().describe("子组件列表"),
    /** 数据源 */
    dataSource: DataSourceTypeSchema.catch({} as DataSourceType).describe("数据源"),
    /** 数据类型 */
    dataType: DataTypeSchema.catch(0).describe("数据类型"),
    /** 数据映射配置列表 */
    dataRemark: z.array(DataRemarkSchema).optional().describe("数据映射配置列表"),
    /** 事件列表 */
    events: z.array(EventSchema).default([]).describe("事件列表"),
    /** 加密事件列表（可选） */
    encodes: z.array(EncodeEventSchema).describe("加密事件列表").optional(),
    /** URL（可选） */
    url: z.string().describe("URL").optional(),
    /** 路径（可选） */
    path: z.string().describe("路径").optional(),
    /** 数据查询（可选） */
    dataQuery: z.string().describe("数据查询").optional(),
    /** 加载动画配置 */
    loadAnimation: AnimationSchema.catch({
      type: "none",
      duration: 1000,
      delay: 0,
      timingFunction: "linear"
    }).describe("加载动画配置"),
    /** 预设子组件列表（可选，可以是组件对象数组或ID列表） */
    presetChild: z.array(z.any()).describe("预设子组件列表").optional(),
    /** 动态面板数据（可选） */
    panelData: z.array(PanelStateFlatSchema).describe("动态面板数据").optional(),
    /** 当前激活状态（可选） */
    activeStatusId: z.string().nullable().describe("当前激活状态").optional(),
    /** Minio资源列表（可选） */
    minioArr: z.array(ComponentMinioAssetSchema).describe("素材库条目列表").optional(),
    /** 父组件ID（可选） */
    parent: z.number().describe("父组件ID").optional(),
    /** 铺满类型（可选） */
    unitPavenType: z
      .union([z.literal("percent"), z.literal("")])
      .transform((val) => (val === "" ? undefined : val))
      .describe("铺满类型")
      .optional(),
    /** 父级动态面板ID列表（可选） */
    parentDynamicPanelId: z.array(z.number()).describe("父级动态面板ID列表").optional(),
    /** 父级编码ID（可选） */
    parentEncodeId: z.string().describe("父级编码ID").optional()
  })
  .catchall(z.any().describe("其他任意属性"));

/** 子组件接口 Schema */
// @ts-expect-error - 递归类型无法显式标注，使用推断类型
export const ChildComponentSchema = z.lazy(() =>
  z
    .object({
      /** 子组件ID */
      id: z.string().describe("子组件ID"),
      /** 是否正在编辑 */
      isEdit: z.boolean().describe("是否正在编辑"),
      /** 是否显示 */
      show: z.boolean().describe("是否显示"),
      /** 是否显示操作按钮 */
      showOperation: z.boolean().describe("是否显示操作按钮"),
      /** 子组件类型 */
      type: z.string().describe("子组件类型"),
      /** 数据请求方法 */
      dataMethod: z.enum(["get", "post", "put", "delete"]).describe("数据请求方法"),
      /** 数据类型 */
      dataType: z.number().describe("数据类型"),
      /** 请求头 */
      requestHeader: z.record(z.string().describe("请求头键"), z.any().describe("请求头值")).describe("请求头"),
      /** 请求体 */
      requestBody: z.record(z.string().describe("请求体键"), z.any().describe("请求体值")).describe("请求体"),
      /** 是否跨域 */
      crossOrigin: z.boolean().describe("是否跨域"),
      /** 是否需要Cookie */
      needCookie: z.boolean().describe("是否需要Cookie"),
      /** 是否自动刷新 */
      autoRefresh: z.boolean().describe("是否自动刷新"),
      /** SQL查询语句 */
      sql: z.string().describe("SQL查询语句"),
      /** 组件基础配置 */
      component: z
        .object({
          /** 组件属性 */
          prop: z.string().describe("组件属性"),
          /** 宽度 */
          width: z.number().describe("宽度"),
          /** 高度 */
          height: z.number().describe("高度"),
          /** 组件名称 */
          name: z.string().describe("组件名称")
        })
        .strict()
        .describe("组件基础配置"),
      /** 组件选项配置 */
      option: z.any().optional().describe("组件选项配置"),
      /** 组件名称 */
      name: z.string().describe("组件名称"),
      /** 左边距 */
      left: z.number().describe("左边距"),
      /** 顶边距 */
      top: z.number().describe("顶边距"),
      /** 是否锁定 */
      isLock: z.boolean().describe("是否锁定"),
      /** Z轴层级 */
      zIndex: z.number().describe("Z轴层级"),
      /** 是否显示 */
      display: z.boolean().describe("是否显示"),
      /** 组件数据 */
      data: z.any().optional().describe("组件数据"),
      /** 组件图片 */
      img: z.string().describe("组件图片"),
      /** 组件标题 */
      title: z.string().describe("组件标题"),
      /** 监听参数列表 */
      listenArgs: z.array(ListenArgSchema).describe("监听参数列表"),
      /** 回调参数列表 */
      cbArgs: z.array(CallbackSchema).describe("回调参数列表"),
      /** 是否开启过滤器 */
      openFilter: z.boolean().describe("是否开启过滤器"),
      /** 数据源 */
      dataSource: DataSourceTypeSchema.describe("数据源"),
      /** 数据映射配置列表 */
      dataRemark: z.array(DataRemarkSchema).describe("数据映射配置列表"),
      /** 事件列表 */
      events: z.array(EventSchema).describe("事件列表"),
      /** 加密事件列表（可选） */
      encodes: z.array(EncodeEventSchema).describe("加密事件列表").optional(),
      /** URL（可选） */
      url: z.string().describe("URL").optional(),
      /** 路径（可选） */
      path: z.string().describe("路径").optional(),
      /** 数据查询（可选） */
      dataQuery: z.string().describe("数据查询").optional(),
      /** 加载动画配置 */
      loadAnimation: AnimationSchema.catch({
        type: "none",
        duration: 1000,
        delay: 0,
        timingFunction: "linear"
      }).describe("加载动画配置"),
      /** 预设子组件列表（可选） */
      presetChild: z
        .array(
          // @ts-expect-error - 递归引用的推断类型
          z.lazy(() => ChildComponentSchema)
        )
        .describe("预设子组件列表")
        .optional(),
      /** Minio资源列表（可选） */
      minioArr: z.array(ComponentMinioAssetSchema).describe("素材库条目列表").optional()
    })
    .catchall(z.any().describe("其他任意属性"))
);

/** 面板状态 Schema */
// config 运行时可以是组件对象或 ID，与 PanelState 类型定义不完全一致，故不强制标注
export const PanelStateSchema = z.lazy(() =>
  z.object({
    /** 状态ID */
    id: z.string().describe("状态ID"),
    /** 状态标题 */
    title: z.string().describe("状态标题"),
    /** 状态名称 */
    name: z.string().describe("状态名称"),
    /** 动态面板内部组件（组件对象或组件ID） */
    config: z
      .array(z.union([z.lazy((): z.ZodTypeAny => ComponentSchema), z.string(), z.number()]))
      .describe("动态面板内部组件"),
    /** 背景颜色 */
    backgroundColor: z.string().describe("背景颜色"),
    /** 是否显示背景图片 */
    showBackgroundImage: z.boolean().describe("是否显示背景图片"),
    /** 背景图片 */
    backgroundImage: z.string().describe("背景图片"),
    /** 是否显示屏幕适配 */
    showScreenAdaptation: z.boolean().describe("是否显示屏幕适配"),
    /** 资源ID（可选） */
    minioIds: z
      .array(z.union([z.number(), z.null()]))
      .describe("资源ID")
      .optional(),
    /** 屏幕适配规范 */
    adaptationNorm: z.string().describe("屏幕适配规范"),
    /** 适配类型 */
    adaptationType: z.number().describe("适配类型")
  })
);

/** 标准组件类型 Schema */
export const ComponentSchema: z.ZodType<ComponentType> = z.lazy(() =>
  ComponentFlatSchema.omit({ children: true, panelData: true }).extend({
    /** 组件选项配置（标准组件对象必有；ComponentFlatSchema 为兼容旧数据放宽成可选，这里收回为必填） */
    option: z.any().describe("组件选项配置"),
    /**
     * 组件数据。
     * zod4 里对象值写 `z.any()`（不带修饰）会要求键必须存在，缺键即报 nonoptional。
     * 而分组（sw-folder）这类纯容器的模板本就没有 data 字段——它不承载数据，只做空间归组。
     * `.default(undefined)` 让入参可以整块不写，同时输出类型仍视 data 为存在，
     * 不破坏 `z.ZodType<ComponentType>`（ComponentType.data 必填）。
     */
    data: z.any().default(() => undefined),
    /** 子组件列表（可选，可以是组件对象或组件ID） */
    children: z
      .array(z.lazy((): z.ZodType<ComponentType> => ComponentSchema))
      .describe("子组件列表")
      .optional(),
    /** 动态面板数据（可选） */
    panelData: z.array(PanelStateSchema).describe("动态面板数据").optional()
  })
);
