import { isNumber } from "lodash-es";

export enum Attrs {
  width = "width",
  height = "height",
  selectValue = "selectValue"
}

export type configSelectInputProps = {
  width: number | string;
  height: number | string;
};

export const configSelectInputEmits = {
  "update:width": (value: number) => isNumber(value),
  "update:height": (value: number) => isNumber(value),
  change: (attrs: Attrs, value: number | string) => {
    return { attrs, value };
  }
};

export type configSelectInputEmits = typeof configSelectInputEmits;
