export type PaddingProps = {
  padding: Array<number>;
};

export interface configPaddingProps {
  modelValue: {
    [key: string]: number[];
  };
  fieldName?: string;
  labelWidth?: number | string;
}

export const configPaddingEmits = ["update:modelValue"];
