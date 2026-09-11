import { BaseChart } from "../BaseChart/index";
import type { ArrayDataItem, BaseChartProps } from "../type";
import { pieEchartType } from "../type";

class EchartloopRingPie extends BaseChart {
  // 原始数据的option
  option: Record<string, any> = {};
  blankData: any[] = [];
  seriesLabelBackground: any[] = [];
  seriesColor: any[] = [];
  seriesOpacity: any = [];
  seriesFieldList: string[] = [];
  displayRows = 4;
  legendGridTop = 0;
  legendGridLeft = 0;
  legendGridRight = 0;
  legendGridBottom = 0;
  legendColorFollowColor: any[] = [];
  dataLength = 0;
  constructor() {
    const defaultChartProps = {
      name: "轮播环形饼图",
      prop: pieEchartType.echartloopRingPie,
      img: "/img/loopRingPie.01253399.png",
      groupName: "饼图"
    };
    super(defaultChartProps);
    this.seriesColor = [];
    this.seriesLabelBackground = [];
    this.blankData = [];
    this.legendColorFollowColor = [];
    this.seriesFieldList = ["seriesColor"];
  }

  getOptions() {
    return this.options;
  }
  getIndexByField(data: any[], field: string, value: any) {
    return data.findIndex((item) => {
      return item[field] === value;
    });
  }
  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    // 设置饼图的 legendSeriesWidthType 和 legendSeriesWidth
    this.setPieSeriesData(this.option);
    // this.option.legendSeriesWidthType = isUndefined(this.option.legendSeriesWidthType)
    //   ? "auto"
    //   : this.option.legendSeriesWidthType

