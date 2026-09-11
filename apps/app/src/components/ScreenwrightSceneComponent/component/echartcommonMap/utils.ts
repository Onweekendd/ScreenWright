import Proj4 from "proj4";

/**
 * 坐标点投影坐标系转换
 * @param {Array} point 坐标点
 * @param {String} curPCS projected coordinate system 当前的投影坐标系
 * @param {String} tarPCS projected coordinate system 需要转的投影坐标系
 */
function getPointByProj4(point: any[], curPCS = "EPSG:4326", tarPCS = "EPSG:3857") {
  return Proj4(curPCS, tarPCS, [Number(point[0]), Number(point[1])]);
}

// 根据颜色类型返回不同格式颜色（echarts）
function getEchartsColor(color: any) {
  if (typeof color === "object" && !color.colorStops) {
    return getEchartsColorFromCssLinearColor(color);
  }
  return color;
}

/**
 * @description: 计算canvas渐变起始坐标
 * @param {number} canvas width
 * @param {number} canvas height
 * @param {number} angle 角度
 * @return {*}
 */
function calculateGradientCoordinate(width: number, height: number, angle = 180) {
  // console.log(angle,'angle===========');
  if (angle >= 360) angle = angle - 360;
  if (angle < 0) angle = angle + 360;
  angle = Math.round(angle);

  // 当渐变轴垂直于矩形水平边上的两种结果
  if (angle === 0) {
    return {
      x0: Math.round(width / 2) / width,
      y0: 1,
      x1: Math.round(width / 2) / width,
      y1: 0
    };
  }
  if (angle === 180) {
    return {
      x0: Math.round(width / 2) / width,
      y0: 0,
      x1: Math.round(width / 2) / width,
      y1: 1
    };
  }

  // 当渐变轴垂直于矩形垂直边上的两种结果
  if (angle === 90) {
    return {
      x0: 0,
      y0: Math.round(height / 2) / height,
      x1: 1,
      y1: Math.round(height / 2) / height
    };
  }
  if (angle === 270) {
    return {
      x0: 1,
      y0: Math.round(height / 2) / height,
      x1: 0,
      y1: Math.round(height / 2) / height
    };
  }

  // 从矩形左下角至右上角的对角线的角度
  const alpha = Math.round((Math.asin(width / Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2))) * 180) / Math.PI);

  // 当渐变轴分别于矩形的两条对角线重合情况下的四种结果
  if (angle === alpha) {
    return {
      x0: 0,
      y0: 1,
      x1: 1,
      y1: 0
    };
  }
  if (angle === 180 - alpha) {
    return {
      x0: 0,
      y0: 0,
      x1: 1,
      y1: 1
    };
  }
  if (angle === 180 + alpha) {
    return {
      x0: 1,
      y0: 0,
      x1: 0,
      y1: 1
    };
  }
  if (angle === 360 - alpha) {
    return {
      x0: 1,
      y0: 1,
      x1: 0,
      y1: 0
    };
  }

  // 以矩形的中点为坐标原点，向上为Y轴正方向，向右为X轴正方向建立直角坐标系
  let x0 = 0,
    y0 = 0,
    x1 = 0,
    y1 = 0;

  // 当渐变轴与矩形的交点落在水平线上
  if (
    angle < alpha || // 处于第一象限
    (angle > 180 - alpha && angle < 180) || // 处于第二象限
    (angle > 180 && angle < 180 + alpha) || // 处于第三象限
    angle > 360 - alpha // 处于第四象限
  ) {
    // 将角度乘以（PI/180）即可转换为弧度
    const radian = (angle * Math.PI) / 180;
    // 当在第一或第四象限，y是height / 2，否则y是-height / 2
    const y = angle < alpha || angle > 360 - alpha ? height / 2 : -height / 2;
    const x = Math.tan(radian) * y;
    // 当在第一或第二象限，l是width / 2 - x，否则l是-width / 2 - x
    const l = angle < alpha || (angle > 180 - alpha && angle < 180) ? width / 2 - x : -width / 2 - x;
    const n = Math.pow(Math.sin(radian), 2) * l;
    x1 = x + n;
    y1 = y + n / Math.tan(radian);
    x0 = -x1;
    y0 = -y1;
  }

  // 当渐变轴与矩形的交点落在垂直线上
  if (
    (angle > alpha && angle < 90) || // 处于第一象限
    (angle > 90 && angle < 90 + alpha) || // 处于第二象限
    (angle > 180 + alpha && angle < 270) || // 处于第三象限
    (angle > 270 && angle < 360 - alpha) // 处于第四象限
  ) {
    // 将角度乘以（PI/180）即可转换为弧度
    const radian = ((90 - angle) * Math.PI) / 180;
    // 当在第一或第二象限，x是width / 2，否则x是-width / 2
    const x = (angle > alpha && angle < 90) || (angle > 90 && angle < 90 + alpha) ? width / 2 : -width / 2;
    const y = Math.tan(radian) * x;
    // 当在第一或第四象限，l是height / 2 - y，否则l是-height / 2 - y
    const l = (angle > alpha && angle < 90) || (angle > 270 && angle < 360 - alpha) ? height / 2 - y : -height / 2 - y;
    const n = Math.pow(Math.sin(radian), 2) * l;
    x1 = x + n / Math.tan(radian);
    y1 = y + n;
    x0 = -x1;
    y0 = -y1;
  }

  // 坐标系更改为canvas标准，Y轴向下为正方向
  x0 = Math.round((x0 + width / 2) / width);
  y0 = Math.round((height / 2 - y0) / height);
  x1 = Math.round((x1 + width / 2) / width);
  y1 = Math.round((height / 2 - y1) / height);

  return { x0, y0, x1, y1 };
}

// 渐变路径 默认从左到右渐变颜色
function setLinearColor(res = { xy: [0, 0, 1, 0], colors: { 0: "#6a25f0", 1: "#1086f4" } }) {
  if (!res.xy) res.xy = [0, 0, 1, 0];
  const colorStops: any[] = [];
  const keys = Object.keys(res.colors);
  keys.forEach((item) => {
    // @ts-ignore
    colorStops.push({ offset: item, color: res.colors[item] });
  });
  return {
    type: "linear",
    x: res.xy[0],
    y: res.xy[1],
    x2: res.xy[2],
    y2: res.xy[3],
    colorStops
  };
}

// 将css线性渐变色转为echarts使用的线性渐变色
function getEchartsColorFromCssLinearColor(color: any) {
  const colorList = color.colors;
  const width = 100;
  const height = 100;
  const canvasDeg = calculateGradientCoordinate(width, height, color.angle);
  const colors: Record<any, any> = {};
  colorList.forEach((item: any) => {
    const per = item.per / 100;
    // 已存在该值则将后来的值作为最终值 确保返回的对象至少存在两个key
    if (colors[per]) {
      if (per === 0) colors[per + 0.001] = item.color;
      else {
        colors[per - 0.001] = colors[per];
        colors[per] = item.color;
      }
    } else colors[per] = item.color;
  });
  return setLinearColor({
    xy: [canvasDeg.x0, canvasDeg.y0, canvasDeg.x1, canvasDeg.y1],
    // @ts-ignore
    colors: colors
  });
}
// 根据字段与值返回符合条件的第一个对象及其索引
function getObjectAndIndexFromArrayByField(array: any, field: any, value: any) {
  for (let index = 0; index < array.length; index++) {
    const obj = array[index];
    if (obj[field] == value) return { obj, index };
  }
  return undefined;
}

export { getEchartsColor, getObjectAndIndexFromArrayByField, getPointByProj4 };
