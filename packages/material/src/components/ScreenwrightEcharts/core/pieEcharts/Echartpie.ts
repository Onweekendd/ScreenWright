import { BaseChart } from "../BaseChart/index";
import type { ArrayDataItem, BaseChartProps } from "../type";
import { pieEchartType } from "../type";

class Echartpie extends BaseChart {
  option: Record<string, any> = {};
  seriesColor: any[] = [];
  seriesFieldList: any[] = ["seriesColor"];
  legendColorFollowColor: any[] = [];
  constructor() {
    const defaultChartProps = {
      name: "饼图",
      prop: pieEchartType.echartpie,
      img: "/img/pie.20240514.png",
      groupName: "饼图"
    };
    super(defaultChartProps);
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
    console.log(this.baseChartProps, "f");
    this.option = baseChartProps.option;
    // 设置饼图的 legendSeriesWidthType 和 legendSeriesWidth
    this.setPieSeriesData(this.option);
    // let optionsData = cloneDeep(baseChartProps.data);
    let optionsData = (await this.transformOptionsDataByDataFilter()) || [];
    optionsData = optionsData.map((a: ArrayDataItem) => {
      return {
        ...a,
        seriesName: a.seriesName + "",
        value: parseFloat(a.value + "")
      };
    });
    const seriesName = optionsData.map((item: ArrayDataItem) => item.seriesName);
    // 删除系列时seriesColor被删除那项还是缓存着，刷新页面后重新设置seriesColor才是对的，所以在刷新配置是重置this[field]
    this.seriesFieldList.forEach((field) => {
      if (this.option[field]) (this as any)[field] = [];
    });
    this.option.dataSeriesName.forEach((item: any, index: number) => {
      const idx = seriesName.indexOf(item);
      if (idx !== -1) {
        optionsData[idx].seriesName = this.option.seriesTabsName[index].value;
        this.seriesFieldList.forEach((field) => {
          (this as any)[field][idx] = this.option[field][index];
        });
      }
    });

    let sum = 0;
    optionsData.forEach((item: { value: number }) => {
      sum += item.value;
    });
    const data = optionsData.map((item: { seriesName: any; value: number }, index: number) => {
      return {
        name: item.seriesName,
        value: item.value,
        percent: ((item.value / sum) * 100).toFixed(this.option.seriesLabelPercentValue) + "%",
        color: this.seriesColor[index]
      };
    });
    switch (this.option.seriesOrder) {
      case "desc":
        data.sort((a: { value: number }, b: { value: number }) => {
          return b.value - a.value;
        });
        break;
      case "asc":
        data.sort((a: { value: number }, b: { value: number }) => {
          return a.value - b.value;
        });
        break;
      default:
        break;
    }
    this.seriesColor = data.map((item: { color: any }) => item.color);
    // let legendData = optionsData.map((item) => {
    //   return {
    //     name: item.seriesName,
    //     value: item.value,
    //     percent:
    //       ((item.value / sum) * 100).toFixed(this.option.legendPercent) + '%'
    //   };
    // });
    const legendData = data.map((item: { name: any; value: number; color: any }) => {
      return {
        name: item.name,
        value: item.value,
        percent: ((item.value / sum) * 100).toFixed(this.option.legendPercent) + "%",
        color: item.color
      };
    });
    switch (this.option.legendOrder) {
      case "desc":
        legendData.sort((a: { value: number }, b: { value: number }) => {
          return b.value - a.value;
        });
        break;
      case "asc":
        legendData.sort((a: { value: number }, b: { value: number }) => {
          return a.value - b.value;
        });
        break;
      default:
        break;
    }
    this.legendColorFollowColor = legendData.map((item: { color: any }) => item.color);
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
            distanceToLabelLine: this.option.seriesDistanceToLabelLine || 0,
            formatter: (params: { name: string; value: any; dataIndex: number }) => {
              return `{name|${this.option.seriesLabelSeriesShow ? params.name + ": " : ""}}${
                this.option.seriesLabelOrient === "horizontal" ? "" : "\n"
              }{value|${this.option.seriesLabelValueShow ? params.value : ""}}{unit|${
                this.option.seriesLabelValueShow ? this.option.seriesLabelUnit : ""
              }}{percent|${
                this.option.seriesLabelPercentShow
                  ? this.option.seriesLabelValueShow
                    ? "(" + data[params.dataIndex].percent + ")"
                    : data[params.dataIndex].percent
                  : ""
              }}`;
            },
            rich: {
              name: {
                fontFamily: this.option.seriesLabelSeriesFontFamily || "Arial",
                fontSize: this.option.seriesLabelSeriesFontSize || 0,
                color: this.option.seriesLabelSeriesColor || "rgba(255, 255, 255, 1)",
                fontStyle: this.option.seriesLabelSeriesFontStyle || "normal",
                fontWeight: this.option.seriesLabelSeriesFontWeight || "normal"
              },
              value: {
                padding: [0, 0, 0, this.option.seriesLabelValueLeftPadding || 0],
                fontFamily: this.option.seriesLabelValueFontFamily || "Arial",
                fontSize: this.option.seriesLabelValueFontSize || 0,
                color: this.option.seriesLabelValueColor || "rgba(255, 255, 255, 1)",
                fontStyle: this.option.seriesLabelValueFontStyle || "normal",
                fontWeight: this.option.seriesLabelValueFontWeight || "normal"
              },
              unit: {
                padding: [0, 0, 0, this.option.seriesLabelUnitLeftPadding || 0],
                fontFamily: this.option.seriesLabelValueFontFamily || "Arial",
                fontSize: this.option.seriesLabelUnitFontSize || 0,
                color: this.option.seriesLabelValueColor || "rgba(255, 255, 255, 1)",
                fontStyle: this.option.seriesLabelValueFontStyle || "normal",
                fontWeight: this.option.seriesLabelValueFontWeight || "normal"
              },
              percent: {
                fontFamily: this.option.seriesLabelPercentFontFamily || "Arial",
                fontSize: this.option.seriesLabelPercentFontSize || 0,
                color: this.option.seriesLabelPercentColor || "rgba(255, 255, 255, 1)",
                fontStyle: this.option.seriesLabelPercentFontStyle || "normal",
                fontWeight: this.option.seriesLabelPercentFontWeight || "normal"
              }
            }
          },
          labelLine: {
            show: true,
            length: this.option.seriesLabelLineLength || 0
          },
          itemStyle: {
            color: (params: { dataIndex: number }) => {
              return this.seriesColor[params.dataIndex];
            },
            borderWidth: this.option.itemBorderWidth || 0,
            borderColor: this.option.itemBorderColor || "rgba(0, 0, 0, 1)"
          },
          // this.option.seriesOrder
          data
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

export { Echartpie };
