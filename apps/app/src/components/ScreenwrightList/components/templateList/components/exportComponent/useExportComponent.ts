import { ref } from "vue";

import { getScreenVersionList } from "@/api/version";
import type { ScreenVersion } from "@/model/Version";
import type { ScreenItem } from "@/model/Visual";
import to from "@/utils/await-to-js";

/**
 * 导出类型枚举
 */
export enum ExportTypeEnum {
  /** 应用文件 */
  PACKAGE_FILE = 0,
  /** 离线应用 */
  PACKAGE = 1
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
    remark: "（包含配置、资源和运行时文件）",
    tooltip: "解压后放到任意静态服务器（如 nginx）即可访问",
    disabled: false
  }
];

export const useExportComponent = (item: ScreenItem) => {
  const exportType = ref("package_file");
  const listData = ref<Array<ScreenVersion>>([]);
  const selectVersionCode = ref("");

  const initData = async () => {
    const [error, res] = await to(getScreenVersionList(item.id));
    if (error) {
      return;
    }
    if (res && res.success) {
      listData.value = res.result;
      if (listData.value.length > 0) {
        selectVersionCode.value = listData.value[0].versionCode;
      }
    }
  };
  const handleSelect = (item: ExportOption) => {
    if (exportType.value === item.value || item.disabled) {
      return;
    }
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
      versionCode: selectVersionCode.value,
      success: true
    };
  };

  return {
    exportType,
    selectVersionCode,
    listData,
    validate,
    initData,
    handleSelect
  };
};
