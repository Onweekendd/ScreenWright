import { onMounted, ref, watch } from "vue";

import { isUndefined } from "lodash-es";
import { get } from "lodash-es";

import { useUpdateInstance } from "@editor/useUpdateInstance";
import type { StyleProps } from "./configTextStyle";

interface Props {
  fontFamily: string;
  fontStyle: string;
  fontWeight: string;
  fontSize: string;
  color: string;
  attrs?: string;
}

const setAttributes = (target: any, attrsMap: Props, value: StyleProps, index?: number) => {
  const keys = Object.keys(attrsMap) as (keyof Props)[];
  keys.forEach((key) => {
    if (isUndefined(index)) {
      if (attrsMap[key] && key !== "attrs") {
        target[attrsMap[key]] = value[key];
      }
    } else {
      if (attrsMap[key] && key !== "attrs") {
        target[attrsMap[key]][index] = value[key];
      }
    }
  });
};

const getAttributes = (
  target: Record<string, any>,
  attrsMap: Props,
  input: { [key in keyof StyleProps]: any },
  index?: number
) => {
  const keys = Object.keys(attrsMap) as (keyof Props)[];
  keys.forEach((key) => {
    if (isUndefined(index)) {
      if (attrsMap[key] && key !== "attrs" && target && target[attrsMap[key]]) {
        input[key] = target[attrsMap[key]];
      }
    } else {
      if (attrsMap[key] && key !== "attrs" && target[attrsMap[key]]) {
        input[key] = target[attrsMap[key]][index];
      }
    }
  });
};

export const useFontStyleAttrs = (
  _attrsMap: Props = {
    fontFamily: "fontFamily",
    fontStyle: "fontStyle",
    fontWeight: "fontWeight",
    fontSize: "fontSize",
    color: "color"
  },
  _index?: number
) => {
  let attrsMap = _attrsMap;
  let index = _index;
  const attrs = ref(attrsMap.attrs || "");
  const input = ref<StyleProps>({
    fontFamily: "",
    fontStyle: "",
    fontWeight: "",
    fontSize: 16,
    color: ""
  });
  const { selectTargetData, update } = useUpdateInstance();
  watch(
    () => [
      selectTargetData.value[0] && selectTargetData.value[0].option[attrsMap.fontSize],
      selectTargetData.value[0] && selectTargetData.value[0].option[attrsMap.color],
      selectTargetData.value[0] && selectTargetData.value[0].option[attrsMap.fontStyle],
      selectTargetData.value[0] && selectTargetData.value[0].option[attrsMap.fontWeight],
      selectTargetData.value[0] && selectTargetData.value[0].option[attrsMap.fontFamily],
      selectTargetData.value[0] && selectTargetData.value[0].option[attrsMap.fontStyle]
    ],
    () => {
      if (
        !selectTargetData.value[0] ||
        !attrsMap.fontSize ||
        !attrsMap.color ||
        !attrsMap.fontStyle ||
        !attrsMap.fontWeight ||
        !attrsMap.fontFamily
      ) {
        return;
      }
      const newFontSize = selectTargetData.value[0].option[attrsMap.fontSize];
      const newFontColor = selectTargetData.value[0].option[attrsMap.color];
      const newFontStyle = selectTargetData.value[0].option[attrsMap.fontStyle];
      const newFontWeight = selectTargetData.value[0].option[attrsMap.fontWeight];
      const newFontFamily = selectTargetData.value[0].option[attrsMap.fontFamily];
      const oldFontSize = input.value.fontSize;
      const oldFontColor = input.value.color;
      const oldFontStyle = input.value.fontStyle;
      const oldFontWeight = input.value.fontWeight;
      const oldFontFamily = input.value.fontFamily;
      if (
        newFontSize === oldFontSize &&
        newFontColor === oldFontColor &&
        newFontStyle === oldFontStyle &&
        newFontWeight === oldFontWeight &&
        newFontFamily === oldFontFamily
      ) {
        return;
      }
      getInitValue(attrsMap.attrs || "");
    }
  );
  const handleConfigTextChange = (key: keyof StyleProps, value: StyleProps) => {
    if (!selectTargetData.value[0].option) {
      return;
    }
    const target = attrs.value ? get(selectTargetData.value[0].option, attrs.value) : selectTargetData.value[0].option;
    setAttributes(target, attrsMap, value, index);
    update();
  };
  const getInitValue = (paramsAttrs: string) => {
    if (!selectTargetData.value[0].option) {
      return;
    }
    attrs.value = paramsAttrs;
    const target = attrs.value ? get(selectTargetData.value[0].option, attrs.value) : selectTargetData.value[0].option;
    getAttributes(target, attrsMap, input.value, index);
  };

  const setInput = (_attrsMap: Props, _index?: number) => {
    attrsMap = _attrsMap;
    const keys = Object.keys(attrsMap) as (keyof Props)[];
    const target = attrs.value ? get(selectTargetData.value[0].option, attrs.value) : selectTargetData.value[0].option;
    if (!isUndefined(index)) {
      index = _index;
    }
    keys.forEach((key) => {
      if (key === "attrs") return;
      const k = key as unknown as keyof StyleProps;
      if (isUndefined(index)) {
        (input.value as any)[k] = target[attrsMap[key]];
      } else {
        if (attrsMap[key] && target[attrsMap[key]]) {
          (input.value as any)[k] = target[attrsMap[key]][index];
        }
      }
    });
  };

  onMounted(() => {
    getInitValue(attrsMap.attrs || "");
  });

  return {
    input,
    setInput,
    handleConfigTextChange,
    getInitValue
  };
};
