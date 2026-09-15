/**
 * 3D fte 引擎加载端口（从 @screenwright/composables 迁入）。
 * 实现依赖 app 运行环境（CDN 路径的 env 判断），由 app 注入；3D 引擎加载是物料包
 * （元素周期表等 3D 组件）自己的端口，不是 use 包通用能力，不经 use 包。
 */
export type RegisterFteFn = (prefix?: string) => Promise<unknown>;

let registerFteImpl: RegisterFteFn | null = null;

/** 由主应用注入 3D fte 初始化实现（加载 ftthree/fteApp 脚本，未注入时静默跳过）。 */
export function initRegisterFte(fn: RegisterFteFn): void {
  registerFteImpl = fn;
}

export function registerFte(prefix?: string): Promise<unknown> {
  return registerFteImpl ? registerFteImpl(prefix) : Promise.resolve();
}
