import { cloneDeep } from "lodash-es";

import type { ComponentType } from "../../buildRender/type";

const getCriticalPosition = (group: ComponentType[]) => {
  if (!Array.isArray(group)) return;
  const groupComp = cloneDeep(group);
  const POS_Size = groupComp.map((item) => {
    return {
      t: item.top,
      r: item.left + item.component.width,
      b: item.top + item.component.height,
      l: item.left
    };
  });
  // 上的最小值|右的最大值|下的最大值|左的最小值
  let POS_Top = POS_Size[0].t,
    POS_Right = POS_Size[0].r,
    POS_Bottom = POS_Size[0].b,
    POS_Left = POS_Size[0].l;
  POS_Size.forEach((current) => {
    if (current.t < POS_Top) POS_Top = current.t;
    if (current.r > POS_Right) POS_Right = current.r;
    if (current.b > POS_Bottom) POS_Bottom = current.b;
    if (current.l < POS_Left) POS_Left = current.l;
  });
  return { POS_Top, POS_Right, POS_Bottom, POS_Left };
};

export { getCriticalPosition };
