import { setMinioUrl } from "@material/minioUrl";
import { minBy } from "lodash-es";

import {
  getEchartsColorFromCssLinearColor,
  getMaxIndex,
  getMinIndex,
  limitTextInLine,
} from "../../utils";
import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { BarEchartType } from "../type";

class Echartbar extends BaseChart {
  // 原始数据的option
  option: Record<string, any> = {};
  legendGridTop = 0;
  legendGridLeft = 0;
  legendGridRight = 0;
  legendGridBottom = 0;
  seriesColor: Array<string | Record<string, any>> = [];
  seriesOpacity: number[] = [];
  extremeData: number[] = [];
  extremeShow: boolean[] = [];
  extremeType: Array<"max" | "min"> = [];
  extremeColor: string[] = [];
  extremeOpacity: number[] = [];
  tooltipUnit: string[] = [];
  tooltipMarkerColor: string[] = [];
  markLineSymbolStart: string[] = [];
  markLineSymbolStartImage: string[] = [];
  markLineSymbolEnd: string[] = [];
  markLineSymbolEndImage: string[] = [];
  markLineSymbolWidth: number[] = [];
  markLineSymbolHeight: number[] = [];
  markLineLabelShow: boolean[] = [];
  markLineLabelPosition: Array<"start" | "middle" | "end"> = [];
  markLineLabelDistance: number[] = [];
  markLineLabelCustom: string[] = [];
  markLineLabelFontFamily: string[] = [];
  markLineLabelFontStyle: Array<"normal" | "italic" | "oblique"> = [];
  markLineLabelFontSize: number[] = [];
  markLineLabelColor: string[] = [];
  markLineLabelFontWeight: Array<
    "normal" | "bold" | "bolder" | "lighter" | number
  > = [];
  markLineLabelPaddingTop: number[] = [];
  markLineLabelPaddingRight: number[] = [];
  markLineLabelPaddingBottom: number[] = [];
  markLineLabelPaddingLeft: number[] = [];
  markLineLineColor: string[] = [];
  markLineLineWidth: number[] = [];
  markLineLineType: Array<"solid" | "dashed" | "dotted"> = [];
  markLineShow: boolean[] = [];
  markLineDataType: string[] = [];
  seriesFieldList: string[] = [];
  constructor() {
    super({
      name: "柱状图",
      prop: BarEchartType.echartpictorialbar,
      img: "/img/bar.20240514.png",
      groupName: "柱状图",
    });
    this.seriesColor = ["rgba(63,246,252,1)"];
    this.seriesOpacity = [100];
    this.extremeShow = [false];
    this.extremeType = ["max"];
    this.extremeData = [];
    this.extremeColor = ["rgba(255,255,255,1)"];
    this.extremeOpacity = [100];
    this.seriesFieldList = [
      "seriesColor",
      "seriesOpacity",
      "extremeShow",
      "extremeType",
      "extremeColor",
      "extremeOpacity",
      "markLineSymbolStart",
      "markLineSymbolStartImage",
      "markLineSymbolEnd",
      "markLineSymbolEndImage",
      "markLineSymbolWidth",
      "markLineSymbolHeight",
      "markLineLabelShow",
      "markLineLabelPosition",
      "markLineLabelDistance",
      "markLineLabelCustom",
      "markLineLabelFontFamily",
      "markLineLabelFontStyle",
      "markLineLabelFontSize",
      "markLineLabelColor",
      "markLineLabelFontWeight",
      "markLineLabelPaddingTop",
      "markLineLabelPaddingRight",
      "markLineLabelPaddingBottom",
      "markLineLabelPaddingLeft",
      "markLineLineColor",
      "markLineLineWidth",
      "markLineLineType",
      "markLineShow",
      "markLineDataType",
    ];
  }

  getOptions() {
    return this.options;
  }

  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    let optionsData = null;

    try {
      optionsData = await this.transformOptionsData(baseChartProps.data);
    } catch (e) {
      console.error("数据处理失败", e);
      optionsData = [];
    }

    const { axisName: xAxisName, optionData } =
      this.getEchartsAxisNameAndSeriesData(optionsData);
    optionsData = optionData;
    optionsData = this.transformAxisData(optionsData, baseChartProps.yAxisType);
    const seriesName = optionsData.map((item) => item.name);
    this.option.dataSeriesName.forEach((item: any, index: number) => {
      const idx = seriesName.indexOf(item);
      if (idx !== -1) {
        seriesName[idx] = this.option.seriesTabsName[index].value;
        this.seriesFieldList.forEach((field: any) => {
          (this[field as keyof Echartbar] as any[])[idx] =
            this.option[field][index];
        });
        if (this.validData(this.extremeShow[idx], false)) {
          if (this.extremeType[idx] === "max") {
            this.extremeData[idx] = getMaxIndex(
              optionsData[idx].list.map((item: any) => item.value),
            );
          } else {
            this.extremeData[idx] = getMinIndex(
              optionsData[idx].list.map((item: any) => item.value),
            );
          }
        }
      } else {
        this.option.extremeShow[index] = false;
      }
    });
    // css线性渐变色转为echarts线性渐变色
    this.seriesColor = this.createSeriesColor(this.seriesColor);
    this.seriesColor.forEach((item, index) => {
      this.tooltipMarkerColor[index] =
        typeof item === "object" ? item.colorStops[1].color : item;
    });

