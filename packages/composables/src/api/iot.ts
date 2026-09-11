import type {
  ApiResponse,
  DeviceControlConfigList,
  DeviceGroup,
  DeviceOperateItem,
  DeviceOperateParams,
  DeviceQueryParams,
  DeviceRecord,
  PaginationResult,
  ProductCategory,
  ProductItem,
  RequestParams,
  WindowInfo
} from "@screenwright/types";
import type { OperateCode } from "@screenwright/types";
import axios, { type AxiosInstance, type AxiosPromise } from "axios";

interface ListWindowsParams {
  deviceId: number;
  pattern?: string;
  baseUrl?: string;
}

// IoT API 服务类
class IotApiService {
  private axiosInstance: AxiosInstance;
  private _baseUrl = "";

  constructor() {
    this.axiosInstance = axios.create();
  }

  // 设置基础URL
  setBaseUrl(baseUrl: string) {
    this._baseUrl = baseUrl;
    this.axiosInstance.defaults.baseURL = baseUrl;
  }

  // 获取当前基础URL
  get baseUrl() {
    return this._baseUrl;
  }

  // API方法
  getProductByOperateCode = (operateCode: OperateCode, baseUrl?: string): AxiosPromise<ApiResponse<ProductItem[]>> => {
    const url = baseUrl || this._baseUrl;
    return this.axiosInstance({
      url: `${url}/product/listByOperateCode/${operateCode}`,
      method: "get"
    });
  };

  deviceDefaultPage = (
    params: Partial<RequestParams>,
    baseUrl?: string
  ): AxiosPromise<ApiResponse<PaginationResult<DeviceRecord[]>>> => {
    const url = baseUrl || this._baseUrl;
    return this.axiosInstance({
      url: `${url}/device/defaultPage`,
      method: "post",
      data: {
        pageSize: 1000,
        ...params
      }
    });
  };

  deviceGroupList = (baseUrl?: string): AxiosPromise<ApiResponse<DeviceGroup[]>> => {
    const url = baseUrl || this._baseUrl;
    return this.axiosInstance({
      url: `${url}/device/group/list`,
      method: "get"
    });
  };

  deviceGetById = (id: number, baseUrl?: string): AxiosPromise<ApiResponse<DeviceRecord>> => {
    const url = baseUrl || this._baseUrl;
    return this.axiosInstance({
      url: `${url}/device/getById/${id}`,
      method: "get"
    });
  };

  deviceInvokeOperate = (params: DeviceOperateParams, baseUrl?: string): AxiosPromise<ApiResponse<any>> => {
    const url = baseUrl || this._baseUrl;
    return this.axiosInstance({
      url: `${url}/device/invokeOperate`,
      method: "post",
      data: params
    });
  };

  getInfoByDeviceId = (deviceId: number, baseUrl?: string): AxiosPromise<ApiResponse<DeviceRecord>> => {
    const url = baseUrl || this._baseUrl;
    return this.axiosInstance({
      url: `${url}/device/getInfoByDeviceId/${deviceId}`,
      method: "get"
    });
  };

  getListWindows = async ({ deviceId, pattern = ".*", baseUrl }: ListWindowsParams): Promise<WindowInfo[]> => {
    try {
      const {
        data: { result }
      } = await this.deviceInvokeOperate(
        {
          deviceId,
          operateCode: "LIST_WINDOWS",
          params: {
            pattern
          }
        },
        baseUrl || this._baseUrl
      );
      return result;
    } catch (error) {
      console.error("获取可切换页面选项失败", error);
      return [];
    }
  };

  integratedControlDefaultPage = (
    params: Partial<RequestParams>,
    baseUrl?: string
  ): AxiosPromise<ApiResponse<PaginationResult<DeviceControlConfigList[]>>> => {
    const url = baseUrl || this._baseUrl;
    return this.axiosInstance({
      url: `${url}/integratedControl/defaultPage`,
      method: "post",
      data: {
        pageSize: 1000,
        ...params
      }
    });
  };

  integratedControlInvoke = (id: number, baseUrl?: string): AxiosPromise<ApiResponse<Record<string, never>>> => {
    const url = baseUrl || this._baseUrl;
    return this.axiosInstance({
      url: `${url}/integratedControl/invoke/${id}`,
      method: "get"
    });
  };

  listByProductCategory = (baseUrl?: string): AxiosPromise<ApiResponse<ProductCategory[]>> => {
    const url = baseUrl || this._baseUrl;
    return this.axiosInstance({
      url: `${url}/product/category/list`,
      method: "get"
    });
  };

  listByCategoryId = (id: number, baseUrl?: string): AxiosPromise<ApiResponse<ProductItem[]>> => {
    const url = baseUrl || this._baseUrl;
    return this.axiosInstance({
      url: `${url}/product/listByCategoryId/${id}`,
      method: "get"
    });
  };

