// 处理 文本样式属性不一致的问题
import { computed, onMounted, ref } from "vue";

import { useUpdateInstance } from "@editor/useUpdateInstance";

import type { ShadowProps } from "./type";

interface Props {
  color: string;
  x: string;
  y: string;
  blur: string;
  preFied: string;
}

export const useItemTextShadowAttrs = (
  attrsMap: Props = {
    color: "color",
    x: "x",
    y: "y",
    blur: "blur",
    preFied: "textShadow"
  }
) => {
  const input = ref<ShadowProps>({ color: "", x: 0, y: 0, blur: 0 });
  const { selectTargetData, update } = useUpdateInstance();
  const handleConfigTextShadowChange = (key: keyof ShadowProps, value: ShadowProps) => {
    console.log("handleConfigTextChange", key, value);
    if (!selectTargetData.value[0].option) {
      return;
    }
    setAttributes(sourceObj.value, attrsMap, value);
    update();
  };

  // 设置属性值
  const setAttributes = (target: any, attrsMap: Props, value: ShadowProps) => {
    const targetObj = attrsMap.preFied
      ? selectTargetData.value[0].option[attrsMap.preFied]
      : selectTargetData.value[0].option;
    const shadowProps = Object.keys(value) as Array<keyof ShadowProps>;
    shadowProps.forEach((key) => {
      const attrKey = attrsMap[key as keyof Omit<Props, "preFied">];
      if (attrKey) {
        targetObj[attrKey] = value[key];
      }
    });
  };

  // 获取属性值
  const getAttributes = (target: Record<string, any>, attrsMap: Props, input: { [key in keyof ShadowProps]: any }) => {
    const keys = Object.keys(input) as Array<keyof ShadowProps>;
    keys.forEach((key) => {
      input[key] = target[attrsMap[key]];
    });
  };
  const sourceObj = computed(() => {
    return attrsMap.preFied ? selectTargetData.value[0].option[attrsMap.preFied] : selectTargetData.value[0].option;
  });
  onMounted(() => {
    if (!selectTargetData.value[0].option) {
      return;
    }

    getAttributes(sourceObj.value, attrsMap, input.value);
  });

  return {
    input,
    handleConfigTextShadowChange
  };
};