    const tooltipUnit = this.setTooltipUnit(
      this.option,
      optionsData.map((item) => item.name),
    );
    const yAxisMin = Math.floor(minBy(optionsData, "value")?.value);
    const options = {
      title: this.createTitle(this.option),
      tooltip: this.createTooltip(
        this.option,
        tooltipUnit,
        this.screenScale,
        this.tooltipMarkerColor,
      ),
      grid: this.createGrid(this.option),
      legend: this.createLegend(this.option),
      xAxis: {
        show: this.validData(this.option.xAxisShow, true),
        type: this.option.xAxisType || "category",
        // type: 'category',
        // name: this.option.xAxisName,
        axisLine: {
          show: this.validData(this.option.xAxisLineShow, true),
          lineStyle: {
            color: this.option.xAxisLineColor || "#333",
            width: this.option.xAxisLineWidth || 0,
            // opacity: this.option.xAxisLineOpacity || 0.5
          },
        },
        data: xAxisName || [],
        inverse: this.validData(this.option.xAxisInverse, false),
        splitLine: {
          show: this.validData(this.option.xAxisSplitLineShow, false),
          interval: this.option.xAxisSplitLineInterval || 0,
          lineStyle: {
            type: this.option.xAxisSplitLineType,
            width: this.option.xAxisSplitLineWidth || 0,
            color: this.option.xAxisSplitLineColor || "#333",
          },
        },
        axisLabel: {
          show: this.validData(this.option.xAxisLabelShow, true),
          interval: (() => {
            const value = this.option.xAxisInterval || 0;
            if (value === 0) {
              return "auto";
            }
            if (value < 0) {
              return 0;
            }
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
                    ? limitTextInLine(
                        label,
                        this.option.xAxisLabelLimitNum || 0,
                      )
                    : label;
                },
        },
        axisTick: {
          show: this.validData(this.option.xAxisTickShow, true),
          length: this.option.xAxisTickLength || 0,
          lineStyle: {
            color: this.option.xAxisTickColor || "#333",
            width: this.option.xAxisTickWidth || 0,
          },
        },
      },
      yAxis: {
        show: this.validData(this.option.yAxisShow, true),
        // type: this.option.category ? 'category' : 'value',
        type: "value",
        max: Number(this.option.yAxisMax) || undefined,
        min:
          Number(this.option.yAxisMin) ||
          (this.option.yAxisMin == "" && yAxisMin) ||
          undefined,
        name: this.option.yAxisNameShow && this.option.yAxisName,
        nameTextStyle: {
          padding: [
            0,
            this.option.yAxisNamePaddingRight || 0,
            this.option.yAxisNamePaddingBottom || 0,
            this.option.yAxisNamePaddingLeft || 0,
          ],
          color: this.option.yAxisNameColor || "#333",
          fontSize: this.option.yAxisNameFontSize || 0,
          fontStyle: this.option.yAxisNameFontStyle || "normal",
          fontWeight: this.option.yAxisNameFontWeight || "normal",
          fontFamily: this.option.yAxisNameFontFamily || "Arial",
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
          fontFamily: this.option.yAxisFontFamily || "Arial",
        },
        axisLine: {
          show: this.validData(this.option.yAxisLineShow, true),
          lineStyle: {
            color: this.option.yAxisLineColor || "#333",
            width: this.option.yAxisLineWidth || 0,
            // opacity: this.option.yAxisLineOpacity || 0.5
          },
        },
        splitLine: {
          show: this.validData(this.option.yAxisSplitLineShow, true),
          lineStyle: {
            type: this.option.yAxisSplitLineType,
            width: this.option.yAxisSplitLineWidth || 0,
            color: this.option.yAxisSplitLineColor || "#333",
          },
        },
        axisTick: {
          show: this.validData(this.option.yAxisTickShow, true),
          length: this.option.yAxisTickLength || 0,
          lineStyle: {
            color: this.option.yAxisTickColor || "#333",
            width: this.option.yAxisTickWidth || 0,
          },
        },
      },
      dataZoom:
        this.option.xAxisType !== "time" &&
        this.validData(
          this.option.dataLoop || this.option.dataZoomShow,
          false,
        ) &&
        optionData[0]?.list.length > this.option.dataLoopDisplayRows
          ? [
              // 滑动条
              {
                xAxisIndex: 0, // 这里是从X轴的0刻度开始
                show: this.validData(this.option.dataZoomShow, false), // 是否显示滑动条，不影响使用
                type: "slider", // 这个 dataZoom 组件是 slider 型 dataZoom 组件
                startValue: 0, // 从头开始。
                endValue: this.option.dataLoopDisplayRows - 1, // 一次性展示10个。
                zoomOnMouseWheel: false,
                zoomLock: true, // 禁止缩放
                height: 0,
                borderColor: "rgba(0, 0, 0, 0)",
                showDetail: false, // 拖动详情显示
                moveHandleSize: this.option.moveHandleSize || 0, // 滚动条宽度
                moveHandleStyle: {
                  color: this.option.moveHandleColor || "#d2dbee",
                },
                emphasis: {
                  moveHandleStyle: {
                    color: this.option.moveHandleEmphasisColor || "#d2dbee",
                  },
                },
                bottom: this.option.dataZoomBottom || 0,
              },
            ]
          : [],
      series: (() => {
        // const barColor = this.option.barColor || [];
        const list = (optionsData || []).map((item: any, index: number) => {
          return {
            stack: this.validData(this.option.stack, false),
            name: seriesName[index],
            type: "bar",
            // stack: ele.stack,
            // barWidth: this.option.barWidth || 16,
            barMinHeight: this.option.barMinHeight || 4,
            barGap: this.option.barGap + "%",
            barCategoryGap: this.option.barCategoryGap + "%",
            showBackground: true,
            backgroundStyle: {
              color: this.option.barBackgroundColor || "rgba(255, 255, 255, 0)",
            },
            itemStyle: {
              // color: this.getColor(index)
              color: this.seriesColor[index] || "auto",
              opacity: this.seriesOpacity[index] / 100 || 1,
              barBorderRadius:
                (this.option.barBorderRadius === "default"
                  ? 0
                  : [50, 50, 0, 0]) || 0,
            },
            label: {
              show: this.validData(this.option.seriesLabelShow, false), //开启显示
              position: "top", //在上方显示,
              formatter: this.option.xAxisLabelCustom
                ? this.option.xAxisLabelCustom
                : (name: any) => name.value,
              //数值样式
              fontFamily:
                this.option.seriesLabelFontFamily ||
                "Source Han Sans CN-Normal, Source Han Sans CN",
              fontStyle: this.option.seriesLabelFontStyle || "normal",
              fontSize: this.option.seriesLabelFontSize || 0,
              color: this.option.seriesLabelColor || "#333",
              fontWeight: this.option.seriesLabelFontWeight || "normal",
              offset: [
                this.option.seriesLabelOffsetX || 0,
                this.option.seriesLabelOffsetY || 0,
              ],
            },
            markLine: {
              symbol: [
                this.markLineSymbolStart[index] === "image"
                  ? `image://${setMinioUrl(this.markLineSymbolStartImage[index])}`
                  : this.markLineSymbolStart[index],
                this.markLineSymbolEnd[index] === "image"
                  ? `image://${setMinioUrl(this.markLineSymbolEndImage[index])}`
                  : this.markLineSymbolEnd[index],
              ],
              symbolSize: [
                this.markLineSymbolWidth[index] || 10,
                this.markLineSymbolHeight[index] || 10,
              ],
              label: {
                show: this.validData(this.markLineLabelShow[index], true),
                position: this.markLineLabelPosition[index] || "end",
                distance: this.markLineLabelDistance[index] || 0,
                formatter: this.markLineLabelCustom[index]
                  ? this.markLineLabelCustom[index]
                  : (name: any) => name.value,
                fontFamily:
                  this.markLineLabelFontFamily[index] ||
                  "Source Han Sans CN-Normal, Source Han Sans CN",
                fontStyle: this.markLineLabelFontStyle[index] || "normal",
                fontSize: this.markLineLabelFontSize[index] || 16,
                color: this.markLineLabelColor[index] || "#fff",
                fontWeight: this.markLineLabelFontWeight[index] || "normal",
                padding: [
                  this.markLineLabelPaddingTop[index] || 0,
                  this.markLineLabelPaddingRight[index] || 0,
                  this.markLineLabelPaddingBottom[index] || 0,
                  this.markLineLabelPaddingLeft[index] || 0,
                ],
              },
              lineStyle: {
                color: this.markLineLineColor[index] || "rgba(230, 97, 97, 1)",
                width: this.markLineLineWidth[index] || 1,
                type: this.markLineLineType[index] || "solid",
              },
              data: this.validData(this.markLineShow[index], false)
                ? [
                    {
                      name: seriesName[index],
                      type: this.markLineDataType[index] || "average",
                      yAxis:
                        item.markLineData ||
                        (this.markLineDataType[index] === "custom"
                          ? this.option.markLineData[index]
                          : null),
                    },
                  ]
                : [],
            },
            data: this.validData(this.extremeShow[index], false)
              ? item.list.map((item: any, idx: number) => {
                  if (this.extremeData[index] === idx) {
                    return Object.assign(item, {
                      itemStyle: {
                        color: getEchartsColorFromCssLinearColor(
                          this.extremeColor[index],
                        ),
                        opacity: this.extremeOpacity[index] / 100 || 0,
                      },
                    });
                  }
                  return item;
                })
              : item.list,
          };
        });
        return list;
      })(),
    };

    this.options = options;
  }
}

export { Echartbar };
