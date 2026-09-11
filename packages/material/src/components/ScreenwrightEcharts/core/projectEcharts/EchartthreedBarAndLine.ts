import { getEchartsColorFromCssLinearColor, getMaxIndex } from "../../utils";
import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { projectEchartType } from "../type";

class EchartthreedBarAndLine extends BaseChart {
  // 原始数据的option
  option: Record<string, any> = {};
  colorNameList: string[] = [];
  seriesColor = "";
  seriesLineColor = "";
  seriesHoverColor = "";
  constructor() {
    const baseChartProps = {
      name: "3D柱状折线图",
      prop: projectEchartType.echartdoubleValueLine,
      img: "/img/doubleValueLine.c9dcda6c.png",
      groupName: "项目"
    };
    super(baseChartProps);
    this.colorNameList = ["seriesColor", "seriesLineColor", "seriesHoverColor"];
  }
  getOptions() {
    return this.options;
  }
  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    let optionsData = await this.transformOptionsData(baseChartProps.data);
    const { axisName: xAxisName, optionData } = this.getEchartsAxisNameAndSeriesData(optionsData);
    optionsData = optionData;
    const maxIndex = getMaxIndex(optionData[0].list.map((item: { value: any }) => item.value));
    console.log(maxIndex, "maxIndex");
    // this.dataLength = optionData[0].list.length;
    // const xAxisName = optionData[0].list.map((item) => item.name);
    const markerColor = [
      this.option.seriesColor.colors && Array.isArray(this.option.seriesLineColor.colors)
        ? this.option.seriesColor.colors[0].color
        : this.option.seriesColor,
      this.option.seriesColor.colors && Array.isArray(this.option.seriesLineColor.colors)
        ? this.option.seriesLineColor.colors[0].color
        : this.option.seriesLineColor
    ];
    this.colorNameList.forEach((item) => {
      if (typeof this.option[item] === "object" && !this.option[item].colorStops) {
        (this[item as keyof EchartthreedBarAndLine] as any) = getEchartsColorFromCssLinearColor(this.option[item]);
      } else (this[item as keyof EchartthreedBarAndLine] as any) = this.option[item];
    });
    const options = {
      tooltip: {
        trigger: "axis",
        confine: true,
        position: (point: number[]) => {
          // console.log(size);
          // 固定在顶部
          return [point[0] - 1, point[1] - 120];
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
        extraCssText:
          "box-shadow :inset 0 0 23px #008aff;color:#fff;padding:5px 23px 15px 23px;border-radius:0;line-height:30px;",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderWidth: 0,
        formatter: (params: any[]) => {
          let str = "";
          str += `<div>`;
          str += `<p style="color:#fff;font-size:16px;text-align:left;margin:0;"><span style="font-family:'Source Han Sans CN-Normal, Source Han Sans CN';font-size:19px;">${params[0].name}</span></p>`;
          params.forEach((item: any, index: number) => {
            const param = item;
            param.marker = `<span style="display:inline-block;vertical-align:15%;margin-right:20px;width:16px;height:3px;background-color:${markerColor[index]};"></span>`;
            str += `<p style="color:#fff;font-size:16px;text-align:left;margin:0;"><span style="font-family:'Source Han Sans CN-Normal, Source Han Sans CN';font-size:19px;">${param.marker}${param.value} ${this.option.tooltipUnit[index]}</span></p>`;
          });
          str += `</div>`;
          return str;
        }
      },
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
        },
        data: [
          {
            name: optionData[0].name,
            itemStyle: {
              color: this.seriesColor || "red",
              opacity: this.option.seriesOpacity / 100 || 0
            }
          },
          {
            name: optionData[1].name,
            itemStyle: {
              opacity: 0
            },
            lineStyle: {
              color: this.seriesLineColor || "red"
            }
          }
        ]
      },
      dataZoom: [],
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
            type: "dashed",
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
          formatter: this.option.xAxisType === "time" ? this.option.xAxisTimeType : "{value}"
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
      yAxis: (() => {
        const list = (this.option.yAxisShow || []).map((item: any, index: string | number) => {
          return {
            show: this.validData(this.option.yAxisShow[index], true),
            // type: this.option.category ? 'category' : 'value',
            type: "value",
            // max: this.option.yAxisMax[index] || undefined,
            // min: this.option.yAxisMin[index] || undefined,
            // data: optionData.categories || [],
            axisLabel: {
              show: this.validData(this.option.yAxisLabelShow[index], true),
              margin: this.option.yAxisMargin[index] || 0,
              color: this.option.yAxisColor[index] || "#333",
              fontSize: this.option.yAxisFontSize[index] || 0,
              fontStyle: this.option.yAxisFontStyle[index] || "normal",
              fontWeight: this.option.yAxisFontWeight[index] || "normal",
              fontFamily: this.option.yAxisFontFamily[index] || "Arial"
            },
            axisLine: {
              show: this.validData(this.option.yAxisLineShow[index], true),
              lineStyle: {
                color: this.option.yAxisLineColor[index] || "#333",
                width: this.option.yAxisLineWidth[index] || 0
                // opacity: this.option.yAxisLineOpacity || 0.5
              }
            },
            splitLine: {
              show: this.validData(this.option.yAxisSplitLineShow[index], true),
              lineStyle: {
                type: "dashed",
                width: this.option.yAxisSplitLineWidth[index] || 0,
                color: this.option.yAxisSplitLineColor[index] || "#333"
              }
            },
            axisTick: {
              show: this.validData(this.option.yAxisTickShow[index], true),
              length: this.option.yAxisTickLength[index] || 0,
              lineStyle: {
                color: this.option.yAxisTickColor[index] || "#333",
                width: this.option.yAxisTickWidth[index] || 0
              }
            }
          };
        });
        return list;
      })(),

