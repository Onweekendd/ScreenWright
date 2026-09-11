export type ShadowProps = {
  color: string;
  x: number;
  y: number;
  blur: number;
};

export type configTextShadowProps = {
  modelValue: ShadowProps | undefined;
  labelWidth?: string | number;
  showLetterSpacing?: boolean;
  label?: string;
  marginLeft?: string;
};

export const configTextShadowEmits = {
  change: (key: keyof ShadowProps, value: ShadowProps) => {
    return { key, value };
  }
};
export type configTextShadowEmits = typeof configTextShadowEmits;
