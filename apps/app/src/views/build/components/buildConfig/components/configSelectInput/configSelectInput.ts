export enum Attrs {
  width = "width",
  height = "height",
  selectValue = "selectValue"
}

export type configSelectInputProps = {
  width: number | string;
  height: number | string;
};

/**
 * 宽高回写成**字符串**：绑定的是 editConfig.width/height，大屏 schema 里这两个字段是 string。
 * 回写数字会让整份 info.json 校验不过，后端读这块屏直接抛错，屏上任何组件都改不了。
 */
export const configSelectInputEmits = {
  "update:width": (value: string) => typeof value === "string",
  "update:height": (value: string) => typeof value === "string",
  change: (attrs: Attrs, value: number | string) => {
    return { attrs, value };
  }
};

export type configSelectInputEmits = typeof configSelectInputEmits;
