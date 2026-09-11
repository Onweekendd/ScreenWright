import { getEchartsColorFromCssLinearColor, getMaxIndex, getMinIndex } from "../../utils";
import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { BarEchartType } from "../type";

export class EchartbothWayStripBar extends BaseChart {
  option: Record<string, any> = {};
  dataLength = 0;
  tootipTimer: any = null;
  dataLoopTimeTicket: any = null;
  tooltipLoopTimeTicket: any = null;
  legendGridTop = 0;
  legendGridLeft = 0;
  legendGridRight = 0;
  legendGridBottom = 0;
  seriesColor: any[] = [];
  seriesOpacity: any[] = [];
  extremeData: any[] = [];
  extremeShow: any[] = [];
  extremeType: any[] = [];
  extremeColor: any[] = [];
  extremeOpacity: any[] = [];
  tooltipUnit: any[] = [];
  tooltipMarkerColor: any[] = [];
  seriesFieldList = ["seriesColor", "seriesOpacity", "extremeShow", "extremeType", "extremeColor", "extremeOpacity"];

  constructor() {
    const defaultChartProps = {
      name: "双向条形图",
      prop: BarEchartType.echartbothWayStripBar,
      img: "/img/echart.20240514.png",
      groupName: "柱状图"
    };
    super(defaultChartProps);
  }

  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    let optionsData = await this.transformOptionsData(baseChartProps.data);

    const { axisName: yAxisName, optionData: data } = this.getEchartsAxisNameAndSeriesData(optionsData);
    optionsData = data;
    optionsData = this.transformAxisData(optionsData, baseChartProps.yAxisType);
    this.dataLength = yAxisName.length;

    const seriesName = optionsData.map((item) => item.name);
    this.extremeShow = this.extremeShow.map(() => {
      return false;
    });
    this.seriesFieldList.forEach((field) => {
      if (this.option && this.option[field as keyof typeof this.option]) {
        (this as any)[field] = [];
      }
    });

    this.option.dataSeriesName?.forEach((item: any, index: number) => {
      const idx = seriesName.indexOf(item);
      if (idx !== -1) {
        seriesName[idx] = this.option.seriesTabsName[index].value;
        this.seriesFieldList.forEach((field) => {
          this[field as keyof EchartbothWayStripBar][idx] = this.option[field][index];
        });
        if (this.validData(this.extremeShow[idx], false)) {
          if (this.extremeType[idx] === "max") {
            this.extremeData[idx] = getMaxIndex(optionsData[idx].list.map((item: any) => item.value));
          } else {
            this.extremeData[idx] = getMinIndex(optionsData[idx].list.map((item: any) => item.value));
          }
        }
      } else {
        this.option.extremeShow[index] = false;
      }
    });

    this.seriesColor = this.createSeriesColor(this.seriesColor);
    this.seriesColor.forEach((item, index) => {
      this.tooltipMarkerColor[index] = typeof item === "object" ? item.colorStops[1].color : item;
    });
    const tooltipUnit: any = {};
    if (this.option.dataUnitName) {
      this.option.dataUnitName.forEach((item: any, index: number) => {
        const idx = seriesName.indexOf(item);
        if (idx !== -1) {
          tooltipUnit[idx] = this.option.unitTabsName[index].value;
        }
      });
    }

