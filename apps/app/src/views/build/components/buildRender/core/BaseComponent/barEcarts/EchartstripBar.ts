import { getEchartsColorFromCssLinearColor, getMaxIndex, getMinIndex } from "../../utils";
import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { BarEchartType } from "../type";

class EchartstripBar extends BaseChart {
  // 原始数据的option
  option: Record<string, any> = {};
  tooltipMarkerColor: any[] = [];
  seriesColor: any[] = [];
  seriesOpacity: any[] = [];
  extremeShow: boolean[] = [];
  extremeType: any[] = [];
  extremeData: any[] = [];
  extremeColor: any[] = [];
  extremeOpacity: any[] = [];
  seriesFieldList: string[] = [];
  constructor() {
    const defaultChartProps = {
      name: "条形图",
      prop: BarEchartType.echartstripBar,
      img: "/img/bar2.20240514.png",
      groupName: "柱状图"
    };
    super(defaultChartProps);
    this.seriesColor = [
      {
        type: "linear",
        x: 0,
        y: 0.5,
        x2: 1,
        y2: 0.5,
        colorStops: [
          {
            offset: "0",
            color: "rgba(62,67,244,1)"
          },
          {
            offset: "1",
            color: "rgba(137,181,252,1)"
          }
        ]
      },
      {
        type: "linear",
        x: 0,
        y: 0.5,
        x2: 1,
        y2: 0.5,
        colorStops: [
          {
            offset: "0",
            color: "rgba(62,67,244,1)"
          },
          {
            offset: "1",
            color: "rgba(61,227,251,1)"
          }
        ]
      }
    ];
    this.seriesOpacity = [100, 100];
    this.extremeShow = [];
    this.extremeType = [];
    this.extremeData = [];
    this.extremeColor = [];
    this.extremeOpacity = [];
    this.seriesFieldList = [
      "seriesColor",
      "seriesOpacity",
      "extremeShow",
      "extremeType",
      "extremeColor",
      "extremeOpacity"
    ];
  }

  getOptions() {
    return this.options;
  }

  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    let optionsData = await this.transformOptionsData(baseChartProps.data);
    const { axisName: yAxisName, optionData: data } = this.getEchartsAxisNameAndSeriesData(optionsData);
    optionsData = data;
    optionsData = this.transformAxisData(optionsData, baseChartProps.yAxisType);
    const seriesName = optionsData.map((item) => item.name);
    this.option.dataSeriesName.forEach((item: any, index: number) => {
      const idx = seriesName.indexOf(item);
      if (idx !== -1) {
        seriesName[idx] = this.option.seriesTabsName[index].value;
        this.seriesFieldList.forEach((field: any) => {
          (this[field as keyof EchartstripBar] as any[])[idx] = this.option[field][index];
        });
        if (this.validData(this.extremeShow[idx], false)) {
          if (this.extremeType[idx] === "max") {
            this.extremeData[idx] = getMaxIndex(optionsData[idx].list.map((item: any) => item.value));
          } else {
            this.extremeData[idx] = getMinIndex(optionsData[idx].list.map((item: any) => item.value));
          }
        }
      } else {
        this.option.extremeShow[index] = false;
      }
    });
    // css线性渐变色转为echarts线性渐变色
    console.log("this.seriesColor", this.seriesColor);
    this.seriesColor = this.createSeriesColor(this.seriesColor);
    this.seriesColor.forEach((item, index) => {
      this.tooltipMarkerColor[index] = typeof item === "object" ? item.colorStops[1].color : item;
    });

    const tooltipUnit = this.setTooltipUnit(
      this.option,
      optionsData.map((item) => item.name)
    );
    const options = {
      title: this.createTitle(this.option),
      tooltip: this.createTooltip(this.option, tooltipUnit, this.screenScale, this.tooltipMarkerColor),
      grid: this.createGrid(this.option),
      legend: this.createLegend(this.option),
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
        inverse: false,
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
        this.option.yAxisType !== "time" && this.validData(this.option.dataLoop || this.option.dataZoomShow, false)
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
          : "",
      series: (() => {
        const list = (optionsData || []).map((item, index) => {
          return {
            stack: this.validData(this.option.stack, false),
            name: seriesName[index],
            type: "bar",
            barMinHeight: this.option.barMinHeight || 0,
            barGap: this.option.barGap + "%",
            barCategoryGap: this.option.barCategoryGap + "%",
            showBackground: true,
            backgroundStyle: {
              color: this.option.barBackgroundColor || "rgba(255, 255, 255, 0)"
            },
            itemStyle: {
              color: this.seriesColor[index] || "red",
              opacity: this.seriesOpacity[index] / 100 || 0,
              borderRadius: (this.option.barBorderRadius === "default" ? 0 : [0, 50, 50, 0]) || 0
            },
            label: {
              show: this.validData(this.option.seriesLabelShow, false), //开启显示
              position: "right",
              // this.getLabelFormatter(name)
              formatter: (name: any) => name.value + (this.option.seriesLabelSuffix ?? ""),
              //数值样式
              fontFamily: this.option.seriesLabelFontFamily || "Source Han Sans CN-Normal, Source Han Sans CN",
              fontStyle: this.option.seriesLabelFontStyle || "normal",
              fontSize: this.option.seriesLabelFontSize || 0,
              color: this.option.seriesLabelColor || "#333",
              fontWeight: this.option.seriesLabelFontWeight || "normal",
              offset: [this.option.seriesLabelOffsetX || 0, this.option.seriesLabelOffsetY || 0]
            },
            data: this.validData(this.extremeShow[index], false)
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
              : item.list
          };
        });
        return list;
      })()
    };

    this.options = options;
  }
}

export { EchartstripBar };
