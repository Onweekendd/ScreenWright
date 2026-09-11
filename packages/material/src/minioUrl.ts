/**
 * setMinioUrl 已下沉到 @screenwright/composables（只读 window.webconfig / process.env，纯运行时/环境逻辑，
 * 无 app 业务状态耦合），物料包和主应用共享同一份 @screenwright/composables 模块实例，不再需要运行时注入。
 */
import { setMinioUrl } from "@screenwright/composables";

export { setMinioUrl };
