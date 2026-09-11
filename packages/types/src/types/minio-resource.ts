/**
 * 资源信息接口
 * @description Minio存储资源的相关信息配置
 */
export interface MinioResource {
  /** 创建人 */
  createdBy: string;

  /** 创建时间 */
  createdTime: string;

  /** 更新人 */
  updatedBy: string;

  /** 更新时间 */
  updatedTime: string;

  /** 资源ID */
  id: number;

  /** 用户ID */
  userId: number;

  /** 资源URL */
  url: string;

  /** 文件名 */
  fileName: string;

  /** 资源类型 */
  resourceType: number;

  /** 认证信息 */
  auth: any | null;

  /** 文件类型 */
  fileType: number;

  /** 大屏ID */
  largeId: number;

  /** 组ID（可选） */
  groupId: number | null;

  /** 封面图 */
  cover: any | null;

  /** HDR预览图 */
  hdrPreviewImg: any | null;

  /** 资源名称 */
  name: string;

  /** 封面名称 */
  coverName: string | null;

  /** 资源大小（可选） */
  resourceSize?: number;

  /** 图层ID列表 */
  layerIds: string;

  /** 大屏使用ID列表 */
  largeUseIds: string;

  /** 矢量数据预览图 */
  vectorDataPreviewImg: any | null;
}

/**
 * 组件上挂的素材库条目（`ComponentType.minioArr` 的元素）。
 *
 * 【它不是 {@link MinioResource}】minioArr 存的是「从素材库里选中的那一项」
 * （id / name / title / img / url / type / isVideo / fileType / moduleId / assetType），
 * 而 MinioResource 是 MinIO 接口返回的资源记录（fileName / resourceType / largeId /
 * layerIds / largeUseIds…），两者字段几乎不重叠，连 fileType 的类型都不同（这里是
 * "webm" 这样的字符串，那边是数字）。
 *
 * 两个写入点都写着 `as unknown as MinioResource[]`——那对双重断言就是这件事一直没被摆平的痕迹。
 * 消费方只用到 id（buildRender/utils.ts 拼 minioIds），所以这里只约束 id，其余字段原样保留。
 */
export interface ComponentMinioAsset {
  /** 素材 ID */
  id: number;
  [key: string]: unknown;
}
