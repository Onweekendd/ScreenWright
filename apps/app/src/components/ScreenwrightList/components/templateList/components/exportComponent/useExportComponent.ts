import { computed, ref } from "vue";

import { getScreenVersionList } from "@/api/version";
import type { ScreenVersion } from "@/model/Version";
import type { ScreenItem } from "@/model/Visual";
import to from "@/utils/await-to-js";
import { formatTime } from "@/utils/utils";

/**
 * 导出类型枚举
 */
export enum ExportTypeEnum {
  /** 应用文件 */
  PACKAGE_FILE = 0,
  /** 离线应用 */
  PACKAGE = 1,
  /** 本地nginx服务器 */
  PACKAGE_NGINX = 2,
  /** 客户端exe程序 */
  PACKAGE_EXE = 3
}

/**
 * 导出选项接口
 */
export interface ExportOption {
  type: ExportTypeEnum;
  label: string;
  value: string;
  remark: string;
  tooltip: string;
  disabled: boolean;
}

/**
 * 导出选项配置
 */
export const exportOption: ExportOption[] = [
  {
    type: ExportTypeEnum.PACKAGE_FILE,
    label: "应用文件",
    value: "package_file",
    remark: "（只包含配置、资源）",
    tooltip: "无需解压，支持导入Screenwright平台中",
    disabled: false
  },
  {
    type: ExportTypeEnum.PACKAGE,
    label: "离线应用",
    value: "package",
    remark: "（包含配置、资源和执行脚本）",
    tooltip: "文件解压后，nginx部署环境替换该文件",
    disabled: false
  },
  {
    type: ExportTypeEnum.PACKAGE_NGINX,
    label: "本地nginx服务器",
    value: "package_nginx",
    remark: "（包含配置、资源和执行脚本）",
    tooltip: "文件解压后，可以运行FunBIServer.bat,并按提示操作",
    disabled: false
  },
  {
    type: ExportTypeEnum.PACKAGE_EXE,
    label: "客户端exe程序",
    value: "package_exe",
    remark: "（包含配置、资源和执行脚本）",
    tooltip: "文件解压后，可以直接运行FunBI.exe",
    disabled: false
  }
];

export const useExportComponent = (item: ScreenItem) => {
  const exportType = ref("package_file");
  const expirationTime = ref<string | undefined>("");
  const listData = ref<Array<ScreenVersion>>([]);
  const selectVersionCode = ref("");
  //   const hasExpirationTime = ref(true)
  const hasExpirationTime = computed(() => {
    return exportType.value !== "package_file";
  });

  const initData = async () => {
    const [error, res] = await to(getScreenVersionList(item.id));
    if (error) return;
    if (res && res.success) {
      listData.value = res.result;
      if (listData.value.length > 0) {
        selectVersionCode.value = listData.value[0].versionCode;
        expirationTime.value = formatTime(new Date().getTime() + 3600 * 1000 * 24 * 30);
      }
    }
  };
  const handleSelect = (item: ExportOption) => {
    if (exportType.value === item.value || item.disabled) return;
    exportType.value = item.value;
  };

  const getValueByExportType = (value: string): ExportTypeEnum | "" => {
    const target = exportOption.find((item) => item.value === value);
    if (target) {
      return target.type;
    }
    return "";
  };

  const validate = () => {
    return {
      exportType: getValueByExportType(exportType.value),
      exportTypeText: exportType.value,
      expirationTime: expirationTime.value,
      versionCode: selectVersionCode.value,
      success: true
    };
  };

  return {
    exportType,
    expirationTime,
    hasExpirationTime,
    selectVersionCode,
    listData,
    validate,
    initData,
    handleSelect
  };
};
