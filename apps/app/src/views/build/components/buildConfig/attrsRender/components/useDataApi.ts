import { computed, ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import { getDataApiList, getDataDbList, getDataLocalList, getDataSocketList } from "@/api/dataSource";
import type { dbModelReq } from "@/model/DataModel";
import { DataSourceType } from "@/views/source/type";

import type { ComponentType } from "../../../buildRender/type";
import { tcpudpDataTypeEnum } from "../../constants";

export type ApiFunction = (params: dbModelReq) => Promise<any>;
export interface DataSource {
  type: number;
  config: string;
  id: number;
  name: string;
  [x: string]: any;
}
const apiMap = new Map<DataSourceType, ApiFunction>([
  [DataSourceType.LOCAL, getDataLocalList],
  [DataSourceType.DB, getDataDbList],
  [DataSourceType.API, getDataApiList],
  [DataSourceType.WEBSOCKET, getDataApiList],
  [DataSourceType.TCPUDP, getDataSocketList]
]);

const dataTypeMapDataSourceType = {
  [tcpudpDataTypeEnum.None]: DataSourceType.LOCAL,
  [tcpudpDataTypeEnum.TCP]: DataSourceType.TCPUDP,
  [tcpudpDataTypeEnum.UDP]: DataSourceType.TCPUDP,
  [tcpudpDataTypeEnum.WebSocket]: DataSourceType.WEBSOCKET
};

const useDataApi = createGlobalState((type?: DataSourceType) => {
  const options = ref<
    Array<
      {
        label: string;
        value: number;
      } & ComponentType["dataSource"]
    >
  >([]);

  const getMenuApi = computed(() => {
    if (!type) return null;

    return apiMap.get(type);
  });
  const getOptionData = async (dataSourceName?: DataSourceType) => {
    if (!dataSourceName) return [];

    const currentApi = apiMap.get(dataSourceName);
    if (!currentApi) return;
    const res = await currentApi({
      size: 100,
      groupId: -2,
      current: 1,
      status: -2,
      name: ""
    });
    if (res.success) {
      if (dataSourceName === DataSourceType.WEBSOCKET) {
        res.result.records = res.result.records.filter((item: any) => JSON.parse(item.config).type === "websocket");
      }
      return res.result.records.map((v: any) => {
        return {
          ...v,
          value: v.id,
          label: v.name
        };
      });
    }
    return [];
  };
  const setOptions = async (dataSourceName: DataSourceType) => {
    options.value = await getOptionData(dataSourceName);
  };

  return { options, getMenuApi, getOptionData, setOptions };
});

export { dataTypeMapDataSourceType, useDataApi };
