import { isProxy, toRaw } from "vue";

import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import dayjs from "dayjs";
import { debounce } from "lodash-es";

import { getScreenMeta } from "@/api/visual";
import type { BuildCacheDataInput } from "@/db/cacheWorker";
import { cacheWorkerManager } from "@/db/cacheWorkerManager";
import type { CacheRequestConfig } from "@/utils/cacheService";
import { BaseName } from "@/utils/config";
import { getLocationSearch } from "@/utils/utils";
import { getVersionCode } from "@/utils/version";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

import {
  ComponentConfigBuilder,
  smartApplyComponentConfig
} from "./components/buildConfig/attrsRender/components/statusAnimation/components/hooks/generators";
import type { ExtractToComponentResult } from "./components/buildConfig/attrsRender/components/statusAnimation/components/hooks/generators/types";
import { useStatusAnimationData } from "./components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimationData";
import { PanelType } from "./components/buildRender/core/SystemComponent/type";
import type { ComponentType } from "./components/buildRender/type";
import { useCacheTime } from "./useCacheTime";
import { useResponseHistoryHandler } from "./useResponseHistoryHandler";

/**
 * 需要缓存的API接口URL列表
 * 只包含在JSDoc中明确标注了"(缓存)"的接口
 */
export const cacheableAPIUrls = [
  /** 保存图层 (缓存) - saveLayersAgg接口 */
  `${BaseName.Online}/layersAgg/save`,

  /** 更新图层 (缓存) - updateLayersAgg接口 */
  `${BaseName.System}/layers/update`,

  /** 删除图层 (缓存) - delLayersAgg接口 */
  `${BaseName.System}/layers/delete/`,

  /** 复制图层 (缓存) - copyLayers接口 */
  `${BaseName.System}/layers/copy/`,

  /** 更新大屏应用 (缓存) - updateLargeScreen接口 */
  `${BaseName.System}/largeScreen/update`
] as const;

/**
 * 可以应用缓存的接口
 */
export const cacheAvailableAPIUrls = [`${BaseName.System}/largeScreen/info/:id`] as const;
/**
 * 检查给定的URL是否可以缓存
 * @param url API接口URL
 * @returns 是否可以缓存
 */
export const isCacheableAPI = (url: string): boolean => {
  return cacheableAPIUrls.some((cacheableUrl) => {
    // 精确匹配或前缀匹配（适用于带参数的URL如 /layers/delete/123）
    return url.startsWith(cacheableUrl);
  });
};

/**
 * 检查给定的URL是否可以应用缓存并提取ID
 * @param url API接口URL
 * @returns 匹配结果，包含是否匹配和提取的ID
 */