  listDeviceByCode = (params: DeviceQueryParams, baseUrl?: string): AxiosPromise<ApiResponse<DeviceRecord[]>> => {
    const url = baseUrl || this._baseUrl;
    return this.axiosInstance({
      url: `${url}/device/listDevice`,
      method: "post",
      data: params
    });
  };

  listDeviceOperateByDeviceId = (id: number, baseUrl?: string): AxiosPromise<ApiResponse<DeviceOperateItem[]>> => {
    const url = baseUrl || this._baseUrl;
    return this.axiosInstance({
      url: `${url}/device/listDeviceOperateByDeviceId/${id}`,
      method: "get"
    });
  };

  integratedControlLogPage = (
    params: Record<string, any>,
    baseUrl?: string
  ): AxiosPromise<ApiResponse<PaginationResult<any[]>>> => {
    const url = baseUrl || this._baseUrl;
    return this.axiosInstance({
      url: `${url}/integratedControlLog/defaultPage`,
      method: "post",
      data: {
        current: 1,
        pageSize: 10,
        orderColumns: [{ updatedTime: "desc" }],
        selectObj: params
      }
    });
  };
}

// 创建单例实例
const iotApiService = new IotApiService();

// 导出服务实例和兼容性方法
export { iotApiService };

// 为了保持向后兼容，导出原有的函数形式
export const getProductByOperateCode = (
  operateCode: OperateCode,
  baseUrl: string
): AxiosPromise<ApiResponse<ProductItem[]>> => iotApiService.getProductByOperateCode(operateCode, baseUrl);

export const deviceDefaultPage = (
  params: Partial<RequestParams>,
  baseUrl: string
): AxiosPromise<ApiResponse<PaginationResult<DeviceRecord[]>>> => iotApiService.deviceDefaultPage(params, baseUrl);

export const deviceGroupList = (baseUrl: string): AxiosPromise<ApiResponse<DeviceGroup[]>> =>
  iotApiService.deviceGroupList(baseUrl);

export const deviceGetById = (id: number, baseUrl: string): AxiosPromise<ApiResponse<DeviceRecord>> =>
  iotApiService.deviceGetById(id, baseUrl);

export const deviceInvokeOperate = (params: DeviceOperateParams, baseUrl: string): AxiosPromise<ApiResponse<any>> =>
  iotApiService.deviceInvokeOperate(params, baseUrl);

export const getInfoByDeviceId = (deviceId: number, baseUrl: string): AxiosPromise<ApiResponse<DeviceRecord>> =>
  iotApiService.getInfoByDeviceId(deviceId, baseUrl);

export const getListWindows = async ({
  deviceId,
  pattern = ".*",
  baseUrl
}: {
  deviceId: number;
  pattern?: string;
  baseUrl: string;
}): Promise<WindowInfo[]> => {
  // 设置临时baseUrl进行此次调用
  const originalBaseUrl = iotApiService.baseUrl;
  iotApiService.setBaseUrl(baseUrl);
  const result = await iotApiService.getListWindows({ deviceId, pattern });
  // 恢复原来的baseUrl
  if (originalBaseUrl) {
    iotApiService.setBaseUrl(originalBaseUrl);
  }
  return result;
};

export const integratedControlDefaultPage = (
  params: Partial<RequestParams>,
  baseUrl: string
): AxiosPromise<ApiResponse<PaginationResult<DeviceControlConfigList[]>>> =>
  iotApiService.integratedControlDefaultPage(params, baseUrl);

export const integratedControlInvoke = (
  id: number,
  baseUrl: string
): AxiosPromise<ApiResponse<Record<string, never>>> => iotApiService.integratedControlInvoke(id, baseUrl);

export const listByProductCategory = (baseUrl: string): AxiosPromise<ApiResponse<ProductCategory[]>> =>
  iotApiService.listByProductCategory(baseUrl);

export const listByCategoryId = (id: number, baseUrl: string): AxiosPromise<ApiResponse<ProductItem[]>> =>
  iotApiService.listByCategoryId(id, baseUrl);

export const listDeviceByCode = (
  params: DeviceQueryParams,
  baseUrl: string
): AxiosPromise<ApiResponse<DeviceRecord[]>> => iotApiService.listDeviceByCode(params, baseUrl);

export const listDeviceOperateByDeviceId = (id: number, baseUrl: string): AxiosPromise<ApiResponse<any[]>> =>
  iotApiService.listDeviceOperateByDeviceId(id, baseUrl);

export const integratedControlLogPage = (
  params: Record<string, any>,
  baseUrl: string
): AxiosPromise<ApiResponse<PaginationResult<any[]>>> => iotApiService.integratedControlLogPage(params, baseUrl);
