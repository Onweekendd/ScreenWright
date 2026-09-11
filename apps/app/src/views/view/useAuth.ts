import type { CSSProperties } from "vue";
import { computed, onUnmounted, type Ref, ref } from "vue";
import { useRoute } from "vue-router";
import { useDebounceFn } from "@vueuse/core";

import axios from "axios";

import expiredImage from "@/assets/expired.jpg";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";
import { getDecryptStatus } from "@/utils/crypto";
import { parseUrl, sleep } from "@/utils/utils";

/**
 * 全局Window接口扩展
 */
declare global {
  interface Window {
    $Loading?: {
      show: (options: { type: string; progress: number; zIndex: number }) => void;
      hide: () => void;
    };
    prohibitionZone: {
      ihl: boolean;
    };
    axios: (url: string) => Promise<any>;
    absSecretKey: Record<string, any>;
    isFunBI_exe: boolean;
    fteCityEditor: any;
    threeMgr: any;
    cityMgr: any;
    maptalksmap: any;
    funcityIde: any;
    ftcity: any;
  }
}

/**
 * 密钥数据接口
 */
interface SecretKeyData {
  a?: string;
  b?: string;
  s?: string;
  invalidImage?: string;
  [key: string]: any;
}

/**
 * URL参数接口
 */
interface UrlParams {
  notPlan?: string | boolean;
  [key: string]: any;
}

/**
 * 验证和授权管理Hook
 */
export const useAuth = () => {
  const { loading } = useGlobalLoading();
  const route = useRoute();

  // 本地存储加密信息
  const secretKeyData: Ref<SecretKeyData> = ref({});

  /**
   * 计算内容背景样式
   */
  const contentBg = computed<string>(() => {
    return `url(${expiredImage}) no-repeat center center / 100% 100%`;
  });

  /**
   * 计算背景样式对象
   */
  const backgroundStyle = computed<CSSProperties>(() => {
    return {
      background: contentBg.value
    };
  });

  /**
   * 显示加载遮罩
   */
  const showLoadingMask = (): void => {
    // 发布或导出时是否隐藏加载图标的勾选
    if (!(window.prohibitionZone && window.prohibitionZone.ihl)) {
      // loading.value = true
    } else {
      loading.value = false;
    }
  };

  /**
   * 设置内容背景（过期显示）
   */
  const setContentBg = (): void => {
    const editorEl: HTMLElement | null = document.querySelector(".es-editor");
    if (editorEl) {
      editorEl.style.background = contentBg.value;
    }
  };

  /**
   * 检查授权状态
   */
  const checkAuth = (): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      const run = async () => {
        const searchParam: UrlParams = parseUrl(location.href); // 预览或导出后
        if (route && route.params) {
          resolve(true);
          return;
        }

        if (!searchParam.notPlan) showLoadingMask();

        const isFileOrigin = window.location.origin === "file://" && !window.isFunBI_exe;
        console.log("isFileOrigin", isFileOrigin);
        if (isFileOrigin) {
          const res = await verifingToOption(window.absSecretKey, searchParam);
          console.log(res, "resres");
          resolve(res);
        } else {
          axios("./license.json")
            .then((res: any) => {
              const data = verifingToOption(res.data, searchParam);
              console.log("授权文件内容:", data);
              resolve(data);
            })
            .catch((error: any) => {
              console.error("获取授权文件失败:", error);
              setContentBg();
              showLoadingMask();
              resolve(false);
            });
        }
      };
      run();
    });
  };

  /**
   * 验证并应用配置
   */
  const verifingToOption = async (params: SecretKeyData, searchParam: UrlParams): Promise<boolean> => {
    // 存储密钥信息
    secretKeyData.value = params || {};
    secretKeyData.value["invalidImage"] = expiredImage;
    const { a, b, s } = secretKeyData.value;

    // 检查授权状态
    const isAuthorized = getDecryptStatus(
      typeof a === "string" ? a : "",
      typeof b === "string" ? b : "",
      typeof s === "string" ? s : ""
    );

    if (isAuthorized) {
      // 添加定期校验
      setupPeriodicValidation(a, b, s);
    } else {
      setContentBg();
    }

    if (!searchParam.notPlan) {
      showLoadingMask();
    }
    return isAuthorized;
  };

  /**
   * 设置周期性验证
   */
  const setupPeriodicValidation = (a?: string, b?: string, s?: string): void => {
    // 确保参数有效
    const validA = typeof a === "string" ? a : "";
    const validB = typeof b === "string" ? b : "";
    const validS = typeof s === "string" ? s : "";

    // 使用VueUse的useDebounceFn替代lodash的debounce
    const checkValidation = useDebounceFn(
      () => {
        if (!getDecryptStatus(validA, validB, validS)) {
          setContentBg();
        }
      },
      1000 * 60 * 10
    ); // 10分钟检查一次

    document.addEventListener("mousedown", checkValidation);

    // 组件卸载时清理事件监听，防止内存泄漏
    onUnmounted(() => {
      document.removeEventListener("mousedown", checkValidation);
    });
  };

  /**
   * 初始化授权检查
   */
  const init = async () => {
    await sleep(500);
    return checkAuth();
  };

  return {
    contentBg,
    backgroundStyle,
    init
  };
};
