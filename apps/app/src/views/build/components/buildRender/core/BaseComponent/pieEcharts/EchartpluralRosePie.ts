import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { pieEchartType } from "../type";

class EchartpluralRosePie extends BaseChart {
  // 原始数据的option
  option: Record<string, any> = {};
  seriesColor: any[] = [];
  seriesFieldList: string[] = [];
  legendGridTop = 0;
  legendGridLeft = 0;
  legendGridRight = 0;
  legendGridBottom = 0;
  tooltipUnit: any[] = [];
  tooltipMarkerColor: any[] = [];
  dataLength = 0;
  constructor() {
    const defaultChartProps = {
      name: "层叠玫瑰图",
      prop: pieEchartType.echartpluralRosePie,
      img: "/img/pie2.20240514.png",
      groupName: "饼图"
    };
    super(defaultChartProps);
    this.seriesColor = [];
    this.tooltipUnit = [];
    this.tooltipMarkerColor = [];
    this.seriesFieldList = ["seriesColor"];
  }

  getOptions() {
    return this.options;
  }
  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    let optionsData = await this.transformOptionsData(baseChartProps.data);

    optionsData = this.transformAxisData(optionsData, baseChartProps.yAxisType);
    const { axisName: xAxisName, optionData: data } = this.getEchartsAxisNameAndSeriesData(optionsData);
    optionsData = data;
    let seriesName: any[] = [];
    seriesName = optionsData.map((item) => item.name);
    this.seriesFieldList.forEach((field) => {
      if (this.option[field]) (this[field as keyof EchartpluralRosePie] as any) = [];
    });
    this.option.dataSeriesName.forEach((item: any, index: number) => {
      const idx = seriesName.indexOf(item);
      if (idx !== -1) {
        optionsData[idx].seriesName = this.option.seriesTabsName[index].value;
        this.seriesFieldList.forEach((field) => {
          (this[field as keyof EchartpluralRosePie] as any[])[idx] = this.option[field][index];
        });
      }
    });

