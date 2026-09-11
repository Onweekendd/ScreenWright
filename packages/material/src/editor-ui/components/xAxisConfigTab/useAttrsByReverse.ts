import { computed, ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import { useGenericAttrs } from "../../chartComponent/useGenericAttrs";

export enum TypeAttrs {
  row = "row",
  column = "column",
  column_l = "column_l",
  column_r = "column_r",
  row_l = "row_l",
  row_r = "row_r"
}

interface keyAttrs {
  axisType: string;
  axisInterval: string;
  axisRotate: string;
  axisMargin: string;
  axisLabelUtil: string;
  axisLabelLimit: string;
  axisLabelLimitNum: string;
  axisMin: string;
  axisMax: string;
  axisName: string;
  axisNamePaddingTop: string;
  axisNamePaddingBottom: string;
  axisNamePaddingLeft: string;
  axisNamePaddingRight: string;
  axisLabelShow: string;
  axisNameShow: string;
  axisLineShow: string;
  axisTickShow: string;
  axisSplitLineShow: string;
  axisLineColor: string;
  axisLineWidth: string;
  axisTickColor: string;
  axisTickWidth: string;
  axisTickLength: string;
  axisSplitLineType: string;
  axisSplitLineColor: string;
  axisSplitLineWidth: string;
  axisSplitLineInterval: string;
  axisLabelHover: string;
  axisLabelHoverColor: string;
}
const mapTypeToAttrs: Record<TypeAttrs, keyAttrs> = {
  [TypeAttrs.row]: {
    axisType: "xAxisType",
    axisInterval: "xAxisInterval",
    axisRotate: "xAxisRotate",
    axisMargin: "xAxisMargin",
    axisLabelUtil: "xAxisLabelUtil",
    axisLabelLimit: "xAxisLabelLimit",
    axisLabelLimitNum: "xAxisLabelLimitNum",
    axisMin: "xAxisMin",
    axisMax: "xAxisMax",
    axisNamePaddingTop: "xAxisNamePaddingTop",
    axisNamePaddingBottom: "xAxisNamePaddingBottom",
    axisNamePaddingLeft: "xAxisNamePaddingLeft",
    axisNamePaddingRight: "xAxisNamePaddingRight",
    axisName: "xAxisName",
    axisNameShow: "xAxisNameShow",
    axisLabelShow: "xAxisLabelShow",
    axisLineShow: "xAxisLineShow",
    axisTickShow: "xAxisTickShow",
    axisSplitLineShow: "xAxisSplitLineShow",
    axisLineColor: "xAxisLineColor",
    axisLineWidth: "xAxisLineWidth",
    axisTickColor: "xAxisTickColor",
    axisTickWidth: "xAxisTickWidth",
    axisTickLength: "xAxisTickLength",
    axisSplitLineType: "xAxisSplitLineType",
    axisSplitLineColor: "xAxisSplitLineColor",
    axisSplitLineWidth: "xAxisSplitLineWidth",
    axisSplitLineInterval: "xAxisSplitLineInterval",
    axisLabelHover: "xAisLabelHover",
    axisLabelHoverColor: "xAxisLabelHoverColor"
  },
  [TypeAttrs.column]: {
    axisType: "yAxisType",
    axisInterval: "yAxisInterval",
    axisRotate: "yAxisRotate",
    axisMargin: "yAxisMargin",
    axisLabelUtil: "yAxisLabelUtil",
    axisLabelLimit: "yAxisLabelLimit",
    axisLabelLimitNum: "yAxisLabelLimitNum",
    axisMin: "yAxisMin",
    axisMax: "yAxisMax",
    axisNamePaddingTop: "yAxisNamePaddingTop",
    axisNamePaddingBottom: "yAxisNamePaddingBottom",
    axisNamePaddingLeft: "yAxisNamePaddingLeft",
    axisNamePaddingRight: "yAxisNamePaddingRight",
    axisName: "yAxisName",
    axisNameShow: "yAxisNameShow",
    axisLabelShow: "yAxisLabelShow",
    axisLineShow: "yAxisLineShow",
    axisTickShow: "yAxisTickShow",
    axisSplitLineShow: "yAxisSplitLineShow",
    axisLineColor: "yAxisLineColor",
    axisLineWidth: "yAxisLineWidth",
    axisTickColor: "yAxisTickColor",
    axisTickWidth: "yAxisTickWidth",
    axisTickLength: "yAxisTickLength",
    axisSplitLineType: "yAxisSplitLineType",
    axisSplitLineColor: "yAxisSplitLineColor",
    axisSplitLineWidth: "yAxisSplitLineWidth",
    axisSplitLineInterval: "yAxisSplitLineInterval",
    axisLabelHover: "yAxisLabelHover",
    axisLabelHoverColor: "yAxisLabelHoverColor"
  },
  [TypeAttrs.column_l]: {
    axisType: "lyAxisType",
    axisInterval: "lyAxisInterval",
    axisRotate: "lyAxisRotate",
    axisMargin: "lyAxisMargin",
    axisLabelUtil: "lyAxisLabelUtil",
    axisLabelLimit: "lyAxisLabelLimit",
    axisLabelLimitNum: "lyAxisLabelLimitNum",
    axisMin: "lyAxisMin",
    axisMax: "lyAxisMax",
    axisNamePaddingTop: "lyAxisNamePaddingTop",
    axisNamePaddingBottom: "lyAxisNamePaddingBottom",
    axisNamePaddingLeft: "lyAxisNamePaddingLeft",
    axisNamePaddingRight: "lyAxisNamePaddingRight",
    axisName: "lyAxisName",
    axisNameShow: "lyAxisNameShow",
    axisLabelShow: "lyAxisLabelShow",
    axisLineShow: "lyAxisLineShow",
    axisTickShow: "lyAxisTickShow",
    axisSplitLineShow: "lyAxisSplitLineShow",
    axisLineColor: "lyAxisLineColor",
    axisLineWidth: "lyAxisLineWidth",
    axisTickColor: "lyAxisTickColor",
    axisTickWidth: "lyAxisTickWidth",
    axisTickLength: "lyAxisTickLength",
    axisSplitLineType: "lyAxisSplitLineType",
    axisSplitLineColor: "lyAxisSplitLineColor",
    axisSplitLineWidth: "lyAxisSplitLineWidth",
    axisSplitLineInterval: "lyAxisSplitLineInterval",
    axisLabelHover: "lyAxisLabelHover",
    axisLabelHoverColor: "lyAxisLabelHoverColor"
  },
  [TypeAttrs.column_r]: {
    axisType: "ryAxisType",
    axisInterval: "ryAxisInterval",
    axisRotate: "ryAxisRotate",
    axisMargin: "ryAxisMargin",
    axisLabelUtil: "ryAxisLabelUtil",
    axisLabelLimit: "ryAxisLabelLimit",
    axisLabelLimitNum: "ryAxisLabelLimitNum",
    axisMin: "ryAxisMin",
    axisMax: "ryAxisMax",
    axisNamePaddingTop: "ryAxisNamePaddingTop",
    axisNamePaddingBottom: "ryAxisNamePaddingBottom",
    axisNamePaddingLeft: "ryAxisNamePaddingLeft",
    axisNamePaddingRight: "ryAxisNamePaddingRight",
    axisName: "ryAxisName",
    axisNameShow: "ryAxisNameShow",
    axisLabelShow: "ryAxisLabelShow",
    axisLineShow: "ryAxisLineShow",
    axisTickShow: "ryAxisTickShow",
    axisSplitLineShow: "ryAxisSplitLineShow",
    axisLineColor: "ryAxisLineColor",
    axisLineWidth: "ryAxisLineWidth",
    axisTickColor: "ryAxisTickColor",
    axisTickWidth: "ryAxisTickWidth",
    axisTickLength: "ryAxisTickLength",
    axisSplitLineType: "ryAxisSplitLineType",
    axisSplitLineColor: "ryAxisSplitLineColor",
    axisSplitLineWidth: "ryAxisSplitLineWidth",
    axisSplitLineInterval: "ryAxisSplitLineInterval",
    axisLabelHover: "ryAxisLabelHover",
    axisLabelHoverColor: "ryAxisLabelHoverColor"
  },
  [TypeAttrs.row_l]: {
    axisType: "lxAxisType",
    axisInterval: "lxAxisInterval",
    axisRotate: "lxAxisRotate",
    axisMargin: "lxAxisMargin",
    axisLabelUtil: "lxAxisLabelUtil",
    axisLabelLimit: "lxAxisLabelLimit",
    axisLabelLimitNum: "lxAxisLabelLimitNum",
    axisMin: "lxAxisMin",
    axisMax: "lxAxisMax",
    axisNamePaddingTop: "lxAxisNamePaddingTop",
    axisNamePaddingBottom: "lxAxisNamePaddingBottom",
    axisNamePaddingLeft: "lxAxisNamePaddingLeft",
    axisNamePaddingRight: "lxAxisNamePaddingRight",
    axisName: "lxAxisName",
    axisNameShow: "lxAxisNameShow",
    axisLabelShow: "lxAxisLabelShow",
    axisLineShow: "lxAxisLineShow",
    axisTickShow: "lxAxisTickShow",
    axisSplitLineShow: "lxAxisSplitLineShow",
    axisLineColor: "lxAxisLineColor",
    axisLineWidth: "lxAxisLineWidth",
    axisTickColor: "lxAxisTickColor",
    axisTickWidth: "lxAxisTickWidth",
    axisTickLength: "lxAxisTickLength",
    axisSplitLineType: "lxAxisSplitLineType",
    axisSplitLineColor: "lxAxisSplitLineColor",
    axisSplitLineWidth: "lxAxisSplitLineWidth",
    axisSplitLineInterval: "lxAxisSplitLineInterval",
    axisLabelHover: "lxAxisLabelHover",
    axisLabelHoverColor: "lxAxisLabelHoverColor"
  },
  [TypeAttrs.row_r]: {
    axisType: "rxAxisType",
    axisInterval: "rxAxisInterval",
    axisRotate: "rxAxisRotate",
    axisMargin: "rxAxisMargin",
    axisLabelUtil: "rxAxisLabelUtil",
    axisLabelLimit: "rxAxisLabelLimit",
    axisLabelLimitNum: "rxAxisLabelLimitNum",
    axisMin: "rxAxisMin",
    axisMax: "rxAxisMax",
    axisNamePaddingTop: "rxAxisNamePaddingTop",
    axisNamePaddingBottom: "rxAxisNamePaddingBottom",
    axisNamePaddingLeft: "rxAxisNamePaddingLeft",
    axisNamePaddingRight: "rxAxisNamePaddingRight",
    axisName: "rxAxisName",
    axisNameShow: "rxAxisNameShow",
    axisLabelShow: "rxAxisLabelShow",
    axisLineShow: "rxAxisLineShow",
    axisTickShow: "rxAxisTickShow",
    axisSplitLineShow: "rxAxisSplitLineShow",
    axisLineColor: "rxAxisLineColor",
    axisLineWidth: "rxAxisLineWidth",
    axisTickColor: "rxAxisTickColor",
    axisTickWidth: "rxAxisTickWidth",
    axisTickLength: "rxAxisTickLength",
    axisSplitLineType: "rxAxisSplitLineType",
    axisSplitLineColor: "rxAxisSplitLineColor",
    axisSplitLineWidth: "rxAxisSplitLineWidth",
    axisSplitLineInterval: "rxAxisSplitLineInterval",
    axisLabelHover: "rxAxisLabelHover",
    axisLabelHoverColor: "rxAxisLabelHoverColor"
  }
};
export const useAttrsByReverse = createGlobalState(() => {
  const props = ref({ type: TypeAttrs.row });
  const setProps = (type: TypeAttrs) => {
    props.value.type = type || TypeAttrs.row;
  };
  const type = computed(() => props.value.type);
  return {
    ...useGenericAttrs(props.value, mapTypeToAttrs),
    type,
    setProps
  };
});
