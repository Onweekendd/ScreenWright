import { setMinioUrl } from "@material/minioUrl";

import { getMinVal } from "../../utils";
import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { BarEchartType } from "../type";

class EchartareaLine extends BaseChart {
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
  seriesLineColor: any[] = [];
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
  markLineDataType: any[] = [];
  markLineSymbolWidth: any[] = [];
  markLineSymbolEnd: any[] = [];
  markLineSymbolEndImage: any[] = [];
  markLineSymbolStart: any[] = [];
  markLineSymbolStartImage: any[] = [];
  markLineSymbolHeight: any[] = [];
  markLineLabelShow: any[] = [];
  markLineLabelPosition: any[] = [];
  markLineLabelDistance: any[] = [];
  markLineLabelCustom: any[] = [];
  markLineLabelFontFamily: any[] = [];
  markLineLabelFontStyle: any[] = [];
  markLineLabelFontSize: any[] = [];
  markLineLabelColor: any[] = [];
  markLineLabelFontWeight: any[] = [];
  markLineLabelPaddingTop: any[] = [];
  markLineLabelPaddingRight: any[] = [];
  markLineLabelPaddingBottom: any[] = [];
  markLineLabelPaddingLeft: any[] = [];
  markLineLineColor: any[] = [];
  markLineLineWidth: any[] = [];
  markLineLineType: any[] = [];
  markLineShow: any[] = [];
  constructor() {
    const baseChartProps = {
      name: "面积折线图",
      prop: BarEchartType.echartbothWayStripBar,
      img: "/img/areaLine.46cdb470.png",
      groupName: "折线图"
    };
    super(baseChartProps);
    this.seriesFieldList = [
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
      "seriesLabelOffsetY",
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
      "markLineDataType"
    ];
  }
  getOptions() {
    return this.options;
  }
  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    let optionsData = await this.transformOptionsData(baseChartProps.data);
    // 获取数据中的最小值用于y轴最小值为空时的自适应
    const yAxisMin = Math.floor(getMinVal(optionsData, "value"));
    const { axisName: xAxisName, optionData: data } = this.getEchartsAxisNameAndSeriesData(optionsData);
    optionsData = data;
    optionsData = this.transformAxisData(optionsData, baseChartProps.yAxisType);

    this.dataLength = xAxisName.length;
    const seriesName = optionsData.map((item: { name: string }) => item.name);
    // 删除系列时seriesColor被删除那项还是缓存着，刷新页面后重新设置seriesColor才是对的，所以在刷新配置是重置this[field]
    this.seriesFieldList.forEach((field) => {
      if (this.option[field]) (this as any)[field] = [];
    });
    this.option.dataSeriesName.forEach((item: string, index: number) => {
      const idx = seriesName.indexOf(item);
      if (idx !== -1) {
        seriesName[idx] = this.option.seriesTabsName[index].value;
        this.seriesFieldList.forEach((field) => {
          if (this.option[field]) (this as any)[field][idx] = this.option[field][index];
        });
      }
    });
    // css线性渐变色转为echarts线性渐变色
    this.seriesAreaColor = this.createSeriesColor(this.seriesAreaColor);
    // this.seriesLineColor.forEach((item) => {
    //   this.tooltipMarkerColor.push(
    //     typeof item === 'object' ? item.colorStops[1].color : item
    //   );
    // });
    this.seriesLineColor.forEach((item, index) => {
      this.tooltipMarkerColor[index] = typeof item === "object" ? item.colorStops[1].color : item;
    });
    const tooltipUnit = this.setTooltipUnit(
      this.option,
      optionsData.map((item) => item.name)
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
        selectedMode: this.option.legendSelectedMode,
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
        boundaryGap: this.validData(this.option.boundaryGap, true),
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
      yAxis: {
        show: this.validData(this.option.yAxisShow, true),
        // type: this.option.category ? 'category' : 'value',
        type: "value",
        max: Number(this.option.yAxisMax) || undefined,
        min: Number(this.option.yAxisMin) || (this.option.yAxisMin == "" && yAxisMin) || undefined,
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
        const list = (optionsData || []).map((item, index) => {
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
              // opacity: this.option.seriesOpacity[index] / 100 || 0,
              borderWidth: this.seriesItemBorderWidth[index] || 0,
              borderColor: this.seriesItemBorderColor[index] || "rgba(255, 255, 255, 1)"
            },
            lineStyle: {
              width: this.seriesLineWidth[index] || 0,
              color: this.seriesLineColor[index] || "#fff"
            },
            areaStyle: {
              color: this.seriesAreaColor[index] || "auto",
              opacity: this.seriesAreaOpacity[index] / 100 || 0
            },
            label: {
              show: this.validData(this.seriesLabelShow[index], false), //开启显示
              position: "top", //在上方显示,
              formatter: (name: any) => name.value,
              //数值样式
              fontFamily: this.seriesLabelFontFamily[index] || "Source Han Sans CN-Normal, Source Han Sans CN",
              fontStyle: this.seriesLabelFontStyle[index] || "normal",
              fontSize: this.seriesLabelFontSize[index] || 0,
              color: this.seriesLabelColor[index] || "#333",
              fontWeight: this.seriesLabelFontWeight[index] || "normal",
              offset: [this.seriesLabelOffsetX[index] || 0, this.seriesLabelOffsetY[index] || 0]
            },
            markLine: {
              symbol: [
                this.markLineSymbolStart[index] === "image"
                  ? `image://${setMinioUrl(this.markLineSymbolStartImage[index])}`
                  : this.markLineSymbolStart[index],
                this.markLineSymbolEnd[index] === "image"
                  ? `image://${setMinioUrl(this.markLineSymbolEndImage[index])}`
                  : this.markLineSymbolEnd[index]
              ],
              symbolSize: [this.markLineSymbolWidth[index] || 10, this.markLineSymbolHeight[index] || 10],
              label: {
                show: this.validData(this.markLineLabelShow[index], true),
                position: this.markLineLabelPosition[index] || "end",
                distance: this.markLineLabelDistance[index] || 0,
                formatter: this.markLineLabelCustom[index]
                  ? this.markLineLabelCustom[index]
                  : (name: any) => name.value,
                fontFamily: this.markLineLabelFontFamily[index] || "Source Han Sans CN-Normal, Source Han Sans CN",
                fontStyle: this.markLineLabelFontStyle[index] || "normal",
                fontSize: this.markLineLabelFontSize[index] || 16,
                color: this.markLineLabelColor[index] || "#fff",
                fontWeight: this.markLineLabelFontWeight[index] || "normal",
                padding: [
                  this.markLineLabelPaddingTop[index] || 0,
                  this.markLineLabelPaddingRight[index] || 0,
                  this.markLineLabelPaddingBottom[index] || 0,
                  this.markLineLabelPaddingLeft[index] || 0
                ]
              },
              lineStyle: {
                color: this.markLineLineColor[index] || "rgba(230, 97, 97, 1)",
                width: this.markLineLineWidth[index] || 1,
                type: this.markLineLineType[index] || "solid"
              },
              data: this.validData(this.markLineShow[index], false)
                ? [
                    {
                      name: seriesName[index],
                      type: this.markLineDataType[index] || "average",
                      yAxis: this.markLineDataType[index] === "custom" ? this.option.markLineData[index] : null
                    }
                  ]
                : []
            },
            data: item.list
          };
        });
        return list;
      })()
    };
    this.options = options;
  }
}

export { EchartareaLine };
