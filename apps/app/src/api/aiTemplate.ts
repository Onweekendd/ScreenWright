import type {
  CopyComponentsParam,
  LargeScreenAiConfig,
  PageLargeScreenAiConfig,
  PageParamLargeScreenAiConfig
} from "@/model/AiTemplate";
import type { BaseEntity } from "@/model/BaseEntity";
import { BaseName } from "@/utils/config";
import { request } from "@/utils/service";

/** AI大屏配置（AI模板）接口前缀 */
const AI_TEMPLATE_BASE = `${BaseName.System}/ai-large-screen/config`;

/**
 * 分页查询AI模板列表（含关联信息表数据）
 * @param data 分页参数
 */
export const pageAiTemplate = (data: PageParamLargeScreenAiConfig) =>
  request<BaseEntity<PageLargeScreenAiConfig>>({
    url: `${AI_TEMPLATE_BASE}/list`,
    method: "post",
    data
  });

/**
 * 根据ID查询AI模板（含关联信息表数据）
 * @param id 主键
 */
export const queryAiTemplateById = (id: number) =>
  request<BaseEntity<LargeScreenAiConfig>>({
    url: `${AI_TEMPLATE_BASE}/${id}`,
    method: "get"
  });

/**
 * 新增AI模板（同步写入info表）
 * @param data AI模板配置
 */
export const saveAiTemplate = (data: LargeScreenAiConfig) =>
  request<BaseEntity<LargeScreenAiConfig>>({
    url: `${AI_TEMPLATE_BASE}/save`,
    method: "post",
    data
  });

/**
 * 更新AI模板（同步更新info表）
 * @param data AI模板配置
 */
export const updateAiTemplate = (data: LargeScreenAiConfig) =>
  request<BaseEntity<LargeScreenAiConfig>>({
    url: `${AI_TEMPLATE_BASE}/update`,
    method: "put",
    data
  });

/**
 * 删除AI模板（同步通知AI服务删除向量记录）
 * @param id 主键
 */
export const deleteAiTemplate = (id: number) =>
  request<BaseEntity<boolean>>({
    url: `${AI_TEMPLATE_BASE}/${id}`,
    method: "delete"
  });

/**
 * 将AI模板源大屏的所有组件批量深度复制到目标大屏
 * @param data 源AI模板配置id与目标普通大屏id
 */
export const copyAiTemplateComponents = (data: CopyComponentsParam) =>
  request<BaseEntity<Array<{ newId: number; oldId: number }>>>({
    url: `${AI_TEMPLATE_BASE}/copy-components`,
    method: "post",
    data
  });
