import { setMinioUrl } from "@/utils/config";

import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { otherEchartType } from "../type";

class EchartRadar extends BaseChart {
  // 原始数据的option
  option: Record<string, any> = {};
  dataLength = 0;
  legendGridTop = 0;
  legendGridLeft = 0;
  legendGridBottom = 0;
  seriesColor: Array<string | Record<string, any>> = [];
  seriesLineWidth: string[] = [];
  seriesLineColor: string[] = [];
  seriesLineShadowColor: string[] = [];
  seriesLineShadowOffsetX: string[] = [];
  seriesLineShadowOffsetY: string[] = [];
  seriesLineShadowBlur: string[] = [];
  seriesSymbol: string[] = [];
  seriesSymbolImage: string[] = [];
  seriesSymbolWidth: string[] = [];
  seriesSymbolHeight: string[] = [];
  seriesItemColor: string[] = [];
  seriesItemBorderWidth: string[] = [];
  seriesItemBorderColor: string[] = [];
  seriesAreaColor: string[] = [];
  tooltipMarkerColor: string[] = [];
  seriesFieldList: string[] = [];
  constructor() {
    const baseChartProps = {
      name: "雷达图",
      prop: otherEchartType.echartradar,
      img: "/img/radar.237e8670.png",
      groupName: "其他"
    };
    super(baseChartProps);
    this.seriesFieldList = [
      // 'seriesColor',
      // 'seriesOpacity',
      "seriesLineColor",
      "seriesLineWidth",
      "seriesLineShadowColor",
      "seriesLineShadowOffsetX",
      "seriesLineShadowOffsetY",
      "seriesLineShadowBlur",
      "seriesSymbol",
      "seriesSymbolImage",
      "seriesSymbolWidth",
      "seriesSymbolHeight",
      "seriesItemColor",
      "seriesItemBorderWidth",
      "seriesItemBorderColor",
      "seriesAreaColor"
    ];
  }
  getOptions() {
    return this.options;
  }
  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    let optionsData = await this.transformOptionsData(baseChartProps.data);
    const { axisName, optionData: radarData } = this.getEchartsAxisNameAndSeriesData(optionsData);
    optionsData = radarData;
    this.dataLength = axisName.length;
    const data = optionsData.map((items) => {
      return {
        name: items.list[0].name,
        value: items.list.map((item: { value: any }) => item.value)
      };
    });
    const seriesName = optionsData.map((item) => item.name);
    // 删除系列时seriesColor被删除那项还是缓存着，刷新页面后重新设置seriesColor才是对的，所以在刷新配置是重置this[field]
    this.seriesFieldList.forEach((field) => {
      if (this.option[field]) {
        (this as any)[field] = [];
      }
    });
    this.option.dataSeriesName.forEach((item: string, index: number) => {
      const idx = seriesName.indexOf(item);
      if (idx !== -1) {
        optionsData[idx].seriesName = this.option.seriesTabsName[index].value;
        this.seriesFieldList.forEach((field: any) => {
          (this[field as keyof EchartRadar] as any[])[idx] = this.option[field][index];
        });
      }
    });

