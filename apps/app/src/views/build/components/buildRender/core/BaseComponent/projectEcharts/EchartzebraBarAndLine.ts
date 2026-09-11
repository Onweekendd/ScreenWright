import { cloneDeep, isArray } from "lodash-es";

import { setMinioUrl } from "@/utils/config";

import { getEchartsColorFromCssLinearColor } from "../../utils";
import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { projectEchartType } from "../type";

class EchartzebraBarAndLine extends BaseChart {
  option: Record<string, any> = {};
  dataLength = 0;
  legendGridTop = 0;
  legendGridLeft = 0;
  legendGridRight = 0;
  legendGridBottom = 0;
  seriesBarColor: any[] = [];
  seriesType: any[] = [];
  seriesLineColor: any[] = [];
  seriesLineOpacity: number[] = [];
  seriesLineWidth: number[] = [];
  seriesSmoothShow: boolean[] = [];
  seriesSmooth: boolean[] = [];
  extremeShow: boolean[] = [];
  seriesConnectNulls: boolean[] = [];
  seriesSymbolShow: boolean[] = [];
  seriesSymbol: string[] = [];
  seriesSymbolImage: string[] = [];
  seriesSymbolWidth: number[] = [];
  seriesSymbolHeight: number[] = [];
  seriesItemColor: string[] = [];
  seriesItemBorderWidth: number[] = [];
  seriesItemBorderColor: string[] = [];
  seriesLabelShow: boolean[] = [];
  seriesLabelColor: string[] = [];
  seriesLabelFontFamily: string[] = [];
  seriesLabelFontSize: number[] = [];
  seriesLabelFontWeight: string[] = [];
  seriesLabelFontStyle: string[] = [];
  seriesLabelOffsetX: number[] = [];
  seriesLabelOffsetY: number[] = [];
  seriesFieldList: string[] = [];
  constructor() {
    const defaultChartProps = {
      name: "斑马柱状折线图",
      prop: projectEchartType.echartzebraBarAndLine,
      img: "/img/BarAndLine.20240514.png",
      groupName: "项目"
    };
    super(defaultChartProps);
    this.seriesFieldList = [
      "seriesType",
      "seriesBarColor",
      "seriesLineColor",
      "seriesLineOpacity",
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
  }

  getOptions() {
    return this.options;
  }

  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    this.compatibleWithOldData();
    let optionsData = await this.transformOptionsData(baseChartProps.data);
    const { axisName: xAxisName, optionData: data } = this.getEchartsAxisNameAndSeriesData(optionsData);
    optionsData = data;
    optionsData = this.transformAxisData(optionsData, baseChartProps.yAxisType);
    this.dataLength = optionsData[0].list.length;
    const seriesName = optionsData.map((item) => item.name);
    this.seriesFieldList.forEach((field) => {
      if (this.option[field]) (this[field as keyof EchartzebraBarAndLine] as any) = [];
    });
    this.option.dataSeriesName.forEach((item: any, index: number) => {
      const idx = seriesName.indexOf(item);
      if (idx !== -1) {
        seriesName[idx] = this.option.seriesTabsName[index].value;
        this.seriesFieldList.forEach((field: any) => {
          (this[field as keyof EchartzebraBarAndLine] as any[])[idx] = this.option[field][index];
        });
      }
    });
    // css线性渐变色转为echarts线性渐变色
    this.seriesLineColor = this.seriesLineColor.map((item) => {
      if (typeof item === "object" && !item.colorStops) {
        return getEchartsColorFromCssLinearColor(item);
      }
      return item;
    });

    this.seriesBarColor = this.seriesBarColor.map((item) => {
      if (typeof item === "object" && !item.colorStops) {
        return getEchartsColorFromCssLinearColor(item);
      }
      return item;
    });

    const markerColor = (() => {
      const res: any[] = [];
      this.option.dataSeriesName.map((dsnItem: any, dsnItemIndex: number) => {
        if (this.option.seriesType[dsnItemIndex] === "bar") {
          res[dsnItemIndex] = this.option.seriesBarColor?.[dsnItemIndex]?.colors
            ? this.option.seriesBarColor[dsnItemIndex]?.colors?.[0]?.color
            : this.option.seriesBarColor[dsnItemIndex];
        }
        if (this.option.seriesType[dsnItemIndex] === "line") {
          res[dsnItemIndex] = this.option.seriesLineColor?.[dsnItemIndex]?.colors
            ? this.option.seriesLineColor[dsnItemIndex]?.colors?.[0]?.color
            : this.option.seriesLineColor[dsnItemIndex];
        }
      });
      return res;
    })();
    const options = {
      tooltip: {
        trigger: "axis",
        confine: true,
        position: (point: number[]) => {
          // console.log(size);
          // 固定在顶部
          return [point[0] - 1, point[1] - 120];
        },
        axisPointer: {
          label: {
            show: true,
            formatter: () => {
              return "▲";
            },
            margin: -20,
            backgroundColor: "transparent",
            fontSize: 20
          },
          lineStyle: {
            color: "#ffffff",
            width: 1,
            shadowColor: "rgba(22, 156, 241, 1)",
            shadowBlur: 2
          }
        },
        extraCssText:
          "box-shadow :inset 0 0 23px #008aff;color:#fff;padding:5px 23px 15px 23px;border-radius:0;line-height:30px;",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderWidth: 0,
        formatter: (params: any[]) => {
          let str = "";
          str += `<div>`;
          str += `<p style="color:#fff;font-size:16px;text-align:left;margin:0;"><span style="font-family:'Source Han Sans CN-Normal, Source Han Sans CN';font-size:19px;">${params[0].name}</span></p>`;
          params.forEach((item: any, index: number) => {
            const param = item;
            param.marker = `<span style="display:inline-block;vertical-align:15%;margin-right:20px;width:16px;height:3px;background-color:${markerColor[index]};"></span>`;
            str += `<p style="color:#fff;font-size:16px;text-align:left;margin:0;"><span style="font-family:'Source Han Sans CN-Normal, Source Han Sans CN';font-size:19px;">${
              param.marker
            }${this.option.tooltipSeriesName ? param.seriesName : ""} ${param.value}</span></p>`;
          });
          str += `</div>`;
          return str;
        }
      },
      grid: this.createGrid(this.option),
      legend: this.createLegend(this.option),
      dataZoom: [],
      xAxis: {
        show: this.validData(this.option.xAxisShow, true),
        type: this.option.xAxisType || "category",
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
      yAxis: [
        {
          show: this.validData(this.option.lyAxisShow, true),
          // type: this.option.category ? 'category' : 'value',
          type: "value",
          max: this.option.lyAxisMax || undefined,
          min: this.option.lyAxisMin || undefined,
          name: this.option.lyAxisNameShow && this.option.lyAxisName,
          nameTextStyle: {
            padding: [
              0,
              this.option.lyAxisNamePaddingRight || 0,
              this.option.lyAxisNamePaddingBottom || 0,
              this.option.lyAxisNamePaddingLeft || 0
            ],
            color: this.option.lyAxisNameColor || "#333",
            fontSize: this.option.lyAxisNameFontSize || 0,
            fontStyle: this.option.lyAxisNameFontStyle || "normal",
            fontWeight: this.option.lyAxisNameFontWeight || "normal",
            fontFamily: this.option.lyAxisNameFontFamily || "Arial"
          },
          nameGap: 20 + -1 * (this.option.lyAxisNamePaddingTop || 0),
          // data: optionsData.categories || [],
          axisLabel: {
            show: this.validData(this.option.lyAxisLabelShow, true),
            margin: this.option.lyAxisMargin || 0,
            color: this.option.lyAxisColor || "#333",
            fontSize: this.option.lyAxisFontSize || 0,
            fontStyle: this.option.lyAxisFontStyle || "normal",
            fontWeight: this.option.lyAxisFontWeight || "normal",
            fontFamily: this.option.lyAxisFontFamily || "Arial"
          },
          axisLine: {
            show: this.validData(this.option.lyAxisLineShow, true),
            lineStyle: {
              color: this.option.lyAxisLineColor || "#333",
              width: this.option.lyAxisLineWidth || 0
              // opacity: this.option.yAxisLineOpacity || 0.5
            }
          },
          splitLine: {
            show: this.validData(this.option.lyAxisSplitLineShow, true),
            lineStyle: {
              type: "dashed",
              width: this.option.lyAxisSplitLineWidth || 0,
              color: this.option.lyAxisSplitLineColor || "#333"
            }
          },
          axisTick: {
            show: this.validData(this.option.lyAxisTickShow, true),
            length: this.option.lyAxisTickLength || 0,
            lineStyle: {
              color: this.option.lyAxisTickColor || "#333",
              width: this.option.lyAxisTickWidth || 0
            }
          }
        },
        {
          show: this.validData(this.option.ryAxisShow, true),
          // type: this.option.category ? 'category' : 'value',
          type: "value",
          max: this.option.ryAxisMax || undefined,
          min: this.option.ryAxisMin || undefined,
          name: this.option.ryAxisNameShow && this.option.ryAxisName,
          nameTextStyle: {
            padding: [
              0,
              this.option.ryAxisNamePaddingRight || 0,
              this.option.ryAxisNamePaddingBottom || 0,
              this.option.ryAxisNamePaddingLeft || 0
            ],
            color: this.option.ryAxisNameColor || "#333",
            fontSize: this.option.ryAxisNameFontSize || 0,
            fontStyle: this.option.ryAxisNameFontStyle || "normal",
            fontWeight: this.option.ryAxisNameFontWeight || "normal",
            fontFamily: this.option.ryAxisNameFontFamily || "Arial"
          },
          nameGap: 20 + -1 * this.option.ryAxisNamePaddingTop,
          // data: optionsData.categories || [],
          axisLabel: {
            show: this.validData(this.option.ryAxisLabelShow, true),
            margin: this.option.ryAxisMargin || 0,
            color: this.option.ryAxisColor || "#333",
            fontSize: this.option.ryAxisFontSize || 0,
            fontStyle: this.option.ryAxisFontStyle || "normal",
            fontWeight: this.option.ryAxisFontWeight || "normal",
            fontFamily: this.option.ryAxisFontFamily || "Arial"
          },
          axisLine: {
            show: this.validData(this.option.ryAxisLineShow, true),
            lineStyle: {
              color: this.option.ryAxisLineColor || "#333",
              width: this.option.ryAxisLineWidth || 0
              // opacity: this.option.yAxisLineOpacity || 0.5
            }
          },
          splitLine: {
            show: this.validData(this.option.ryAxisSplitLineShow, true),
            lineStyle: {
              type: "dashed",
              width: this.option.ryAxisSplitLineWidth || 0,
              color: this.option.ryAxisSplitLineColor || "#333"
            }
          },
          axisTick: {
            show: this.validData(this.option.ryAxisTickShow, true),
            length: this.option.ryAxisTickLength || 0,
            lineStyle: {
              color: this.option.ryAxisTickColor || "#333",
              width: this.option.ryAxisTickWidth || 0
            }
          }
        }
      ],
      series: (() => {
        // const barColor = this.option.barColor || [];
        // 老的格式当出现多个柱状图时会异常，这里做兼容
        const barArr: any[] = [];
        this.seriesType.map((it, idx) => {
          if (it === "bar") {
            barArr.push({
              type: it,
              indexInOption: idx
            });
          }
        });
        // 中间值
        const barArrMiddleIndex = (barArr.length + 1) / 2 - 1;
        const list: any[] = [];
        (optionsData || []).forEach((item, index) => {
          if (this.seriesType[index] === "bar") {
            // targetIndex主要用户设置间隙和顶部
            const targetIndex = barArr.findIndex((ba) => ba.indexInOption === index);
            list.push([
              // 顶部
              {
                type: "pictorialBar",
                symbol: "rect",
                symbolSize: [this.option.seriesWidth[index] + 4, 5],
                // symbolOffset: [0, -8],
                symbolOffset: [(targetIndex - barArrMiddleIndex) * (this.option.seriesWidth[index] + 3.5), -8],
                zlevel: 4,
                tooltip: {
                  show: false
                },
                itemStyle: {
                  color: "#ffffff",
                  shadowBlur: 20,
                  shadowColor: "rgba(0, 214, 255, 1)"
                },
                data: item.list.map((ele: any) => {
                  return {
                    value: ele.value,
                    symbolPosition: "end"
                  };
                })
              },
              {
                name: seriesName[index],
                type: "bar",
                barWidth: this.option.seriesWidth[index],
                itemStyle: {
                  color: this.seriesBarColor[index],
                  opacity: this.option.seriesBarOpacity[index] / 100 || 0
                },
                data: item.list
              },
              // 分割线
              {
                z: 20,
                type: "pictorialBar",
                symbol: "rect",
                symbolRepeat: "true",
                symbolMargin: "160%",
                symbolClip: true,
                symbolSize: [this.option.seriesWidth[index], 3],
                symbolOffset: [(targetIndex - barArrMiddleIndex) * (this.option.seriesWidth[index] + 3.5), -8],
                itemStyle: {
                  color: this.option.intervalColor[index] || "rgba(4,18,40,0.8)"
                },
                data: item.list,
                tooltip: {
                  show: false
                }
              }
            ]);
          }
          if (this.seriesType[index] === "line") {
            list.push({
              yAxisIndex: 1,
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
                width: this.seriesLineWidth[index],
                color: this.seriesLineColor[index],
                opacity: this.seriesLineOpacity[index] / 100 || 0
              },
              label: {
                show: this.validData(this.seriesLabelShow[index], false),
                position: "top",
                formatter: (name: { name: string; value: number }) => name.value,
                //数值样式
                fontFamily: this.seriesLabelFontFamily[index] || "Source Han Sans CN-Normal, Source Han Sans CN",
                fontStyle: this.seriesLabelFontStyle[index] || "normal",
                fontSize: this.seriesLabelFontSize[index] || 0,
                color: this.seriesLabelColor[index] || "#333",
                fontWeight: this.seriesLabelFontWeight[index] || "normal",
                offset: [this.seriesLabelOffsetX[index] || 0, this.seriesLabelOffsetY[index] || 0]
              },
              data: item.list
            });
          }
        });
        return list.flat();
      })(),
      animationDelay: (idx: number) => {
        idx += 0.5;
        // 越往后的数据延迟越大
        return idx * 100;
      },
      animationEasing: "linear"
    };
    this.options = options;
  }
  // 兼容类型-柱形的老数据
  compatibleWithOldData() {
    const barKeyList = ["seriesWidth", "seriesBarColor", "seriesBarOpacity", "intervalColor"];
    barKeyList.map((blItem) => {
      const newItem = cloneDeep(this.option[blItem]);
      if (!isArray(newItem)) {
        this.option[blItem] = this.option.dataSeriesName.map((_: any) => {
          return newItem;
        });
        // 渐变颜色首次设置无效问题
        if (blItem === "seriesBarColor") {
          this.option.seriesBarColor.map((it: { colors: { color: string }[] }) => {
            if (it?.colors?.length) {
              it.colors.map((colorItem: { color: string }) => {
                if (colorItem?.color?.indexOf("rgb") !== -1 && colorItem?.color?.indexOf("rgba") === -1) {
                  colorItem.color = colorItem.color.replace("rgb(", "rgba(");
                  colorItem.color = colorItem.color.replace(")", ",1)");
                }
              });
            }
          });
        }
      }
    });
    // 渐变颜色首次设置无效问题
    if ("seriesLineColor" in this.option && isArray(this.option.seriesLineColor)) {
      this.option.seriesLineColor.map((it: { colors: { color: string }[] }) => {
        if (it?.colors?.length) {
          it.colors.map((colorItem: { color: string }) => {
            if (colorItem?.color?.indexOf("rgb") !== -1 && colorItem?.color?.indexOf("rgba") === -1) {
              colorItem.color = colorItem.color.replace("rgb(", "rgba(");
              colorItem.color = colorItem.color.replace(")", ",1)");
            }
          });
        }
      });
    }
  }
}

export { EchartzebraBarAndLine };
