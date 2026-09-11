import { descSort, getEchartsColorFromCssLinearColor, getMaxColorListByData, getTooltipByColor } from "../../utils";
import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { projectEchartType } from "../type";

interface EchartthinBarDataItem {
  name: string;
  value: number;
}
class EchartthinBar extends BaseChart {
  option: Record<string, any> = {};
  colorNameList: string[] = [];
  seriesColor: string[] = [];
  hoverColor: string[] = [];
  constructor() {
    const defaultChartProps = {
      name: "细长柱状图",
      prop: projectEchartType.echartthinBar,
      img: "/img/rankBar2.20240514.png",
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

    const isSort = this.option.isSort;
    const optionsData = await this.transformOptionsDataByDataFilter();
    const data = isSort ? descSort(optionsData, "value") : optionsData;
    this.colorNameList.forEach((item) => {
      if (typeof this.option[item] === "object" && !this.option[item].colorStops) {
        (this[item as keyof EchartthinBar] as any) = getEchartsColorFromCssLinearColor(this.option[item]);
      } else (this[item as keyof EchartthinBar] as any) = this.option[item];
    });
    const colorList = getMaxColorListByData(data, this.seriesColor, this.hoverColor, false);
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
        data: data.map((item: EchartthinBarDataItem) => item.name) || [],
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
        {
          type: "bar",
          barWidth: this.option.seriesWidth,
          itemStyle: {
            barBorderRadius: [20, 20, 0, 0],
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
              ? data.map((item: EchartthinBarDataItem) => {
                  return {
                    name: item.name,
                    value: [item.name, item.value]
                  };
                })
              : data
        }
      ],
      animationDelay: (idx: number) => {
        idx += 0.5;
        return idx * 100;
      },
      animationEasing: "linear"
    };

    this.options = options;
  }
}

export { EchartthinBar };
