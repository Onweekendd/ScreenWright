import type { FtLabelTypeProps } from "@screenwright/ui";

export type StyleProps = {
  fontStyle: string;
  fontWeight: string;
  color: string;
  attrs?: string;
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number;
} & FtLabelTypeProps;

export interface configTextStyleProps {
  modelValue: StyleProps | undefined;
  labelWidth?: string;
  isShowFontStyle?: boolean;
  isShowColorStyle?: boolean;
  isShowFontSize?: boolean;
  selectWidth?: number;
  colorWidth?: number;
}

export const configTextStyleEmits = {
  change: (key: keyof StyleProps, value: StyleProps) => {
    return { key, value };
  }
};
export type configTextStyleEmits = typeof configTextStyleEmits;
