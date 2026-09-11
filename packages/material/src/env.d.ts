/// <reference types="vite/client" />

declare global {
  // vite define 注入的构建模式全局标识
  const __BUILD_MODE__: string;
  interface Window {
    fteApp?: any;
    ftThree?: any;
    webconfig?: Record<string, any>;
  }
}

export {};
