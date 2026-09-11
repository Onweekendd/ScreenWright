import { getEchartsColorFromCssLinearColor, getMaxIndex, getMinIndex, limitTextInLine } from "../../utils";
import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { projectEchartType } from "../type";

class Echartzebra2 extends BaseChart {
  option: Record<string, any> = {};
  dataLength = 0;
  legendGridTop = 0;
  legendGridLeft = 0;
  legendGridRight = 0;
  legendGridBottom = 0;
  seriesColor: any[] = [];
  seriesOpacity: any[] = [];
  extremeData: number[] = [];
  extremeShow: boolean[] = [];
  extremeType: string[] = [];
  extremeColor: string[] = [];
  extremeOpacity: any[] = [];
  tooltipUnit: any[] = [];
  tooltipMarkerColor: any[] = [];
  markLineSymbolStart: any[] = [];
  markLineSymbolStartImage: any[] = [];
  markLineSymbolEnd: any[] = [];
  markLineSymbolEndImage: any[] = [];
  markLineSymbolWidth: any[] = [];
  markLineSymbolHeight: any[] = [];
  markLineLabelShow: any[] = [];
  markLineLabelPosition: any[] = [];
  markLineLabelDistance: any[] = [];
  markLineLabelCustom: any[] = [];
  markLineLabelFontFamily: any[] = [];
  markLineLabelFontStyle: any[] = [];
  markLineLabelFontSize: any[] = [];
  markLineLabelColor: any[] = [];
  markLineLabelFontWeight: any[] = [];
  markLineLabelPaddingTop: any[] = [];
  markLineLabelPaddingRight: any[] = [];
  markLineLabelPaddingBottom: any[] = [];
  markLineLabelPaddingLeft: any[] = [];
  markLineLineColor: any[] = [];
  markLineLineWidth: any[] = [];
  markLineLineType: any[] = [];
  markLineShow: any[] = [];
  markLineDataType: any[] = [];
  seriesFieldList: string[] = [];
  constructor() {
    const defaultChartProps = {
      name: "斑马柱状图2",
      prop: projectEchartType.echartzebra2,
      img: "/img/zebra2.f1d2ff44.png",
      groupName: "项目"
    };
    super(defaultChartProps);

    this.seriesFieldList = [
      "seriesColor",
      "seriesOpacity",
      "extremeShow",
      "extremeType",
      "extremeColor",
      "extremeOpacity",
      "markLineSymbolStart",
      "markLineSymbolStartImage",
      "markLineSymbolEnd",
      "markLineSymbolEndImage",
      "markLineSymbolWidth",
      "markLineSymbolHeight",
      "markLineLabelShow",
      "markLineLabelPosition",
      "markLineLabelDistance",
      "markLineLabelCustom",
      "markLineLabelFontFamily",
      "markLineLabelFontStyle",
      "markLineLabelFontSize",
      "markLineLabelColor",
      "markLineLabelFontWeight",
      "markLineLabelPaddingTop",
      "markLineLabelPaddingRight",
      "markLineLabelPaddingBottom",
      "markLineLabelPaddingLeft",
      "markLineLineColor",
      "markLineLineWidth",
      "markLineLineType",
      "markLineShow",
      "markLineDataType"
    ];
  }

  getOptions() {
    return this.options;
  }
  getData(item: { list: any[] }, index: number) {
    const res = this.validData(this.extremeShow[index], false)
      ? item.list.map((item: any, idx: number) => {
          if (this.extremeData[index] === idx) {
            return Object.assign(item, {
              itemStyle: {
                color: getEchartsColorFromCssLinearColor(this.extremeColor[index]),
                opacity: this.extremeOpacity[index] / 100 || 0
              }
            });
          }
          return item;
        })
      : item.list;
    return res;
  }

