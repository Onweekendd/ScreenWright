import { getEchartsColorFromCssLinearColor, getMaxIndex, getMinIndex } from "../../utils";
import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { BarEchartType } from "../type";

class EchartpictorialBar extends BaseChart {
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
      name: "象形图",
      prop: BarEchartType.echartpictorialbar,
      img: "/img/bar2.95f5ddc8.png",
      groupName: "柱状图"
    };
    super(defaultChartProps);
    this.seriesColor = ["rgba(63,246,252,1)"];
    this.seriesOpacity = [100];
    this.extremeShow = [false];
    this.extremeType = ["max"];
    this.extremeData = [];
    this.extremeColor = ["rgba(255,255,255,1)"];
    this.extremeOpacity = [100];
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
    const { axisName: xAxisName } = this.getEchartsAxisNameAndSeriesData(optionsData);
    optionsData = this.transformAxisData(optionsData, baseChartProps.yAxisType);
    const seriesName = optionsData.map((item) => item.name);
    this.option.dataSeriesName.forEach((item: any, index: number) => {
      const idx = seriesName.indexOf(item);
      if (idx !== -1) {
        seriesName[idx] = this.option.seriesTabsName[index].value;
        this.seriesFieldList.forEach((field: any) => {
          (this[field as keyof EchartpictorialBar] as any[])[idx] = this.option[field][index];
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
        type: this.option.xAxisType || "category",
        axisLine: {
          show: this.validData(this.option.xAxisLineShow, true),
          lineStyle: {
            color: this.option.xAxisLineColor || "#333",
            width: this.option.xAxisLineWidth || 0
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
      yAxis: {
        show: this.validData(this.option.yAxisShow, true),
        type: "value",
        max: Number(this.option.yAxisMax) || undefined,
        min: Number(this.option.yAxisMin) || undefined,
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
          }
        },
        splitLine: {
          show: this.validData(this.option.yAxisSplitLineShow, true),
          lineStyle: {
            type: "dashed",
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
        this.option.xAxisType !== "time" && this.validData(this.option.dataLoop, false)
          ? [
              // 滑动条
              {
                xAxisIndex: 0, // 这里是从X轴的0刻度开始
                show: false, // 是否显示滑动条，不影响使用
                type: "inside", // 这个 dataZoom 组件是 slider 型 dataZoom 组件
                startValue: 0, // 从头开始。
                endValue: this.option.dataLoopDisplayRows - 1, // 一次性展示10个。
                zoomOnMouseWheel: false
              }
            ]
          : "",
      series: (() => {
        const switchTheme = this.validData(this.option.switchTheme, false);
        const list = (optionsData || []).map((item, index) => {
          return {
            name: seriesName[index],
            type: "pictorialBar",
            symbol: this.option.symbol ? "path://" + this.option.symbol : "none",
            barGap: this.option.barGap + "%",
            barCategoryGap: this.option.barCategoryGap + "%",
            symbolSize: [(this.option.symbolWidth || 0) + "%", (this.option.symbolHeight || 0) + "%"],
            showBackground: true,
            backgroundStyle: {
              color: this.option.barBackgroundColor || "rgba(255, 255, 255, 0)"
            },
            itemStyle: !switchTheme
              ? {
                  // color: this.getColor(index)
                  color: this.seriesColor[index] || "red",
                  opacity: this.seriesOpacity[item.name] || 1,
                  barBorderRadius: this.option.barBorderRadius || 0
                }
              : { barBorderRadius: this.option.barBorderRadius || 0 },
            label: {
              show: this.validData(this.option.seriesLabelShow, false), //开启显示
              position: "top", //在上方显示,
              //   formatter: this.option.xAxisLabelCustom
              //       ? this.option.xAxisLabelCustom
              //       : (name) => this.getLabelFormatter(name),
              formatter: this.option.xAxisLabelCustom ? this.option.xAxisLabelCustom : (name: any) => name.value,
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

export { EchartpictorialBar };
