import { TypeAttrs } from "./useAttrsByReverse";

const nameOptions = {
  [TypeAttrs.row]: {
    fontFamily: "xAxisNameFontFamily",
    fontStyle: "xAxisNameFontStyle",
    fontWeight: "xAxisNameFontWeight",
    fontSize: "xAxisNameFontSize",
    color: "xAxisNameColor"
  },
  [TypeAttrs.column]: {
    fontFamily: "yAxisNameFontFamily",
    fontStyle: "yAxisNameFontStyle",
    fontWeight: "yAxisNameFontWeight",
    fontSize: "yAxisNameFontSize",
    color: "yAxisNameColor"
  },
  [TypeAttrs.column_l]: {
    fontFamily: "lyAxisNameFontFamily",
    fontStyle: "lyAxisNameFontStyle",
    fontWeight: "lyAxisNameFontWeight",
    fontSize: "lyAxisNameFontSize",
    color: "lyAxisNameColor"
  },
  [TypeAttrs.column_r]: {
    fontFamily: "ryAxisNameFontFamily",
    fontStyle: "ryAxisNameFontStyle",
    fontWeight: "ryAxisNameFontWeight",
    fontSize: "ryAxisNameFontSize",
    color: "ryAxisNameColor"
  },
  [TypeAttrs.row_l]: {
    fontFamily: "lxAxisNameFontFamily",
    fontStyle: "lxAxisNameFontStyle",
    fontWeight: "lxAxisNameFontWeight",
    fontSize: "lxAxisNameFontSize",
    color: "lxAxisNameColor"
  },
  [TypeAttrs.row_r]: {
    fontFamily: "rxAxisNameFontFamily",
    fontStyle: "rxAxisNameFontStyle",
    fontWeight: "rxAxisNameFontWeight",
    fontSize: "rxAxisNameFontSize",
    color: "rxAxisNameColor"
  }
};

const labelOptions = {
  [TypeAttrs.row]: {
    fontFamily: "xAxisFontFamily",
    fontStyle: "xAxisFontStyle",
    fontWeight: "xAxisFontWeight",
    fontSize: "xAxisFontSize",
    color: "xAxisColor"
  },
  [TypeAttrs.column]: {
    fontFamily: "yAxisFontFamily",
    fontStyle: "yAxisFontStyle",
    fontWeight: "yAxisFontWeight",
    fontSize: "yAxisFontSize",
    color: "yAxisColor"
  },
  [TypeAttrs.column_l]: {
    fontFamily: "lyAxisFontFamily",
    fontStyle: "lyAxisFontStyle",
    fontWeight: "lyAxisFontWeight",
    fontSize: "lyAxisFontSize",
    color: "lyAxisColor"
  },
  [TypeAttrs.column_r]: {
    fontFamily: "ryAxisFontFamily",
    fontStyle: "ryAxisFontStyle",
    fontWeight: "ryAxisFontWeight",
    fontSize: "ryAxisFontSize",
    color: "ryAxisColor"
  },
  [TypeAttrs.row_l]: {
    fontFamily: "lxAxisFontFamily",
    fontStyle: "lxAxisFontStyle",
    fontWeight: "lxAxisFontWeight",
    fontSize: "lxAxisFontSize",
    color: "lxAxisColor"
  },
  [TypeAttrs.row_r]: {
    fontFamily: "rxAxisFontFamily",
    fontStyle: "rxAxisFontStyle",
    fontWeight: "rxAxisFontWeight",
    fontSize: "rxAxisFontSize",
    color: "rxAxisColor"
  }
};

export const textStyleNameByType = (type: TypeAttrs) => {
  return nameOptions[type];
};
export const textStyleLabelByType = (type: TypeAttrs) => {
  return labelOptions[type];
};
