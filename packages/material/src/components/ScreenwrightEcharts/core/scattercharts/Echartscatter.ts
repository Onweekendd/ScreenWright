import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { scatterEchartType } from "../type";

class Echartscatter extends BaseChart {
  option: Record<string, any> = {};
  legendGridTop = 0;
  legendGridLeft = 0;
  legendGridRight = 0;
  legendGridBottom = 0;
  seriesSymbolSize: number[] = [];
  seriesColor: any[] = [];
  seriesItemBorderShow: boolean[] = [];
  seriesItemBorderWidth: number[] = [];
  seriesItemBorderColor: string[] = [];
  tooltipUnit: string[] = [];
  tooltipMarkerColor: string[] = [];
  seriesFieldList: string[] = [];
  constructor() {
    const defaultChartProps = {
      name: "散点图",
      prop: scatterEchartType.echartscatter,
      img: "/img/scatter.20240514.png",
      groupName: "散点图",
    };
    super(defaultChartProps);
    this.seriesColor = [];
    this.seriesItemBorderShow = [];
    this.seriesItemBorderWidth = [];
    this.seriesItemBorderColor = [];
    this.tooltipUnit = [];
    this.tooltipMarkerColor = [];
    this.seriesFieldList = [
      "seriesSymbolSize",
      "seriesColor",
      "seriesItemBorderShow",
      "seriesItemBorderColor",
      "seriesItemBorderWidth",
    ];
  }

  getOptions() {
    return this.options;
  }

  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    let optionsData = await this.transformOptionsData(baseChartProps.data);
    const { axisName: yAxisName, optionData } =
      this.getEchartsAxisNameAndSeriesData(optionsData);
    optionsData = optionData;

    optionsData = this.transformAxisData(optionsData, baseChartProps.yAxisType);
    const seriesName = optionsData.map((item) => item.name);

    this.seriesFieldList.forEach((field) => {
      if (this.option[field]) {
        (this[field as keyof Echartscatter] as any) = [];
      }
    });

    this.seriesColor.forEach((item, index) => {
      this.tooltipMarkerColor[index] =
        typeof item === "object" ? item.colorStops[1].color : item;
    });
    const tooltipUnit: any = {};

    this.option.dataUnitName.forEach((item: any, index: number) => {
      const idx = seriesName.indexOf(item);
      if (idx !== -1) {
        tooltipUnit[idx] = this.option.unitTabsName?.[index]?.value || "";
      }
    });

    this.option.dataSeriesName.forEach((item: any, index: number) => {
      const idx = seriesName.indexOf(item);
      if (idx !== -1) {
        seriesName[idx] = this.option.seriesTabsName[index].value;
        this.seriesFieldList.forEach((field) => {
          (this[field as keyof Echartscatter] as any[])[idx] =
            this.option[field][index];
        });
      }
    });
    // const xAxisName = optionData[0].list.map((item) => item.name);
    // const xAxisName = [];
    optionsData.forEach((items) => {
      items.list.forEach((item: any) => {
        if (yAxisName.indexOf(item.name) === -1) {
          yAxisName.push(item.name);
        }
      });
    });
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
        boundaryGap: this.validData(this.option.boundaryGap, true),
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
        data: yAxisName || [],
        inverse: this.validData(this.option.xAxisInverse, false),
        splitLine: {
          show: this.validData(this.option.xAxisSplitLineShow, false),
          interval: this.option.xAxisSplitLineInterval || 0,
          lineStyle: {
            type: "dashed",
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
              : "{value}",
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
        min: Number(this.option.yAxisMin) || undefined,
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
            type: "dashed",
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
        this.validData(this.option.dataLoop, false)
          ? [
              // 滑动条
              {
                xAxisIndex: 0, // 这里是从X轴的0刻度开始
                show: false, // 是否显示滑动条，不影响使用
                type: "inside", // 这个 dataZoom 组件是 slider 型 dataZoom 组件
                startValue: 0, // 从头开始。
                endValue: this.option.dataLoopDisplayRows - 1, // 一次性展示10个。
                zoomOnMouseWheel: false,
              },
            ]
          : "",
      series: (() => {
        // const barColor = this.option.barColor || [];
        const list = (optionsData || []).map((item, index) => {
          return {
            name: seriesName[index],
            type: "scatter",
            symbolSize: this.seriesSymbolSize[index],
            itemStyle: this.seriesItemBorderShow[index]
              ? {
                  borderWidth: this.seriesItemBorderWidth[index] || 0,
                  borderColor:
                    this.seriesItemBorderColor[index] ||
                    "rgba(255, 255, 255, 1)",
                  color: this.seriesColor[index] || "red",
                }
              : {
                  color: this.seriesColor[index] || "red",
                },
            data:
              this.option.xAxisType === "time"
                ? item.list.map((item: { name: any; value: any }) => {
                    return {
                      name: item.name,
                      value: item.value,
                    };
                  })
                : item.list.map((item: { name: any; value: any }) => {
                    return [item.name, item.value];
                  }),
          };
        });
        return list;
      })(),
    };

    this.options = options;
  }
}

export { Echartscatter };