export const isCacheAvailableAPI = (url: string): { isMatch: boolean; id?: string } => {
  // 匹配 /{baseName}/{可变资源}/info/{路径ID}，查询串 ?id= 可有可无：
  //   请求拦截器阶段 config.url 只有 `/bi-system/largeScreen/info/9`（id 走 axios params，尚未拼进 url）
  //   完整 URL 才是 `/bi-system/largeScreen/info/9?id=9`
  // 之前的正则强制要求 `?id=`，导致读缓存分支永远不命中、每次都走网络。
  const baseSystemRegex = BaseName.System.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pathMatch = url.match(new RegExp(`${baseSystemRegex}/[^/]+/info/([^/?#]+)`));
  if (!pathMatch) {
    return { isMatch: false };
  }
  // 优先取查询串里的 id（历史约定），没有则回落到路径 id（二者在现有调用里恒等）
  const queryId = url.match(/[?&]id=([^&#]*)/)?.[1];
  return { isMatch: true, id: queryId || pathMatch[1] };
};

/**
 * 简化版本：仅检查是否匹配
 * @param url API接口URL
 * @returns 是否可以应用缓存
 */
export const isUrlCacheable = (url: string): boolean => {
  return isCacheAvailableAPI(url).isMatch;
};

export const toRawDeep = <T>(observed: T): T => {
  const val = toRaw(observed);

  if (Array.isArray(val)) {
    return val.map(toRawDeep) as T;
  }

  if (val === null) {
    return null as T;
  }

  if (typeof val === "object") {
    const entries = Object.entries(val).map(([key, val]) => {
      if (key === "panelData") {
        return [key, toRaw(val)];
      }

      if (key === "children") {
        return [key, toRawDeep(val)];
      }

      if (!isProxy(val)) {
        return [key, toRaw(val)];
      }

      return [key, toRawDeep(val)];
    });

    return Object.fromEntries(entries);
  }

  return val;
};

/**
 * 缓存数据管理 hooks
 */
export const useCacheData = () => {
  const { groupData, allComponentMap } = useGlobalComponentData();
  const { navInfo } = useLargeScreenInfo();
  const { editConfig } = useEditStore();
  const { editorVisible, componentDefaultConfigMap, selectAnimationId, selectStatusId, componentAnimations } =
    useStatusAnimationData();
  const { lastCacheTime } = useCacheTime();

  // 使用历史记录处理 hooks
  const { handleDeleteResponse, handleUpdateResponse, handleCopyResponse } = useResponseHistoryHandler();

  const currentComponentList: Array<ExtractToComponentResult> = [];

  /**
   * 处理状态动画编辑器可见时的组件缓存逻辑
   * @description 当状态动画编辑器可见时，提取当前组件配置并恢复组件到备份状态
   */
  const processStatusAnimationEditorCache = () => {
    if (!editorVisible.value) {
      return;
    }

    const rawComponentList = componentDefaultConfigMap.value.values();
    const builder = ComponentConfigBuilder.createDefault();

    for (const rawComponent of rawComponentList) {
      const component = toRaw(allComponentMap.value.get(rawComponent.id.toString()));

      if (component) {
        const currentAnimationConfig =
          componentAnimations.value[selectAnimationId.value][selectStatusId.value][rawComponent.id.toString()];

        if (!currentAnimationConfig) {
          continue;
        }

        // 当前的配置
        const currentConfig = builder.extractToComponent({
          component,
          animationConfig: currentAnimationConfig
        });

        const backupConfig = builder.extractToComponent({
          component: rawComponent,
          animationConfig: currentAnimationConfig
        });

        currentComponentList.push(
          JSON.parse(
            JSON.stringify({
              ...currentConfig,
              config: {
                ...currentConfig.config,
                id: rawComponent.id
              }
            })
          )
        );

        // 使用智能应用函数，只应用实际有值的属性，避免覆盖原始对象的默认值
        smartApplyComponentConfig(component, backupConfig.config);
      }
    }
  };

  /**
   * 处理引用面板组件的特殊逻辑
   * @description 对引用面板组件进行特殊处理，清空其配置数据
   */
  const processQuotePanelComponents = (components: ComponentType[]) => {
    return components.map((component) => {
      if (component.component.prop === PanelType.quotePanel) {
        const { panelData } = component;
        if (!panelData || panelData.length === 0) {
          return toRawDeep(component);
        }

        const { config: _config, ...rest } = panelData[0] || {};
        return {
          ...toRawDeep(component),
          panelData: [
            {
              config: [],
              ...toRawDeep(rest)
            }
          ]
        };
      }

      return toRawDeep(component);
    });
  };

  const getCacheComponent = () => {
    // 处理状态动画编辑器可见时的缓存逻辑
    processStatusAnimationEditorCache();

    // 获取原始组件数据并处理引用面板组件
    const rawComponents = [...(toRaw(groupData.value) as ComponentType[])];
    return processQuotePanelComponents(rawComponents);
  };

  /**
   * 同步当前组件列表到渲染组件Map
   */
  const syncCurrentComponentListToRenderMap = () => {
    if (editorVisible.value) {
      for (const component of currentComponentList) {
        if (!component.config.id) {
          continue;
        }

        const renderComponent = toRaw(allComponentMap.value.get(component.config.id.toString()));
        if (renderComponent) {
          smartApplyComponentConfig(renderComponent, component.config);
        }
      }

      currentComponentList.length = 0;
    }
  };

  /**
   * 构建用于Worker的缓存输入数据
   * @param customCacheTime 自定义缓存时间
   * @returns Worker输入数据
   */
  const buildWorkerCacheInput = (customCacheTime?: number | string): BuildCacheDataInput => {
    // 检查是否为有效的大屏ID，如果为-1则不进行缓存
    if (navInfo.value.id === -1) {
      throw new Error("无效的大屏ID，无法进行缓存操作");
    }

    const layers = getCacheComponent();

    const detailInfo = toRaw(editConfig.value);

    const {
      detail: _detail,
      dataFilterArr,
      encodedControl,
      aniFrameSet,
      statusAnimation,
      ...restNavInfo
    } = navInfo.value;

    return {
      layers,

      detail: detailInfo,

      ...toRawDeep(restNavInfo),

      config: toRaw(navInfo.value.config),

      dataFilterArr: JSON.stringify(dataFilterArr),

      encodedControl: toRaw(encodedControl),

      aniFrameSet: JSON.stringify(aniFrameSet),

      statusAnimation: toRaw(statusAnimation),

      customCacheTime
    };
  };

  /**
   * 缓存数据到 IndexedDB（使用Worker）
   * @param customCacheTime 自定义缓存时间戳，如果不传则使用当前时间
   * @param syncWorkspace 是否同步到 Workspace
   */
  const cacheData = async (customCacheTime?: number | string, syncWorkspace = true) => {
    try {
      const workerInput = buildWorkerCacheInput(customCacheTime);
      // 使用Worker异步处理缓存，不等待完成
      await cacheWorkerManager.cacheData(workerInput, { syncWorkspace });

      syncCurrentComponentListToRenderMap();
    } catch (error) {
      console.error("缓存数据失败:", error);
      throw error;
    }
  };

  /**
   * 缓存数据到 IndexedDB并等待完成（使用Worker）
   * @param customCacheTime 自定义缓存时间戳，如果不传则使用当前时间
   */
  const cacheDataWithResponse = async (customCacheTime?: number | string) => {
    try {
      const workerInput = buildWorkerCacheInput(customCacheTime);
      // 使用Worker处理缓存并等待完成
      return await cacheWorkerManager.cacheDataWithResponse(workerInput);
    } catch (error) {
      console.error("缓存数据失败:", error);
      throw error;
    }
  };

  // 创建专门用于响应拦截器的防抖处理函数
  const debouncedResponseHandler = debounce(async (syncWorkspace = true) => {
    // 检查是否为有效的大屏ID，如果为-1则直接返回，不进行后续操作
    if (navInfo.value.id === -1) {
      console.warn("无效的大屏ID，跳过缓存操作");
      return;
    }

    try {
      const data = await getScreenMeta(navInfo.value.id);
      const lastUpdatedTimeStamp = dayjs(data.result.updatedTime).valueOf();

      lastCacheTime.value = lastUpdatedTimeStamp;

      // 将 lastUpdatedTimeStamp 传递给防抖缓存函数
      await cacheData(lastUpdatedTimeStamp, syncWorkspace);
    } catch (error) {
      console.error("获取大屏信息失败:", error);
    }
  }, 1000);

  /**
   * 强制缓存：拉取大屏最新 updatedTime，用该时间把当前大屏数据缓存到 IndexedDB。
   * 与 debouncedResponseHandler 同逻辑，但不防抖、可 await，供「应用 AI 模板」等
   * 主动改动画布后立即刷新缓存的场景调用（确保缓存时间戳与服务端最新版本对齐）。
   */
  const forceCacheWithLatestTime = async () => {
    if (navInfo.value.id === -1) {
      console.warn("无效的大屏ID，跳过缓存操作");
      return;
    }
    try {
      const data = await getScreenMeta(navInfo.value.id);
      const lastUpdatedTimeStamp = dayjs(data.result.updatedTime).valueOf();
      lastCacheTime.value = lastUpdatedTimeStamp;
      await cacheData(lastUpdatedTimeStamp);
    } catch (error) {
      console.error("强制缓存失败:", error);
    }
  };

  const getCacheData = async (id: number) => {
    const versionCode = getVersionCode() || "";
    const cacheData = await cacheWorkerManager.getCacheData(id, versionCode);
    return cacheData;
  };

  /**
   * 处理 /largeScreen/info/:id 接口的缓存
   */
  const handleLargeScreenInfoResponse = async (response: AxiosResponse) => {
    try {
      const data = response.data?.result;
      if (!data || !data.id) {
        return;
      }

      // 使用 updatedTime 作为缓存时间戳
      const lastUpdatedTimeStamp = dayjs(data.updatedTime).valueOf();
      lastCacheTime.value = lastUpdatedTimeStamp;

      // 构建缓存输入数据
      const cacheInput: BuildCacheDataInput = {
        ...data,
        customCacheTime: lastUpdatedTimeStamp
      };

      // 缓存数据到 IndexedDB
      await cacheWorkerManager.cacheData(cacheInput);
      console.log("已缓存大屏信息:", { id: data.id, cacheTime: lastUpdatedTimeStamp });
    } catch (error) {
      console.error("缓存大屏信息失败:", error);
    }
  };

  /**
   * 处理响应拦截中的缓存逻辑
   * 由于已保证只有缓存请求会进入此函数，无需再做URL判断getCacheData
   */
  const handleResponseCacheInterceptor = async (response: AxiosResponse) => {
    const { updateHistoryType, syncWorkspace } = response.config as CacheRequestConfig;

    const url = response.config.url;
    if (!url) {
      return;
    }

    if (!updateHistoryType) {
      debouncedResponseHandler(syncWorkspace);
      return;
    }

    const isSuccessResponse = Boolean(response.data && response.data.code === 200 && response.data.success);
    // 处理 /largeScreen/info/:id 接口的缓存
    const cacheResult = isCacheAvailableAPI(url);
    if (cacheResult.isMatch) {
      await handleLargeScreenInfoResponse(response);
      return;
    }

    if (url.startsWith(`${BaseName.System}/layers/delete/`)) {
      if (!isSuccessResponse) {
        return;
      }
      handleDeleteResponse(url, updateHistoryType);
      debouncedResponseHandler(syncWorkspace);
      return;
    }

    if (url.startsWith(`${BaseName.System}/layers/update`)) {
      handleUpdateResponse(response.config.data, updateHistoryType);
      debouncedResponseHandler(syncWorkspace);
      return;
    }

    if (url.includes(`${BaseName.System}/layers/copy`)) {
      if (response.data && response.data.code === 200 && response.data.success) {
        handleCopyResponse(response.data.result.config, updateHistoryType);
      }

      debouncedResponseHandler(syncWorkspace);
    }
  };

  /**
   * 处理请求拦截中的缓存逻辑
   * @param config axios请求配置
   * @returns 处理结果，如果有缓存则返回缓存数据的Promise.reject，否则返回原配置
   */
  const handleRequestCacheInterceptor = async (config: InternalAxiosRequestConfig<any>) => {
    // 检查是否为可应用缓存的API且为GET请求
    if (config.url && config.method?.toLowerCase() === "get") {
      const cacheResult = isCacheAvailableAPI(config.url);

      if (cacheResult.isMatch && cacheResult.id) {
        try {
          // 使用防抖版本的函数获取大屏信息
          const data = await getScreenMeta(Number(cacheResult.id));

          // 检查数据是否存在（防抖函数可能返回 undefined）
          if (data && data.result && data.result.updatedTime) {
            const lastUpdatedTimeStamp = dayjs(data.result.updatedTime).valueOf();
            lastCacheTime.value = lastUpdatedTimeStamp;

            const versionCode = getLocationSearch() || getVersionCode() || data.result.versionCode || "";

            const cacheData = await cacheWorkerManager.getCacheData(Number(cacheResult.id), versionCode);
            if (cacheData && lastUpdatedTimeStamp === cacheData.cacheTime) {
              return Promise.reject({
                isCache: true,
                data: cacheData,
                status: 200,
                statusText: "OK (From Cache)",
                headers: {},
                config
              });
            }
          }
        } catch (error) {
          console.error("获取大屏信息失败:", error);
          // 如果获取失败，继续正常请求流程
        }
      }
    }

    return config;
  };

  /**
   * 处理缓存错误返回
   * @param error 错误对象
   * @returns 如果是缓存错误则返回缓存数据，否则重新抛出错误
   */
  const handleCacheErrorResponse = (error: any) => {
    // 处理缓存返回的伪造错误
    if (error.isCache) {
      return error.data;
    }
    throw error;
  };

  return {
    getCacheData,
    cacheDataWithResponse,
    forceCacheWithLatestTime,
    buildWorkerCacheInput,
    handleResponseCacheInterceptor,
    handleRequestCacheInterceptor,
    handleCacheErrorResponse,
    processStatusAnimationEditorCache,
    syncCurrentComponentListToRenderMap
  };
};
