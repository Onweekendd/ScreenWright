import { has } from "lodash-es";

import { setMinioUrl } from "@/utils/config";

import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { BarEchartType } from "../type";

class Echartline extends BaseChart {
  // 原始数据的option
  option: Record<string, any> = {};
  seriesFieldList: string[];
  seriesLineColor: string[];
  tooltipMarkerColor: string[];
  seriesSmoothShow: string[]; // 平滑曲线
  seriesSmooth: any[];
  seriesSymbolShow: any[];
  seriesSymbol: any[];
  seriesSymbolImage: any[];
  seriesSymbolWidth: any[];
  seriesSymbolHeight: any[];
  seriesItemColor: any[];
  seriesItemBorderWidth: any[];
  seriesItemBorderColor: any[];
  seriesLineWidth: any[];
  seriesLabelShow: any[];
  seriesLabelColor: any[];
  seriesLabelFontFamily: any[];
  seriesLabelFontSize: any[];
  seriesLabelFontWeight: any[];
  seriesLabelFontStyle: any[];
  seriesLabelOffsetX: any[];
  seriesLabelOffsetY: any[];

  constructor() {
    const baseChartProps = {
      name: "折线图",
      prop: BarEchartType.echartbothWayStripBar,
      img: "/img/line.20240514.png",
      groupName: "折线图"
    };
    super(baseChartProps);
    this.seriesFieldList = [
      // 'seriesColor',
      // 'seriesOpacity',
      "seriesLineColor",
      "seriesLineWidth",
      "seriesSmoothShow",
      "seriesSmooth",
      "seriesSymbolShow",
      "seriesSymbol",
      "seriesSymbolImage",
      "seriesSymbolWidth",
      "seriesSymbolHeight",
      "seriesItemColor",
      "seriesItemBorderWidth",
      "seriesItemBorderColor",
      "seriesLabelShow",
      "seriesLabelColor",
      "seriesLabelFontFamily",
      "seriesLabelFontSize",
      "seriesLabelFontWeight",
      "seriesLabelFontStyle",
      "seriesLabelOffsetX",
      "seriesLabelOffsetY"
    ];
    this.seriesLineColor = ["rgba(62,67,244,1)", "#3DE5FC"];
    this.tooltipMarkerColor = [];
    this.seriesSmoothShow = [];
    this.seriesSmooth = [];
    this.seriesSymbolShow = [];
    this.seriesSymbol = [];
    this.seriesSymbolImage = [];
    this.seriesSymbolWidth = [];
    this.seriesSymbolHeight = [];
    this.seriesItemColor = [];
    this.seriesItemBorderWidth = [];
    this.seriesItemBorderColor = [];
    this.seriesLineWidth = [];
    this.seriesLabelShow = [];
    this.seriesLabelFontFamily = [];
    this.seriesLabelFontSize = [];
    this.seriesLabelFontWeight = [];
    this.seriesLabelFontStyle = [];
    this.seriesLabelOffsetX = [];
    this.seriesLabelOffsetY = [];
    this.seriesLabelColor = [];
  }
  getOptions() {
    return this.options;
  }

  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    if (!has(baseChartProps.option, "tooltipLabelOffsetX")) {
      (baseChartProps.option as any).tooltipLabelOffsetX = 0;
    }
    if (!has(baseChartProps.option, "tooltipLabelOffsetY")) {
      (baseChartProps.option as any).tooltipLabelOffsetY = 0;
    }
    if (!has(baseChartProps.option, "tooltipMarkerShow")) {
      (baseChartProps.option as any).tooltipMarkerShow = true;
    }
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
          (this[field as keyof Echartline] as any[])[idx] = this.option[field][index];
        });
      }
    });
    this.seriesLineColor.forEach((item, index) => {
      this.tooltipMarkerColor[index] = typeof item === "object" ? (item as any).colorStops[1].color : item;
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
        boundaryGap: this.validData(this.option.boundaryGap, true),
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
        // type: this.option.category ? 'category' : 'value',
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
        // const barColor = this.option.barColor || [];
        const list = (optionsData || []).map((item, index) => {
          return {
            name: seriesName[index],
            type: "line",
            smooth: this.seriesSmoothShow[index] ? this.seriesSmooth[index] : false,
            showSymbol: this.validData(this.seriesSymbolShow[index], true),
            symbol:
              this.seriesSymbol[index] === "image"
                ? `image://${setMinioUrl(this.seriesSymbolImage[index])}`
                : this.seriesSymbol[index],
            symbolSize: [this.seriesSymbolWidth[index], this.seriesSymbolHeight[index]],
            connectNulls: this.validData(this.option.seriesConnectNulls[index], false),
            showBackground: true,
            backgroundStyle: {
              color: this.option.barBackgroundColor || "rgba(255, 255, 255, 0)"
            },
            itemStyle: {
              // color: this.getColor(index)
              color: this.seriesItemColor[index] || "red",
              // opacity: this.option.seriesOpacity[index] / 100 || 0,
              borderWidth: this.seriesItemBorderWidth[index] || 0,
              borderColor: this.seriesItemBorderColor[index] || "rgba(255, 255, 255, 1)"
            },
            lineStyle: {
              width: this.seriesLineWidth[index] || 0,
              color: this.seriesLineColor[index] || "rgba(255, 255, 255, 1)"
            },
            label: {
              show: this.validData(this.seriesLabelShow[index], false), //开启显示
              position: "top", //在上方显示,
              formatter: this.option.xAxisLabelCustom?.[index]
                ? this.option.xAxisLabelCustom[index]
                : (name: any) => name.value,
              //数值样式
              fontFamily: this.seriesLabelFontFamily[index] || "Source Han Sans CN-Normal, Source Han Sans CN",
              fontStyle: this.seriesLabelFontStyle[index] || "normal",
              fontSize: this.seriesLabelFontSize[index] || 0,
              color: this.seriesLabelColor[index] || "#333",
              fontWeight: this.seriesLabelFontWeight[index] || "normal",
              offset: [this.seriesLabelOffsetX[index] || 0, this.seriesLabelOffsetY[index] || 0]
            },
            data: item.list
          };
        });
        return list;
      })()
    };
    this.options = options;
  }
}

export { Echartline };
