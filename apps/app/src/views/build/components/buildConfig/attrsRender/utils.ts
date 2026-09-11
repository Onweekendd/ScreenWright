import { getRuntimeCallbackArgs } from "@screenwright/core";

import type { Filter } from "@/views/build/components/buildRender/type";

import type { ListenArg } from "../../buildRender/type";

export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

interface execFunByListenArgsProps {
  dataFilter: Record<string, Filter>;
  listenArgs: ListenArg[];
  data: any;
}

export const execFunByListenArgs = (props: execFunByListenArgsProps) => {
  const { listenArgs, dataFilter, data } = props;
  let result: any[] = data;
  for (const arg of listenArgs) {
    if (arg.usageStatus) {
      const filterName = arg.filterName;
      // console.log(dataFilter, "dataFilter")
      const dataFormatter = dataFilter[filterName] ? dataFilter[filterName].dataFormatter : "";
      console.log(dataFormatter, "dataFormatter");
      if (dataFormatter) {
        let executableFunction;
        try {
          executableFunction = new Function("return " + dataFormatter)();
        } catch (error) {
          throw new Error("函数解析出错:" + error);
        }
        try {
          result = executableFunction(result, getRuntimeCallbackArgs());
        } catch (error) {
          throw new Error("执行函数出错:" + error);
        }
      }
    }
  }
  return result;
};
