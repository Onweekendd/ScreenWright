// 定义与给定 JSON 结构对应的类型
interface Performance {
  isSetPerformance: boolean;
  num: number;
  type: string;
}

interface PublishQuality {
  isSetPublishQuality: boolean;
  type: string;
  resolution: string;
  effect: string;
  shadow: string;
  texture: string;
}

export interface typeParamsMapInfo {
  performance: Performance;
  publishQuality: PublishQuality;
  id: number;
  versionCode: string;
  publishInfo: string;
  isPublish: boolean;
}
