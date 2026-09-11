import type { InjectionKey, Ref } from "vue";

import type { FormInstance } from "element-plus";

export type dataFormContext = {
  FormInstance: Ref<FormInstance | null>;
};

export enum methodsEnum {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE"
}

export enum activeNameEnum {
  Header = "Header",
  Query = "Query",
  Body = "Body"
}
export enum emApiType {
  None = "none",
  FormData = "formData",
  Json = "json",
  Raw = "raw"
}

export interface ParamsInterface {
  methods: methodsEnum;
  url: string;
  activeName: activeNameEnum;
  data: Record<activeNameEnum, Record<string, any>>;
  response: string;
}

export const defaultParams = {
  methods: methodsEnum.POST,
  url: "",
  activeName: activeNameEnum.Body,
  data: {
    [activeNameEnum.Header]: {
      listData: [
        {
          key: "",
          value: "",
          type: "String"
        }
      ]
    },
    [activeNameEnum.Query]: {
      listData: [
        {
          key: "",
          value: "",
          type: "String"
        }
      ]
    },
    [activeNameEnum.Body]: {
      apiType: emApiType.None,
      [emApiType.None]: "",
      [emApiType.FormData]: {
        listData: [
          {
            key: "",
            value: "",
            type: "String"
          }
        ]
      },
      [emApiType.Json]: "{}",
      [emApiType.Raw]: '""'
    }
  },
  response: "{}"
};

export const dataFormKey: InjectionKey<dataFormContext> = Symbol("dataFormKey");
