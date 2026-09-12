import type { LargeScreeInfo } from "@screenwright/types";
import type { AxiosRequestConfig } from "axios";

import type { BaseEntity } from "@/model/BaseEntity";
import type { DataModelReq, DataModelRes, DataSceneReq, dbModelReq, dbModelRes, TcpUdpReq } from "@/model/DataModel";
import type { ScreenModuleRes } from "@/model/Library";
import { BaseName } from "@/utils/config";
import { serverRequest } from "@/utils/serverService";
import { request } from "@/utils/service";

interface Params {
  [key: string]: any;
  sourceId?: string;
  id?: string;
  deleteChild?: boolean;
  deleteId?: string;
}

interface Options {
  base: string;
  path: string;
  type: "get" | "post" | "put" | "delete";
  cityBase?: string;
  isJoin?: boolean;
}

export const getDataUrl = ({
  params = {},
  options = {
    base: "",
    path: "",
    type: "get"
  }
}: {
  params?: Params;
  options?: Options;
}) => {
  // 由于接口端口不同，后端暂未整合；特殊处理城市模板-整合后删除
  const defaultBase = options.cityBase || `${BaseName.System}`;
  const dataURL = options.isJoin
    ? `${defaultBase + options.base}/${params.sourceId || params.id}${options.path}`
    : `${defaultBase + options.base}${options.path}`;

  const resOptions: AxiosRequestConfig = {
    url: dataURL,
    method: options.type
  };

  // 大屏 / 数据管理 / 素材分组树已回落 Screenwright；接口调试器等仍走 Java
  const funaiBases = ["/largeScreen", "/data", "/minioGroup"];
  const useFunai = !options.cityBase && funaiBases.includes(options.base);

  switch (options.type) {
    case "get":
      resOptions.params = { ...params };
      break;
    case "post":
    case "put":
      resOptions.data = { ...params };
      break;
    case "delete":
      resOptions.params = {};
      if ("deleteChild" in params) {
        // 特殊处理请求类型
        resOptions.params.deleteChild = params.deleteChild;
      }
      if ("deleteId" in params && params.deleteId) {
        // 特殊处理请求类型
        resOptions.params.id = params.deleteId;
      }
      break;
  }

  return useFunai
    ? serverRequest<DataModelRes & ScreenModuleRes>(resOptions as AxiosRequestConfig & Record<string, unknown>)
    : request<DataModelRes & ScreenModuleRes>(resOptions);
};

export const getDataGroupList = () => {
  return serverRequest<DataModelRes>({
    url: `${BaseName.System}/data/group/list`,
    method: "get"
  });
};

/**获取sql数据库信息 */
export const executeSql = (params: { jdbcUrl: string; password: string; username: string; sql: string }) => {
  return serverRequest<
    BaseEntity<{
      result: any;
    }>
  >({
    url: `${BaseName.System}/data/db/executeSql`,
    method: "post",
    data: {
      baseInfoSource: {
        dbVersion: "",
        ext: true,
        jdbcUrl: params.jdbcUrl,
        password: params.password,
        properties: [
          {
            key: "",
            value: ""
          }
        ],
        username: params.username
      },
      limit: 0,
      pageNo: 0,
      pageSize: 0,
      sourceId: 0,
      sql: params.sql,
      variables: [
        {
          channel: {
            bizId: 0,
            name: "",
            tenantId: 0
          },
          defaultValues: [],
          name: "",
          type: "",
          udf: true,
          valueType: ""
        }
      ]
    }
  });
};

// 删除大屏应用分组
export const deleteScreenGroup = (id: number) =>
  serverRequest<BaseEntity<null>>({
    url: `${BaseName.System}/largeScreen/group/delete/${id}/true?id=${id}`,
    method: "DELETE"
  });

// 新增大屏应用分组
export const addScreenGroup = (params: { name: string; orgId: number; parentId: string }) =>
  serverRequest<
    BaseEntity<{
      id: number;
      name: string;
      userId: number;
    }>
  >({
    url: `${BaseName.System}/largeScreen/group/save`,
    method: "POST",
    data: { ...params }
  });

// 修改大屏应用分组
export const updateScreenGroup = (params: { name: string; id: string }) =>
  serverRequest<
    BaseEntity<{
      id: number;
      name: string;
      userId: number;
    }>
  >({
    url: `${BaseName.System}/largeScreen/group/update`,
    method: "PUT",
    data: { ...params }
  });

// 新增大屏应用的数据
export const addScreenData = (params: DataModelReq) =>
  serverRequest<BaseEntity<null>>({
    url: `${BaseName.Online}/largeScreenAgg/save`,
    method: "POST",
    data: { ...params }
  });

// 新增三维大屏应用的数据
export const addSceneData = (params: DataSceneReq) =>
  request<BaseEntity<null>>({
    url: `${BaseName.Online}/sceneAgg/save`,
    method: "POST",
    data: { ...params },
    showLoading: true
  });