    // this.option.legendSeriesWidth = isUndefined(this.option.legendSeriesWidth) ? 100 : this.option.legendSeriesWidth
    // let optionsData = cloneDeep(baseChartProps.data);
    let optionsData = (await this.transformOptionsDataByDataFilter()) || [];
    optionsData = optionsData.map((a: ArrayDataItem) => {
      return {
        ...a,
        seriesName: a.seriesName + "",
        value: parseFloat(a.value + "")
      };
    });
    let seriesName: string[] = [];
    seriesName = optionsData.map((item: ArrayDataItem) => item.seriesName);
    // 删除系列时seriesColor被删除那项还是缓存着，刷新页面后重新设置seriesColor才是对的，所以在刷新配置是重置this[field]
    this.seriesFieldList.forEach((field) => {
      if (this.option[field]) (this[field as keyof EchartloopRingPie] as any) = [];
    });
    this.option.dataSeriesName.forEach((item: any, index: number) => {
      const idx = seriesName.indexOf(item);
      if (idx !== -1) {
        optionsData[idx].seriesName = this.option.seriesTabsName[index].value;
        this.seriesFieldList.forEach((field) => {
          (this[field as keyof EchartloopRingPie] as any[])[idx] = this.option[field][index];
        });
      }
    });
    let sum = 0;
    optionsData.forEach((item: ArrayDataItem) => {
      sum += item.value;
    });
    const data = optionsData.map((item: ArrayDataItem, index: number) => {
      const percent = sum === 0 ? 0 + "%" : ((item.value / sum) * 100).toFixed(this.option.legendPercent) + "%";
      return {
        name: item.seriesName,
        value: item.value,
        percent: percent,
        color: this.seriesColor[index]
      };
    });
    this.dataLength = data.length * 2;
    switch (this.option.seriesOrder) {
      case "desc":
        data.sort((a: ArrayDataItem, b: ArrayDataItem) => {
          return b.value - a.value;
        });
        break;
      case "asc":
        data.sort((a: ArrayDataItem, b: ArrayDataItem) => {
          return a.value - b.value;
        });
        break;
      default:
        break;
    }
    const legendData = data.map((item: any) => {
      const percent = sum === 0 ? 0 + "%" : ((item.value / sum) * 100).toFixed(this.option.legendPercent) + "%";
      return {
        name: item.name,
        value: item.value,
        percent: percent,
        color: item.color
      };
    });
    switch (this.option.legendOrder) {
      case "desc":
        legendData.sort((a: ArrayDataItem, b: ArrayDataItem) => {
          return b.value - a.value;
        });
        break;
      case "asc":
        legendData.sort((a: ArrayDataItem, b: ArrayDataItem) => {
          return a.value - b.value;
        });
        break;
      default:
        break;
    }
    this.legendColorFollowColor = legendData.map((item: any) => item.color);
    switch (this.option.seriesOrder) {
      case "desc":
        data.sort((a: ArrayDataItem, b: ArrayDataItem) => {
          return b.value - a.value;
        });
        break;
      case "asc":
        data.sort((a: ArrayDataItem, b: ArrayDataItem) => {
          return a.value - b.value;
        });
        break;
      default:
        break;
    }
    this.seriesColor = data.map((item: any) => item.color);
    const options = {
      title: this.createTitle(this.option),
      legend: {
        ...this.createLegend(this.option),
        data: legendData.map((item: any) => {
          return {
            name: item.name
          };
        }),
        formatter: (name: any) => {
          const index = this.getIndexByField(legendData, "name", name);
          if (index < 0) return "{name_}";
          return `{name_${index}|${this.option.legendSeriesShow ? legendData[index].name : ""}}{value_${index}|${
            this.option.legendValueShow ? legendData[index].value : ""
          }}{unit_${index}|${this.option.legendValueShow ? this.option.legendUnit : ""}}{percent_${index}|${
            this.option.legendPercentShow
              ? this.option.legendValueShow
                ? "(" + legendData[index].percent + ")"
                : legendData[index].percent
              : ""
          }}`;
        }
      },
      series: (() => {
        return {
          type: "pie",
          left: this.option.seriesLeft || 0,
          top: this.option.seriesTop || 0,
          right: this.option.seriesRight || 0,
          bottom: this.option.seriesBottom || 0,
          radius: [`${this.option.pieRadiusInner || 0}%`, `${this.option.pieRadiusOuter || 0}%`],
          startAngle: this.option.pieStartAngle || 0,
          clockwise: this.validData(this.option.pieClockwise, false),
          roseType: this.validData(this.option.pieRoseType, false),
          label: {
            show: this.option.seriesLabelShow,
            position: "center",
            // distanceToLabelLine: this.option.seriesDistanceToLabelLine || 0,
            formatter: (params: any) => {
              if (!params.name) return "";
              const list = [];
              if (this.option.seriesLabelSeriesShow) list.push(`{name|${params.name}}`);
              if (this.option.seriesLabelValueShow)
                list.push(`{value|${params.value}}{unit|${this.option.seriesLabelUnit}}`);
              if (this.option.seriesLabelPercentShow)
                list.push(`{percent|${data[Math.floor(params.dataIndex / 2)].percent}}`);
              return list.join("\n");
            },
            rich: {
              name: {
                padding: [0, 0, this.option.seriesLabelValueBottomPadding || 0, 0],
                fontFamily: this.option.seriesLabelSeriesFontFamily || "Arial",
                fontSize: this.option.seriesLabelSeriesFontSize || 0,
                color: this.option.seriesLabelSeriesColor || "rgba(255, 255, 255, 1)",
                fontStyle: this.option.seriesLabelSeriesFontStyle || "normal",
                fontWeight: this.option.seriesLabelSeriesFontWeight || "normal",
                align: "center",
                verticalAlign: "center"
              },
              value: {
                padding: [
                  0,
                  0,
                  this.option.seriesLabelValueBottomPadding || 0,
                  this.option.seriesLabelValueLeftPadding || 0
                ],
                fontFamily: this.option.seriesLabelValueFontFamily || "Arial",
                fontSize: this.option.seriesLabelValueFontSize || 0,
                color: this.option.seriesLabelValueColor || "rgba(255, 255, 255, 1)",
                fontStyle: this.option.seriesLabelValueFontStyle || "normal",
                fontWeight: this.option.seriesLabelValueFontWeight || "normal",
                align: "center",
                verticalAlign: "center"
              },
              unit: {
                padding: [
                  0,
                  0,
                  this.option.seriesLabelValueBottomPadding || 0,
                  this.option.seriesLabelUnitLeftPadding || 0
                ],
                fontFamily: this.option.seriesLabelValueFontFamily || "Arial",
                fontSize: this.option.seriesLabelUnitFontSize || 0,
                color: this.option.seriesLabelValueColor || "rgba(255, 255, 255, 1)",
                fontStyle: this.option.seriesLabelValueFontStyle || "normal",
                fontWeight: this.option.seriesLabelValueFontWeight || "normal",
                align: "center",
                verticalAlign: "center"
              },
              percent: {
                fontFamily: this.option.seriesLabelPercentFontFamily || "Arial",
                fontSize: this.option.seriesLabelPercentFontSize || 0,
                color: this.option.seriesLabelPercentColor || "rgba(255, 255, 255, 1)",
                fontStyle: this.option.seriesLabelPercentFontStyle || "normal",
                fontWeight: this.option.seriesLabelPercentFontWeight || "normal",
                align: "center",
                verticalAlign: "center"
              }
            }
          },
          emphasis: {
            label: {
              show: true
            },
            scale: this.option.seriesEmphasisScale,
            // this.main.isBuild todo
            scaleSize: !this.option.tooltipLoop && this.option.isBuild ? 0 : this.option.seriesEmphasisScaleSize || 0
          },
          data: (() => {
            const list: any = [];
            data.forEach((item: any, index: number) => {
              list.push(
                {
                  name: item.name,
                  value: item.value,
                  itemStyle: {
                    color: this.seriesColor[index],
                    borderWidth: this.option.itemBorderWidth || 0,
                    borderColor: this.option.itemBorderColor || "rgba(0, 0, 0, 1)"
                  }
                },
                {
                  name: null,
                  value: (() => {
                    const valueList = data.map((item: ArrayDataItem) => item.value);
                    return (eval(valueList.join("+")) / valueList.length) * ((this.option.piePaddingNum || 0) / 100);
                  })(),
                  itemStyle: {
                    color: "rgba(0,0,0,0)"
                  },
                  emphasis: {
                    disabled: true
                  }
                }
              );
            });
            return list;
          })()
        };
      })()
    };
    legendData.forEach((item: any, index: number) => {
      options.legend.textStyle.rich[`name_${index}`] = {
        fontFamily: this.option.legendSeriesFontFamily || "Arial",
        fontSize: this.option.legendSeriesFontSize || 0,
        color: this.option.legendSeriesColor || "rgba(255, 255, 255, 1)",
        fontStyle: this.option.legendSeriesFontStyle || "normal",
        fontWeight: this.option.legendSeriesFontWeight || "normal",
        width: this.option?.legendSeriesWidthType === "custom" ? this.option?.legendSeriesWidth : "auto"
      };
      options.legend.textStyle.rich[`value_${index}`] = {
        padding: [0, 0, 0, this.option.legendValueLeftPadding || 0],
        fontFamily: this.option.legendValueFontFamily || "Arial",
        fontSize: this.option.legendValueFontSize || 0,
        color:
          (this.option.legendValueColorFollow ? this.legendColorFollowColor[index] : this.option.legendValueColor) ||
          "rgba(255, 255, 255, 1)",
        fontStyle: this.option.legendValueFontStyle || "normal",
        fontWeight: this.option.legendValueFontWeight || "normal"
      };
      options.legend.textStyle.rich[`unit_${index}`] = {
        padding: [0, 0, 0, this.option.legendUnitLeftPadding || 0],
        fontFamily: this.option.legendValueFontFamily || "Arial",
        fontSize: this.option.legendUnitFontSize || 0,
        color:
          (this.option.legendValueColorFollow ? this.legendColorFollowColor[index] : this.option.legendValueColor) ||
          "rgba(255, 255, 255, 1)",
        fontStyle: this.option.legendValueFontStyle || "normal",
        fontWeight: this.option.legendValueFontWeight || "normal"
      };
      options.legend.textStyle.rich[`percent_${index}`] = {
        padding: [0, 0, 0, this.option.legendPercentLeftPadding || 0],
        fontFamily: this.option.legendPercentFontFamily || "Arial",
        fontSize: this.option.legendPercentFontSize || 0,
        color:
          (this.option.legendPercentColorFollow
            ? this.legendColorFollowColor[index]
            : this.option.legendPercentColor) || "rgba(255, 255, 255, 1)",
        fontStyle: this.option.legendPercentFontStyle || "normal",
        fontWeight: this.option.legendPercentFontWeight || "normal"
      };
    });

    this.options = options;
  }
}

export { EchartloopRingPie };
