import down from "@material/assets/image/arrowDown.png";
import up from "@material/assets/image/arrowUp.png";

import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { projectEchartType } from "../type";

class EchartgrowthRateBar extends BaseChart {
  option: Record<string, any> = {};

  constructor() {
    const defaultChartProps = {
      name: "增长率柱状图",
      prop: projectEchartType.echartgrowthRateBar,
      img: "/img/RateBar.20240514.png",
      groupName: "项目"
    };
    super(defaultChartProps);
  }

  getOptions() {
    return this.options;
  }

  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    let optionsData = await this.transformOptionsData(baseChartProps.data);
    const { axisName: yAxisName, optionData } = this.getEchartsAxisNameAndSeriesData(optionsData);
    optionsData = optionData;
    const optionDataByName = await this.transformOptionsData(baseChartProps.data, "name");
    const rateList = optionDataByName.map((item) => {
      return ((item.list[1].value / item.list[0].value - 1) * 100).toFixed(2) + "%";
    });

    const options = {
      tooltip: {
        trigger: "axis",
        confine: true,
        position: (point: number[]) => {
          // 固定在顶部
          return [point[0] + 2, point[1] - 100];
        },
        extraCssText:
          "box-shadow :inset 0 0 23px #008aff;color:#fff;padding:5px 23px 5px 23px;border-radius:0;line-height:30px;",
        axisPointer: {
          label: {
            show: true,
            formatter: () => {
              return "";
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
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderWidth: 0,
        formatter: (params: any[]) => {
          let str = '<div style="">';
          params.forEach((item, index) => {
            if (index < 2) {
              const param = item;
              param.marker = `<span style="display:inline-block;vertical-align:3%;margin-right:20px;width:14px;height:9px;background-color:${this.option.seriesColor[index]};"></span>`;
              str += `<p style="color:#fff;font-size:16px;text-align:left;margin:0;"><span style="font-family:'DIN-Bold';font-size:19px;">${param.marker}${param.value}</span></p>`;
            }
          });
          str += `<div class="flex"><img src="${
            rateList[params[0].dataIndex].match(RegExp(/-/)) ? down : up
          }" style="width:16px;height:16px;margin-top:8px"/><p style="color:#fff;font-size:16px;text-align:left;"><span style="font-family:'DIN-Bold';font-size:19px;padding-left:10px;">${rateList[params[0].dataIndex]}</span></p></div>`;
          str += "</div>";
          return str;
        }
      },
      legend: [
        {
          icon: "roundRect",
          show: this.option.legendShow,
          // itemGap: 30,
          // itemWidth: 15,
          // itemHeight: 9,
          itemWidth: this.option.legendItemWidth || 0,
          itemHeight: this.option.legendItemHeight || 0,
          itemGap: this.option.legendItemGap || 0,
          textStyle: {
            fontFamily: this.option.legendFontFamily || "Arial",
            fontSize: this.option.legendFontSize || 0,
            color: this.option.legendColor || "rgba(255, 255, 255, 1)",
            fontStyle: this.option.legendFontStyle || "normal",
            fontWeight: this.option.legendFontWeight || "normal"
          },
          data: [
            {
              name: this.option.dataSeriesName[0],
              icon: "roundRect"
            },

            {
              name: this.option.dataSeriesName[1],
              icon: "roundRect"
            },
            {
              name: "增长率",
              icon: "image://data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAASCAYAAABb0P4QAAAB7klEQVQ4jZXUO2hUQRTG8V+yUdegsuALUlooi2ghkS1sfDYWtqKthaKwPtHGMo3B54pRC2uxtRAEEdFq24AsCraCj8iioqtxs3LIXHJzXUNy4HJnd87855vvnLkDvV5PFu1afRMmsAonK83GpD5R1RnBeMo731J+l2UN5mAVnMEB7MLFdq2+oR8QW7EXe7A9PzGYYMtwAsdzmxzBuXatPtwHuBLLMZTG84E4iLMpKT93Cof7AP+kp5vec4vatfpuXEZ2vG56JI8utWv1Q/85+j8RKi5gFF/wAlPhAp7hA7akDRcNDMnf8QDX8A2/cQd38RW/FgsMU2/hFR5iJJk8nEATSe3bpSiMY96uNBvvsQ5R8RLWVpqNTwn6tLCuVGDMKaw0G710RAk2g162qNJsTJtt5oGYbylH7nQCDWQFrOrE2u5QYedubjxTmItu2FHVCWs+J2i02VRVZz2OhjVF4EJxGvuwES/xMylcE9c0LgEmlwIcSn15DDuxOtkSzb8tgVcsBXg1qRtNx8/s2Z/ebzA2uABgXrSUoxvG8DH9X8pVO/r4Skv5cREYiuOJxH7qn+BGrisionhxCR7FjyIwjI7kuD0xLqqMyt7D/VwXRNWvt5R/ZIry8RrPk/l9P64t5XZV5yY2p7zxlvKsDfgL4Vh+VrmIr70AAAAASUVORK5CYII="
            }
          ]
        }
      ],
      grid: this.createGrid(this.option),
      xAxis: {
        show: this.validData(this.option.xAxisShow, true),
        // type: this.option.category ? 'category' : 'value',
        type: "value",
        max: Number(this.option.xAxisMax) || undefined,
        min: Number(this.option.xAxisMin) || undefined,
        // data: optionData.categories || [],
        axisLabel: {
          show: this.validData(this.option.xAxisLabelShow, true),
          margin: this.option.xAxisMargin || 0,
          color: this.option.xAxisColor || "#333",
          fontSize: this.option.xAxisFontSize || 0,
          fontStyle: this.option.xAxisFontStyle || "normal",
          fontWeight: this.option.xAxisFontWeight || "normal",
          fontFamily: this.option.xAxisFontFamily || "Arial"
        },
        axisLine: {
          show: this.validData(this.option.xAxisLineShow, true),
          lineStyle: {
            color: this.option.xAxisLineColor || "#333",
            width: this.option.xAxisLineWidth || 0
            // opacity: this.option.xAxisLineOpacity || 0.5
          }
        },
        splitLine: {
          show: this.validData(this.option.xAxisSplitLineShow, true),
          lineStyle: {
            type: "dashed",
            width: this.option.xAxisSplitLineWidth || 0,
            color: this.option.xAxisSplitLineColor || "#333"
          }
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
        type: this.option.yAxisType || "category",
        data: yAxisName,
        axisLabel: {
          show: this.validData(this.option.yAxisLabelShow, true),
          interval: (() => {
            const value = this.option.yAxisInterval || 0;
            if (value === 0) return "auto";
            if (value < 0) return 0;
            return value;
          })(),
          rotate: this.option.yAxisRotate || 0,
          margin: this.option.yAxisMargin || 0,
          color: this.option.yAxisColor || "#333",
          fontSize: this.option.yAxisFontSize || 0,
          fontStyle: this.option.yAxisFontStyle || "normal",
          fontWeight: this.option.yAxisFontWeight || "normal",
          fontFamily: this.option.yAxisFontFamily || "Arial",
          // formatter:
          //   this.option.yAxisType === 'time'
          //     ? this.option.yAxisTimeType
          //     : '{value}'
          formatter: (params: any, index: number) => {
            if (this.option.yAxisLabelHover[index]) return `{hover_${index}|${params}}`;
            return params;
          },
          rich: (() => {
            const res: any = {};
            yAxisName.forEach((item, index) => {
              res[`hover_${index}`] = {
                color: this.option.yAxisLabelHoverColor[index] || "rgba(241,205,59,1)",
                fontSize: this.option.yAxisFontSize || 0,
                fontStyle: this.option.yAxisFontStyle || "normal",
                fontWeight: this.option.yAxisFontWeight || "normal",
                fontFamily: this.option.yAxisFontFamily || "Arial"
              };
            });
            return res;
          })()
        },
        axisLine: {
          show: this.validData(this.option.yAxisLineShow, true),
          lineStyle: {
            color: this.option.yAxisLineColor || "#333",
            width: this.option.yAxisLineWidth || 0
            // opacity: this.option.yAxisLineOpacity || 0.5
          }
        },
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
        axisTick: {
          show: this.validData(this.option.yAxisTickShow, true),
          length: this.option.yAxisTickLength || 0,
          lineStyle: {
            color: this.option.yAxisTickColor || "#333",
            width: this.option.yAxisTickWidth || 0
          }
        }
      },
      series: (() => {
        const res = [];
        for (let index = 0; index < 2; index++) {
          res.push({
            barGap: "-100%",
            stack: "total",
            name: this.option.dataSeriesName[index],
            type: "bar",
            barWidth: this.option.seriesWidth || 0,
            itemStyle: {
              color: this.option.seriesColor[index] || "#fff",
              borderWidth: 1,
              borderColor: this.option.borderColor[index] || "#000"
            },
            data: optionData[index].list
          });
        }
        res.push({
          name: "增长率",
          type: "pictorialBar",
          symbol: "none",
          itemStyle: {
            color: "#fff"
          },
          data: [0]
        });
        return res;
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
}

export { EchartgrowthRateBar };