// 删除大屏应用的数据
export const deleteScreenObj = (id: string | number, baseUrl = "largeScreen") =>
  serverRequest<BaseEntity<null>>({
    url: `${BaseName.System}/${baseUrl}/delete/${id}`,
    method: "DELETE",
    showLoading: true
  });

// 新增数据管理增加分组接口

export const addDataManageGroup = (params: { name: string; orgId: number; parentId: string }) =>
  serverRequest<
    BaseEntity<{
      id: number;
      name: string;
      userId: number;
    }>
  >({
    url: `${BaseName.System}/data/group/add`,
    method: "POST",
    data: { ...params }
  });

// 数据管理删除分组接口
export const delDataManageGroup = (id: string | number) =>
  serverRequest<BaseEntity<null>>({
    url: `${BaseName.System}/data/group/delete/${id}?id=${id}`,
    method: "DELETE"
  });

// 修改数据管理应用分组
export const updateDataManageGroup = (params: { name: string; id: string }) =>
  serverRequest<
    BaseEntity<{
      id: number;
      name: string;
      userId: number;
    }>
  >({
    url: `${BaseName.System}/data/group/edit`,
    method: "POST",
    data: { ...params }
  });

// 获取数据管理本地数据库列表
export const getDataLocalList = (params: dbModelReq) =>
  serverRequest<BaseEntity<dbModelRes>>({
    url: `${BaseName.System}/data/local/list`,
    method: "POST",
    data: { ...params }
  });

// 获取数据管理数据库列表
export const getDataDbList = (params: dbModelReq) =>
  serverRequest<BaseEntity<dbModelRes>>({
    url: `${BaseName.System}/data/db/list`,
    method: "POST",
    data: { ...params }
  });

// 获取数据管理Api列表
export const getDataApiList = (params: dbModelReq) =>
  serverRequest<BaseEntity<dbModelRes>>({
    url: `${BaseName.System}/data/api/list`,
    method: "POST",
    data: { ...params }
  });

// 获取数据管理TCPUDP列表
export const getDataSocketList = (params: dbModelReq) =>
  request<BaseEntity<dbModelRes>>({
    url: `${BaseName.System}/data/socket/list`,
    method: "POST",
    data: { ...params }
  });
// 获取交互数据源列表
export const getInteractiveDataSourceList = (params: TcpUdpReq) =>
  request<BaseEntity<dbModelRes>>({
    url: `${BaseName.System}/data/socket/listByType`,
    method: "GET",
    params: { ...params }
  });
// 新增local数据源
export const addLocalData = (params = {}) => {
  return serverRequest<BaseEntity<null>>({
    url: `${BaseName.System}/data/local/add`,
    method: "post",
    data: params,
    headers: {
      "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundaryYB0wZJuRXxqGsZWO"
    },
    showLoading: true
  });
};

// 预览本地数据
export const viewLocalData = (id: number) => {
  return serverRequest<BaseEntity<Record<string, any>>>({
    url: `${BaseName.System}/data/local/viewLocalData/${id || ""}`,
    method: "get"
  });
};

// 编辑本地数据
export const editLocalData = (params = {}) => {
  return serverRequest<BaseEntity<Record<string, any>>>({
    url: `${BaseName.System}/data/local/edit`,
    method: "post",
    data: params,
    showLoading: true
  });
};

// 删除本地数据
export const delLocalData = (id: number) => {
  return serverRequest<BaseEntity<Record<string, any>>>({
    url: `${BaseName.System}/data/local/delete/${id || ""}`,
    method: "DELETE",
    showLoading: true
  });
};

// 新增api接口
export const addApiData = (params = {}) => {
  return serverRequest<BaseEntity<Record<string, any>>>({
    url: `${BaseName.System}/data/api/add`,
    method: "post",
    data: params,
    headers: {
      "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundaryYB0wZJuRXxqGsZWO"
    }
  });
};

// 编辑api接口
export const editApiData = (params = {}) => {
  return serverRequest<BaseEntity<Record<string, any>>>({
    url: `${BaseName.System}/data/api/edit`,
    method: "post",
    data: params
  });
};

// 删除api接口
export const delApiData = (id: number) => {
  return serverRequest<BaseEntity<Record<string, any>>>({
    url: `${BaseName.System}/data/api/delete/${id || ""}`,
    method: "DELETE",
    showLoading: true
  });
};

// 新增TCPUDP接口
export const addTcpUdpData = (params = {}) => {
  return request<BaseEntity<Record<string, any>>>({
    url: `${BaseName.System}/data/socket/add`,
    method: "post",
    data: params
  });
};

// 修改TCPUDP接口
export const editTcpUdpData = (params = {}) => {
  return request<BaseEntity<Record<string, any>>>({
    url: `${BaseName.System}/data/socket/update`,
    method: "post",
    data: params,
    showLoading: true
  });
};

