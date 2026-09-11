import { getEchartsColorFromCssLinearColor } from "../../utils";
import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { projectEchartType } from "../type";

class EchartoverlapBar extends BaseChart {
  option: Record<string, any> = {};

  constructor() {
    const defaultChartProps = {
      name: "堆叠占比图",
      prop: projectEchartType.echartoverlapBar,
      img: "/img/overlapBar.8ea5f49e.png",
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
    const { optionData: data } = this.getEchartsAxisNameAndSeriesData(optionsData);
    optionsData = data;
    const options = {
      // backgroundColor: 'rgba(123, 32, 38, 1)',
      tooltip: {
        show: false
      },
      grid: this.createGrid(this.option),
      dataZoom: this.validData(this.option.dataLoop, false)
        ? [
            {
              yAxisIndex: 0, // 这里是从X轴的0刻度开始
              show: false, // 是否显示滑动条，不影响使用
              type: "inside", // 这个 dataZoom 组件是 slider 型 dataZoom 组件
              startValue: 0, // 从头开始。
              endValue: Number(this.option.dataLoopDisplayRows - 1), // 一次性展示10个。
              zoomOnMouseWheel: false
            }
          ]
        : "",
      xAxis: {
        // 兼容老数据
        splitLine:
          "xAxisSplitLineShow" in this.option
            ? {
                show: this.option.xAxisSplitLineShow,
                lineStyle: {
                  width: this.option.xAxisSplitLineWidth,
                  color: this.option.xAxisSplitLineColor,
                  // opacity: '0.2',
                  type: this.option.xAxisSplitLineType
                }
              }
            : {
                show: true,
                lineStyle: {
                  color: "#FFFFFF",
                  opacity: "0.2",
                  type: "dashed"
                }
              },
        type: "value",
        show: true,
        axisLabel: {
          show: false
        },
        axisLine: {
          show: false
        }
      },
      yAxis: {
        inverse: true,
        type: "category",
        data: optionsData[0].list.map((label: { name: any }) => label.name),
        axisLabel: {
          fontSize: this.option.nameFontSize,
          color: this.option.nameColor,
          // opacity: '0.8',
          fontFamily: this.option.nameFontFamily,
          fontStyle: this.option.nameFontStyle,
          fontWeight: this.option.nameFontWeight,
          margin: this.option.nameLeftPadding
          // width: this.option.nameWidth
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: "#fff",
            opacity: 0.5
          }
        },
        splitLine: {
          show: false
        },
        axisTick: {
          show: false
        }
      },
      series: [
        {
          type: "bar",
          barWidth: this.option.seriesWidth[0],
          itemStyle: {
            barBorderRadius: 12,
            color: getEchartsColorFromCssLinearColor(this.option.barBodyColor[0]),
            opacity: this.option.barBodyOpacity[0]
          },
          data: optionsData[0].list,
          label: {
            show: this.option.valueShow[0],
            position: "left",
            offset: [this.option.valueOffSetX[0], this.option.valueOffSetY[0]],
            formatter: (params: { value: any }) => {
              return `{label|${params.value}%}{line|   |}`;
            },
            rich: {
              label: {
                fontSize: this.option.valueFontSize[0],
                fontFamily: this.option.valueFontFamily[0],
                fontStyle: this.option.valueFontStyle[0],
                fontWeight: this.option.valueFontWeight[0],
                color: this.option.valueColor[0]
              },
              line: {
                padding: 0,
                fontSize: this.option.splitLineFontSize,
                color: this.option.splitLineColor
              }
            }
          },
          tooltip: {
            show: false
          }
        },
        {
          type: "bar",
          barGap: "-100%",
          barWidth: this.option.seriesWidth[1],
          itemStyle: {
            barBorderRadius: 12,
            color: getEchartsColorFromCssLinearColor(this.option.barBodyColor[1]),
            borderColor: this.option.barBorderColor,
            opacity: this.option.barBodyOpacity[1],
            borderWidth: this.option.borderWidth
          },
          data: optionsData[1].list,
          label: {
            show: this.option.valueShow[1],
            position: "left",
            offset: [this.option.valueOffSetX[1], this.option.valueOffSetY[1]],
            // align: 'right',
            fontSize: this.option.valueFontSize[1],
            fontFamily: this.option.valueFontFamily[1],
            color: this.option.valueColor[1],
            fontStyle: this.option.valueFontStyle[1],
            fontWeight: this.option.valueFontWeight[1],
            formatter: `{c}%`
          },
          tooltip: {
            show: false
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
    this.options = options;
  }
}

export { EchartoverlapBar };
