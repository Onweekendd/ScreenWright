import type { Ref } from "vue";
import { computed, ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import { ElMessage } from "element-plus";
import md5 from "js-md5";
import { merge } from "lodash-es";

import { getScreenObjWithNoCache } from "@/api/visual";
import type { ScreenVersion } from "@/model/Version";
import type { ScreenDetail, ScreenItem } from "@/model/Visual";
import to from "@/utils/await-to-js";
import { uuid } from "@/utils/utils";
import { setVersionCode } from "@/utils/version";

import { useModelApi } from "../../useModelApi";

type paramsType = ScreenVersion & {
  versionDesc: string;
  name: string;
  invitationCode: string;
  publishInfo?: string;
  path?: string;
};

const { WEB_APP_PUBLIC_PATH } = (window as any).webconfig;
const { PUBLIC_PATH } = process.env;

export const usePublishInfo = createGlobalState(() => {
  const params = ref<paramsType | null>(null) as Ref<paramsType | null>;
  const loading = ref(false);
  const versionList = ref<Array<{ label: string; value: string; versionDesc: string | null; status: boolean }>>([]);

  const terminalEnableArr = ref<Record<string, any>>({});

  const { modelApi } = useModelApi();

  /**
   * 生成基础主机URL
   */
  const baseHostUrl = computed(() => {
    return location.origin + (WEB_APP_PUBLIC_PATH || PUBLIC_PATH);
  });

  /**
   * 生成分享链接的工厂函数
   */
  const createShareLink = (invitationCode: string, id: number | string, isHiddenLoading = false) => {
    const indexCode = invitationCode.lastIndexOf("-");
    const splitCode = invitationCode.split("-"); // 7065a4ff-d4a9-40b3-806e-6c37bb5c6cc2邀请码
    const isHiddenLoadingCode = md5(`ihl:${isHiddenLoading}`); // 是否隐藏加载图标
    return `${baseHostUrl.value}shareScreen/${invitationCode.slice(0, indexCode)}-${id}-${isHiddenLoadingCode}-${
      splitCode[4]
    }`;
  };

  /**
   * 默认分享链接（不隐藏加载）
   */
  const linkUrl = computed(() => {
    if (!params.value || !params.value.invitationCode) {
      return "";
    }
    return createShareLink(params.value.invitationCode, params.value.id, false);
  });

  const initItemData = async (item: Ref<ScreenItem>) => {
    params.value = {
      expirationTime: item.value.expirationTime || null,
      hasExpirationTime: item.value.hasExpirationTime,
      hasPassword: item.value.hasPassword,
      versionCode: item.value.versionCode || "1",
      id: item.value.id,
      password: item.value.password,
      status: item.value.status,
      versionDesc: item.value.versionDesc || "",
      name: item.value.name,
      invitationCode: item.value.invitationCode,
      path: item.value.path || "",
      publishInfo: item.value.publishInfo || ""
    };

    await getOptions();

    // if (!params.value.status && versionList.value.length > 0) {
    //   params.value.versionCode = versionList.value[versionList.value.length - 1].value;
    // }

    // setVersionCode(params.value.versionCode);
    // 这里要读 detail（终端配置），走完整详情接口
    const [error2, largeScreenData] = await to(
      getScreenObjWithNoCache(params.value.id, "/largeScreen", params.value.versionCode || "1")
    );
    if (error2) {
      return;
    }
    params.value.status = largeScreenData.result.status;

    const detail = JSON.parse(largeScreenData.result.detail as string) as ScreenDetail;
    terminalEnableArr.value = detail.isEncodedControl ? (detail.terminalEnableArr ?? {}) : {};
  };

  const getOptions = async () => {
    const [error, res] = await to(modelApi.value.getScreenVersionList(params.value!.id));
    if (error) {
      return;
    }
    if (res && res.success) {
      versionList.value = res.result.map((item: ScreenVersion) => {
        return {
          label: "V" + item.versionCode,
          value: item.versionCode,
          versionDesc: item.versionDesc || "",
          status: item.status
        };
      });
      if (params.value && versionList.value.length > 0) {
        // params.value.versionCode = res.result.find((item: ScreenVersion) => item.status === true)?.versionCode || "1";
        params.value.versionDesc = res.result.find((item: ScreenVersion) => item.status === true)?.versionDesc || "";
      }
    }
  };

  const getParams = (dataParams: Partial<ScreenVersion>) => {
    if (!params.value) {
      return;
    }
    const reqParams = merge({}, params.value, dataParams);
    if (!reqParams.hasPassword) {
      reqParams.password = "";
    }
    return reqParams;
  };

  // 提取处理密码相关逻辑到独立函数
  const handlePasswordLogic = (reqParams: paramsType) => {
    if (reqParams.hasPassword) {
      const uid = uuid(6);
      reqParams.password = reqParams.password ? reqParams.password : uid;
      params.value!.password = reqParams.password ? reqParams.password : uid;
    }
    return reqParams;
  };

  // 提取处理有效期相关逻辑到独立函数
  const handleExpirationTimeLogic = (reqParams: paramsType) => {
    if (reqParams.hasExpirationTime) {
      params.value!.expirationTime = reqParams.expirationTime || null;
    } else {
      params.value!.expirationTime = null;
    }
    return reqParams;
  };

  // 公共的更新方法 - 核心逻辑
  const updateScreenVersion = async (addParams: Partial<ScreenVersion>) => {
    loading.value = true;
    if (!params.value) {
      loading.value = false;
      return { success: false, message: "参数不存在" };
    }

    let reqParams = getParams(addParams);
    if (!reqParams) {
      loading.value = false;
      return { success: false, message: "参数获取失败" };
    }

    // 处理密码逻辑
    reqParams = handlePasswordLogic(reqParams);
    // 处理有效期逻辑
    reqParams = handleExpirationTimeLogic(reqParams);

    const [error, res] = await to(modelApi.value.publishScreenVersion(reqParams));

    setVersionCode(addParams.versionCode ?? "1");
    const [error2, screenData] = await to(
      getScreenObjWithNoCache(params.value.id, "/largeScreen", addParams.versionCode ?? "1")
    );
    if (error2) {
      loading.value = false;
      return { success: false, message: "获取屏幕详情失败" };
    }

    const detail = JSON.parse(screenData.result.detail as string) as ScreenDetail;
    terminalEnableArr.value = detail.terminalEnableArr ?? {};

    if (error) {
      loading.value = false;
      return { success: false, message: "操作失败" };
    }

    if (res && res.success) {
      const versionDesc = versionList.value.find((item) => item.value === addParams.versionCode)?.versionDesc || "";

      // 更新本地状态
      params.value.expirationTime = res.result.expirationTime;
      params.value.versionDesc = versionDesc || params.value.versionDesc;
      params.value.versionCode = addParams.versionCode || params.value.versionCode;
      params.value.password = res.result.password || "";

      loading.value = false;
      return { success: true, result: res.result };
    } else {
      loading.value = false;
      return { success: false, message: res ? res.message : "操作失败" };
    }
  };

  // 发布屏幕
  const publishScreen = async (versionParams?: Partial<ScreenVersion>) => {
    if (!params.value) return;

    const updateParams = { ...versionParams, ...params.value, status: true };
    const result = await updateScreenVersion(updateParams);
    if (result.success) {
      params.value.status = true;
      ElMessage.success("发布成功");
    } else {
      ElMessage.error(result.message || "发布失败");
    }

    return result;
  };

  // 取消发布屏幕
  const unpublishScreen = async (versionParams?: Partial<ScreenVersion>) => {
    if (!params.value) return;

    // 取消发布时清空加密发布与过期设置，并设置为最后一个版本，同步到数据库
    const updateParams = {
      ...versionParams,
      ...params.value,
      status: false,
      hasPassword: false,
      password: "",
      hasExpirationTime: false,
      expirationTime: null
    };

    const result = await updateScreenVersion(updateParams);

    if (result.success) {
      // 获取版本列表中的最后一个版本
      const lastVersion = versionList.value.length > 0 ? versionList.value[versionList.value.length - 1] : null;

      // 同步更新本地状态
      params.value.status = false;
      params.value.hasPassword = false;
      params.value.password = "";
      params.value.hasExpirationTime = false;
      params.value.expirationTime = null;
      // 设置为最后一个版本
      if (lastVersion) {
        // params.value.versionCode = lastVersion.value;
        params.value.versionDesc = lastVersion.versionDesc ?? "";
      }
      ElMessage.success("取消发布成功");
    } else {
      ElMessage.error(result.message || "取消发布失败");
    }

    return result;
  };

  // 更新发布状态
  const updatePublishStatus = async (status: boolean) => {
    if (status) {
      return await publishScreen();
    } else {
      return await unpublishScreen();
    }
  };

  // 更新密码设置
  const updatePassword = async (hasPassword: boolean, password?: string) => {
    if (!params.value) return;

    params.value.hasPassword = hasPassword;
    if (password !== undefined) {
      params.value.password = password;
    }

    return await updateScreenVersion(params.value);
  };

  // 更新有效期设置
  const updateExpirationTime = async (hasExpirationTime: boolean, expirationTime?: any) => {
    if (!params.value) return;

    params.value.hasExpirationTime = hasExpirationTime;
    if (expirationTime !== undefined) {
      params.value.expirationTime = expirationTime;
    }

    return await updateScreenVersion(params.value);
  };

  const resetPassword = async () => {
    const uid = uuid(6);
    await updatePassword(true, uid);
  };

  const terminalPublishLinks = computed(() => {
    return Object.keys(terminalEnableArr.value).map((key) => {
      const terminalEnableArrValue = terminalEnableArr.value[key];

      return {
        name: terminalEnableArrValue,
        linkUrl: linkUrl.value + `?type=${key}`
      };
    });
  });

  return {
    params,
    loading,
    linkUrl,
    options: versionList,
    updatePublishStatus,
    updatePassword,
    updateExpirationTime,
    publishScreen,
    unpublishScreen,
    resetPassword,
    initItemData,
    terminalPublishLinks
  };
});
