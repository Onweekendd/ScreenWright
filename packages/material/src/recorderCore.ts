// recorder-core 是第三方 UMD 录音库（https://github.com/xiangyuecn/Recorder），无类型声明。
// ftVoiceControl 组件与主包 AIChartBox 均需使用，统一从 @screenwright/material 导出，避免反向依赖主包内部路径。
// 以 namespace 形式导出，与 ftVoiceControl / AIChartBox 既有的 `import * as X` + `X.default` 用法一致；
// 运行时取值方式：`recorderCore.default || window.RecorderIns`。
// @ts-ignore - UMD 模块无类型声明
export * as recorderCore from "./components/ScreenwrightInteractive/components/ftVoiceControl/recorder-core.js";
