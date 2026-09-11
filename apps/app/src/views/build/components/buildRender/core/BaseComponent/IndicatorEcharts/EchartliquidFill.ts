import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { indicatorEchartType } from "../type";

class EchartliquidFill extends BaseChart {
  // 原始数据的option
  option: Record<string, any> = {};
  constructor() {
    const baseChartProps = {
      name: "水球图",
      prop: indicatorEchartType.echartliquidFill,
      img: "/img/waterball.b80597ee.png",
      groupName: "指标"
    };
    super(baseChartProps);
  }
  getOptions() {
    return this.options;
  }
  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    const filterData: any = await this.transformOptionsDataByDataFilter();
    const optionData = Array.isArray(filterData) ? filterData[0] : filterData;
    const options = {
      tooltip: {
        show: false
      },
      series: [
        {
          name: optionData.seriesName || "",
          type: "liquidFill",
          center: [(this.option.centerX || 0) + "%", (this.option.centerY || 0) + "%"],
          // radius: (this.option.radius || 0) + '%',
          radius: (this.option.radius || 0) + "%",
          // 高度 为0时静止
          amplitude: (this.option.amplitude || 0) + "%",
          // 宽度
          waveLength: (this.option.waveLength || 0) + "%",
          phase: "auto",
          period: "auto",
          // 方向
          direction: this.option.direction || "right",
          // container时为完全填满容器
          shape: this.option.shape || "circle",
          data: (() => {
            const list = [optionData.percent];
            const interval = optionData.percent / this.option.waveColor.length;
            for (let index = 1; index < this.option.waveColor.length; index++) {
              list.push(optionData.percent - interval * index);
            }
            return list;
          })(),
          color: this.option.waveColor || ["#fff"],

          // 波浪左右移动
          waveAnimation: this.validData(this.option.waveAnimation, true),

          // 轮廓
          outline: {
            show: this.validData(this.option.outlineShow, true),
            borderDistance: this.option.outlineBorderDistance || 0,
            itemStyle: {
              color: this.option.outlineColor || "#fff",
              borderColor: this.option.outlineBorderColor || "#fff",
              borderWidth: this.option.outlineBorderWidth || 0
              // shadowBlur: 20,
              // shadowColor: 'rgba(0, 0, 0, 0.25)'
            }
          },
          backgroundStyle: {
            color: this.option.backgroundColor || "#fff"
          },

          itemStyle: {
            opacity: this.option.seriesItemStyleOpacity || 0
            // shadowBlur: 50,
            // shadowColor: 'rgba(0, 0, 0, 0.4)'
          },
          label: {
            show: this.validData(this.option.seriesLabelShow, true),
            color: this.option.seriesLabelPercentColor || "#fff",
            insideColor: this.option.seriesLabelInsideColor || "#fff",
            fontFamily: this.option.seriesLabelPercentFontFamily || "Source Han Sans CN-Normal, Source Han Sans CN",
            fontSize: this.option.seriesLabelPercentFontSize || 0,
            fontWeight: this.option.seriesLabelPercentFontWeight || "normal",
            fontStyle: this.option.seriesLabelPercentFontStyle || "normal",
            align:
              this.option.seriesLabelAlign === "left"
                ? "right"
                : this.option.seriesLabelAlign === "right"
                  ? "left"
                  : "center",
            baseline:
              this.option.seriesLabelBaseline === "top"
                ? "bottom"
                : this.option.seriesLabelBaseline === "bottom"
                  ? "top"
                  : "middle",
            position: [(this.option.seriesLabelPositionX || 0) + "%", (this.option.seriesLabelPositionY || 0) + "%"],
            formatter: (params: any) => {
              const list = [];
              if (this.option.seriesLabelSeriesShow) {
                list.push(`{name|${params.seriesName}}`);
              }
              if (this.option.seriesLabelPercentShow) {
                list.push(
                  `${optionData.value || (params.value * 100).toFixed(this.option.seriesLabelPercentValue || 0) + "%"}`
                );
              }
              console.log(list, optionData);
              return list.join("\n");
            },
            rich: {
              name: {
                padding: [0, 0, this.option.seriesLabelSeriesBottomPadding || 0, 0],
                fontFamily: this.option.seriesLabelSeriesFontFamily || "Arial",
                fontSize: this.option.seriesLabelSeriesFontSize || 0,
                color: this.option.seriesLabelSeriesColor || "rgba(255, 255, 255, 1)",
                fontStyle: this.option.seriesLabelSeriesFontStyle || "normal",
                fontWeight: this.option.seriesLabelSeriesFontWeight || "normal",
                insideColor: this.option.seriesLabelInsideColor || "#fff"
              }
            }
          }
        }
      ],
      // 波浪上升动画
      animationEasing: "linear",
      animationEasingUpdate: "linear",
      animationDuration: 2000,
      animationDurationUpdate: 1000
    };
    this.options = options;
  }
}

export { EchartliquidFill };
