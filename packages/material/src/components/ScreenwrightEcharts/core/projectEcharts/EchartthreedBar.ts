// import { cloneDeep } from "lodash-es";

import { getEchartsColorFromCssLinearColor, getTooltipByColor } from "../../utils";
import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { projectEchartType } from "../type";

class EchartthreedBar extends BaseChart {
  option: Record<string, any> = {};
  colorNameList: string[] = [];
  dataLength = 0;
  seriesColor = "";
  constructor() {
    const defaultChartProps = {
      name: "3D柱状图",
      prop: projectEchartType.echartoverlapBar,
      img: "/img/overlapBar.8ea5f49e.png",
      groupName: "项目"
    };
    super(defaultChartProps);
    this.colorNameList = ["seriesColor"];
  }

  getOptions() {
    return this.options;
  }

  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    const optionsData = await this.transformOptionsDataByDataFilter();
    // let data = cloneDeep(optionsData[0].list || []);
    const data = this.transformAxisData(optionsData, baseChartProps.yAxisType);
    this.dataLength = optionsData.length;
    this.colorNameList.forEach((item) => {
      if (typeof this.option[item] === "object" && !this.option[item].colorStops) {
        (this[item as keyof EchartthreedBar] as any) = getEchartsColorFromCssLinearColor(
          Array.isArray(this.option[item]) ? this.option[item][0] : this.option[item]
        );
      } else (this[item as keyof EchartthreedBar] as any) = this.option[item];
    });
    const options = {
      tooltip: getTooltipByColor("#008aff", this.option.tooltipUnit, this.option.tooltipFixed),
      grid: this.createGrid(this.option),
      dataZoom: [],
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
        data: data.map((item: { name: string }) => item.name) || [],
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
            color: this.option.seriesTopColor
          },
          data: data.map((item: { value: number }) => {
            return {
              value: item.value,
              symbolPosition: "end"
            };
          })
        },
        // 1
        {
          type: "bar",
          barWidth: 1,
          barGap: 0,
          itemStyle: {
            color: this.seriesColor
          },
          tooltip: {
            show: false
          },
          data
        },
        // 2
        {
          type: "bar",
          barWidth: this.option.seriesWidth,
          barGap: 0,
          itemStyle: {
            color: this.seriesColor,
            opacity: this.option.seriesOpacity / 100 || 0
          },
          data
        },
        // 3
        {
          type: "bar",
          barWidth: 1,
          barGap: 0,
          itemStyle: {
            color: this.seriesColor
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
          data
        },
        // 4
        {
          type: "bar",
          barWidth: this.option.seriesWidth,
          barGap: 0,
          itemStyle: {
            color: this.seriesColor,
            opacity: this.option.seriesOpacity / 100 || 0
          },
          tooltip: {
            show: false
          },
          data
        },
        // 5
        {
          type: "bar",
          barWidth: 1,
          barGap: 0,
          itemStyle: {
            color: this.seriesColor
          },
          tooltip: {
            show: false
          },
          data
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
            color: this.option.seriesBottomColor
          },
          data
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

export { EchartthreedBar };
