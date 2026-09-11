import type { AllComponentType } from "@screenwright/types";
import { cloneDeep, includes, map, min, orderBy, take } from "lodash-es";

const renderComponent = (name: AllComponentType) => {
  return name;
};
function getMaxIndex(arr: any) {
  const newArr = arr.map((res: any) => Number(res));
  const maxVal = Math.max(...newArr);
  return newArr.indexOf(maxVal);
}
function getMinIndex(arr: any) {
  let min = arr[0];
  let index = 0;
  for (let i = 0; i < arr.length; i += 1) {
    if (min > arr[i]) {
      min = arr[i];
      index = i;
    }
  }
  return index;
}
function calculateGradientCoordinate(width: number, height: number, angle = 180) {
  // console.log(angle,'angle===========');
  if (angle >= 360) {
    angle = angle - 360;
  }
  if (angle < 0) {
    angle = angle + 360;
  }
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
function setLinearColor(
  res: { xy?: number[]; colors: Record<string, string> } = {
    xy: [0, 0, 1, 0],
    colors: { "0": "#6a25f0", "1": "#1086f4" }
  }
) {
  if (!res.xy) {
    res.xy = [0, 0, 1, 0];
  }
  const colorStops: { offset: string; color: string }[] = [];
  const keys = Object.keys(res.colors);
  keys.forEach((item) => {
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
function getEchartsColorFromCssLinearColor(color: any) {
  if (!color.colors) {
    return color;
  }
  const colorList = color.colors;
  const width = 100;
  const height = 100;
  const canvasDeg = calculateGradientCoordinate(width, height, color.angle);
  const colors: { [key: string]: string } = {};
  colorList.forEach((item: any) => {
    const per = item.per / 100;
    // 已存在该值则将后来的值作为最终值 确保返回的对象至少存在两个key
    if (colors[per]) {
      if (per === 0) {
        colors[per + 0.001] = item.color;
      } else {
        colors[per - 0.001] = colors[per];
        colors[per] = item.color;
      }
    } else {
      colors[per] = item.color;
    }
  });
  return setLinearColor({
    xy: [canvasDeg.x0, canvasDeg.y0, canvasDeg.x1, canvasDeg.y1],
    colors: colors
  });
}
/**
 * 输入text 限制每行显示多少字
 * @param {String} data 文字内容
 * @param {Number} num 限制一行显示多少字
 * @returns
 */
function limitTextInLine(data: string, num: number): string {
  if (!num) {
    return data;
  }

  const lineLength = num; // 每行显示字数
  const totalLength = data.length;
  let result = "";

  if (totalLength > lineLength) {
    for (let i = 0; i < Math.ceil(totalLength / lineLength); i++) {
      const start = i * lineLength;
      const end = Math.min(start + lineLength, totalLength);
      result += data.substring(start, end) + (i < Math.ceil(totalLength / lineLength) - 1 ? "\n" : "");
    }
  } else {
    result = data;
  }

  return result;
}

/**
 * 获取top前3的颜色并标黄
 * @param Array 图表数组
 * @param Object 默认颜色
 * @param Object 标注特殊颜色---单一
 * @param Boolean 是否排序 排序则显示前三 三种颜色
 */
function getMaxColorListByData(data: any[], commonColor: any, hoverColor: any, isSort: boolean) {
  const top3Res = getTop3Index(data, "value");
  const top3Names = map(top3Res, "name");
  const getTop3LinearColor = getColorListByData(top3Res, "horizontal");

  return map(data, (item: { name: any }, index: number) => {
    return includes(top3Names, item.name) ? (isSort ? getTop3LinearColor[index] : hoverColor) : commonColor;
  });
}

// 获取数组排行前三的索引
function getTop3Index(arr: any, val: string) {
  const data = cloneDeep(arr);
  const arrSort = orderBy(data, [val], ["desc"]);
  return take(arrSort, 3);
}

function getColorListByData(data: any[], direction: string) {
  const colorMap = [
    {
      colors: {
        0: "rgb(255,118,57)",
        0.44: "rgb(255,104,60)",
        1: "rgba(255,85,62,0)"
      }
    },
    {
      colors: {
        0: "rgb(255,178,67)",
        0.36: "rgb(255,196,71)",
        1: "rgba(255,228,77,0)"
      }
    },
    {
      colors: {
        0: "rgb(255,222,120)",
        0.35: "rgb(255,200,100)",
        1: "rgba(255,157,62,0)"
      }
    },
    {
      colors: {
        0: "rgb(0,255,241)",
        0.37: "rgb(23,203,246)",
        1: "rgba(62,112,255,0)"
      }
    }
  ];

  let xy: number[] = [];
  if (direction === "horizontal" || direction === "h") {
    xy = [0, 0, 0, 1];
  } else if (direction === "vertical" || direction === "v") {
    xy = [1, 0, 0, 0];
  }

  return map(data, (item, index) => {
    const colorConfig = colorMap[index] || colorMap[3]; // 默认使用最后一个颜色配置
    // 过滤掉 undefined 的键值对
    const filteredColors = Object.fromEntries(
      Object.entries(colorConfig.colors).filter(([_, value]) => value !== undefined)
    );
    return setLinearColor({
      xy,
      colors: filteredColors as Record<string, string>
    });
  });
}

/**
 * 根据颜色获取通用tooltip
 * case 'green':
      tooltipColor = 'rgb(86,219,158)';
 */
function getTooltipByColor(color: any, newUnit: string, tooltipFixed: number) {
  const unit = newUnit || "";
  const fixedNum = tooltipFixed || "";
  return {
    trigger: "axis",
    confine: true,
    position: (point: number[]) => {
      // 固定在顶部
      return [point[0] - 1, point[1] - 60];
    },
    axisPointer: {
      label: {
        show: true,
        formatter: () => {
          return "▲";
        },
        margin: -20,
        backgroundColor: "transparent",
        fontSize: 20
      },
      lineStyle: {
        color: "#ffffff",
        width: 1,
        shadowColor: "rgba(22, 156, 241, 1)",
        shadowBlur: 2
      }
    },
    extraCssText: `box-shadow :inset 0 0 23px ${color};color:#fff;padding:5px 28px 0px 28px;border-radius:0;line-height:30px;`,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderWidth: 0,
    formatter: (params: { value: string }[]) => {
      let str = "";
      str += `<p style="color:#fff;font-size:16px;text-align:center;"><span style="font-family:'Source Han Sans CN-Normal, Source Han Sans CN';font-size:28px;">${
        fixedNum ? Number(params[0].value).toFixed(fixedNum) : parseFloat(params[0].value)
      } ${unit}</span></p>`;
      return str;
    }
  };
}

// 降序
// 定义数据项的类型
interface DataItem {
  [key: string]: any;
}

function descSort(data: DataItem[], val: string | number, type?: string) {
  return data.sort((a: DataItem, b: DataItem) => {
    let aVal: number, bVal: number;

    if (type === "time") {
      aVal = new Date(a[val]).getTime();
      bVal = new Date(b[val]).getTime();
    } else {
      aVal = typeof a[val] === "number" ? a[val] : parseFloat(a[val]);
      bVal = typeof b[val] === "number" ? b[val] : parseFloat(b[val]);
    }

    return bVal - aVal;
  });
}

function getTop3Label(object: {
  nameFontFamily: any;
  nameFontSize: any;
  nameColor: any;
  nameFontStyle: any;
  nameFontWeight: any;
  nameWidth: any;
  nameLeftPadding: any;
}) {
  const { nameFontFamily, nameFontSize, nameColor, nameFontStyle, nameFontWeight, nameWidth, nameLeftPadding } = object;
  return {
    show: true,
    formatter: (item: { dataIndex: number; name: any }) => {
      if (item.dataIndex > 2) {
        return `{pad|}{other|${item.dataIndex + 1}}    {otherLabel|${item.name}}{line|}`;
      }
      return `{pad|}{${item.dataIndex + 1}|${item.dataIndex + 1}}    {label${item.dataIndex + 1}|${item.name}}{line|}`;
    },
    position: "left",
    offset: [-60, 0],
    fontSize: 15,
    align: "center",
    margin: 0,
    lineHeight: 27,
    rich: {
      pad: {
        padding: [0, 0, 0, nameLeftPadding]
      },
      1: {
        fontFamily: "AlibabaPuHuiTiM",
        fontSize: 17,
        backgroundColor: "rgb(183,87,71)",
        color: "#fff",
        width: 27,
        height: 27,
        borderRadius: [27, 27, 27, 27],
        borderWidth: 1,
        borderColor: "rgb(255,118,57)",
        shadowColor: "rgb(255,118,57)",
        shadowBlur: 4
      },
      2: {
        fontFamily: "AlibabaPuHuiTiM",
        fontSize: 17,
        backgroundColor: "rgb(173,131,2)",
        color: "#fff",
        width: 27,
        height: 27,
        borderRadius: [27, 27, 27, 27],
        borderWidth: 1,
        borderColor: "rgb(255,178,67)",
        shadowColor: "rgb(255,178,67)",
        shadowBlur: 4
      },
      3: {
        fontFamily: "AlibabaPuHuiTiM",
        fontSize: 17,
        backgroundColor: "rgb(203,164,43)",
        color: "#fff",
        width: 27,
        height: 27,
        borderRadius: [27, 27, 27, 27],
        borderWidth: 1,
        borderColor: "rgb(255,222,120)",
        shadowColor: "rgb(255,222,120)",
        shadowBlur: 4
      },
      other: {
        fontFamily: "AlibabaPuHuiTiM",
        fontSize: 17,
        backgroundColor: "#000",
        color: "#fff",
        width: 27,
        height: 27,
        borderRadius: [27, 27, 27, 27],
        borderWidth: 1,
        borderColor: "rgb(62,112,255)",
        shadowColor: "rgb(62,112,255)",
        shadowBlur: 4
      },
      otherLabel: {
        fontFamily: nameFontFamily,
        width: nameWidth,
        height: 40,
        fontSize: nameFontSize,
        color: nameColor,
        fontStyle: nameFontStyle,
        fontWeight: nameFontWeight,
        backgroundColor: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGkAAAAkCAYAAACKRBSIAAACDUlEQVRoge2bO24UQRCGv1kPtnn5hQmQiCAhQGQcAF/Bl/FGlqO1D+CAQzhFIuYOnAAiwMY8vev1tlXrv83IWkgGD1NDfVJrpe5ZzUx96poOqgq20itgCTjlgnngI7AJjOk4aVDv/Yp+vf/n+xd9SuAAWAdGFRfHtrAKrF2RhOZ+AL16j9Fu6ga5Lrr/BLglQfcrkubskrIiJ5Mk5oEklZ2y0k7GktRT/I1C86MsIM149LHGrLXg73L2p09LlmTb7QZwU3MjmQyaw+J9B7graT81LiWZnLcaduF3mQ1RzZBT22vgNvANeAY8Bo5KXbACvAF2gXvKjUtdPzS0iJ7OBnuW1dKAT0WfHeA58K6a7hZlcfV/j9g/wjbLMhcnPjuwLchL7BQPhCQHhCQHhCQHhCQHhCQHhCQHhCQHhCQHhCQHhCQHhCQHhCQHhCQHhCQHhCQHhCQHhCQHhCQHZEn2e6J6u0Pgc1SuNk5S3A/TYFoUeaJa8GlxpC0eAS+AhyqO/Arsq5I1dtv1M1GjxLZVsBb9aXHkE+ADlQpWs/YIeKo5a315CQw7HJg2kRT3DXVWjNUsYeNSUk53Q9WEf4l01zhJca92ukyzWJZUzKj7LpUTo/WlGX4b51I7p0qhHPleVf1RtH/9JDVNTK7E2/zMlzo0nM1ox8zznaZF7Zj2ubG4G7/aMeH4HIe6bVU6ceL2AAAAAElFTkSuQmCC"
        }
      },
      label1: {
        fontFamily: nameFontFamily,
        width: nameWidth,
        height: 40,
        fontSize: nameFontSize,
        color: nameColor,
        fontStyle: nameFontStyle,
        fontWeight: nameFontWeight,
        backgroundColor: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGkAAAAkCAYAAACKRBSIAAACEUlEQVRoge2bvW7UUBBGjxcTCD8JgaRAooKGAtFR4A5egXfBJaJjH4AiD5E2EjXSPgJPABWQEP5CNps1Gue7wYoWGhPjMXOkq5Wuvbr2fDrjU8xk1cv1V8AK8JMjloCPwAYwY+iMJ+1esCza/T+tXxY58AK4DkwbLnbswhpw9YQkNLcLjNo9Rc9pG+S2HK0/By5I0I2GpDNAljfkJCqJuSlJ+cC09JGZJI0UfyPT/DQJqBY8+Exj0bXg73Lwp09LkmTb7SxwXnNTmQy6w+J9CbgsaXsax5JMzlsNu/G7zIaobkip7TVwEfgG3AfuANu5brgCvAGeANeUG1cGf2joDyOdDZ7WWW08+URZPAYeAO+a6e6cLK797xH7R9hmWa2XLgs7sC3LS+wUD4QkB4QkB4QkB4QkB4QkB4QkB4QkB4QkB4QkB4QkB4QkB4QkB4QkB4QkB4QkB4QkB4QkB4QkB4QkB4QkByRJ9vtD9XZbwOeoXO2cSnHfYjzZkw+rBa+LI+3iNvAQuKXiyK/AM1Wyxm47feZqlNisK1jLwooj7wIfaFSwmrXbwD3NWevLc2B/wIHpE5Xi/kidFTM1S9g4lpTS3b5qwr9EuuucSnFvdrrUWSxJyhbUfefKidH60g2/jXOundMkU458r6r+KNo/fSo1TcxPxNv8LOU6NBwsaMdM88OmP+2Y9rmxuBu/2jFh5xDSw29JUJbtCAAAAABJRU5ErkJggg=="
        }
      },
      label2: {
        fontFamily: nameFontFamily,
        width: nameWidth,
        height: 40,
        fontSize: nameFontSize,
        color: nameColor,
        fontStyle: nameFontStyle,
        fontWeight: nameFontWeight,
        backgroundColor: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGkAAAAkCAYAAACKRBSIAAACEUlEQVRoge2bu27UUBCGPy8m4ZoQLgUSFTQUiI4HgLjdKg8U0cEDUPAQNFhCQtqOd+AJoAISwiUhy2YdjfOfYEULjYnxmPmko5WOvTr2fDrjU8xk1cv1V8AK8JMjloCPwAYwY+iMJ+1esCza/T+tXxY58AK4DkwbLnbswhpw9YQkNLcLjNo9Rc9pG+S2HK0/By5I0I2GpDNAljfkJCqJuSlJ+cC09JGZJI0UfyPT/DQJqBY8+Exj0bXg73Lwp09LkmTb7SxwXnNTmQy6w+J9CbgsaXsax5JMzlsNu/G7zIaobkip7TVwEfgL3gNvATq4b1oBXwBZwVblxZfCHhv4w0tngSZ3VxpOPlMVj4D7wtpnuzsni+v8esX+EbZbVeumysAPbWXmJneKBkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAJMl+v6vebhv4FJWrnVMp7tuMJ/vyYbXgdXGkXdwBHgA3VRz5BXiqStbYbafPXI0Sj+oK1rKw4sg7wHsaFaxm7RZwV3PW+vIMOBhwYPpEpbhvqLNipmYJG8eSUro7UE3450h3nVMp7s1OlzqLJUnZgrrvXDkxWl+64bdxzrVzmmTKke9U1R9F+6dPpaaJ+Yl4m5/lXIeGwwXtmGl+2PSnHdM+NxZ341c7Juz+BI+rcM0bcHO4AAAAAElFTkSuQmCC"
        }
      },
      label3: {
        fontFamily: nameFontFamily,
        width: nameWidth,
        height: 40,
        fontSize: nameFontSize,
        color: nameColor,
        fontStyle: nameFontStyle,
        fontWeight: nameFontWeight,
        backgroundColor: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGkAAAAkCAYAAACKRBSIAAACEElEQVRoge2bu27UUBCGP29MuOfCpUCiWWgoEB0PQF6Bl4krRLXhASh4CFokat6BEjdQAQnhkpBls0bj/CdY0UJjYjxmPulopWOvjj2fzvgUM1n1ZvMFsAL84Ihl4APwEJgxdMaTdi9YFu3+n9Yvixx4DlwDpg0Xu3ZhHbhyQhKa2wNG7Z6i57QNcluO1p8DFyToekPSEpDlDTmJSmJuSFI+MC19ZCZJI8XfyDQ/TQKqBQ8+01h0Lfi7HP7p05Ik2XY7A5zX3FQmg+6weF8CLkvavsaxJJPzWsNu/CazIaobUmp7CVwEvgL3gNvATq4b1oBXwBZwVblxZfCHhv4w0tngSZ3VxpOPlMVj4D7wtpnuzsni+v8esX+EbZbVeumysAPbWXmJneKBkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAkOSAJMl+v6vebhv4FJWrnVMp7tuMJ/vyYbXgdXGkXdwBHgA3VRz5BXiqStbYbafPXI0Sj+oK1rKw4sg7wHsaFaxm7RZwV3PW+vIMOBhwYPpEpbhvqLNipmYJG8eSUro7UE3450h3nVMp7s1OlzqLJUnZgrrvXDkxWl+64bdxzrVzmmTKke9U1R9F+6dPpaaJ+Yl4m5/lXIeGwwXtmGl+2PSnHdM+NxZ341c7Juz+BI+rcM0bcHO4AAAAAElFTkSuQmCC"
        }
      },
      line: {
        width: 340,
        height: 40,
        backgroundColor: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPoAAAAlCAYAAABrhPTHAAABt0lEQVR4nO3VQUsbURSG4XcaF26K6MJCF1246EJwVYIg/jD9Bf6xbooVaQRBKLorFEUXBm1s9ZaxhzCIGZMpbnLeZzPfDGFy52S+m4qd0gcGQH0cmc3m+ctVKQVJ8+2Nv680/yy6lIBFlxKw6FICFl1KwKJLCVh0KQGLLiVg0aUELLqUgEWXErDoUgIWXUrAoksJWHQpAYsuJWDRpQQsupSARZcSsOhSAhZdSsCiSwlYdCkBiy4lYNGlBCy6lIBFlxKw6FICFl1KwKJLCVh0KQGLLiVg0aUEKnZKHxgA9XHUIX8DNoA74KRjvgG+Ax+B38DZjPkU+AD8AX50zL+An8A74B646JBXYg7XwBLwMGO+i1ksAiXmO2vulb3H55LGFsoe+3HyuXF9nKtdvtQvT7yEB/FCNXNdtOOW3IsCnsaLPynfR+mey+ePm9K/86u41swlitqWX7IQ37EYa3ya38a9L4HleL6neTVyXdb3z+RbYK2xKU7K6y35Ieb6qbExN3O/2m3dsI+A7ZjL1wl5/4WNv57nYct9NmMGbX8gWzGT11pDnYfxmddawzTz/N81TDPP9jXA8C8h0aSau5YUFQAAAABJRU5ErkJggg=="
        }
      }
    }
  };
}

function getMinVal(res: any, val: string) {
  const values = map(res, val);
  return min(values);
}

export const uuid = (len = 36): string => {
  const s: string[] = [];
  const hexDigits = "0123456789abcdefghijklmnopqrstuvwxyzGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < len; i++) {
    s[i] = hexDigits.charAt(Math.floor(Math.random() * 0x36));
  }
  if (len > 8) {
    s[14] = "4";
    s[19] = hexDigits.charAt((parseInt(s[19], 36) & 0x3) | 0x8);
    s[8] = s[13] = s[18] = s[23] = "-";
  }
  const uuid = s.join("");
  return uuid;
};

export {
  calculateGradientCoordinate,
  descSort,
  getColorListByData,
  getEchartsColorFromCssLinearColor,
  getMaxColorListByData,
  getMaxIndex,
  getMinIndex,
  getMinVal,
  getTooltipByColor,
  getTop3Index,
  getTop3Label,
  limitTextInLine,
  renderComponent,
  setLinearColor
};
