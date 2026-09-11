/** MyBatis-Plus 分页形状（前端按此解构，字段需齐全） */
export function pageOf<T>(records: T[], total: number, current: number, size: number) {
  return {
    records,
    total,
    size,
    current,
    pages: size > 0 ? Math.ceil(total / size) : 0,
    orders: [] as unknown[],
    optimizeCountSql: true,
    searchCount: true,
    maxLimit: null,
    countId: null
  };
}
