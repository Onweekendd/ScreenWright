import { cloneDeep } from "lodash-es";

import { descSort, getColorListByData, getEchartsColorFromCssLinearColor, getTop3Label } from "../../utils";
import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { projectEchartType } from "../type";

class EchartrankBar extends BaseChart {
  option: Record<string, any> = {};
  dataLength = 0;
  colorNameList: string[] = [];
  seriesColor: any[] = [];

  isSort = true;
  constructor() {
    const defaultChartProps = {
      name: "排名图",
      prop: projectEchartType.echartrankBar,
      img: "/img/rankBar.20240514.png",
      groupName: "项目"
    };
    super(defaultChartProps);
    this.colorNameList = ["seriesColor"];
  }
  nameObject() {
    return {
      nameFontFamily: this.option.nameFontFamily,
      nameFontSize: this.option.nameFontSize,
      nameColor: this.option.nameColor,
      nameFontStyle: this.option.nameFontStyle,
      nameFontWeight: this.option.nameFontWeight,
      nameWidth: this.option.nameWidth,
      nameLeftPadding: this.option.nameLeftPadding
    };
  }
  getOptions() {
    return this.options;
  }

  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    const filterData = await this.transformOptionsDataByDataFilter();
    const optionsData = cloneDeep(filterData);

    const data = this.isSort ? descSort(cloneDeep(optionsData), "value") : cloneDeep(optionsData);
    this.dataLength = data.length;
    this.colorNameList.forEach((item) => {
      if (typeof this.option[item] === "object" && !this.option[item].colorStops) {
        (this[item as keyof EchartrankBar] as any) = getEchartsColorFromCssLinearColor(this.option[item]);
      } else (this[item as keyof EchartrankBar] as any) = this.option[item];
    });
    const unit = "";
    const toFixedNum = 0;
    let color: any[] = [];
    color = this.option.seriesColor || getColorListByData(data, "v");
    let max = Math.max(...data.map((item: { value: number }) => item.value));
    max += max / 10;
    const maxArr = [];
    const stackData = [];
    for (let index = 0; index < data.length; index += 1) {
      maxArr.push(max);
      stackData.push(max - data[index].value);
    }
    console.log(stackData, "stackDatastackData");

    const options = {
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
        max,
        axisLine: {
          show: false
        },
        axisLabel: {
          show: false
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        inverse: true,
        data: data.map((item: { name: string }) => {
          return {
            value: item.name
          };
        }),
        axisLabel: {
          show: false,
          color: "rgb(209,209,209)",
          fontSize: 19,
          fontFamily: "AlibabaPuHuiTiR",
          interval: 0
        },
        axisLine: {
          show: false,
          lineStyle: {
            color: "#d2d2d2"
          }
        },
        splitLine: {
          show: false,
          lineStyle: {
            color: "#d2d2d2",
            opacity: "0.1",
            type: "dashed"
          }
        },
        axisTick: {
          show: false,
          length: 0
        }
      },
      series: [
        {
          stack: "总量",
          // barGap: '-100%',
          type: "bar",
          barWidth: this.option.seriesWidth,
          itemStyle: {
            normal: {
              color: (params: { dataIndex: number }) => {
                return color[params.dataIndex];
              }
            }
          },
          data,
          tooltip: {
            show: false
          }
        },
        {
          stack: "总量",
          type: "bar",
          barWidth: this.option.seriesWidth,
          itemStyle: {
            normal: {
              color: "rgba(0, 214, 255, 0.2)"
            }
          },
          data: stackData,
          label: {
            show: this.option.valueShow,
            position: "right",
            offset: [this.option.valueOffSetX, this.option.valueOffSetY],
            color: this.option.valueColor,
            fontFamily: this.option.valueFontFamily,
            fontSize: this.option.valueFontSize,
            fontStyle: this.option.valueFontStyle,
            fontWeight: this.option.valueFontWeight,
            formatter: (res: { dataIndex: number }) => {
              const val =
                (toFixedNum ? Number(data[res.dataIndex].value).toFixed(toFixedNum) : data[res.dataIndex].value) +
                (unit || "");
              return Number(val).toLocaleString();
            }
          },
          tooltip: {
            show: false
          }
        },
        // 分割线
        {
          barGap: "-100%",
          z: 20,
          type: "pictorialBar",
          symbol: "rect",
          symbolRepeat: "true",
          symbolMargin: "80%",
          symbolClip: true,
          symbolSize: [6, this.option.seriesWidth],
          itemStyle: {
            color: this.option.intervalColor
          },
          data: maxArr,
          label: getTop3Label(this.nameObject()),
          tooltip: {
            show: false
          }
        }
      ]
    };

    this.options = options;
  }
}

export { EchartrankBar };