  gradient = (startColor: string, endColor: string, step: number) => {
    // 将 hex 转换为rgb
    const sColor: number[] = startColor.indexOf("#") === -1 ? this.rgbaToRgb(startColor) : this.hexToRgb(startColor),
      eColor = endColor.indexOf("#") === -1 ? this.rgbaToRgb(endColor) : this.hexToRgb(endColor);
    // 计算R\G\B每一步的差值
    const rStep = (eColor[0] - sColor[0]) / step;
    const gStep = (eColor[1] - sColor[1]) / step;
    const bStep = (eColor[2] - sColor[2]) / step;

    const gradientColorArr = [];
    for (let i = 0; i < step; i++) {
      // 计算每一步的hex值
      gradientColorArr.push(
        this.rgbToHex(
          parseInt((rStep * i + sColor[0]).toString()),
          parseInt((gStep * i + sColor[1]).toString()),
          parseInt((bStep * i + sColor[2]).toString())
        )
      );
    }
    return gradientColorArr;
  };
  getRgbaOpacity = (startColor: string, endColor: string, step: number) => {
    const opArr = [];
    const startColorOp = Number(startColor?.split(",")?.[startColor?.split(",")?.length - 1].replace(")", "")) || 1;
    const endColorOp = Number(endColor?.split(",")?.[endColor?.split(",")?.length - 1].replace(")", "")) || 1;
    // 显=>隐
    if (startColorOp > endColorOp) {
      for (let i = 0; i < step; i++) {
        opArr.push((i / step) * startColorOp);
      }
      // 防止1-0时最后那个完全不显示
      if (opArr[0] === 0) {
        opArr[0] = opArr[1] * 0.5;
      }
      opArr.reverse();
    } else {
      // 隐=>显
      for (let i = 0; i < step; i++) {
        opArr.push((i / step) * endColorOp);
      }
      if (opArr[0] === 0) {
        opArr[0] = opArr[1] * 0.5;
      }
    }
    return opArr;
  };
  rgbToHex = (r: number, g: number, b: number) => {
    const hex = ((r << 16) | (g << 8) | b).toString(16);
    return "#" + new Array(Math.abs(hex.length - 7)).join("0") + hex;
  };
  rgbaToRgb = (rgba: string) => {
    return rgba
      .substring(5, rgba.length - 3)
      .split(",")
      .map((it: any) => Number(it));
  };
  hexToRgb = (hex: string) => {
    const rgb = [];
    for (let i = 1; i < 7; i += 2) {
      rgb.push(parseInt("0x" + hex.slice(i, i + 2)));
    }
    return rgb;
  };

  getRenderItems({ params, api, index: seriesIndex, seriesLength, nameLength }: any) {
    const coordSys = params.coordSys;

    const BarWidthItem = coordSys.width / nameLength;
    const BarWidth = this.option.barWidth;
    const barItemInterval = this.option.barCategoryGap;
    const randerBarWidthItem = BarWidth * seriesLength + barItemInterval * (seriesLength - 1);

    const itemHeight = this.option.barBlockItemHeight;
    const itemInterval = this.option.barBlockItemInterval;

    const startColor = this.seriesColor?.[seriesIndex]?.colorStops?.[0]?.color || "#ffffff";
    const endColor = this.seriesColor?.[seriesIndex]?.colorStops?.[1]?.color || "#ffffff";

    const value = api.value(1);
    const value2Height = api.size([0, value])[1];

    const BarHeightItem = value2Height + itemInterval / 2;
    const MaxHeight = coordSys.y + (coordSys.height - value2Height) + BarHeightItem;
    const itemNum = Math.round(BarHeightItem / itemHeight);
    const totalItemNum = Math.round((coordSys.height + itemInterval / 2) / itemHeight);

    const colorArr = this.gradient(startColor, endColor, totalItemNum);
    const colorOpacityArr = this.getRgbaOpacity(startColor, endColor, totalItemNum);

    const children = [];
    for (let itemCount = 0; itemCount < totalItemNum; itemCount++) {
      const hasValue = itemCount < itemNum;
      children.push({
        type: "rect",
        shape: {
          x:
            coordSys.x +
            BarWidthItem / 2 -
            randerBarWidthItem / 2 +
            params.dataIndexInside * BarWidthItem +
            seriesIndex * (BarWidth + barItemInterval),
          y: MaxHeight - itemHeight * itemCount,
          width: BarWidth,
          height: -(itemHeight - itemInterval),
          r: new Array(4).fill(this.option.barBlockItemRadio)
        },
        style: {
          ...api.style(),
          fill: hasValue ? colorArr[itemCount] : "rgba(21,154,255,0.4)",
          opacity: hasValue ? colorOpacityArr[itemCount] + 0.2 : 0.4
        }
      });
    }
    return {
      type: "group",
      children
    };
  }

  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    let optionsData = await this.transformOptionsData(baseChartProps.data);
    const { axisName: xAxisName, optionData } = this.getEchartsAxisNameAndSeriesData(optionsData);
    optionsData = optionData;
    this.dataLength = xAxisName.length;
    optionsData = this.transformAxisData(optionsData, baseChartProps.yAxisType);
    const seriesName = optionsData.map((item) => item.name);
    // 若数据中存在markLineData字段（数据标线）则系列数据中额外添加markLineData字段
    // 暂时只用于和光同程项目，不对外暴露
    if (baseChartProps.data[0]?.markLineData) {
      const seriesDataList = optionsData.map((item) => {
        return baseChartProps.data.find((data: any) => data.seriesName === item.name);
      });
      optionsData = optionsData.map((items) => {
        return {
          name: items.name,
          list: items.list,
          markLineData: seriesDataList.find((seriesData) => seriesData.seriesName === items.name)?.markLineData
        };
      });
    }
    this.extremeShow = this.extremeShow.map(() => {
      return false;
    });
    this.seriesFieldList.forEach((field) => {
      if (this.option[field]) (this[field as keyof Echartzebra2] as any) = [];
    });
    // 提示框每个系列的后缀
    this.option.dataUnitName.forEach((item: any, index: number) => {
      const idx = seriesName.indexOf(item);
      if (idx !== -1) {
        this.tooltipUnit[idx] = this.option.unitTabsName?.[index]?.value || "";
      }
    });

