import { isString } from "lodash-es";

export type configAttrsTabProps = {
  modelValue: string | undefined;
  options: Array<{
    label: string;
    value: string;
    hidden?: boolean;
  }>;
};

export const configAttrsTabEmits = {
  "update:modelValue": (value: string) => isString(value),

  change: (value: string) => isString(value)
};
export type configAttrsTabEmits = typeof configAttrsTabEmits;
