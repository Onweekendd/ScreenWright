// 图片数据类型定义
export interface ImageItem {
  src: string;
  title: string;
  id?: string | number;
  url?: string;
  name?: string;
}

// 分页参数类型
export interface PaginationParams {
  currentPage: number;
  pageSize: number;
  total: number;
}

// 上传响应类型
export interface UploadResponse {
  src: string;
  title: string;
  id: string | number;
}

// 素材库图片类型
export interface MaterialLibraryImage {
  url: string;
  name: string;
  id?: string | number;
}
