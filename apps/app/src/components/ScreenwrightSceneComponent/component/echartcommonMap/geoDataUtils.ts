// geoDataUtils.ts - 省市区数据查询工具类（阿里 DataV 在线数据源）

// ===================== 核心类型定义 =====================
/** 地理数据核心信息 */
interface GeoCoreInfo {
  adcode: string;
  name: string;
  level: string;
  parentAdcode: string;
}

/** GeoJSON特征属性类型（DataV 返回结构） */
interface GeoFeatureProperties {
  adcode: number | string;
  name: string;
  level: string;
  parent?: { adcode: number | string } | string;
  [key: string]: any; // 兼容其他未知属性
}

/** GeoJSON特征类型 */
interface GeoFeature {
  type: string;
  properties: GeoFeatureProperties;
  geometry: {
    type: string;
    coordinates: any[][][];
  };
  [key: string]: any;
}

/** GeoJSON完整数据类型 */
interface GeoFullData {
  type: string;
  features: GeoFeature[];
  [key: string]: any;
}

/** 查询返回结果类型 */
interface GeoDataResult {
  coreInfo: GeoCoreInfo;
  fullData: GeoFullData;
}

// ===================== 全局变量类型声明 =====================
declare global {
  interface Window {
    // 边界数据（按 adcode 缓存，供 3D 地图绘制边界发光线）
    geoData_border: Record<string, GeoFullData>;
    // 工具类实例
    GeoDataUtils: GeoDataUtils;
  }
}

/** 阿里 DataV 行政区划数据源 */
const DATAV_BASE = "https://geo.datav.aliyun.com/areas_v3/bound/";

// ===================== 工具类实现 =====================
class GeoDataUtils {
  // 已加载的区划数据缓存（含下级区划）
  private fullDataCache = new Map<string, GeoFullData>();

  /**
   * 初始化工具类（保留接口兼容，在线数据源无需前置加载）
   * @returns {GeoDataUtils} 实例
   */
  init(): GeoDataUtils {
    return this;
  }

  /**
   * 校验6位adcode编码格式
   * @param {string | number} code 待校验的编码
   * @returns {boolean} 是否为合法6位数字编码
   */
  validateCode(code: string | number): boolean {
    const codeStr = String(code);
    return /^\d{6}$/.test(codeStr);
  }

  /**
   * 请求 DataV 的 GeoJSON 文件
   * @param {string} file 文件名（如 440000_full.json）
   */
  private async fetchGeoJson(file: string): Promise<GeoFullData> {
    const response = await fetch(`${DATAV_BASE}${file}`);
    if (!response.ok) {
      throw new Error(`请求 ${file} 失败：${response.status}`);
    }
    return response.json();
  }

  /**
   * 动态加载指定区划的边界数据（不含下级区划），挂载到 window.geoData_border[adcode]
   * @param {string | number} adcode 6位adcode编码
   * @returns {Promise<void>}
   */
  async loadBorderData(adcode: string | number): Promise<void> {
    const codeStr = String(adcode);
    if (!window.geoData_border) window.geoData_border = {};
    if (window.geoData_border[codeStr]) return;

    window.geoData_border[codeStr] = await this.fetchGeoJson(`${codeStr}.json`);
  }

  /**
   * 核心方法：根据Code查询省市区数据（含下级区划）
   * @param {string | number} code 6位adcode编码
   * @returns {Promise<GeoDataResult | null>} 对应Code的完整数据（无数据返回null）
   */
  async getGeoData(code: string | number): Promise<GeoDataResult | null> {
    try {
      const codeStr = String(code);
      // 1. 校验格式
      if (!this.validateCode(codeStr)) {
        throw new Error(`编码格式错误：${codeStr}（必须是6位数字）`);
      }

      // 2. 读取缓存或在线拉取
      let targetData = this.fullDataCache.get(codeStr);
      if (!targetData) {
        targetData = await this.fetchGeoJson(`${codeStr}_full.json`);
        this.fullDataCache.set(codeStr, targetData);
      }

      // 提取核心信息，方便使用
      const firstProps = targetData.features[0]?.properties;
      const parent = firstProps?.parent;
      const coreInfo: GeoCoreInfo = {
        adcode: codeStr,
        name: firstProps?.name || "未知名称",
        level: firstProps?.level || "未知级别",
        parentAdcode: typeof parent === "object" && parent ? String(parent.adcode) : parent || "无"
      };

      return {
        coreInfo, // 核心信息（简化使用）
        fullData: targetData // 完整GeoJSON数据
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "未知错误";
      console.error(`❌ 查询编码${code}失败：${errorMsg}`);
      return null;
    }
  }

  /**
   * 获取已加载的区划编码列表
   * @returns {string[]}
   */
  getLoadedCodes(): string[] {
    return Array.from(this.fullDataCache.keys());
  }

  /**
   * 清空已加载的缓存（可选）
   */
  clearCache(): void {
    this.fullDataCache.clear();
  }
}

// 暴露单例实例（全局可复用）
window.GeoDataUtils = new GeoDataUtils();

// 导出类型（供其他TS文件导入使用）
export type { GeoCoreInfo, GeoDataResult, GeoFeature, GeoFeatureProperties, GeoFullData };
// 导出类（可选，如需局部实例化）
export default GeoDataUtils;
