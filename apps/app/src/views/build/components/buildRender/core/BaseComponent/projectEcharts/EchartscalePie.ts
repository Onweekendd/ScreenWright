import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { projectEchartType } from "../type";

class EchartscalePie extends BaseChart {
  // 原始数据的option
  option: Record<string, any> = {};

  seriesFieldList: string[] = [];
  seriesColor: string[] = [];
  dataLength = 0;

  // 定义默认渐变颜色数组
  readonly DEFAULT_COLOR = [
    "linear-gradient(0.0deg,rgba(0,150,254,1) 0.0,rgba(1,246,255,1) 100.0%)",
    "linear-gradient(0.0deg,rgba(56,207,160,1) 0.0,rgba(106,229,175,1) 100.0%)",
    "linear-gradient(0.0deg,rgba(250,241,93,1) 0.0,rgba(234,178,32,1) 100.0%)"
  ];

  constructor() {
    const defaultChartProps = {
      name: "刻度饼图",
      prop: projectEchartType.echartscalePie,
      img: "/img/scalePie.5a9a0f01.png",
      groupName: "项目"
    };
    super(defaultChartProps);

    this.seriesFieldList = ["seriesColor"];
  }

  getOptions() {
    return this.options;
  }

  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    const optionsData = await this.transformOptionsDataByDataFilter();

    let seriesName: string[] = [];
    seriesName = optionsData.map((item: { seriesName: any }) => item.seriesName);
    // 删除系列时seriesColor被删除那项还是缓存着，刷新页面后重新设置seriesColor才是对的，所以在刷新配置是重置this[field]
    this.seriesFieldList.forEach((field) => {
      if (this.option[field]) (this[field as keyof EchartscalePie] as any) = [];
    });
    this.option.dataSeriesName.forEach((item: any, index: number) => {
      const idx = seriesName.indexOf(item);
      if (idx !== -1) {
        optionsData[idx].seriesName = this.option.seriesTabsName[index].value;
        this.seriesFieldList.forEach((field) => {
          (this[field as keyof EchartscalePie] as any[])[idx] = this.option[field][index];
        });
      }
    });
    this.seriesColor = this.createSeriesColor(this.seriesColor);
    const data = optionsData.map((item: { seriesName: any; value: any }) => {
      return {
        name: item.seriesName,
        value: item.value
      };
    });

    const options = {
      legend: {
        show: this.validData(this.option.legendShow, false),
        // this.option.legendOrder
        orient: this.option.legendOrient || "vertical",
        ...this.option.legendGrid,
        width: this.option.legendWidth || 0,
        height: this.option.legendHeight || 0,
        itemWidth: this.option.legendItemWidthAndHeight || 0,
        itemHeight: this.option.legendItemWidthAndHeight || 0,
        icon: "path://M480 64C250.24 64 64 250.24 64 480 64 709.76 250.24 896 480 896c229.76 0 416-186.24 416-416C896 250.24 709.76 64 480 64zM480 832C285.44 832 128 674.56 128 480 128 285.44 285.44 128 480 128 674.56 128 832 285.44 832 480 832 674.56 674.56 832 480 832z",
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
        textStyle: {
          fontFamily: this.option.legendFontFamily || "Arial",
          fontSize: this.option.legendFontSize || 0,
          color: this.option.legendColor || "rgba(255, 255, 255, 1)",
          fontStyle: this.option.legendFontStyle || "normal",
          fontWeight: this.option.legendFontWeight || "normal",
          padding: [0, 0, 0, this.option.legendTextLeftPadding || 0],
          rich: {}
        }
      },
      tooltip: {
        show: false
      },
      grid: {
        top: "13%",
        left: "5%",
        right: "7%",
        bottom: "28%"
      },
      series: [
        {
          type: "pie",
          radius: [(this.option.pieRadiusMax || 0) + "%", (this.option.pieRadiusMin || 0) + "%"],
          center: [(this.option.pieCenterX || 0) + "%", (this.option.pieCenterY || 0) + "%"],
          hoverAnimation: false,
          itemStyle: {
            // 核心修改：循环使用默认渐变颜色数组
            color: (param: { dataIndex: number }) => {
              // 先拿用户配置的颜色
              if (
                param.dataIndex >= 0 &&
                param.dataIndex < this.seriesColor.length &&
                this.seriesColor[param.dataIndex]
              ) {
                return this.seriesColor[param.dataIndex];
              }

              // 默认渐变数组（ECharts 标准格式，能正常显示）
              const defaultColors = [
                {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: "rgba(0,150,254,1)" },
                    { offset: 1, color: "rgba(1,246,255,1)" }
                  ]
                },
                {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: "rgba(56,207,160,1)" },
                    { offset: 1, color: "rgba(106,229,175,1)" }
                  ]
                },
                {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: "rgba(250,241,93,1)" },
                    { offset: 1, color: "rgba(234,178,32,1)" }
                  ]
                }
              ];

              const idx = param.dataIndex % defaultColors.length;
              return defaultColors[idx];
            }
          },
          label: {
            show: this.option.seriesLabelShow,
            distanceToLabelLine: this.option.seriesDistanceToLabelLine || 0,
            formatter: (params: { name: string; value: any; percent: number }) => {
              return `{name|${this.option.seriesLabelSeriesShow ? params.name + ": " : ""}}${
                this.option.seriesLabelOrient === "horizontal" ? "" : "\n"
              }{value|${this.option.seriesLabelValueShow ? params.value : ""}}{unit|${
                this.option.seriesLabelValueShow ? this.option.seriesLabelUnit : ""
              }}{percent|${
                this.option.seriesLabelPercentShow
                  ? params.percent.toFixed(this.option.seriesLabelPercentValue || 0) + "%"
                  : ""
              }}`;
            },
            rich: {
              name: {
                fontFamily: this.option.seriesLabelSeriesFontFamily || "Arial",
                fontSize: this.option.seriesLabelSeriesFontSize || 0,
                color: this.option.seriesLabelSeriesColor || "rgba(255, 255, 255, 1)",
                fontStyle: this.option.seriesLabelFontStyle || "normal",
                fontWeight: this.option.seriesLabelFontWeight || "normal"
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
          data,
          labelLine: {
            show: true,
            length: this.option.seriesLabelLineLength || 0,
            lineStyle: {
              width: 2,
              color: "rgb(1,230,255)"
            }
          }
        }
      ],
      animationDelay: (idx: number) => {
        idx += 0.5;
        // 越往后的数据延迟越大
        return idx * 100;
      },
      animationEasing: "linear"
    };
    if (this.validData(this.option.gaugeShow, true)) {
      options.series.push({
        z: 100,
        type: "gauge",
        //@ts-ignore
        radius: (this.option.gaugeRadius || 0) + "%",
        center: [(this.option.gaugeCenterX || 0) + "%", (this.option.gaugeCenterY || 0) + "%"],
        startAngle: 90,
        endAngle: -270,
        min: 0,
        max: 12,
        splitNumber: 28,
        hoverAnimation: true,
        axisTick: {
          show: false
        },

        splitLine: {
          length: this.option.gaugeLength || 0,
          lineStyle: {
            width: 2,
            color: this.option.gaugeColor || "#000"
          }
        },
        axisLabel: {
          show: false
        },
        pointer: {
          show: false
        },
        axisLine: {
          lineStyle: {
            opacity: 0
          }
        },
        detail: {
          show: false
        },
        data: [
          {
            value: 0,
            name: ""
          }
        ]
      });
    }
    this.options = options;
  }
}

export { EchartscalePie };
