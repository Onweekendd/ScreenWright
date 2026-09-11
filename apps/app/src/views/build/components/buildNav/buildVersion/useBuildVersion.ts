import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { createGlobalState } from "@vueuse/core";

import { ElMessage, ElMessageBox } from "element-plus";

import { createScreenVersion, getScreenVersionList, screenVersion } from "@/api/version";
import { dbManager, STORE_NAME } from "@/db/index";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";
import type { ScreenData, ScreenVersion, updateScreenVersion } from "@/model/Version";
import { handleMessageBox } from "@/utils/utils";
import { setVersionCode } from "@/utils/version";
import { useInitLargeScreenData } from "@/views/build/useInitLargeScreenData";

import { useLargeScreenInfo } from "../../../useLargeScreenInfo";
import { useCustomAnimationData } from "../../buildConfig/attrsRender/components/customAnimation/useCustomAnimationData";
import { useStatusAnimationData } from "../../buildConfig/attrsRender/components/statusAnimation/useStatusAnimationData";
import type { dictNumber } from "../../buildConfig/sceneComponent/type";
import { useEditStore } from "../../buildRender/hooks/useEditStore";
export const operateDic: dictNumber[] = [
  {
    label: "切换版本",
    value: 1
  },
  {
    label: "复制版本",
    value: 2
  },
  {
    label: "修改说明",
    value: 3
  },
  {
    label: "删除",
    value: 4
  },
  {
    label: "新增版本",
    value: 5
  }
];