      series: [
        // 上
        {
          type: "pictorialBar",
          symbol: "diamond",
          symbolSize: [this.option.seriesWidth * 2 + 4, 8],
          symbolOffset: [0, -5],
          zlevel: 4,
          tooltip: {
            show: false
          },
          itemStyle: {
            color: (params: { dataIndex: any }) => {
              return this.option.isHover && params.dataIndex === maxIndex
                ? this.option.seriesHoverTopColor
                : this.option.seriesTopColor;
            }
          },
          data: optionData[0].list.map((item: { value: any }) => {
            return {
              value: item.value,
              symbolPosition: "end"
            };
          })
        },
        // 1
        {
          name: optionData[0].name,
          type: "bar",
          barWidth: 1,
          barGap: 0,
          itemStyle: {
            color: (params: { dataIndex: any }) => {
              return this.option.isHover && params.dataIndex === maxIndex ? this.seriesHoverColor : this.seriesColor;
            }
          },
          tooltip: {
            show: false
          },
          data: optionData[0].list
        },
        // 2
        {
          name: optionData[0].name,
          type: "bar",
          barWidth: this.option.seriesWidth,
          barGap: 0,
          itemStyle: {
            color: (params: { dataIndex: any }) => {
              return this.option.isHover && params.dataIndex === maxIndex ? this.seriesHoverColor : this.seriesColor;
            },
            opacity: this.option.seriesOpacity / 100 || 0
          },
          data: optionData[0].list
        },
        // 3
        {
          name: optionData[0].name,
          type: "bar",
          barWidth: 1,
          barGap: 0,
          itemStyle: {
            color: (params: { dataIndex: any }) => {
              return this.option.isHover && params.dataIndex === maxIndex ? this.seriesHoverColor : this.seriesColor;
            }
          },
          tooltip: {
            show: false
          },
          label: {
            show: false,
            position: "top",
            color: "#fff",
            fontFamily: "Source Han Sans CN-Normal, Source Han Sans CN",
            fontSize: 28,
            formatter: (res: { value: number }) => {
              return Math.round(res.value);
            }
          },
          data: optionData[0].list
        },
        // 4
        {
          name: optionData[0].name,
          type: "bar",
          barWidth: this.option.seriesWidth,
          barGap: 0,
          itemStyle: {
            color: (params: { dataIndex: number }) => {
              return this.option.isHover && params.dataIndex === maxIndex ? this.seriesHoverColor : this.seriesColor;
            },
            opacity: this.option.seriesOpacity / 100 || 0
          },
          tooltip: {
            show: false
          },
          data: optionData[0].list
        },
        // 5
        {
          name: optionData[0].name,
          type: "bar",
          barWidth: 1,
          barGap: 0,
          itemStyle: {
            color: (params: { dataIndex: number }) => {
              return this.option.isHover && params.dataIndex === maxIndex ? this.seriesHoverColor : this.seriesColor;
            }
          },
          tooltip: {
            show: false
          },
          data: optionData[0].list
        },
        // 下
        {
          type: "pictorialBar",
          symbol: "diamond",
          symbolSize: [this.option.seriesWidth * 2 + 4, 8],
          symbolOffset: [0, 5],
          zlevel: -1,
          tooltip: {
            show: false
          },
          itemStyle: {
            color: (params: { dataIndex: number }) => {
              return this.option.isHover && params.dataIndex === maxIndex
                ? this.option.seriesHoverBottomColor
                : this.option.seriesBottomColor;
            }
          },
          data: optionData[0].list
        },
        {
          name: optionData[1].name,
          type: "line",
          smooth: this.option.seriesSmoothShow ? this.option.seriesSmooth : false,
          connectNulls: this.validData(this.option.seriesConnectNulls, false),
          yAxisIndex: 1,
          // barWidth: nowSize(9),
          symbol: "none",
          lineStyle: {
            color: this.seriesLineColor || "red",
            opacity: this.option.seriesLineOpacity / 100 || 0,
            width: this.option.seriesLineWidth || 0
          },
          data: optionData[1].list
        }
      ],
      animationDelay: (idx: number) => {
        idx += 0.5;
        // 越往后的数据延迟越大
        return idx * 100;
      },
      animationEasing: "linear"
    };
    this.options = options;
  }
}

export { EchartthreedBarAndLine };