// 删除TCPUDP接口
export const delTcpUdpData = (id: number) => {
  return request<BaseEntity<Record<string, any>>>({
    url: `${BaseName.System}/data/socket/delete/${id || ""}`,
    method: "DELETE",
    showLoading: true
  });
};

// 新增数据库接口
export const addDbData = (params = {}) => {
  return serverRequest<BaseEntity<Record<string, any>>>({
    url: `${BaseName.System}/data/db/add`,
    method: "post",
    data: params
  });
};

// 测试数据库是否连接
export const testDbConnect = (params = {}) => {
  return serverRequest<BaseEntity<Record<string, any>>>({
    url: `${BaseName.System}/data/db/testConnection`,
    method: "post",
    data: params,
    showLoading: true
  });
};

// 编辑数据库接口
export const editDbData = (params = {}) => {
  return serverRequest<BaseEntity<Record<string, any>>>({
    url: `${BaseName.System}/data/db/edit`,
    method: "post",
    data: params
  });
};

// 删除数据库接口
export const delDbData = (id: number) => {
  return serverRequest<BaseEntity<Record<string, any>>>({
    url: `${BaseName.System}/data/db/delete/${id || ""}`,
    method: "DELETE",
    showLoading: true
  });
};

// 新增三维应用分组
export const addSceneGroup = (params: { name: string; orgId: number; parentId: string }) =>
  request<
    BaseEntity<{
      id: number;
      name: string;
      userId: number;
    }>
  >({
    url: `${BaseName.System}/scene/group/save`,
    method: "POST",
    data: { ...params }
  });

// 删除三维应用分组
export const deleteSceneGroup = (id: number) =>
  request<BaseEntity<null>>({
    url: `${BaseName.System}/scene/group/delete/${id}/true?id=${id}`,
    method: "DELETE"
  });

// 修改数据管理应用分组
export const updateSceneGroup = (params: { name: string; id: string }) =>
  request<
    BaseEntity<{
      id: number;
      name: string;
      userId: number;
    }>
  >({
    url: `${BaseName.System}/scene/group/update`,
    method: "PUT",
    data: { ...params }
  });

// 新增资产分组
export const addAssetsGroup = (params: { name: string; type: number }) =>
  serverRequest<
    BaseEntity<{
      type: number;
      name: string;
      label?: string;
    }>
  >({
    url: `${BaseName.System}/minioGroup/add`,
    method: "POST",
    data: { ...params }
  });

// 删除资产分组
export const deleteAssetsGroup = (id: number) =>
  serverRequest<BaseEntity<null>>({
    url: `${BaseName.System}/minioGroup/delete/${id}?id=${id}`,
    method: "DELETE"
  });

// 用户资产分组（groupLayerData/*）：依赖 Screenwright 内部素材云，开源版移除

// 修改数据管理应用分组
export const updateAssetsGroupGroup = (params: { name: string; id: string }) =>
  serverRequest<
    BaseEntity<{
      id: number;
      name: string;
    }>
  >({
    url: `${BaseName.System}/minioGroup/edit`,
    method: "POST",
    data: { ...params }
  });

// 新增interfaceDebugger分组
export const addInterfaceGroup = (data: { name: string; orgId: number; parentId: string }) =>
  request<
    BaseEntity<{
      id: number;
      name: string;
    }>
  >({
    url: `${BaseName.System}/interface-debugger/group/save`,
    method: "POST",
    data
  });

// 删除interfaceDebugger分组
export const delInterfaceGroup = (id: string) =>
  request<BaseEntity<null>>({
    url: `${BaseName.System}/interface-debugger/group/delete/${id}/true?id=${id}`,
    method: "DELETE"
  });
// 更新interfaceDebugger分组
export const updateInterfaceGroup = (data: { name: string; id: number }) =>
  request<BaseEntity<null>>({
    url: `${BaseName.System}/interface-debugger/group/update`,
    method: "PUT",
    data
  });

// 获取CSV文件数据
export const getCsvData = (id: number) =>
  serverRequest<BaseEntity<null>>({
    url: `${BaseName.System}/data/local/getLocalData/${id}`,
    method: "GET"
  });

/**后端请求API数据 */
export const queryAPIData = (params = {}) => {
  return serverRequest<BaseEntity<any>>({
    url: `${BaseName.System}/data/api/connect`,
    method: "post",
    data: params
  });
};

export const getCSVContent = (params: { id: string }) => {
  return serverRequest<BaseEntity<any>>({
    url: `${BaseName.System}/data/local/getLocalData/${params.id}`,
    method: "get"
  });
};

export const getLargeScreenGroupList = () => {
  return serverRequest<BaseEntity<any>>({
    url: `${BaseName.System}/largeScreen/group/list`,
    method: "get"
  });
};
