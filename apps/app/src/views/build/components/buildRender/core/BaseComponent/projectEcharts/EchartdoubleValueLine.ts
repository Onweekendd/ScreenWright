import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { projectEchartType } from "../type";

class EchartdoubleValueLine extends BaseChart {
  // 原始数据的option
  option: Record<string, any> = {};
  seriesColor: string[] = [];

  seriesLabelShow: any[];
  seriesLabelColor: any[];
  seriesLabelFontFamily: any[];
  seriesLabelFontSize: any[];
  seriesLabelFontWeight: any[];
  seriesLabelFontStyle: any[];
  seriesLabelOffsetX: any[];
  seriesLabelOffsetY: any[];
  seriesFieldList: string[];

  constructor() {
    const baseChartProps = {
      name: "特殊型折线图",
      prop: projectEchartType.echartdoubleValueLine,
      img: "/img/doubleValueLine.c9dcda6c.png",
      groupName: "项目"
    };
    super(baseChartProps);
    this.seriesFieldList = [
      "seriesColor",
      "seriesLabelShow",
      "seriesLabelColor",
      "seriesLabelFontFamily",
      "seriesLabelFontSize",
      "seriesLabelFontWeight",
      "seriesLabelFontStyle",
      "seriesLabelOffsetX",
      "seriesLabelOffsetY"
    ];
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
    this.option = baseChartProps.option;
    const optionsData = await this.transformOptionsDataByDataFilter();
    const seriesName = optionsData.map((item: any) => item.seriesName);

    this.seriesFieldList.forEach((field) => {
      if (this.option[field]) (this[field as keyof EchartdoubleValueLine] as any) = [];
    });
    this.option.dataSeriesName.forEach((item: any, index: number) => {
      const idx = seriesName.indexOf(item);
      if (idx !== -1) {
        optionsData[idx].seriesName = this.option.seriesTabsName[index].value;
        this.seriesFieldList.forEach((field: any) => {
          (this[field as keyof EchartdoubleValueLine] as any[])[idx] = this.option[field][index];
        });
      }
    });
    const xList: any[] = [];
    optionsData.forEach((item: any) => {
      item.value.forEach((itm: any[]) => {
        xList.push(itm[0]);
      });
    });
    const maxX = (Math.max(...xList) + Math.max(...xList) / 10).toFixed(0);
    const options = {
      tooltip: { show: false },
      grid: this.createGrid(this.option),
      xAxis: {
        max: maxX,
        type: "value",
        show: this.validData(this.option.xAxisShow, true),
        axisLine: {
          show: this.validData(this.option.xAxisLineShow, true),
          lineStyle: {
            color: this.option.xAxisLineColor || "#333",
            width: this.option.xAxisLineWidth || 0
          }
        },
        inverse: this.validData(this.option.xAxisInverse, false),
        splitLine: {
          show: this.validData(this.option.xAxisSplitLineShow, false),
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
          formatter:
            (this.option.xAxisType === "time" ? this.option.xAxisTimeType : "{value}") +
            (this.option.xAxisLabelUtil || "")
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

        axisLabel: {
          show: this.validData(this.option.yAxisLabelShow, true),
          margin: this.option.yAxisMargin || 0,
          color: this.option.yAxisColor || "#333",
          fontSize: this.option.yAxisFontSize || 0,
          fontStyle: this.option.yAxisFontStyle || "normal",
          fontWeight: this.option.yAxisFontWeight || "normal",
          fontFamily: this.option.yAxisFontFamily || "Arial",
          formatter: "{value}" + (this.option.yAxisLabelUtil || "")
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
      series: (() => {
        // const barColor = this.option.barColor || [];
        const list = (optionsData || []).map((item: any, index: number) => {
          return {
            name: item.seriesName || "",
            type: "line",
            // showSymbol: false,
            symbolSize: 0.001,
            smooth: true,
            lineStyle: {
              color: this.seriesColor[index] || "red"
            },
            markArea: {
              silent: true,
              itemStyle: {
                color: "rgba(0,0,0,0)",
                borderWidth: 1,
                borderType: "dashed"
              },
              data: [
                [
                  {
                    xAxis: item.value[item.value.length - 2][0],
                    yAxis: item.value[item.value.length - 2][1],
                    itemStyle: {
                      borderColor: this.seriesColor[index]
                    }
                  },
                  {
                    xAxis: item.value[item.value.length - 1][0] + item.value[item.value.length - 1][0] / 10,
                    yAxis:
                      item.value[item.value.length - 1][1] > item.value[item.value.length - 2][1]
                        ? item.value[item.value.length - 1][1] + item.value[item.value.length - 1][1] / 10
                        : item.value[item.value.length - 1][1] - item.value[item.value.length - 1][1] / 10
                  }
                ]
              ]
            },
            label: {
              show: this.validData(this.seriesLabelShow[index], false), //开启显示
              position: "top", //在上方显示,
              formatter: (params: { dataIndex: number; seriesName: any }) => {
                if (params.dataIndex === item.value.length - 1) {
                  return params.seriesName;
                }
                return "";
              },
              //数值样式
              fontFamily: this.seriesLabelFontFamily[index] || "Source Han Sans CN-Normal, Source Han Sans CN",
              fontStyle: this.seriesLabelFontStyle[index] || "normal",
              fontSize: this.seriesLabelFontSize[index] || 0,
              color: this.seriesLabelColor[index] || "#333",
              fontWeight: this.seriesLabelFontWeight[index] || "normal",
              offset: [this.seriesLabelOffsetX[index] || 0, this.seriesLabelOffsetY[index] || 0]
            },
            data: item.value
          };
        });
        return list;
      })(),
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

export { EchartdoubleValueLine };