    const options: any = {
      color: ["#31e0f2", "#3e43f4"],
      tooltip: {
        show: false // 弹层数据去掉
      },
      legend: { ...this.createLegend(this.option), data: seriesName || [] },
      radar: {
        center: [(this.option.radarCenterX || 0) + "%", (this.option.radarCenterY || 0) + "%"], // 外圆的位置
        radius: [(this.option.radarRadiusMin || 0) + "%", (this.option.radarRadiusMax || 0) + "%"],
        shape: this.option.radarShape || "polygon",
        splitNumber: this.option.radarSplitNumber || 0,
        nameGap: this.option.radarNameGap || 0,
        name: {
          show: this.validData(this.option.radarNameShow, true),
          fontFamily: this.option.radarNameFontFamily || "Arial",
          fontSize: this.option.radarNameFontSize || 0,
          color: this.option.radarNameColor || "rgba(255, 255, 255, 1)",
          fontStyle: this.option.radarNameFontStyle || "normal",
          fontWeight: this.option.radarNameFontWeight || "normal"
        },
        // TODO:
        // 272.4528855	70.14215591	291.6283237	89.24068791	70.79619566
        // indicator: [
        //   {
        //     name: '维度一',
        //     max: maxList[0]
        //   },
        //   {
        //     name: '维度二',
        //     max: maxList[1]
        //   },
        //   {
        //     name: '维度三',
        //     max: maxList[2]
        //   },
        //   {
        //     name: '维度四',
        //     max: maxList[3]
        //   },
        //   {
        //     name: '维度五',
        //     max: maxList[4]
        //   },
        //   {
        //     name: '维度六',
        //     max: maxList[4]
        //   }
        // ],
        indicator: (() => {
          return axisName.map((item) => {
            const realName = item ? item.replace(/\\n/g, "\n") : "";
            return {
              name: realName || "",
              max: this.option.radarMax || 0,
              min: this.option.radarMin || 0
            };
          });
        })(),
        splitArea: {
          // 坐标轴在 grid 区域中的分隔区域，默认不显示。
          show: true,
          areaStyle: {
            // 分隔区域的样式设置。
            color: this.option.radarSplitAreaColor, // 分隔区域颜色。分隔区域会按数组中颜色的顺序依次循环设置颜色。默认是一个深浅的间隔色。
            opacity: 1
          }
        },
        axisLine: {
          show: this.validData(this.option.radarLineShow, true),
          // 指向外圈文本的分隔线样式
          lineStyle: {
            color: this.option.radarLineColor || "rgba(255, 255, 255, 1)",
            width: this.option.radarLineWidth || 0
          }
        },
        axisTick: {
          show: this.validData(this.option.radarTickShow, true),
          length: this.option.radarTickLength || 0,
          lineStyle: {
            color: this.option.radarTickColor || "rgba(255, 255, 255, 1)",
            width: this.option.radarTickWidth || 0
          }
        },
        axisLabel: {
          show: this.validData(this.option.radarLabelShow, true),
          showMaxLabel: this.validData(this.option.radarLabelMaxShow, true),
          showMinLabel: this.validData(this.option.radarLabelMinShow, false),
          formatter: (value: number) => {
            return value > 0 ? value.toFixed(0) : value.toFixed(1);
          },
          margin: this.option.radarLabelMargin || 0,
          fontFamily: this.option.radarLabelFontFamily || "Arial",
          fontSize: this.option.radarLabelFontSize || 0,
          color: this.option.radarLabelColor || "rgba(255, 255, 255, 1)",
          fontStyle: this.option.radarLabelFontStyle || "normal",
          fontWeight: this.option.radarLabelFontWeight || "normal"
        },
        splitLine: {
          show: this.validData(this.option.radarSplitLineShow, true),
          lineStyle: {
            type: "solid",
            color: this.option.radarSplitLineColor || "rgba(255, 255, 255, 1)",
            width: this.option.radarSplitLineWidth || 0
          }
        }
      },
      series: (() => {
        // const barColor = this.option.barColor || [];
        const list = (optionsData || []).map((item, index: number) => {
          return {
            name: seriesName[index],
            type: "radar",
            symbol:
              this.seriesSymbol[index] === "image"
                ? `image://${setMinioUrl(this.seriesSymbolImage[index])}`
                : this.seriesSymbol[index],
            symbolSize: [this.seriesSymbolWidth[index] || 0, this.seriesSymbolHeight[index] || 0],
            itemStyle: {
              // color: this.getColor(index)
              color: this.seriesItemColor[index] || "red",
              // opacity: this.option.seriesOpacity[index] / 100 || 0,
              borderWidth: this.seriesItemBorderWidth[index] || 0,
              borderColor: this.seriesItemBorderColor[index] || "rgba(255, 255, 255, 1)"
            },
            lineStyle: {
              width: this.seriesLineWidth[index] || 0,
              color: this.seriesLineColor[index] || "rgba(255, 255, 255, 1)",
              shadowColor: this.seriesLineShadowColor[index] || "rgba(255, 255, 255, 1)",
              shadowOffsetX: this.seriesLineShadowOffsetX[index] || 0,
              shadowOffsetY: this.seriesLineShadowOffsetY[index] || 0,
              shadowBlur: this.seriesLineShadowBlur[index] || 0
            },
            areaStyle: {
              color: this.seriesAreaColor[index]
            },
            label: {
              show: this.validData(this.option.seriesLabelShow, false), //开启显示
              position: "top", //在上方显示,
              formatter: (name: { name: string; value: number }) => name.value,
              //数值样式
              fontFamily: this.option.seriesLabelFontFamily || "Source Han Sans CN-Normal, Source Han Sans CN",
              fontStyle: this.option.seriesLabelFontStyle || "normal",
              fontSize: this.option.seriesLabelFontSize || 0,
              color: this.option.seriesLabelColor || "#333",
              fontWeight: this.option.seriesLabelFontWeight || "normal",
              offset: [this.option.seriesLabelOffsetX || 0, this.option.seriesLabelOffsetY || 0]
            },
            data: [data[index]]
          };
        });
        return list;
      })()
      // series: [
      //   {
      //     name: '系列一',
      //     type: 'radar',
      //     symbol: 'none',
      //     data: [
      //       {
      //         // 272.4528855	70.14215591	291.6283237	89.24068791	70.79619566
      //         value: data || [200, 50, 240, 60, 40],
      //         itemStyle: {
      //           // 折线拐点标志的样式。
      //           show: true
      //           // normal: {
      //           //   // 普通状态时的样式
      //           //   lineStyle: {
      //           //     width: 2
      //           //   },
      //           //   opacity: 1
      //           // }
      //         },
      //         lineStyle: {
      //           color: '#31e0f2',
      //           shadowColor: '#31e0f2',
      //           shadowBlur: 10
      //         },
      //         areaStyle: {
      //           color: '#31e0f2',
      //           opacity: 0.2
      //         }
      //       }
      //     ]
      //   },
      //   {
      //     name: '系列二',
      //     type: 'radar',
      //     symbol: 'none',
      //     data: [
      //       {
      //         // 272.4528855	70.14215591	291.6283237	89.24068791	70.79619566
      //         value: data2 || [200, 50, 240, 60, 40],
      //         // itemStyle: {
      //         //   // 折线拐点标志的样式。
      //         //   normal: {
      //         //     // 普通状态时的样式
      //         //     lineStyle: {
      //         //       width: 2
      //         //     },
      //         //     opacity: 1
      //         //   }
      //         // },
      //         lineStyle: {
      //           color: '#3e43f4',
      //           shadowColor: '#3e43f4',
      //           shadowBlur: 10
      //         },
      //         areaStyle: {
      //           color: '#3e43f4',
      //           opacity: 0.2
      //         }
      //       }
      //     ]
      //   }
      // ]
    };
    this.options = options;
  }
}

export { EchartRadar };
