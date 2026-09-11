import { setMinioUrl } from "@material/minioUrl";

import { getEchartsColorFromCssLinearColor } from "../../utils";
import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { BarEchartType } from "../type";

class EchartlineAndBar extends BaseChart {
  dataLength = 0;
  legendGridTop = 0;
  legendGridLeft = 0;
  legendGridRight = 0;
  legendGridBottom = 0;
  option: Record<string, any> = {};
  seriesTabs = "";
  linearColorFieldList: string[] = [];
  seriesType: string[] = [];
  seriesBarColor: any[] = [];
  seriesFieldList: string[] = [];
  seriesLineColor: string[] = [];
  tooltipMarkerColor: string[] = [];
  seriesSmoothShow: string[] = []; // 平滑曲线
  seriesSmooth: any[] = [];
  seriesSymbolShow: any[] = [];
  seriesSymbol: any[] = [];
  seriesSymbolImage: any[] = [];
  seriesSymbolWidth: any[] = [];
  seriesSymbolHeight: any[] = [];
  seriesItemColor: any[] = [];
  seriesItemBorderWidth: any[] = [];
  seriesItemBorderColor: any[] = [];
  seriesLineWidth: any[] = [];
  seriesLabelShow: any[] = [];
  seriesLabelColor: any[] = [];
  seriesLabelFontFamily: any[] = [];
  seriesLabelFontSize: any[] = [];
  seriesLabelFontWeight: any[] = [];
  seriesLabelFontStyle: any[] = [];
  seriesLabelOffsetX: any[] = [];
  seriesLabelOffsetY: any[] = [];
  seriesBarOpacity: any[] = [];
  seriesAreaColor: any[] = [];
  seriesAreaOpacity: any[] = [];
  constructor() {
    const baseChartProps = {
      name: "折线柱形图",
      prop: BarEchartType.echartlineAndBar,
      img: "/img/bar4.20240514.png",
      groupName: "柱状图"
    };
    super(baseChartProps);
    this.seriesFieldList = [
      "seriesType",
      "seriesBarColor",
      "seriesBarOpacity",
      "seriesAreaColor",
      "seriesAreaOpacity",
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
    this.linearColorFieldList = ["seriesBarColor", "seriesAreaColor"];
  }
  getOptions() {
    return this.options;
  }
  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    console.log("fzz", this.baseChartProps);
    this.option = baseChartProps.option;
    let optionData = await this.transformOptionsData(baseChartProps.data);
    console.log(optionData, "optionData");
    const { axisName: xAxisName, optionData: data } = this.getEchartsAxisNameAndSeriesData(optionData);
    optionData = data;
    this.dataLength = xAxisName.length;
    if (this.option.xAxisType === "time") {
      optionData = optionData.map((items) => {
        return {
          name: items.name,
          list: items.list.map((item: { name: any; seriesName: any; value: any }) => {
            return {
              name: item.name,
              seriesName: item.seriesName,
              value: [item.name, item.value]
            };
          })
        };
      });
    }
    let seriesName: any[] = [];
    seriesName = optionData.map((item) => item.name);
    this.seriesTabs = "系列1";
    // 删除系列时seriesColor被删除那项还是缓存着，刷新页面后重新设置seriesColor才是对的，所以在刷新配置是重置this[field]
    this.seriesFieldList.forEach((field) => {
      if (this.option && this.option[field as keyof typeof this.option]) {
        (this as any)[field] = [];
      }
    });

    this.option.dataSeriesName.forEach((item: any, index: number) => {
      const idx = seriesName.indexOf(item);
      if (idx !== -1) {
        seriesName[idx] = this.option.seriesTabsName[index].value;
        this.seriesFieldList.forEach((field) => {
          (this as any)[field][idx] = this.option[field][index];
        });
      }
    });
    // css线性渐变色转为echarts线性渐变色
    this.linearColorFieldList.forEach((field) => {
      if (this[field as keyof EchartlineAndBar]) {
        const value = this[field as keyof EchartlineAndBar];
        if (Array.isArray(value)) {
          (this as any)[field] = value.map((item) => {
            if (typeof item === "object" && !item.colorStops) {
              return getEchartsColorFromCssLinearColor(item);
            }
            return item;
          });
        }
      }
    });
    this.seriesType.forEach((item, index) => {
      if (item === "bar") {
        this.tooltipMarkerColor[index] =
          typeof this.seriesBarColor[index] === "object"
            ? this.seriesBarColor[index].colorStops[1].color
            : this.seriesBarColor[index];
      } else this.tooltipMarkerColor[index] = this.seriesLineColor[index];
    });

    const tooltipUnit = this.setTooltipUnit(
      this.option,
      optionData.map((item) => item.name)
    );
    const options = {
      title: this.createTitle(this.option),
      tooltip: this.createTooltip(this.option, tooltipUnit, this.screenScale, this.tooltipMarkerColor),
      grid: {
        left: this.option.gridLeft || 0,
        top: this.option.gridTop || 0,
        right: this.option.gridRight || 0,
        bottom: this.option.gridBottom || 0
      },
      legend: {
        show: this.validData(this.option.legendShow, false),
        orient: this.option.legendOrient || "horizontal",
        ...this.option.legendGrid,
        width: this.option.legendWidth || 0,
        height: this.option.legendHeight || 0,
        itemWidth: this.option.legendItemWidth || 0,
        itemHeight: this.option.legendItemHeight || 0,
        itemGap: this.option.legendItemGap || 0,
        padding: (() => {
          const { legendOffsetX, legendOffsetY, legendGrid } = this.option;
          const { top = 0, right = 0, bottom = 0, left = 0 } = legendGrid;
          return [
            top ? 0 : legendOffsetY,
            right ? 0 : -1 * legendOffsetX,
            bottom ? 0 : -1 * legendOffsetY,
            left ? 0 : legendOffsetX
          ];
        })(),
        selectedMode: this.option.legendSelectedMode,
        // x: this.option.legendPostion || 'left',
        // top: 0,
        // right: this.x2,
        textStyle: {
          fontFamily: this.option.legendFontFamily || "Arial",
          fontSize: this.option.legendFontSize || 0,
          color: this.option.legendColor || "rgba(255, 255, 255, 1)",
          fontStyle: this.option.legendFontStyle || "normal",
          fontWeight: this.option.legendFontWeight || "normal",
          padding: [0, 0, 0, this.option.legendTextLeftPadding || 0]
        }
      },
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
      yAxis: (() => {
        const list = (this.option.yAxisShow || []).map((item: any, index: number) => {
          return {
            show: this.validData(this.option.yAxisShow[index], true),
            type: "value",
            max: Number(this.option.yAxisMax[index]) || undefined,
            min: Number(this.option.yAxisMin[index]) || undefined,
            name: this.option.yAxisNameShow[index] && this.option.yAxisName[index],
            nameTextStyle: {
              padding: [
                0,
                this.option.yAxisNamePaddingRight[index] || 0,
                this.option.yAxisNamePaddingBottom[index] || 0,
                this.option.yAxisNamePaddingLeft[index] || 0
              ],
              color: this.option.yAxisNameColor[index] || "#333",
              fontSize: this.option.yAxisNameFontSize[index] || 0,
              fontStyle: this.option.yAxisNameFontStyle[index] || "normal",
              fontWeight: this.option.yAxisNameFontWeight[index] || "normal",
              fontFamily: this.option.yAxisNameFontFamily[index] || "Arial"
            },
            nameGap: 20 + -1 * (this.option.yAxisNamePaddingTop[index] || 0),
            axisLabel: {
              show: this.validData(this.option.yAxisLabelShow[index], true),
              margin: this.option.yAxisMargin[index] || 0,
              color: this.option.yAxisColor[index] || "#333",
              fontSize: this.option.yAxisFontSize[index] || 0,
              fontStyle: this.option.yAxisFontStyle[index] || "normal",
              fontWeight: this.option.yAxisFontWeight[index] || "normal",
              fontFamily: this.option.yAxisFontFamily[index] || "Arial"
            },
            axisLine: {
              show: this.validData(this.option.yAxisLineShow[index], true),
              lineStyle: {
                color: this.option.yAxisLineColor[index] || "#333",
                width: this.option.yAxisLineWidth[index] || 0
              }
            },
            splitLine: {
              show: this.validData(this.option.yAxisSplitLineShow[index], true),
              lineStyle: {
                type: "dashed",
                width: this.option.yAxisSplitLineWidth[index] || 0,
                color: this.option.yAxisSplitLineColor[index] || "#333"
              }
            },
            axisTick: {
              show: this.validData(this.option.yAxisTickShow[index], true),
              length: this.option.yAxisTickLength[index] || 0,
              lineStyle: {
                color: this.option.yAxisTickColor[index] || "#333",
                width: this.option.yAxisTickWidth[index] || 0
              }
            }
          };
        });
        return list;
      })(),
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
        // seriesType有几个就放多少个series 否则没有type会报错
        optionData.splice(this.seriesType.length);
        const list = (optionData || []).map((item, index) => {
          if (this.seriesType[index] === "bar") {
            return {
              stack: this.validData(this.option.barStack, false),
              name: seriesName[index],
              type: "bar",
              // stack: ele.stack,
              // barWidth: this.option.barWidth || 16,
              barMinHeight: this.option.barMinHeight || 0,
              barGap: this.option.barGap + "%",
              barCategoryGap: this.option.barCategoryGap + "%",
              showBackground: true,
              backgroundStyle: {
                color: this.option.barBackgroundColor || "rgba(255, 255, 255, 0)"
              },
              itemStyle: {
                // color: this.getColor(index)
                color: this.seriesBarColor[index] || "red",
                opacity: this.seriesBarOpacity[index] / 100 || 0,
                barBorderRadius: this.option.barBorderRadius || 0
              },
              label: {
                show: this.validData(this.seriesLabelShow[index], false),
                position: "top",
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
              data: item.list,
              yAxisIndex: this.option.yAxisIndex ? this.option.yAxisIndex[index] : 0
            };
          }
          if (this.seriesType[index] === "line") {
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
                borderWidth: this.seriesItemBorderWidth[index] || 0,
                borderColor: this.seriesItemBorderColor[index] || "rgba(255, 255, 255, 1)"
              },
              lineStyle: {
                width: this.seriesLineWidth[index] || 0,
                color: this.seriesLineColor[index] || "#fff"
              },
              areaStyle: {
                color: this.seriesAreaColor[index] || "#fff",
                opacity: this.seriesAreaOpacity[index] / 100 || 0
              },
              label: {
                show: this.validData(this.seriesLabelShow[index], false),
                position: "top",
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
              data: item.list,
              yAxisIndex: this.option.yAxisIndex ? this.option.yAxisIndex[index] : 1
            };
          }
        });

        return list.filter((item) => item);
      })()
    };
    this.options = options;
  }
}

export { EchartlineAndBar };
