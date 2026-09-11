import type Point from "./point";
import type { BasicPoint } from "./type";

interface ControlPoints {
  c1: BasicPoint;
  c2: BasicPoint;
}

/**
 * 贝塞尔曲线类，用于平滑签名轨迹
 */
class Bezier {
  public startPoint: Point;
  public control1: BasicPoint;
  public control2: BasicPoint;
  public endPoint: Point;
  public startWidth: number;
  public endWidth: number;

  /**
   * 从点集合创建贝塞尔曲线
   * @static
   * @param points - 点集合
   * @param widths - 曲线起始和终止宽度
   * @returns 贝塞尔曲线实例
   */
  static fromPoints(points: Point[], widths: { start: number; end: number }): Bezier {
    const c2 = this.calculateControlPoints(points[0], points[1], points[2]).c2;
    const c3 = this.calculateControlPoints(points[1], points[2], points[3]).c1;
    return new Bezier(points[1], c2, c3, points[2], widths.start, widths.end);
  }

  /**
   * 计算贝塞尔曲线的控制点
   * @private
   * @static
   * @param s1 - 第一个点
   * @param s2 - 第二个点
   * @param s3 - 第三个点
   * @returns 控制点对象
   */
  static calculateControlPoints(s1: BasicPoint, s2: BasicPoint, s3: BasicPoint): ControlPoints {
    const dx1 = s1.x - s2.x;
    const dy1 = s1.y - s2.y;
    const dx2 = s2.x - s3.x;
    const dy2 = s2.y - s3.y;
    const m1: BasicPoint = { x: (s1.x + s2.x) / 2.0, y: (s1.y + s2.y) / 2.0, pressure: 0, time: 0 };
    const m2: BasicPoint = { x: (s2.x + s3.x) / 2.0, y: (s2.y + s3.y) / 2.0, pressure: 0, time: 0 };
    const l1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const l2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    const dxm = m1.x - m2.x;
    const dym = m1.y - m2.y;
    const k = l2 / (l1 + l2);
    const cm: BasicPoint = { x: m2.x + dxm * k, y: m2.y + dym * k, pressure: 0, time: 0 };
    const tx = s2.x - cm.x;
    const ty = s2.y - cm.y;
    return {
      c1: { x: m1.x + tx, y: m1.y + ty, pressure: 0, time: 0 },
      c2: { x: m2.x + tx, y: m2.y + ty, pressure: 0, time: 0 }
    };
  }

  /**
   * 创建一个新的贝塞尔曲线实例
   * @param startPoint - 起始点
   * @param control1 - 控制点1
   * @param control2 - 控制点2
   * @param endPoint - 终止点
   * @param startWidth - 起始宽度
   * @param endWidth - 终止宽度
   */
  constructor(
    startPoint: Point,
    control1: BasicPoint,
    control2: BasicPoint,
    endPoint: Point,
    startWidth: number,
    endWidth: number
  ) {
    this.startPoint = startPoint;
    this.control1 = control1;
    this.control2 = control2;
    this.endPoint = endPoint;
    this.startWidth = startWidth;
    this.endWidth = endWidth;
  }

  /**
   * 计算贝塞尔曲线的近似长度
   * @returns 曲线长度
   */
  length(): number {
    const steps = 10;
    let length = 0;
    let px = 0;
    let py = 0;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const cx = this.point(t, this.startPoint.x, this.control1.x, this.control2.x, this.endPoint.x);
      const cy = this.point(t, this.startPoint.y, this.control1.y, this.control2.y, this.endPoint.y);
      if (i > 0) {
        const xdiff = cx - px;
        const ydiff = cy - py;
        length += Math.sqrt(xdiff * xdiff + ydiff * ydiff);
      }
      px = cx;
      py = cy;
    }
    return length;
  }

  /**
   * 计算贝塞尔曲线上的点
   * @private
   * @param t - 参数值 (0到1之间)
   * @param start - 起始值
   * @param c1 - 控制点1值
   * @param c2 - 控制点2值
   * @param end - 终止值
   * @returns 曲线上的点的值
   */
  private point(t: number, start: number, c1: number, c2: number, end: number): number {
    return (
      start * (1.0 - t) * (1.0 - t) * (1.0 - t) +
      3.0 * c1 * (1.0 - t) * (1.0 - t) * t +
      3.0 * c2 * (1.0 - t) * t * t +
      end * t * t * t
    );
  }
}

export default Bezier;