    const options = {
      title: this.createTitle(this.option),
      tooltip: { show: false },
      grid: (() => {
        const list = [];
        for (let index = 0; index < 3; index++) {
          list.push({
            left: (this.option.gridLeft[index] || 0) + "%",
            top: (this.option.gridTop || 0) + "%",
            right: (this.option.gridRight[index] || 0) + "%",
            bottom: (this.option.gridBottom || 0) + "%"
          });
        }
        return list;
      })(),
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
      xAxis: (() => {
        const list = (this.option.xAxisShow || []).map((item: any, index: number) => {
          return {
            show: this.validData(this.option.xAxisShow[index], true),
            inverse: index === 0,
            splitNumber: 2,
            type: "value",
            max: Number(this.option.xAxisMax[index]) || undefined,
            min: Number(this.option.xAxisMin[index]) || undefined,
            name: this.option.xAxisNameShow[index] && this.option.xAxisName[index],
            nameTextStyle: {
              color: this.option.xAxisNameColor[index] || "#333",
              fontSize: this.option.xAxisNameFontSize[index] || 0,
              fontStyle: this.option.xAxisNameFontStyle[index] || "normal",
              fontWeight: this.option.xAxisNameFontWeight[index] || "normal",
              fontFamily: this.option.xAxisNameFontFamily[index] || "Arial"
            },
            nameGap: this.option.xAxisNameGap[index] || 0,
            axisLabel: {
              show: this.validData(this.option.xAxisLabelShow[index], true),
              margin: this.option.xAxisMargin[index] || 0,
              color: this.option.xAxisColor[index] || "#333",
              fontSize: this.option.xAxisFontSize[index] || 0,
              fontStyle: this.option.xAxisFontStyle[index] || "normal",
              fontWeight: this.option.xAxisFontWeight[index] || "normal",
              fontFamily: this.option.xAxisFontFamily[index] || "Arial"
            },
            axisLine: {
              show: this.validData(this.option.xAxisLineShow[index], true),
              lineStyle: {
                color: this.option.xAxisLineColor[index] || "#333",
                width: this.option.xAxisLineWidth[index] || 0
              }
            },
            splitLine: {
              show: this.validData(this.option.xAxisSplitLineShow[index], true),
              lineStyle: {
                type: "dashed",
                width: this.option.xAxisSplitLineWidth[index] || 0,
                color: this.option.xAxisSplitLineColor[index] || "#333"
              }
            },
            axisTick: {
              show: this.validData(this.option.xAxisTickShow[index], true),
              length: this.option.xAxisTickLength[index] || 0,
              lineStyle: {
                color: this.option.xAxisTickColor[index] || "#333",
                width: this.option.xAxisTickWidth[index] || 0
              }
            },
            gridIndex: index
          };
        });
        list.push({ show: false, gridIndex: 2 });
        return list;
      })(),
      yAxis: (() => {
        let list;
        if (this.option.yAxisType === "time") {
          list = [
            {
              show: this.validData(this.option.yAxisShow, true),
              type: this.option.yAxisType || "category",
              axisLine: {
                show: this.validData(this.option.yAxisLineShow, true),
                lineStyle: {
                  color: this.option.yAxisLineColor || "#333",
                  width: this.option.yAxisLineWidth || 0
                }
              },
              data: yAxisName || [],
              inverse: this.validData(this.option.yAxisInverse, false),
              splitLine: {
                show: this.validData(this.option.yAxisSplitLineShow, false),
                interval: this.option.yAxisSplitLineInterval || 0,
                lineStyle: {
                  type: "dashed",
                  width: this.option.yAxisSplitLineWidth || 0,
                  color: this.option.yAxisSplitLineColor || "#333"
                }
              },
              axisLabel: { show: false },
              axisTick: {
                show: this.validData(this.option.yAxisTickShow, true),
                inside: true,
                length: this.option.yAxisTickLength || 0,
                lineStyle: {
                  color: this.option.yAxisTickColor || "#333",
                  width: this.option.yAxisTickWidth || 0
                }
              },
              gridIndex: 0
            },
            {
              show: this.validData(this.option.yAxisShow, true),
              type: this.option.yAxisType || "category",
              axisLine: {
                show: this.validData(this.option.yAxisLineShow, true),
                lineStyle: {
                  color: this.option.yAxisLineColor || "#333",
                  width: this.option.yAxisLineWidth || 0
                }
              },
              data: yAxisName || [],
              inverse: this.validData(this.option.yAxisInverse, false),
              splitLine: { show: false },
              axisLabel: {
                show: this.validData(this.option.yAxisLabelShow, true),
                interval: (() => {
                  const value = this.option.yAxisInterval || 0;
                  if (value === 0) return "auto";
                  if (value < 0) return 0;
                  return value;
                })(),
                rotate: this.option.yAxisRotate || 0,
                margin: -this.option.yAxisMargin || 0,
                color: this.option.yAxisColor || "#333",
                fontSize: this.option.yAxisFontSize || 0,
                fontStyle: this.option.yAxisFontStyle || "normal",
                fontWeight: this.option.yAxisFontWeight || "normal",
                fontFamily: this.option.yAxisFontFamily || "Arial",
                formatter: this.option.yAxisType === "time" ? this.option.yAxisTimeType : "{value}"
              },
              axisTick: { show: false },
              gridIndex: 1
            },
            {
              show: this.validData(this.option.yAxisShow, true),
              type: this.option.yAxisType || "category",
              axisLine: { show: false },
              data: yAxisName || [],
              inverse: this.validData(this.option.yAxisInverse, false),
              splitLine: {
                show: this.validData(this.option.yAxisSplitLineShow, false),
                interval: this.option.yAxisSplitLineInterval || 0,
                lineStyle: {
                  type: "dashed",
                  width: this.option.yAxisSplitLineWidth || 0,
                  color: this.option.yAxisSplitLineColor || "#333"
                }
              },
              axisLabel: { show: false },
              axisTick: {
                show: this.validData(this.option.yAxisTickShow, true),
                inside: false,
                length: this.option.yAxisTickLength || 0,
                lineStyle: {
                  color: this.option.yAxisTickColor || "#333",
                  width: this.option.yAxisTickWidth || 0
                }
              },
              gridIndex: 2
            }
          ];
        } else {
          list = [
            {
              show: this.validData(this.option.yAxisShow, true),
              type: this.option.yAxisType || "category",
              // type: 'category',
              // name: this.option.yAxisName,
              axisLine: {
                show: this.validData(this.option.yAxisLineShow, true),
                lineStyle: {
                  color: this.option.yAxisLineColor || "#333",
                  width: this.option.yAxisLineWidth || 0
                  // opacity: this.option.yAxisLineOpacity || 0.5
                }
              },
              data: yAxisName || [],
              inverse: this.validData(this.option.yAxisInverse, false),
              splitLine: {
                show: this.validData(this.option.yAxisSplitLineShow, false),
                interval: this.option.yAxisSplitLineInterval || 0,
                lineStyle: {
                  type: "dashed",
                  width: this.option.yAxisSplitLineWidth || 0,
                  color: this.option.yAxisSplitLineColor || "#333"
                }
              },
              axisLabel: {
                show: false
              },
              axisTick: {
                show: this.validData(this.option.yAxisTickShow, true),
                inside: true,
                length: this.option.yAxisTickLength || 0,
                lineStyle: {
                  color: this.option.yAxisTickColor || "#333",
                  width: this.option.yAxisTickWidth || 0
                }
              },
              gridIndex: 0
            },
            {
              show: this.validData(this.option.yAxisShow, true),
              type: this.option.yAxisType || "category",
              // type: 'category',
              // name: this.option.yAxisName,
              axisLine: {
                show: this.validData(this.option.yAxisLineShow, true),
                lineStyle: {
                  color: this.option.yAxisLineColor || "#333",
                  width: this.option.yAxisLineWidth || 0
                  // opacity: this.option.yAxisLineOpacity || 0.5
                }
              },
              data: yAxisName || [],
              inverse: this.validData(this.option.yAxisInverse, false),
              splitLine: {
                show: this.validData(this.option.yAxisSplitLineShow, false),
                interval: this.option.yAxisSplitLineInterval || 0,
                lineStyle: {
                  type: "dashed",
                  width: this.option.yAxisSplitLineWidth || 0,
                  color: this.option.yAxisSplitLineColor || "#333"
                }
              },
              axisLabel: {
                show: false
              },
              axisTick: {
                show: this.validData(this.option.yAxisTickShow, true),
                inside: false,
                length: this.option.yAxisTickLength || 0,
                lineStyle: {
                  color: this.option.yAxisTickColor || "#333",
                  width: this.option.yAxisTickWidth || 0
                }
              },
              gridIndex: 1
            },
            {
              show: this.validData(this.option.yAxisShow, true),
              type: this.option.yAxisType || "category",
              // type: 'category',
              // name: this.option.yAxisName,
              axisLine: {
                // show: this.validData(this.option.yAxisLineShow, true)
                show: false
              },
              data: yAxisName || [],
              inverse: this.validData(this.option.yAxisInverse, false),
              splitLine: {
                show: false
              },
              axisLabel: {
                show: this.validData(this.option.yAxisLabelShow, true),
                interval: (() => {
                  const value = this.option.yAxisInterval || 0;
                  if (value === 0) return "auto";
                  if (value < 0) return 0;
                  return value;
                })(),
                rotate: this.option.yAxisRotate || 0,
                margin: -this.option.yAxisMargin || 0,
                color: this.option.yAxisColor || "#333",
                fontSize: this.option.yAxisFontSize || 0,
                fontStyle: this.option.yAxisFontStyle || "normal",
                fontWeight: this.option.yAxisFontWeight || "normal",
                fontFamily: this.option.yAxisFontFamily || "Arial",
                formatter: this.option.yAxisType === "time" ? this.option.yAxisTimeType : "{value}"
              },
              axisTick: {
                show: false
              },
              gridIndex: 2
            }
          ];
        }
        return list;
      })(),
      dataZoom:
        this.option.yAxisType !== "time" && this.validData(this.option.dataLoop, false)
          ? (() => {
              const list = [];
              for (let index = 0; index < 3; index++) {
                list.push({
                  yAxisIndex: index,
                  show: false,
                  type: "inside",
                  startValue: 0,
                  endValue: this.option.dataLoopDisplayRows - 1,
                  zoomOnMouseWheel: false
                });
              }
              return list;
            })()
          : "",
      series: (() => {
        const list = (optionsData || []).map((item, index) => {
          return {
            name: seriesName[index],
            type: "bar",
            barMinHeight: this.option.barMinHeight || 0,
            barCategoryGap: this.option.barCategoryGap + "%",
            showBackground: true,
            backgroundStyle: {
              color: this.option.barBackgroundColor || "rgba(255, 255, 255, 0)"
            },
            itemStyle: {
              color: this.seriesColor[index] || "red",
              opacity: this.seriesOpacity[index] / 100 || 0,
              barBorderRadius:
                (this.option.barBorderRadius === "default" ? 0 : index === 0 ? [50, 0, 0, 50] : [0, 50, 50, 0]) || 0
            },
            label: {
              show: this.validData(this.option.seriesLabelShow[index], false),
              position: index === 0 ? "left" : "right",
              formatter: (name: any) => name.value,
              fontFamily: this.option.seriesLabelFontFamily[index] || "Source Han Sans CN-Normal, Source Han Sans CN",
              fontStyle: this.option.seriesLabelFontStyle[index] || "normal",
              fontSize: this.option.seriesLabelFontSize[index] || 0,
              color: this.option.seriesLabelColor[index] || "#333",
              fontWeight: this.option.seriesLabelFontWeight[index] || "normal",
              offset: [this.option.seriesLabelOffsetX[index] || 0, this.option.seriesLabelOffsetY[index] || 0]
            },
            data: this.validData(this.extremeShow[index], false)
              ? item.list.map((item: any, idx: number) => {
                  if (this.extremeData[index] === idx) {
                    return Object.assign(item, {
                      itemStyle: {
                        color: getEchartsColorFromCssLinearColor(this.extremeColor[index]),
                        opacity: this.extremeOpacity[index] / 100 || 0
                      }
                    });
                  }
                  return item;
                })
              : item.list,
            xAxisIndex: index,
            yAxisIndex: index
          };
        });
        return list;
      })()
    };

    this.options = options;
  }

  getOptions() {
    return this.options;
  }
}
