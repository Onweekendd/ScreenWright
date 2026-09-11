import { isArray } from "lodash-es";

import { getEchartsColorFromCssLinearColor } from "../../utils";
import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { ringEchartType } from "../type";

class EchartRing extends BaseChart {
  // 原始数据的option
  option: Record<string, any> = {};
  legendGridTop = 0;
  legendGridLeft = 0;
  legendGridBottom = 0;
  seriesColor: any = [];
  seriesOpacity: number[] = [];
  extremeData: number[] = [];
  extremeShow: boolean[] = [];
  extremeType: string[] = [];
  extremeColor: string[] = [];
  extremeOpacity: number[] = [];
  tooltipMarkerColor: string[] = [];
  seriesFieldList: string[] = [];
  dataChartItem: Record<string, any> = {};
  constructor() {
    const baseChartProps = {
      name: "环形图",
      prop: ringEchartType.echartring,
      img: "/img/progress.1e8fda59.png",
      groupName: "其他"
    };
    super(baseChartProps);
    this.seriesFieldList = ["seriesColor"];
  }
  getOptions() {
    return this.options;
  }
  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    const optionsData = await this.transformOptionsDataByDataFilter();
    if (isArray(optionsData) && optionsData.length) {
      this.dataChartItem = optionsData[0];
    } else {
      this.dataChartItem = optionsData;
    }
    if (
      !(
        typeof this.dataChartItem === "object" &&
        typeof this.dataChartItem?.value === "number" &&
        typeof this.dataChartItem?.total === "number"
      )
    ) {
      console.log("数据格式不正确");

      return false;
    }
    // css线性渐变色转为echarts线性渐变色
    if (typeof this.option.seriesColor === "object" && !this.option.seriesColor.colorStops) {
      this.seriesColor = getEchartsColorFromCssLinearColor(this.option.seriesColor);
    } else {
      this.seriesColor = this.option.seriesColor;
    }
    const options: any = {
      tooltip: {
        show: false
      },
      legend: {
        show: false
      },
      angleAxis: {
        max: this.dataChartItem.total,
        clockwise: true,
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          show: false
        },
        splitLine: {
          show: false
        },
        startAngle: this.option.startAngle || 0
      },
      radiusAxis: {
        type: "category",
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          show: false
        },
        splitLine: {
          show: false
        }
      },
      polar: {
        center: [(this.option.centerX || 0) + "%", (this.option.centerY || 0) + "%"],
        radius: [(this.option.radiusMin || 0) + "%", (this.option.radiusMax || 0) + "%"]
      },
      series: {
        // name: seriesName[index],
        type: "bar",
        // 设置环形图圆角：roundCap 控制柱状图两端的圆角效果
        // true: 启用圆角（子弹头样式），false: 禁用圆角（方形样式）
        // 也可以通过 option.barBorderRadius 配置项控制（"radius" 为圆角，"default" 为方形）
        roundCap: this.option.barBorderRadius !== "default",
        coordinateSystem: "polar",
        polarIndex: 0,
        itemStyle: {
          color: this.seriesColor || "red",
          opacity: this.option.seriesOpacity / 100 || 0,
          // 注意：在极坐标系中，borderRadius 不生效，圆角效果需要通过 roundCap 控制
          borderRadius: 0
        },
        label: {
          show: false,
          formatter: "{c}" + (this.option.seriesLabelUtil || ""),
          fontFamily: this.option.seriesLabelFontFamily || "Source Han Sans CN-Normal, Source Han Sans CN",
          fontStyle: this.option.seriesLabelFontStyle || "normal",
          fontSize: this.option.seriesLabelFontSize || 0,
          color: this.option.seriesLabelColor || "#333",
          fontWeight: this.option.seriesLabelFontWeight || "normal",
          offset: [this.option.seriesLabelOffsetX || 0, this.option.seriesLabelOffsetY || 0]
        },
        data: [this.dataChartItem]
      }
    };

    this.options = options;
  }
}

export { EchartRing };
