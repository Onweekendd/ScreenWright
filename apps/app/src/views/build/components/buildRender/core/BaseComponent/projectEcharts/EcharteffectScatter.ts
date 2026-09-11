import { BaseChart } from "../BaseChart/index";
import type { ArrayDataItem, BaseChartProps } from "../type";
import { projectEchartType } from "../type";

class EcharteffectScatter extends BaseChart {
  option: Record<string, any> = {};

  constructor() {
    const defaultChartProps = {
      name: "Top10气泡图",
      prop: projectEchartType.echarteffectScatter,
      img: "/img/effectScatter.60f2a868.png",
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
    const optionsData = await this.transformOptionsDataByDataFilter();
    const seriesData: any[] = [];
    if (this.option.seriesList) {
      optionsData.forEach((item: ArrayDataItem) => {
        const target = this.option.seriesList.find((it1: { name: any }) => it1.name === item.name);
        if (target) {
          seriesData.push({
            ...target,
            value: item.value
          });
        }
      });
    }

    const options = {
      legend: { show: false },
      grid: this.createGrid(this.option),
      xAxis: {
        max: 100,
        axisLine: { show: false },
        axisLabel: { show: false },
        axisTick: { show: false },
        splitLine: { show: false }
      },
      yAxis: {
        max: 100,
        axisLine: { show: false },
        axisLabel: { show: false },
        axisTick: { show: false },
        splitLine: { show: false }
      },
      series: seriesData.map((item) => {
        return {
          type: "effectScatter",
          showEffectOn: item.showEffectOn,
          rippleEffect: {
            number: this.option.rippleEffectNumber || 0,
            period: this.option.rippleEffectPeriod || 0,
            scale: this.option.rippleEffectScale || 0,
            brushType: this.option.rippleEffectBrushType || "fill"
          },
          symbolSize: (params: number[]) => {
            return params[2] * 1.5;
          },
          label: {
            show: true
          },
          emphasis: {
            label: { show: true }
          },
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(120, 36, 50, 0)",
            borderWidth: this.option.borderWidth || 0,
            borderColor: this.option.borderColor || "#fff"
          },
          data: [
            {
              name: item.name,
              value: [item.translateX, item.translateY, item.size, item.name, item.value],
              symbol: "circle",
              label: {
                formatter: (() => {
                  const res = [];
                  if (item.seriesLabelTopShow) res.push(`{top|${item.tabName}}`);
                  if (item.seriesLabelNameShow) res.push(`{name|${item.name}}`);
                  if (item.seriesLabelValueShow) res.push(`{value|${item.value || ""}}`);
                  return res.join("\n");
                })(),
                align: "center",
                verticalAlign: "middle",
                offset: item.value ? [0, 0] : [0, 5],
                rich: {
                  top: {
                    fontFamily: item.seriesLabelTopFontFamily || "Arial",
                    fontSize: item.seriesLabelTopFontSize || 0,
                    color: item.seriesLabelTopColor || "rgba(255, 255, 255, 1)",
                    fontStyle: item.seriesLabelTopFontStyle || "normal",
                    fontWeight: item.seriesLabelTopFontWeight || "normal"
                  },
                  name: {
                    fontFamily: item.seriesLabelNameFontFamily || "Arial",
                    fontSize: item.seriesLabelNameFontSize || 0,
                    color: item.seriesLabelNameColor || "rgba(255, 255, 255, 1)",
                    fontStyle: item.seriesLabelNameFontStyle || "normal",
                    fontWeight: item.seriesLabelNameFontWeight || "normal"
                  },
                  value: {
                    fontFamily: item.seriesLabelValueFontFamily || "Arial",
                    fontSize: item.seriesLabelValueFontSize || 0,
                    color: item.seriesLabelValueColor || "rgba(255, 255, 255, 1)",
                    fontStyle: item.seriesLabelValueFontStyle || "normal",
                    fontWeight: item.seriesLabelValueFontWeight || "normal"
                  }
                }
              },
              itemStyle: {
                color: {
                  type: "radial",
                  x: 0.5,
                  y: 0.5,
                  r: 0.5,
                  colorStops: [
                    {
                      offset: 0.25,
                      color: item.insideColor
                    },
                    {
                      offset: 1,
                      color: item.outsideColor
                    }
                  ]
                }
              }
            }
          ]
        };
      })
    };
    this.options = options;
  }
}

export { EcharteffectScatter };
