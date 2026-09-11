// import { validateNull } from "@/views/build/components/buildRender/core/BaseComponent/BaseChart"
import { validateNull } from "@/utils/utils";

export const handleFunction = (fun: string) => {
  if (!validateNull(fun)) {
    try {
      return eval(fun);
    } catch (error) {
      return () => {
        console.log("eval error!!!!!!!!!!", error);
      };
    }
  }
};

// 克隆数据弃用lodash的cloneDeep，改为普通正反序列化
export const cloneDeep = (data: object) => {
  return JSON.parse(JSON.stringify(data));
};

// 升序
export const ascSort = <T>(data: Array<T>, val: keyof T) => {
  return data.sort((a, b) => {
    const data = (a[val] as number) - (b[val] as number);
    return data;
  });
};
