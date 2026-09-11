export interface ExportParams {
  id: number;
  type?: "package" | "package_exe" | "package_nginx";
  name?: string;
  prohibition?: {
    ihl?: boolean;
    iwm?: boolean;
    ed?: number | string;
  };
}

export interface Component {
  title: string;
  option: {
    id?: number;
    displayList?: Array<{ value: number; version?: string }>;
    [key: string]: any;
  };
  panelData?: any[];
  [key: string]: any;
}

export interface TempMode {
  aniFrameSet: any;
  statusAnimation: any;
  dataFilterArr: any;
  detail: any;
  component: Component[];
  prohibitionZone?: any;
  encodedControl: any;
  prohibition?: any;
  config: any | null;
}

export interface AsyncQuoteParams {
  quoteArr: any[];
  isQuote?: boolean;
  quoteItem?: any;
}

// 定义一个枚举来限制 field 的取值范围
export enum PackageType {
  package_exe = "package_exe",
  package_nginx = "package_nginx",
  default = "default"
}

export interface ExportConfig {
  tempMode: TempMode;
  appId: number | string;
  appName: string;
  outputType: "package" | "package_exe" | "package_nginx" | "package_file";
  outputName: string;
  prohibitionZone: any;
  filterFields: string[];
  exportNotify: any | null;
}
export interface InstructionParams {
  system: string;
  appId: string | number;
  encodedList?: string[];
}

export interface LayerConfigParams {
  modeStr: string;
  iv: string;
  encryptedData: string;
  secretKey: string;
  isExe?: boolean;
}
