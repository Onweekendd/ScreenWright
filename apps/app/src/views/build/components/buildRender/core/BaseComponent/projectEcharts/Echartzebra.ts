import { orderBy } from "lodash-es";

import {
  getEchartsColorFromCssLinearColor,
  getMaxColorListByData,
  getTooltipByColor,
  limitTextInLine
} from "../../utils";
import { BaseChart } from "../BaseChart/index";
import type { ArrayDataItem, BaseChartProps } from "../type";
import { projectEchartType } from "../type";

class Echartzebra extends BaseChart {
  option: Record<string, any> = {};
  dataLength = 0;
  seriesColor = "";
  hoverColor = "";
  colorNameList: string[] = [];
  constructor() {
    const defaultChartProps = {
      name: "斑马柱状图2",
      prop: projectEchartType.echartzebra2,
      img: "/img/zebra2.f1d2ff44.png",
      groupName: "项目"
    };
    super(defaultChartProps);
    this.colorNameList = ["seriesColor", "hoverColor"];
  }

  getOptions() {
    return this.options;
  }

  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    const optionsData = await this.transformOptionsData(baseChartProps.data);
    // const { axisName: xAxisName, optionData } = this.getEchartsAxisNameAndSeriesData(optionsData);
    // console.log(optionData, "optionDataoptionDataoptionData");
    this.dataLength = optionsData[0]?.list.length || 0;
    const isSort = this.option.isSort;
    const data = isSort ? orderBy(optionsData[0]?.list || [], ["value"], ["desc"]) : optionsData[0]?.list || [];
    this.colorNameList.forEach((item) => {
      if (typeof this.option[item] === "object" && !this.option[item].colorStops) {
        (this[item as keyof Echartzebra] as any) = getEchartsColorFromCssLinearColor(this.option[item]);
      } else (this[item as keyof Echartzebra] as any) = this.option[item];
    });
    const colorList = getMaxColorListByData(data, this.seriesColor, this.hoverColor, isSort);

    const options = {
      tooltip: getTooltipByColor("#008aff", this.option.tooltipUnit, this.option.tooltipFixed),
      grid: this.createGrid(this.option),
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
        data: data.map((item: ArrayDataItem) => item.name) || [],
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
        max: Number(this.option.yAxisMax) || undefined,
        min: Number(this.option.yAxisMin) || undefined,
        minInterval: this.option.yAxisNameShow && this.option.yAxisName.includes("人") ? 1 : "auto", // 单位包含"人"则单位间隔改为1
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
      series: [
        // 顶部
        {
          type: "pictorialBar",
          symbol: "rect",
          symbolSize: [this.option.seriesWidth + 4, 5],
          symbolOffset: [0, -8],
          zlevel: 4,
          tooltip: {
            show: false
          },
          itemStyle: {
            color: "#ffffff",
            shadowBlur: 20,
            shadowColor: "rgba(0, 214, 255, 1)"
          },
          data:
            this.option.xAxisType === "time"
              ? data.map((item: ArrayDataItem) => {
                  return {
                    value: [item.name, item.value],
                    symbolPosition: "end"
                  };
                })
              : data.map((item: ArrayDataItem) => {
                  return {
                    value: item.value,
                    symbolPosition: "end"
                  };
                })
        },
        {
          type: "bar",
          barWidth: this.option.seriesWidth,
          itemStyle: {
            color:
              this.option.isSort || this.option.isHover
                ? (params: { dataIndex: number }) => {
                    return colorList[params.dataIndex];
                  }
                : this.seriesColor,
            opacity: this.option.seriesOpacity / 100 || 0
          },
          data:
            this.option.xAxisType === "time"
              ? data.map((item: ArrayDataItem) => {
                  return {
                    name: item.name,
                    value: [item.name, item.value]
                  };
                })
              : data
        },
        // 分割线
        {
          z: 20,
          type: "pictorialBar",
          symbol: "rect",
          symbolRepeat: "true",
          symbolMargin: "160%",
          symbolClip: true,
          symbolSize: [this.option.seriesWidth, 3],
          itemStyle: {
            color: this.option.intervalColor || "rgba(4,18,40,0.8)"
          },
          data:
            this.option.xAxisType === "time"
              ? data.map((item: ArrayDataItem) => {
                  return {
                    name: item.name,
                    value: [item.name, item.value]
                  };
                })
              : data,
          tooltip: {
            show: false
          }
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

export { Echartzebra };
