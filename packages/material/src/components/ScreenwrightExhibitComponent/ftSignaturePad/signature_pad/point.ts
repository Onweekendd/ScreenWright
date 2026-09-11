import type { BasicPoint } from "./type";

/**
 * 点类，实现了BasicPoint接口，提供点操作的方法
 */
class Point implements BasicPoint {
  x: number;
  y: number;
  pressure: number;
  time: number;

  /**
   * 创建一个新的点实例
   * @param x - X坐标值
   * @param y - Y坐标值
   * @param pressure - 压力值
   * @param time - 时间戳
   */
  constructor(x: number, y: number, pressure?: number, time?: number) {
    if (isNaN(x) || isNaN(y)) {
      throw new Error(`Point is invalid: (${x}, ${y})`);
    }
    this.x = +x;
    this.y = +y;
    this.pressure = pressure || 0;
    this.time = time || Date.now();
  }

  /**
   * 计算当前点到目标点的距离
   * @param start - 目标点
   * @returns 两点之间的欧氏距离
   */
  distanceTo(start: BasicPoint): number {
    return Math.sqrt(Math.pow(this.x - start.x, 2) + Math.pow(this.y - start.y, 2));
  }

  /**
   * 判断当前点与另一个点是否相等
   * @param other - 待比较的点
   * @returns 如果两点所有属性都相等，则返回true
   */
  equals(other: BasicPoint): boolean {
    return (
      this.x === other.x &&
      this.y === other.y &&
      this.pressure === (other.pressure || 0) &&
      this.time === (other.time || 0)
    );
  }

  /**
   * 计算从起始点到当前点的速度
   * @param start - 起始点
   * @returns 速度值 (距离/时间)
   */
  velocityFrom(start: BasicPoint): number {
    return start.time && this.time !== start.time ? this.distanceTo(start) / (this.time - start.time) : 0;
  }
}

export default Point;
export type { BasicPoint };