    // css线性渐变色转为echarts线性渐变色
    this.seriesColor = this.createSeriesColor(this.seriesColor);
    this.seriesColor.forEach((item, index) => {
      this.tooltipMarkerColor[index] = typeof item === "object" ? item.colorStops[1].color : item;
    });
    const tooltipUnit = this.setTooltipUnit(
      this.option,
      optionsData.map((item) => item.name)
    );
    const options = {
      tooltip: this.createTooltip(this.option, tooltipUnit, this.screenScale, this.tooltipMarkerColor),
      legend: this.createLegend(this.option),
      angleAxis: {
        show: this.validData(this.option.angleAxisShow, true),
        type: "category",
        startAngle: this.option.angleAxisStartAngle || 0,
        axisLine: {
          show: this.validData(this.option.angleAxisLineShow, true),
          lineStyle: {
            color: this.option.angleAxisLineColor || "#333",
            width: this.option.angleAxisLineWidth || 0
          }
        },
        data: xAxisName || [],
        inverse: this.validData(this.option.angleAxisInverse, false),
        splitLine: {
          show: this.validData(this.option.angleAxisSplitLineShow, false),
          lineStyle: {
            width: this.option.angleAxisSplitLineWidth || 0,
            color: this.option.angleAxisSplitLineColor || "#333"
          }
        },
        axisLabel: {
          show: this.validData(this.option.angleAxisLabelShow, true),
          interval: (() => {
            const value = this.option.angleAxisInterval || 0;
            if (value === 0) return "auto";
            if (value < 0) return 0;
            return value;
          })(),
          margin: this.option.angleAxisMargin || 0,
          color: this.option.angleAxisColor || "#333",
          fontSize: this.option.angleAxisFontSize || 0,
          fontStyle: this.option.angleAxisFontStyle || "normal",
          fontWeight: this.option.angleAxisFontWeight || "normal",
          fontFamily: this.option.angleAxisFontFamily || "Arial",
          formatter: "{value}"
        },
        axisTick: {
          show: this.validData(this.option.angleAxisTickShow, true),
          length: this.option.angleAxisTickLength || 0,
          lineStyle: {
            color: this.option.angleAxisTickColor || "#333",
            width: this.option.angleAxisTickWidth || 0
          }
        }
      },
      polar: {
        center: [(this.option.polarCenterX || 0) + "%", (this.option.polarCenterY || 0) + "%"],
        radius: [(this.option.polarRadiusMin || 0) + "%", (this.option.polarRadiusMax || 0) + "%"]
      },
      radiusAxis: {
        show: this.validData(this.option.radiusAxisShow, true),
        // type: this.option.category ? 'category' : 'value',
        type: "value",
        max: Number(this.option.radiusAxisMax) || undefined,
        min: Number(this.option.radiusAxisMin) || undefined,
        splitNumber: this.option.radiusAxisSplitLineNumber || 0,
        name: this.option.radiusAxisNameShow && this.option.radiusAxisName,
        nameTextStyle: {
          padding: [
            0,
            this.option.radiusAxisNamePaddingRight || 0,
            this.option.radiusAxisNamePaddingBottom || 0,
            this.option.radiusAxisNamePaddingLeft || 0
          ],
          color: this.option.radiusAxisNameColor || "#333",
          fontSize: this.option.radiusAxisNameFontSize || 0,
          fontStyle: this.option.radiusAxisNameFontStyle || "normal",
          fontWeight: this.option.radiusAxisNameFontWeight || "normal",
          fontFamily: this.option.radiusAxisNameFontFamily || "Arial"
        },
        nameGap: 20 + -1 * (this.option.radiusAxisNamePaddingTop || 0),
        // data: optionData.categories || [],
        axisLabel: {
          show: this.validData(this.option.radiusAxisLabelShow, true),
          margin: this.option.radiusAxisMargin || 0,
          color: this.option.radiusAxisColor || "#333",
          fontSize: this.option.radiusAxisFontSize || 0,
          fontStyle: this.option.radiusAxisFontStyle || "normal",
          fontWeight: this.option.radiusAxisFontWeight || "normal",
          fontFamily: this.option.radiusAxisFontFamily || "Arial"
        },
        axisLine: {
          show: this.validData(this.option.radiusAxisLineShow, true),
          lineStyle: {
            color: this.option.radiusAxisLineColor || "#333",
            width: this.option.radiusAxisLineWidth || 0
            // opacity: this.option.radiusAxisLineOpacity || 0.5
          }
        },
        splitLine: {
          show: this.validData(this.option.radiusAxisSplitLineShow, true),
          lineStyle: {
            width: this.option.radiusAxisSplitLineWidth || 0,
            color: this.option.radiusAxisSplitLineColor || "#333"
          }
        },
        axisTick: {
          show: this.validData(this.option.radiusAxisTickShow, true),
          length: this.option.radiusAxisTickLength || 0,
          lineStyle: {
            color: this.option.radiusAxisTickColor || "#333",
            width: this.option.radiusAxisTickWidth || 0
          }
        }
      },
      dataZoom: this.validData(this.option.dataLoop, false)
        ? [
            // 滑动条
            {
              angleAxisIndex: 0, // 这里是从X轴的0刻度开始
              show: false, // 是否显示滑动条，不影响使用
              type: "inside", // 这个 dataZoom 组件是 slider 型 dataZoom 组件
              startValue: 0, // 从头开始。
              endValue: this.option.dataLoopDisplayRows - 1, // 一次性展示10个。
              zoomOnMouseWheel: false
            }
          ]
        : "",
      series: (() => {
        const list = (optionsData || []).map((item: any, index: number) => {
          return {
            stack: this.validData(this.option.stack, false),
            name: seriesName[index] || "",
            type: "bar",
            coordinateSystem: "polar",
            barMinHeight: this.option.barMinHeight || 0,
            barCategoryGap: this.option.barCategoryGap + "%",
            showBackground: true,
            backgroundStyle: {
              color: this.option.barBackgroundColor || "rgba(255, 255, 255, 0)"
            },
            itemStyle: {
              color: this.seriesColor[index] || "red"
            },
            label: {
              show: this.validData(this.option.seriesLabelShow, false), //开启显示
              formatter: (name: { name: string; value: number }) => name.value,
              //数值样式
              fontFamily: this.option.seriesLabelFontFamily || "Source Han Sans CN-Normal, Source Han Sans CN",
              fontStyle: this.option.seriesLabelFontStyle || "normal",
              fontSize: this.option.seriesLabelFontSize || 0,
              color: this.option.seriesLabelColor || "#333",
              fontWeight: this.option.seriesLabelFontWeight || "normal",
              offset: [this.option.seriesLabelOffsetX || 0, this.option.seriesLabelOffsetY || 0]
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

export { EchartpluralRosePie };