    // 循环配置项系列中的字段名
    this.option.dataSeriesName.forEach((item: any, index: number) => {
      // 获取当前字段名在数据中的位置
      const idx = seriesName.indexOf(item);
      if (!this.option.seriesTabsName[index]?.value) return;
      if (idx !== -1) {
        // 数据中的字段名更改为映射后的显示名
        seriesName[idx] = this.option.seriesTabsName[index].value;
        // 将对应的属性都赋值过去
        this.seriesFieldList.forEach((field) => {
          if (this.option[field]) this[field as keyof Echartzebra2][idx] = this.option[field][index];
        });
        // 是否高亮最大/小值
        if (this.validData(this.extremeShow[idx], false)) {
          if (this.extremeType[idx] === "max") {
            this.extremeData[idx] = getMaxIndex(optionData[idx].list.map((item: { value: any }) => item.value));
          } else {
            this.extremeData[idx] = getMinIndex(optionData[idx].list.map((item: { value: any }) => item.value));
          }
        }
      } else {
        this.option.extremeShow[index] = false;
      }
    });
    // css线性渐变色转为echarts线性渐变色
    this.seriesColor = this.seriesColor.map((item) => {
      if (typeof item === "object" && !item.colorStops) {
        return getEchartsColorFromCssLinearColor(item);
      }
      return item;
    });
    // 每个系列的颜色赋给提示框的markercolor，渐变色则取后面的颜色
    this.seriesColor.forEach((item, index) => {
      this.tooltipMarkerColor[index] = typeof item === "object" ? item.colorStops[1].color : item;
    });

