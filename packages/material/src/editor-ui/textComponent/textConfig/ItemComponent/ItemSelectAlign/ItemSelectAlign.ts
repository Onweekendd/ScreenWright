export enum typeAttrs {
  "default" = "default",
  "component" = "component",
  "layout" = "layout",
  "size" = "size",
  "vertical" = "vertical",
  "flex" = "flex",
  "custom" = "custom",
  "verticalWithMiddle" = "verticalWithMiddle",
  "defaultWithThree" = "defaultWithThree"
}

export interface ItemSelectAlignProps {
  modelValue: any;
  type: typeAttrs;
  label?: string;
  customOptions?: any[];
  labelWidth?: string | number;
  marginLeft?: string;
}
