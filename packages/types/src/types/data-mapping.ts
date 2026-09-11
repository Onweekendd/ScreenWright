/**
 * 数据映射配置
 * @description 数据字段的映射配置，用于数据字段的转换和映射
 */
export interface DataRemark {
  /** 描述 */
  description?: string;

  /** 键名 */
  key: string;

  /** 映射规则 */
  map: string;

  /** 描述（可选） */
  decription?: string;
}
