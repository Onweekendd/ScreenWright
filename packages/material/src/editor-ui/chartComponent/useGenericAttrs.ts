// 处理属性不同 key 的逻辑
import { useUpdateInstance } from "@screenwright/composables";
import { computed } from "vue";

// 通用的 useGenericAttrs 函数
export const useGenericAttrs = <T extends string, K extends string>(
  props: { type: T },
  mapTypeToAttrs: Record<T, Record<K, string>>,
) => {
  const { selectTargetData } = useUpdateInstance();

  const getAttrsByType = (key: K, type?: T) => {
    if (!type) {
      return 0;
    }
    const attrs = mapTypeToAttrs[type][key];

    return selectTargetData.value[0].option[attrs];
  };

  const setAttrsByType = (key: K, value: number, type?: T) => {
    if (!type) {
      return;
    }
    const attrs = mapTypeToAttrs[type][key];
    selectTargetData.value[0].option[attrs] = value;
  };

  const createComputedProperty = (key: K) => {
    return computed({
      get() {
        return getAttrsByType(key, props.type);
      },
      set(value) {
        setAttrsByType(key, value, props.type);
      },
    });
  };

  const result: Record<
    K,
    ReturnType<typeof createComputedProperty>
  > = {} as Record<K, ReturnType<typeof createComputedProperty>>;
  // 使用类型断言
  Object.keys(mapTypeToAttrs[props.type]).forEach((key) => {
    result[key as K] = createComputedProperty(key as K);
  });

  return result;
};
