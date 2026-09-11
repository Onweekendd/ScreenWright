// 有单位切换
export const unitParenList = [
  "sw-video",
  "sw-img",
  "sw-imgBorder",
  "sw-open-video",
  "three-scene",
  "map-talks",
  "ue-peer-streaming",
  "ue-pixel-streaming",
  "map-project"
];
export const unitParenOpt = [
  { label: "数值", value: "" },
  { label: "百分比", value: "percent" }
];

export const validProp = (name: string, list: string[]) => {
  if (list) {
    return list.includes(name);
  }
};
