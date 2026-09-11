/**
 * 统一响应信封，对齐前端 src/model/BaseEntity.ts
 * 前端 service.ts 响应拦截器直接返回 response.data，调用方读 .success / .result
 */
export interface BaseEntity<T> {
  code: number;
  message: string;
  success: boolean;
  result: T;
  requestId: string;
  timestamp: number;
  onlTable: unknown;
}

const requestId = (): string =>
  // 轻量唯一 id（仅用于响应字段填充，无安全用途）
  Math.random().toString(36).slice(2) + Date.now().toString(36);

const build = <T>(result: T, message: string, success: boolean, code: number): BaseEntity<T> => ({
  code,
  message,
  success,
  result,
  requestId: requestId(),
  timestamp: Date.now(),
  onlTable: null
});

/** 成功响应（code 200） */
export const ok = <T>(result: T, message = "操作成功"): BaseEntity<T> => build(result, message, true, 200);

/** 失败响应（默认 code 500） */
export const fail = <T>(result: T, message = "操作失败", code = 500): BaseEntity<T> =>
  build(result, message, false, code);

/** 未授权（code 401） */
export const noAuth = <T>(result: T, message = "未授权"): BaseEntity<T> => fail(result, message, 401);