export const useBuildVersion = () => {
  const { initLargeScreen } = useInitLargeScreenData();
  const { navInfo } = useLargeScreenInfo();
  const { editConfig, syncGlobalComponentData } = useEditStore();
  const { resetCustomAnimationOnPanelChange } = useCustomAnimationData();
  const { resetStatusAnimationOnPanelChange } = useStatusAnimationData();
  const { showLoading, hideLoading } = useGlobalLoading();
  const id = ref<number | string>("");
  const router = useRouter();
  const route = useRoute();

  const versionList = ref<ScreenVersion[]>([]);
  /** 版本切换 / 新建 / 复制过程中，锁住版本列表交互，避免重复触发 */
  const switching = ref(false);

  const getVersionList = async (id: number) => {
    const res = await getScreenVersionList(id);
    if (res.code === 200) {
      versionList.value = res.result;
    } else {
      console.error(res.message);
    }
  };

  const onOperation = (operation: number, item: ScreenVersion) => {
    switch (operation) {
      case 1: // 切换版本
        onSwitchVersion(item);
        break;
      case 2: // 复制版本
        onCopyVersion(item);
        break;
      case 3: // 修改说明
        onEditDesc(item);
        break;
      case 4: // 删除
        onDeleteVersion(item);
        break;
    }
  };

  const updateVersion = async (data: updateScreenVersion | null, detail = "update", isUpdateList = true) => {
    const res = await screenVersion(data, detail);
    if (res.code === 200 && isUpdateList) {
      await getVersionList(Number(id.value));
      onVersionRes(res.result, detail);
      if (detail == "delete") {
        onDeleteVersionCode();
        if (data) {
          dbManager.delete(STORE_NAME, `${id.value}-${data.versionCode}`);
        }
      }
    }
  };

  const onDeleteVersionCode = async () => {
    const existsVersion = versionList.value.some((item) => item.versionCode === navInfo.value.versionCode);
    if (!existsVersion) {
      const code = versionList.value[versionList.value.length - 1].versionCode;
      applyVersionChange(code);
    }
  };

  // 提炼：统一处理版本切换后的动作（带全局 loading + 兜底，切换期间锁交互）
  const applyVersionChange = async (versionCode: string, loadingText = "正在切换版本…") => {
    if (switching.value) {
      return;
    }
    switching.value = true;
    showLoading(loadingText);
    try {
      setVersionCode(versionCode);
      await initLargeScreen(Number(id.value));
      syncGlobalComponentData();
      resetCustomAnimationOnPanelChange();
      resetStatusAnimationOnPanelChange();
    } catch (err) {
      ElMessage.error("版本切换失败：" + ((err as Error)?.message || "请重试"));
    } finally {
      hideLoading();
      switching.value = false;
    }
  };

  const onVersionRes = async (result: ScreenData | null, detail: string) => {
    if (result) {
      if (detail == "create" || detail == "copy") {
        await applyVersionChange(result.versionCode, detail == "copy" ? "正在复制版本…" : "正在创建版本…");
      }
    }
  };
  // url存在version参数时，修改该参数
  const handleVersionQueryChange = async (versionCode: string) => {
    const query = route.query;
    if (query && query.version) {
      router.push({
        // 保留当前路径
        path: route.path,
        // 合并原有query，只修改name字段
        query: {
          ...route.query,
          version: versionCode
        }
      });
    }
  };

  const onSwitchVersion = async (item: ScreenVersion) => {
    // 已是当前版本 / 正在切换中 → 直接忽略，不弹确认
    if (switching.value || String(navInfo.value?.versionCode) === String(item.versionCode)) {
      return;
    }
    const msgRes = await handleMessageBox(`确定从 V${navInfo.value?.versionCode} 切换到 V${item.versionCode}？`);
    if (msgRes) {
      handleVersionQueryChange(item.versionCode);
      await applyVersionChange(item.versionCode);
      ElMessage.success(`已切换到 V${item.versionCode}`);
    }
  };

  const onAdd = async () => {
    // 实现新建版本逻辑
    const msgRes = await handleMessageBox("是否新建版本");

    if (msgRes) {
      const res = await createScreenVersion({
        backgroundUrl: navInfo.value.backgroundUrl,
        config: "[]",
        detail: JSON.stringify(editConfig.value),
        groupId: "",
        id: Number(id.value),
        name: navInfo.value.name,
        password: "",
        type: 1
      });

      if (res.code === 200) {
        await getVersionList(Number(id.value));
        ElMessage.success("新增成功");
        onVersionRes(res.result, "create");
      } else {
        ElMessage.error(res.message || "新增失败");
      }
    }
  };

  const onCopyVersion = async (item: ScreenVersion) => {
    // 实现复制版本逻辑
    const msgRes = await handleMessageBox(`是否复制版本V${item.versionCode}`);

    if (msgRes) {
      updateVersion(
        {
          id: id.value,
          versionCode: item.versionCode
        },
        "copy"
      );
    }
  };

  const onEditDesc = (item: ScreenVersion) => {
    // 实现修改说明逻辑
    ElMessageBox.prompt(`请输入版本 V${item.versionCode} 的说明（最多15个字符）`, "设置版本说明", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputValue: item.versionDesc || "",
      customClass: "sw-message-box",
      inputPlaceholder: "请输入版本说明",
      inputValidator: (value) => {
        if (value.length > 15) {
          return "版本说明不能超过15个字符";
        }
        return true;
      },
      inputErrorMessage: "版本说明不能超过15个字符"
    })
      .then(({ value }) => {
        if (value.length > 15) {
          ElMessage.error("版本说明不能超过15个字符");
          return;
        }
        updateVersion(
          {
            id: id.value,
            versionCode: item.versionCode,
            versionDesc: value
          },
          "update"
        );
      })
      .catch(() => {
        // 用户取消操作
      });
  };

  const onDeleteVersion = async (item: ScreenVersion) => {
    if (versionList.value.length <= 1) {
      ElMessage.error("无法删除唯一版本记录！");
      return;
    }

    const msgRes = await handleMessageBox(`是否删除版本V${item.versionCode}`);
    if (msgRes) {
      updateVersion(
        {
          id: id.value,
          versionCode: item.versionCode
        },
        "delete"
      );
    }
  };

  return {
    id,
    navInfo,
    versionList,
    switching,
    getVersionList,
    updateVersion,
    onAdd,
    onOperation,
    onSwitchVersion
  };
};

export const useVersion = createGlobalState(() => {
  const versionDrawerShow = ref(false);
  const setVersionDrawerShow = (bol: boolean) => {
    versionDrawerShow.value = bol;
  };

  return {
    versionDrawerShow,
    setVersionDrawerShow
  };
});
