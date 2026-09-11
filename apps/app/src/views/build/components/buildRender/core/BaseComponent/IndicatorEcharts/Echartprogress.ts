import { isArray } from "lodash-es";

import { setMinioUrl } from "@/utils/config";

import { getEchartsColorFromCssLinearColor } from "../../utils";
import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { indicatorEchartType } from "../type";

class Echartprogress extends BaseChart {
  seriesFieldList: string[] = [];
  option: Record<string, any> = {};
  seriesColor: any = [];
  constructor() {
    const baseChartProps = {
      name: "进度条",
      prop: indicatorEchartType.echartprogress,
      img: "/img/progress.20240514.png",
      groupName: "指标"
    };
    super(baseChartProps);
    this.seriesFieldList = ["seriesColor"];
  }
  getOptions() {
    return this.options;
  }
  async init(baseChartProps: BaseChartProps) {
    // console.log(this.dataChartItem, '===');
    this.baseChartProps = baseChartProps;
    let optionData: any = await this.transformOptionsDataByDataFilter();
    this.option = baseChartProps.option;
    if (isArray(optionData) && optionData.length) {
      optionData = optionData[0];
    }
    if (!(typeof optionData === "object" && typeof optionData?.value === "number")) {
      console.log("数据格式不正确");

      return false;
    }

    const total = optionData.max || this.option.xAxisMax || optionData.value || 100;
    // css线性渐变色转为echarts线性渐变色
    if (typeof this.option.seriesColor === "object" && !this.option.seriesColor.colorStops) {
      this.seriesColor = getEchartsColorFromCssLinearColor(this.option.seriesColor);
    } else {
      this.seriesColor = this.option.seriesColor;
    }

    // console.log(this.color, 'this.color');
    const options = {
      tooltip: {
        show: false
      },
      legend: {
        show: false
      },
      grid: {
        left: this.option.gridLeft || 0,
        top: this.option.gridTop || 0,
        right: this.option.gridRight || 0,
        bottom: this.option.gridBottom || 0
      },
      xAxis: {
        show: this.validData(this.option.xAxisShow, true),
        // type: this.option.category ? 'category' : 'value',
        type: "value",
        max: optionData.max || this.option.xAxisMax || undefined,
        min: optionData.min || this.option.xAxisMin || undefined,
        splitNumber: this.option.xAxisSplitNumber || 1,
        name: this.option.xAxisNameShow && this.option.xAxisName,
        nameTextStyle: {
          padding: [
            0,
            this.option.xAxisNamePaddingRight || 0,
            this.option.xAxisNamePaddingBottom || 0,
            this.option.xAxisNamePaddingLeft || 0
          ],
          color: this.option.xAxisNameColor || "#333",
          fontSize: this.option.xAxisNameFontSize || 0,
          fontStyle: this.option.xAxisNameFontStyle ? "italic" : "normal",
          fontWeight: this.option.xAxisNameFontWeight ? "bolder" : "normal",
          fontFamily: this.option.xAxisNameFontFamily || "Arial"
        },
        nameGap: 20 + -1 * this.option.xAxisNamePaddingTop,
        // data: optionData.categories || [],
        axisLabel: {
          show: this.validData(this.option.xAxisLabelShow, true),
          margin: this.option.xAxisMargin || 0,
          color: this.option.xAxisColor || "#333",
          fontSize: this.option.xAxisFontSize || 0,
          fontStyle: this.option.xAxisFontStyle ? "italic" : "normal",
          fontWeight: this.option.xAxisFontWeight ? "bolder" : "normal",
          fontFamily: this.option.xAxisFontFamily || "Arial"
        },
        axisLine: {
          show: false
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
          show: false
        }
      },
      yAxis: {
        type: "category",
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          show: false
        },
        splitLine: {
          show: false
        }
      },
      series: [
        // {
        //   type: 'bar',
        //   barWidth: 20,
        //   showBackground: false,
        //   label: {
        //     show: false
        //   },
        //   data: [10]
        // },
        {
          // name: seriesName[index],
          type: "bar",
          barWidth: this.option.seriesBarWidth || 0,
          showBackground: true,
          backgroundStyle: {
            color: this.option.barBackgroundColor || "rgba(0,0,0,0)"
          },
          itemStyle: {
            color: this.seriesColor || "red",
            opacity: this.option.seriesOpacity / 100 || 0,
            borderRadius: this.option.barBorderRadius || 0
          },
          label: {
            show: this.validData(this.option.seriesLabelShow, false),
            position: "insideRight",
            offset: [this.option.seriesLabelOffsetX || 0, this.option.seriesLabelOffsetY || 0],
            formatter: (params: any) => {
              const value =
                this.option.seriesLabelType === "value"
                  ? params.value.toFixed(this.option.seriesLabelPercentValue || 0)
                  : ((params.value / total) * 100).toFixed(this.option.seriesLabelPercentValue || 0);
              return `{prefix|${
                this.option.seriesLabelPrefixShow ? this.option.seriesLabelPrefix || "" : ""
              }}{value|${value}}{unit|${this.option.seriesLabelUnitShow ? this.option.seriesLabelUnit || "" : ""}}`;
            },
            rich: {
              value: {
                fontFamily: this.option.seriesLabelFontFamily || "Source Han Sans CN-Normal, Source Han Sans CN",
                fontStyle: this.option.seriesLabelFontStyle || "normal",
                fontSize: this.option.seriesLabelFontSize || 0,
                color: this.option.seriesLabelColor || "#333",
                fontWeight: this.option.seriesLabelFontWeight || "normal"
              },
              prefix: {
                fontFamily: this.option.seriesLabelPrefixFontFamily || "Source Han Sans CN-Normal, Source Han Sans CN",
                fontStyle: this.option.seriesLabelPrefixFontStyle || "normal",
                fontSize: this.option.seriesLabelPrefixFontSize || 0,
                color: this.option.seriesLabelPrefixColorFollow
                  ? this.option.seriesLabelColor || "#333"
                  : this.option.seriesLabelPrefixColor || "#333",
                fontWeight: this.option.seriesLabelPrefixFontWeight || "normal",
                padding: [0, this.option.seriesLabelPrefixPadding || 0, 0, 0]
              },
              unit: {
                fontFamily: this.option.seriesLabelUnitFontFamily || "Source Han Sans CN-Normal, Source Han Sans CN",
                fontStyle: this.option.seriesLabelUnitFontStyle || "normal",
                fontSize: this.option.seriesLabelUnitFontSize || 0,
                color: this.option.seriesLabelUnitColorFollow
                  ? this.option.seriesLabelColor || "#333"
                  : this.option.seriesLabelUnitColor || "#333",
                fontWeight: this.option.seriesLabelUnitFontWeight || "normal",
                padding: [0, 0, 0, this.option.seriesLabelUnitPadding || 0]
              }
            }
          },
          data: [optionData.value]
        }
        // {
        //   type: 'bar',
        //   barWidth: 20,
        //   showBackground: false,
        //   label: {
        //     show: false
        //   },
        //   data: [10]
        // }
      ],
      animation: this.validData(this.option.animationShow, true),
      animationDuration: this.option.animationDuration * 1000 || 0
    };
    if (this.validData(this.option.headImgShow, false)) {
      options.series.push({
        type: "pictorialBar",
        symbol: `image://${setMinioUrl(this.option.headImg)}`,
        symbolSize: [this.option.headImgWidth || 0, this.option.headImgHeight || 0],
        symbolOffset: [this.option.headImgOffsetX || 0, this.option.headImgOffsetY || 0],
        zlevel: 4,
        tooltip: {
          show: false
        },
        //@ts-ignore
        label: {
          show: false
        },
        data: [
          {
            value: optionData.value,
            symbolPosition: "end"
          }
        ]
      });
    }
    this.options = options;
  }
}

export { Echartprogress };
