export type configEncodeControlProps = {
  controlWebsocketUrl: string | undefined;
  heartbeatInterval: number | undefined;
};

export const configEncodeControlEmits = {
  "update:isEncodedControl": (
    key: keyof configEncodeControlProps,
    value: configEncodeControlProps[keyof configEncodeControlProps]
  ) => {
    return key !== undefined && value !== undefined;
  },
  "update:heartbeatInterval": (
    key: keyof configEncodeControlProps,
    value: configEncodeControlProps[keyof configEncodeControlProps]
  ) => {
    return key !== undefined && value !== undefined;
  },
  change: (key: keyof configEncodeControlProps, value: configEncodeControlProps[keyof configEncodeControlProps]) => {
    return key !== undefined && value !== undefined;
  }
};
export type configEncodeControlEmits = typeof configEncodeControlEmits;
