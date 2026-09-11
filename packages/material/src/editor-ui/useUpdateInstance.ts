/**
 * useUpdateInstance 已下沉到 @screenwright/composables，物料包和主应用共享同一份 @screenwright/composables 模块实例，
 * 不再需要运行时注入（initMaterial 已整体移除）。这里保留原路径作为转发壳，
 * 避免物料包内 250+ 处调用方逐一改 import。
 */
import { useUpdateInstance } from "@screenwright/composables";

export { useUpdateInstance };
