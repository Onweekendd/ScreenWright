/**
 * 数据类型枚举
 * @description 定义组件数据的来源类型
 */
export enum DataType {
  /** 静态数据 */
  STATIC = 0,
  /** SQL 数据库查询 */
  SQL = 1,
  /** API 接口请求 */
  API = 2,
  /** CSV 文件数据 */
  CSV = 3,
  /** WebSocket 实时数据 */
  WEBSOCKET = 4,
  /** 物联网设备数据 */
  IOT = 5
}
