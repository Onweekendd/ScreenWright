import { isArray, orderBy } from "lodash-es";

import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { indicatorEchartType } from "../type";

class EchartGauge extends BaseChart {
  seriesFieldList: string[] = [];
  option: Record<string, any> = {};
  seriesColor: any = [];
  constructor() {
    const baseChartProps = {
      name: "仪表盘",
      prop: indicatorEchartType.echartprogress,
      img: "/img/gauge.9eabe330.png",
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
    this.option = baseChartProps.option;
    let optionData: any = await this.transformOptionsDataByDataFilter();
    // this.option = baseChartProps.option;
    if (isArray(optionData) && optionData.length) {
      optionData = optionData[0];
    }
    if (!(typeof optionData === "object" && typeof optionData?.value === "number")) {
      console.log("数据格式不正确");

      return false;
    }

    // console.log(this.color, 'this.color');
    let scopeColorList = this.option.axisLineColor.map((item: any, index: any) => {
      return {
        scope: this.option.axisLineScope[index],
        color: item
      };
    });
    // 升序
    scopeColorList = orderBy(scopeColorList, "scope", "asc");
    const axisLineColorList = scopeColorList.map((item: any) => {
      return [item.scope, item.color];
    });
    const options = {
      // grid: {
      //   left: this.option.gridX || 20,
      //   top: this.option.gridY || 60,
      //   right: this.x2,
      //   bottom: this.option.gridY2 || 60
      // },
      series: [
        {
          type: "gauge",
          min: this.option.min || 0,
          max: this.option.max || 0,
          startAngle: 180,
          endAngle: 0,
          //   radius: [
          //   this.option.radiusMin || 0 + '%',
          //   this.option.radiusMax || 0 + '%'
          // ],
          splitNumber: this.option.splitNumber || 1,
          axisLabel: {
            show: this.validData(this.option.axisLabelShow, true),
            fontFamily: this.option.axisLabelFontFamily || "Source Han Sans CN-Normal, Source Han Sans CN",
            fontSize: this.option.axisLabelFontSize || 18,
            fontStyle: this.option.axisLabelFontStyle || "normal",
            fontWeight: this.option.axisLabelFontWeight || "normal",
            distance: this.option.axisLabelDistance || 0,
            color: this.option.axisLabelColor || "rgba(255, 255, 255, 1)",
            formatter: (value: any) => {
              return value.toFixed(this.option.axisLabelToFixed || 0);
            }
          },
          splitLine: {
            show: this.validData(this.option.splitLineShow, true),
            distance: this.option.splitLineDistance || 0,
            length: this.option.splitLineLength || 0,
            lineStyle: {
              width: this.option.splitLineWidth || 0,
              color: this.option.splitLineColor || "rgba(255, 255, 255, 1)"
            }
          },
          detail: {
            show: this.validData(this.option.seriesDetailShow, true),
            color: this.option.seriesDetailColor || "rgba(255, 255, 255, 1)",
            fontSize: this.option.valueFontSize || 30,
            // formatter: '{value}' + optionData.unit,
            offsetCenter: [(this.option.seriesDetailOffsetX || 0) + "%", (this.option.seriesDetailOffsetY || 0) + "%"],
            formatter: (param: any) => {
              const value = param.toFixed(this.option.seriesDetailPercentValue || 0);
              return `{prefix|${
                this.option.seriesDetailPrefixShow ? this.option.seriesDetailPrefix || "" : ""
              }}{value|${value}}{unit|${this.option.seriesDetailUnitShow ? this.option.seriesDetailUnit || "" : ""}}`;
            },
            rich: {
              value: {
                fontFamily: this.option.seriesDetailFontFamily || "Source Han Sans CN-Normal, Source Han Sans CN",
                fontStyle: this.option.seriesDetailFontStyle || "normal",
                fontSize: this.option.seriesDetailFontSize || 0,
                color: this.option.seriesDetailColor || "#333",
                fontWeight: this.option.seriesDetailFontWeight || "normal"
              },
              prefix: {
                fontFamily: this.option.seriesDetailPrefixFontFamily || "Source Han Sans CN-Normal, Source Han Sans CN",
                fontStyle: this.option.seriesDetailPrefixFontStyle || "normal",
                fontSize: this.option.seriesDetailPrefixFontSize || 0,
                color: this.option.seriesDetailPrefixColorFollow
                  ? this.option.seriesDetailColor || "#333"
                  : this.option.seriesDetailPrefixColor || "#333",
                fontWeight: this.option.seriesDetailPrefixFontWeight || "normal",
                padding: [0, this.option.seriesDetailPrefixPadding || 0, 0, 0]
              },
              unit: {
                fontFamily: this.option.seriesDetailUnitFontFamily || "Source Han Sans CN-Normal, Source Han Sans CN",
                fontStyle: this.option.seriesDetailUnitFontStyle || "normal",
                fontSize: this.option.seriesDetailUnitFontSize || 0,
                color: this.option.seriesDetailUnitColorFollow
                  ? this.option.seriesDetailColor || "#333"
                  : this.option.seriesDetailUnitColor || "#333",
                fontWeight: this.option.seriesDetailUnitFontWeight || "normal",
                padding: [0, 0, 0, this.option.seriesDetailUnitPadding || 0]
              }
            }
          },
          axisLine: {
            lineStyle: {
              color: [...axisLineColorList, [1, "rgba(0, 0, 0, 0)"]],
              width: this.option.axisLineWidth || 0
            }
          },
          axisTick: {
            show: false,
            lineStyle: {
              color: this.option.lineColor || "#eee"
            }
          },
          pointer: {
            show: this.validData(this.option.pointerShow, true),
            length: this.option.pointerlength || 0,
            itemStyle: {
              color: this.option.pointerColor || "rgba(255, 255, 255, 1)"
            }
          },
          anchor: {
            show: this.validData(this.option.anchorShow, true),
            size: this.option.anchorSize || 0,
            itemStyle: {
              color: this.option.anchorColor || "rgba(255, 255, 255, 1)"
            }
          },
          title: {
            color: this.option.nameColor,
            fontSize: this.option.nameFontSize || 20
          },
          data: [optionData]
        }
      ],
      animation: this.validData(this.option.animationShow, true),
      animationDuration: this.option.animationDuration * 1000 || 0
    };
    this.options = options;
  }
}

export { EchartGauge };
