// import { createGlobalState } from "@vueuse/core"
import type { Ref } from "vue";
import { computed, ref } from "vue";

import { assign, pick } from "lodash-es";

import type { DbItem } from "@/model/DataModel";

import type { DataForm } from "../type";
import { DataSourceType } from "../type";

interface Props {
  groupDataOptions: Array<{ value: string; label: string }>;
  menuActive: Ref<DataSourceType>;
  row: DbItem;
  group: number | "";
  typeOptions: Array<{ value: string; label: string; disabled?: boolean; example?: string }>;
}
// 定义formData的默认值常量

// 定义defaultOptions的默认值常量
const DEFAULT_DEFAULT_OPTIONS = {
  fileName: "",
  type: "",
  url: "",
  name: ""
};

export const useDataForm = (props: Props) => {
  const getDefaultType = () => {
    if (props.menuActive.value === DataSourceType.LOCAL) {
      return "csv";
    } else if (props.menuActive.value === DataSourceType.API) {
      return "api";
    } else if (props.menuActive.value === DataSourceType.TCPUDP) {
      return "1";
    } else if (props.menuActive.value === DataSourceType.DB) {
      return "mysql";
    }
    return "";
  };
  const cPlaceholder = computed(() => {
    if (props.menuActive.value === DataSourceType.API) {
      return formData.value.type === "api"
        ? "http[s]://hostname[:port][/pathname]"
        : "ws[s]://hostname[:port][/pathname]";
    }
    return "";
  });

  const DEFAULT_FORM_DATA = {
    name: "",
    type: "csv",
    description: "",
    charsetName: "UTF-8",
    fileName: {},
    baseUrl: "",
    swaggerUrl: "",
    group: "",
    desIp: "",
    desPort: "",
    url: "",
    username: "",
    password: ""
  };

  const formData = ref<DataForm>(DEFAULT_FORM_DATA);

  const defaultOptions = ref(DEFAULT_DEFAULT_OPTIONS);
  const option = computed(() => {
    return defaultOptions.value;
  });

  const handleChangeFormType = (val: string) => {
    defaultOptions.value.type = val;
    defaultOptions.value.fileName = "";
    defaultOptions.value.url = "";
    defaultOptions.value.name = "";
  };

  const onChange = (key: keyof DataForm, value: any, cb?: () => void) => {
    formData.value[key] = value;
    cb && cb();
  };

  const initFormData = (row: DbItem) => {
    if (!row || Object.keys(row).length === 0) {
      formData.value = { ...DEFAULT_FORM_DATA };
      formData.value.type = getDefaultType();
      formData.value.group = props.group || "";
      defaultOptions.value = assign({ fileName: "", type: "", url: "", name: "" }, { type: formData.value.type });
    } else {
      const assignData = assign({}, formData.value, row);
      formData.value = pick(assignData, [
        "name",
        "type",
        "description",
        "charsetName",
        "fileName",
        "group",
        "id",
        "baseUrl",
        "swaggerUrl",
        "config",
        "desIp",
        "desPort",
        "url",
        "username",
        "password"
      ]);
      const parsedConfig = row.config ? JSON.parse(row.config) : {};
      formData.value.baseUrl = parsedConfig.baseUrl ?? "";
      formData.value.swaggerUrl = parsedConfig.swaggerUrl ?? "";
      if (props.menuActive.value === DataSourceType.API) {
        formData.value.type = parsedConfig.type ?? "";
      }
      if (props.menuActive.value === DataSourceType.DB) {
        const config = parsedConfig;
        formData.value.type = config.type;
        formData.value.password = config.password;
        formData.value.username = config.username;
        formData.value.url = config.url;
      }

      formData.value.group = row.dataGroupId as number;
      const optionsPick = pick(row, ["url", "type", "fileName", "name"]);
      defaultOptions.value = assign(defaultOptions.value, optionsPick);
    }
  };

  return {
    option,
    cPlaceholder,
    formData,
    onChange,
    handleChangeFormType,
    initFormData
  };
};
