import { orderBy } from "lodash-es";

import { setMinioUrl } from "@material/minioUrl";

import { getEchartsColorFromCssLinearColor } from "../../utils";
import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { BarEchartType } from "../type";

class Echartrank extends BaseChart {
  // 原始数据的option
  option: Record<string, any> = {};
  blankData: any[] = [];
  defaultSeriesColor = "";
  seriesLabelBackground: any[] = [];
  seriesColor: any[] = [];
  seriesOpacity: any = [];
  seriesFieldList: string[] = [];
  constructor() {
    const defaultChartProps = {
      name: "排名图",
      prop: BarEchartType.echartrank,
      img: "/img/echart-rank.475870a4.png",
      groupName: "柱状图"
    };
    super(defaultChartProps);
    this.seriesColor = ["rgba(63,246,252,1)", "rgba(255,0,0,1)"];
    this.seriesLabelBackground = [];
    this.blankData = [];
    this.defaultSeriesColor = "rgba(255,255,255,1)";
    this.seriesOpacity = [100, 100];
    this.seriesFieldList = ["seriesColor", "seriesOpacity"];
  }

  getOptions() {
    return this.options;
  }
  handleLinearColor(color: any) {
    if (typeof color === "object" && !color.colorStops) {
      return getEchartsColorFromCssLinearColor(color);
    }
    return color;
  }
  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    const data = await this.transformOptionsDataByDataFilter();
    let optionsData =
      this.option.sortType === "desc" ? orderBy(data, ["value"], ["desc"]) : orderBy(data, ["value"], ["asc"]);
    const yAxisName = optionsData.map((item) => item.name);
    optionsData = this.transformAxisData(optionsData, baseChartProps.yAxisType);
    this.defaultSeriesColor = this.handleLinearColor(this.option.defaultSeriesColor);
    // css线性渐变色转为echarts线性渐变色
    this.seriesColor = [];
    this.seriesColor = [];
    // 空白数据
    this.blankData = [];
    // 排名背景
    this.seriesLabelBackground = [];
    const dataLength = optionsData.length;
    for (let index = 0; index < dataLength; index++) {
      if (this.option.yAxisType === "time") {
        this.blankData.push([0, optionsData[index]?.name]);
      } else {
        this.blankData.push(0);
      }
      if (this.option.seriesColor[index]) {
        this.seriesColor.push(this.handleLinearColor(this.option.seriesColor[index]));
      } else this.seriesColor.push(this.defaultSeriesColor);
      if (this.option.seriesLabelBackground[index]) {
        this.seriesLabelBackground.push(this.option.seriesLabelBackground[index]);
      } else this.seriesLabelBackground.push(this.option.defaultSeriesLabelBackground);
    }
    const options = {
      title: this.createTitle(this.option),
      tooltip: { show: false },
      grid: this.createGrid(this.option),
      legend: {
        show: this.validData(this.option.legendShow, false),
        orient: this.option.legendOrient || "horizontal",
        ...this.option.legendGrid,
        width: this.option.legendWidth || 0,
        height: this.option.legendHeight || 0,
        itemWidth: this.option.legendItemWidth || 0,
        itemHeight: this.option.legendItemHeight || 0,
        itemGap: this.option.legendItemGap || 0,
        padding: (() => {
          const { legendOffsetX, legendOffsetY, legendGrid } = this.option;
          const { top = 0, right = 0, bottom = 0, left = 0 } = legendGrid;
          return [
            top ? 0 : legendOffsetY,
            right ? 0 : -1 * legendOffsetX,
            bottom ? 0 : -1 * legendOffsetY,
            left ? 0 : legendOffsetX
          ];
        })(),
        selectedMode: this.option.legendSelectedMode,
        textStyle: {
          fontFamily: this.option.legendFontFamily || "Arial",
          fontSize: this.option.legendFontSize || 0,
          color: this.option.legendColor || "rgba(255, 255, 255, 1)",
          fontStyle: this.option.legendFontStyle || "normal",
          fontWeight: this.option.legendFontWeight || "normal",
          padding: [0, 0, 0, this.option.legendTextLeftPadding || 0]
        }
      },
      xAxis: {
        show: this.validData(this.option.xAxisShow, true),
        type: "value",
        max: Number(this.option.xAxisMax) || undefined,
        min: Number(this.option.xAxisMin) || undefined,
        name: this.option.xAxisNameShow && this.option.xAxisName,
        nameTextStyle: {
          color: this.option.xAxisNameColor || "#333",
          fontSize: this.option.xAxisNameFontSize || 0,
          fontStyle: this.option.xAxisNameFontStyle || "normal",
          fontWeight: this.option.xAxisNameFontWeight || "normal",
          fontFamily: this.option.xAxisNameFontFamily || "Arial"
        },
        nameGap: this.option.xAxisNameGap || 0,
        axisLabel: {
          show: this.validData(this.option.xAxisLabelShow, true),
          margin: this.option.xAxisMargin || 0,
          color: this.option.xAxisColor || "#333",
          fontSize: this.option.xAxisFontSize || 0,
          fontStyle: this.option.xAxisFontStyle || "normal",
          fontWeight: this.option.xAxisFontWeight || "normal",
          fontFamily: this.option.xAxisFontFamily || "Arial"
        },
        axisLine: {
          show: this.validData(this.option.xAxisLineShow, true),
          lineStyle: {
            color: this.option.xAxisLineColor || "#333",
            width: this.option.xAxisLineWidth || 0
          }
        },
        splitLine: {
          show: this.validData(this.option.xAxisSplitLineShow, true),
          lineStyle: {
            type: "dashed",
            width: this.option.xAxisSplitLineWidth || 0,
            color: this.option.xAxisSplitLineColor || "#333"
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
        type: this.option.yAxisType || "category",
        axisLine: {
          show: this.validData(this.option.yAxisLineShow, true),
          lineStyle: {
            color: this.option.yAxisLineColor || "#333",
            width: this.option.yAxisLineWidth || 0
          }
        },
        data: yAxisName || [],
        inverse: this.validData(this.option.yAxisInverse, false),
        splitLine: {
          show: this.validData(this.option.yAxisSplitLineShow, false),
          interval: this.option.yAxisSplitLineInterval || 0,
          lineStyle: {
            type: "dashed",
            width: this.option.yAxisSplitLineWidth || 0,
            color: this.option.yAxisSplitLineColor || "#333"
          }
        },
        axisLabel: {
          show: this.validData(this.option.yAxisLabelShow, true),
          interval: (() => {
            const value = this.option.yAxisInterval || 0;
            if (value === 0) return "auto";
            if (value < 0) return 0;
            return value;
          })(),
          rotate: this.option.yAxisRotate || 0,
          margin: this.option.yAxisMargin || 0,
          color: this.option.yAxisColor || "#333",
          fontSize: this.option.yAxisFontSize || 0,
          fontStyle: this.option.yAxisFontStyle || "normal",
          fontWeight: this.option.yAxisFontWeight || "normal",
          fontFamily: this.option.yAxisFontFamily || "Arial",
          formatter: this.option.yAxisType === "time" ? this.option.yAxisTimeType : "{value}"
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
        this.option.yAxisType !== "time" &&
        this.validData(this.option.dataLoop || this.option.dataZoomShow, false) &&
        optionsData.length > this.option.dataLoopDisplayRows
          ? [
              // 滑动条
              {
                yAxisIndex: 0, // 这里是从X轴的0刻度开始
                show: this.option.dataZoomShow, // 是否显示滑动条，不影响使用
                type: "slider", // 这个 dataZoom 组件是 slider 型 dataZoom 组件
                startValue: 0, // 从头开始。
                endValue: this.option.dataLoopDisplayRows - 1, // 一次性展示10个。
                zoomOnMouseWheel: false,
                zoomLock: true, // 禁止缩放
                width: 0,
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
                right: this.option.dataZoomRight || 0
              }
            ]
          : [],
      series: [
        {
          stack: "rank",
          name: "排名图",
          type: "bar",
          barMinHeight: this.option.barMinHeight || 0,
          barGap: this.option.barGap + "%",
          barCategoryGap: this.option.barCategoryGap + "%",
          showBackground: true,
          backgroundStyle: {
            color: this.option.barBackgroundColor || "rgba(255, 255, 255, 0)"
          },
          itemStyle: {
            // color: this.getColor(index)
            color: (params: any) => {
              return this.seriesColor[params.dataIndex] || this.option.defaultSeriesColor || "#fff";
            },
            opacity: (params: any) => {
              return this.option.seriesOpacity[params.dataIndex] / 100 || 0;
            },
            barBorderRadius: (this.option.barBorderRadius === "default" ? 0 : [0, 50, 50, 0]) || 0
          },
          data: optionsData
        },
        {
          // 排名标签
          stack: "rank",
          name: "排名图",
          type: "pictorialBar",
          label: {
            show: this.validData(this.option.seriesLabelShow[0], false), //开启显示
            position: "left",
            color: this.option.seriesLabelColor[0] || "#333",
            offset: [this.option.seriesLabelOffsetX[0] || 0, this.option.seriesLabelOffsetY[0] || 0],
            formatter: (item: any) => {
              return `{rank${item.dataIndex}|${item.dataIndex + 1}}`;
            },
            rich: {
              ...(() => {
                const rich: any = {};
                for (let index = 0; index <= optionsData.length; index++) {
                  rich[`rank${index}`] = {
                    backgroundColor: this.seriesLabelBackground[index]
                      ? {
                          image: setMinioUrl(this.seriesLabelBackground[index])
                        }
                      : "",
                    align: "center",
                    fontFamily: this.option.seriesLabelFontFamily[0] || "Source Han Sans CN-Normal, Source Han Sans CN",
                    fontStyle: this.option.seriesLabelFontStyle[0] || "normal",
                    fontSize: this.option.seriesLabelFontSize[0] || 0,
                    fontWeight: this.option.seriesLabelFontWeight[0] || "normal"
                  };
                }
                return rich;
              })()
            }
          },
          data: this.blankData
        },
        {
          // 文本标签
          stack: "rank",
          name: "排名图",
          type: "pictorialBar",
          label: {
            show: this.validData(this.option.seriesLabelShow[1], false), //开启显示
            position: "left",
            formatter: "{b}",
            align: "insideLeft",
            fontFamily: this.option.seriesLabelFontFamily[1] || "Source Han Sans CN-Normal, Source Han Sans CN",
            fontStyle: this.option.seriesLabelFontStyle[1] || "normal",
            fontSize: this.option.seriesLabelFontSize[1] || 0,
            color: this.option.seriesLabelColor[1] || "#333",
            fontWeight: this.option.seriesLabelFontWeight[1] || "normal",
            offset: [this.option.seriesLabelOffsetX[1] || 0, this.option.seriesLabelOffsetY[1] || 0]
          },
          data: this.blankData
        },
        {
          // 数值标签
          stack: "rank",
          name: "排名图",
          type: "pictorialBar",
          label: {
            show: this.validData(this.option.seriesLabelShow[2], false), //开启显示
            position: "right",
            formatter: this.option.yAxisType === "time" ? "{@[0]}" : "{c}" + (this.option.seriesLabelSuffix ?? ""),
            //数值样式
            fontFamily: this.option.seriesLabelFontFamily[2] || "Source Han Sans CN-Normal, Source Han Sans CN",
            fontStyle: this.option.seriesLabelFontStyle[2] || "normal",
            fontSize: this.option.seriesLabelFontSize[2] || 0,
            color: this.option.seriesLabelColor[2] || "#333",
            fontWeight: this.option.seriesLabelFontWeight[2] || "normal",
            offset: [this.option.seriesLabelOffsetX[2] || 0, this.option.seriesLabelOffsetY[2] || 0]
          },
          itemStyle: {
            color: "transparent"
          },
          silent: true,
          data: optionsData
        }
      ]
    };
    this.options = options;
    console.log(this.options, "options");
  }
}

export { Echartrank };