    const options = {
      title: this.createTitle(this.option),

      // 悬浮提示框
      tooltip: this.createTooltip(this.option, this.tooltipUnit, this.screenScale, this.tooltipMarkerColor),
      grid: this.createGrid(this.option),
      legend: this.createLegend(this.option),
      xAxis: {
        show: this.validData(this.option.xAxisShow, true),
        type: this.option.xAxisType || "category",
        // type: 'category',
        // name: this.option.xAxisName,
        axisLine: {
          show: this.validData(this.option.xAxisLineShow, true),
          lineStyle: {
            color: this.option.xAxisLineColor || "#333",
            width: this.option.xAxisLineWidth || 0
            // opacity: this.option.xAxisLineOpacity || 0.5
          }
        },
        data: xAxisName || [],
        inverse: this.validData(this.option.xAxisInverse, false),
        splitLine: {
          show: this.validData(this.option.xAxisSplitLineShow, false),
          interval: this.option.xAxisSplitLineInterval || 0,
          lineStyle: {
            type: this.option.xAxisSplitLineType,
            width: this.option.xAxisSplitLineWidth || 0,
            color: this.option.xAxisSplitLineColor || "#333"
          }
        },
        axisLabel: {
          show: this.validData(this.option.xAxisLabelShow, true),
          interval: (() => {
            const value = this.option.xAxisInterval || 0;
            if (value === 0) return "auto";
            if (value < 0) return 0;
            return value;
          })(),
          rotate: this.option.xAxisRotate || 0,
          margin: this.option.xAxisMargin || 0,
          color: this.option.xAxisColor || "#333",
          fontSize: this.option.xAxisFontSize || 0,
          fontStyle: this.option.xAxisFontStyle || "normal",
          fontWeight: this.option.xAxisFontWeight || "normal",
          fontFamily: this.option.xAxisFontFamily || "Arial",
          formatter:
            this.option.xAxisType === "time"
              ? this.option.xAxisTimeType
              : (label: string) => {
                  return this.validData(this.option.xAxisLabelLimit, false)
                    ? limitTextInLine(label, this.option.xAxisLabelLimitNum || 0)
                    : label;
                }
        },
        axisTick: {
          show: this.validData(this.option.xAxisTickShow, true),
          length: this.option.xAxisTickLength || 0,
          lineStyle: {
            color: this.option.xAxisTickColor || "#333",
            width: this.option.xAxisTickWidth || 0
          }
        }
      },
      yAxis: {
        show: this.validData(this.option.yAxisShow, true),
        // type: this.option.category ? 'category' : 'value',
        type: "value",
        // max: Number(this.option.yAxisMax) || undefined,
        // min:
        //   Number(this.option.yAxisMin) ||
        //   (this.option.yAxisMin == "" && yAxisMin) ||
        //   undefined,
        name: this.option.yAxisNameShow && this.option.yAxisName,
        nameTextStyle: {
          padding: [
            0,
            this.option.yAxisNamePaddingRight || 0,
            this.option.yAxisNamePaddingBottom || 0,
            this.option.yAxisNamePaddingLeft || 0
          ],
          color: this.option.yAxisNameColor || "#333",
          fontSize: this.option.yAxisNameFontSize || 0,
          fontStyle: this.option.yAxisNameFontStyle || "normal",
          fontWeight: this.option.yAxisNameFontWeight || "normal",
          fontFamily: this.option.yAxisNameFontFamily || "Arial"
        },
        nameGap: 20 + -1 * (this.option.yAxisNamePaddingTop || 0),
        // data: optionData.categories || [],
        axisLabel: {
          show: this.validData(this.option.yAxisLabelShow, true),
          margin: this.option.yAxisMargin || 0,
          color: this.option.yAxisColor || "#333",
          fontSize: this.option.yAxisFontSize || 0,
          fontStyle: this.option.yAxisFontStyle || "normal",
          fontWeight: this.option.yAxisFontWeight || "normal",
          fontFamily: this.option.yAxisFontFamily || "Arial"
        },
        axisLine: {
          show: this.validData(this.option.yAxisLineShow, true),
          lineStyle: {
            color: this.option.yAxisLineColor || "#333",
            width: this.option.yAxisLineWidth || 0
            // opacity: this.option.yAxisLineOpacity || 0.5
          }
        },
        splitLine: {
          show: this.validData(this.option.yAxisSplitLineShow, true),
          lineStyle: {
            type: this.option.yAxisSplitLineType,
            width: this.option.yAxisSplitLineWidth || 0,
            color: this.option.yAxisSplitLineColor || "#333"
          }
        },
        axisTick: {
          show: this.validData(this.option.yAxisTickShow, true),
          length: this.option.yAxisTickLength || 0,
          lineStyle: {
            color: this.option.yAxisTickColor || "#333",
            width: this.option.yAxisTickWidth || 0
          }
        }
      },
      dataZoom:
        this.option.xAxisType !== "time" && this.validData(this.option.dataLoop || this.option.dataZoomShow, false)
          ? [
              // 滑动条
              {
                xAxisIndex: 0, // 这里是从X轴的0刻度开始
                show: this.validData(this.option.dataZoomShow, false), // 是否显示滑动条，不影响使用
                type: "slider", // 这个 dataZoom 组件是 slider 型 dataZoom 组件
                startValue: 0, // 从头开始。
                endValue: this.option.dataLoopDisplayRows - 1, // 一次性展示10个。
                zoomOnMouseWheel: false,
                zoomLock: true, // 禁止缩放
                height: 0,
                borderColor: "rgba(0, 0, 0, 0)",
                showDetail: false, // 拖动详情显示
                moveHandleSize: this.option.moveHandleSize || 0, // 滚动条宽度
                moveHandleStyle: {
                  color: this.option.moveHandleColor || "#d2dbee"
                },
                emphasis: {
                  moveHandleStyle: {
                    color: this.option.moveHandleEmphasisColor || "#d2dbee"
                  }
                },
                bottom: this.option.dataZoomBottom || 0
              }
            ]
          : "",
      series: (() => {
        const list: any = [];
        const opData = optionData || [];
        opData.map((item, index) => {
          list.push({
            name: seriesName[index],
            type: "custom",
            itemStyle: {
              color: this.seriesColor[index] || "#fff",
              opacity: this.seriesOpacity[index] / 100 || 0
            },
            data: this.getData(item, index),
            renderItem: (params: any, api: any) => {
              return this.getRenderItems({
                params,
                api,
                index,
                seriesLength: opData.length,
                nameLength: this.validData(this.option.dataLoop || this.option.dataZoomShow, false)
                  ? this.option.dataLoopDisplayRows
                  : item.list.length
              });
            }
          });
        });
        return list;
      })()
    };

    this.options = options;
  }
}

export { Echartzebra2 };
