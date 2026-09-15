// recorder-core 的官方 ESM 入口；使用它可避免引入项目内的 UMD 副本。
// 虽然该库仍会向 window 挂载 Recorder 以兼容传统调用，但业务代码只使用此模块导出。
import Recorder from "recorder-core/src/recorder-core.js.esm.js";

export const recorderCore = Recorder;
export default Recorder;
