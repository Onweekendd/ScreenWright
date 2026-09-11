import { cloneDeep, orderBy } from "lodash-es";

import { BaseChart } from "../BaseChart/index";
import type { ArrayDataItem, BaseChartProps } from "../type";
import { pieEchartType } from "../type";

import "echarts-gl";

class EchartthreePie extends BaseChart {
  // 原始数据的option
  option: Record<string, any> = {};
  seriesColor: any[] = [];
  seriesFieldList: string[] = [];
  legendGridTop = 0;
  legendGridLeft = 0;
  legendGridRight = 0;
  legendGridBottom = 0;
  selectedIndex = 0;
  hoveredIndex = 0;
  seriesIndex = 0;
  constructor() {
    const defaultChartProps = {
      name: "3D饼图",
      prop: pieEchartType.echartthreePie,
      img: "/img/threePie.ee572caa.png",
      groupName: "饼图"
    };
    super(defaultChartProps);
    this.seriesColor = [];
    this.seriesFieldList = ["seriesColor"];
  }

  getOptions() {
    return this.options;
  }
  getFixedHeight() {
    const { fixedHeight, boxHeight } = this.option;
    return fixedHeight ? boxHeight : 0;
  }
  // 生成扇形的曲面参数方程
  // 确保 parametricEquation 对象中的 x、y 和 z 属性都是函数
  getParametricEquation(
    startRatio: number,
    endRatio: number,
    isSelected: boolean,
    isHovered: boolean,
    k: number,
    h: number
  ) {
    const midRatio = (startRatio + endRatio) / 2;

    const startRadian = startRatio * Math.PI * 2;
    const endRadian = endRatio * Math.PI * 2;
    const midRadian = midRatio * Math.PI * 2;

    if (startRatio === 0 && endRatio === 1) {
      isSelected = false;
    }

    k = typeof k !== "undefined" ? k : 1 / 3;

    const offsetX = isSelected ? Math.cos(midRadian) * 0.1 : 0;
    const offsetY = isSelected ? Math.sin(midRadian) * 0.1 : 0;

    const hoverRate = isHovered ? 1.05 : 1;

    const pieThickness = this.getFixedHeight() || h;

    const parametricEquation = {
      u: {
        min: -Math.PI,
        max: Math.PI * 3,
        step: Math.PI / 32
      },
      v: {
        min: 0,
        max: Math.PI * 2,
        step: Math.PI / 20
      },
      x: (u: number, v: number) => {
        if (u < startRadian) {
          return offsetX + Math.cos(startRadian) * (1 + Math.cos(v) * k) * hoverRate;
        }
        if (u > endRadian) {
          return offsetX + Math.cos(endRadian) * (1 + Math.cos(v) * k) * hoverRate;
        }
        return offsetX + Math.cos(u) * (1 + Math.cos(v) * k) * hoverRate;
      },
      y: (u: number, v: number) => {
        if (u < startRadian) {
          return offsetY + Math.sin(startRadian) * (1 + Math.cos(v) * k) * hoverRate;
        }
        if (u > endRadian) {
          return offsetY + Math.sin(endRadian) * (1 + Math.cos(v) * k) * hoverRate;
        }
        return offsetY + Math.sin(u) * (1 + Math.cos(v) * k) * hoverRate;
      },
      z: (u: number, v: number) => {
        if (u < -Math.PI * 0.5) {
          return Math.sin(u);
        }
        if (u > Math.PI * 2.5) {
          return Math.sin(u) * pieThickness * 0.1;
        }
        return Math.sin(v) > 0 ? 1 * pieThickness * 0.1 : -1;
      }
    };

    // 添加调试信息
    console.log("Parametric Equation:", parametricEquation);

    return parametricEquation;
  }
  // 生成模拟 3D 饼图的配置项
  getPie3D(pieData: any[], internalDiameterRatio: number) {
    const series = [];
    let sumValue = 0;
    let startValue = 0;
    let endValue = 0;
    const legendData = [];
    const k =
      typeof internalDiameterRatio !== "undefined" ? (1 - internalDiameterRatio) / (1 + internalDiameterRatio) : 1 / 3;

    for (let i = 0; i < pieData.length; i += 1) {
      sumValue += pieData[i].value;

      const seriesItem = {
        name: typeof pieData[i].name === "undefined" ? `series${i}` : pieData[i].name,
        type: "surface",
        parametric: true,
        wireframe: {
          show: false
        },
        pieData: pieData[i],
        pieStatus: {
          selected: false,
          hovered: false,
          k
        },
        itemStyle: {},
        parametricEquation: {}
      };

      if (typeof pieData[i].itemStyle !== "undefined") {
        const { itemStyle } = pieData[i];

        if (typeof pieData[i].itemStyle.color !== "undefined") itemStyle.color = pieData[i].itemStyle.color;
        if (typeof pieData[i].itemStyle.opacity !== "undefined") itemStyle.opacity = pieData[i].itemStyle.opacity;

        seriesItem.itemStyle = itemStyle;
      }
      series.push(seriesItem);
    }

    for (let i = 0; i < series.length; i += 1) {
      endValue = startValue + series[i].pieData.value;

      series[i].pieData.startRatio = startValue / sumValue;
      series[i].pieData.endRatio = endValue / sumValue;
      series[i].parametricEquation = this.getParametricEquation(
        series[i].pieData.startRatio,
        series[i].pieData.endRatio,
        false,
        false,
        k,
        parseFloat(series[i].pieData.percent)
      );

      startValue = endValue;

      legendData.push(series[i].name);
    }

    const option = {
      legend: this.getChartLegend(pieData),
      tooltip: {
        formatter: (params: { seriesName: string; color: any; seriesIndex: number }) => {
          if (params.seriesName !== "mouseoutSeries") {
            return `${
              params.seriesName
            }<br/><span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${
              params.color
            };"></span>${option.series[params.seriesIndex].pieData.value}`;
          }
          return "";
        },
        confine: true,
        extraCssText: `box-shadow: 0 0 0px;
        -moz-background-size:100% 100%; background-size:100% 100%;color:#fff`,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderWidth: 0
      },
      xAxis3D: {
        min: -1,
        max: 1
      },
      yAxis3D: {
        min: -1,
        max: 1
      },
      zAxis3D: {
        min: -1,
        max: 1
      },
      grid3D: {
        show: false,
        boxHeight: this.option.boxHeight,
        left: `${this.option.viewControlX}%`,
        top: `${this.option.viewControlY}%`,
        viewControl: {
          alpha: this.option.alpha,
          beta: this.option.beta,
          rotateSensitivity: 1,
          zoomSensitivity: 0,
          panSensitivity: 0,
          autoRotate: this.option.autoRotate,
          distance: this.option.distance,
          projection: this.option.projection,
          autoRotateSpeed: this.option.autoRotateSpeed,
          center: [0, 0, this.option.viewControlZ]
        },
        postEffect: {
          enable: false,
          bloom: {
            enable: true,
            bloomIntensity: 0.1
          },
          SSAO: {
            enable: true,
            quality: "medium",
            radius: 2
          }
        }
      },
      series
    };

    legendData.forEach((item, index) => {
      option.legend.textStyle.rich[`percent_${index}`] = {
        padding: [0, 0, 0, this.option.legendPercentLeftPadding || 0],
        fontFamily: this.option.legendPercentFontFamily || "Arial",
        fontSize: this.option.legendPercentFontSize || 0,
        color:
          (this.option.legendPercentColorFollow ? this.option.seriesColor[index] : this.option.legendPercentColor) ||
          "rgba(255, 255, 255, 1)",
        fontStyle: this.option.legendPercentFontStyle || "normal",
        fontWeight: this.option.legendPercentFontWeight || "normal"
      };
      option.legend.textStyle.rich[`value_${index}`] = {
        padding: [0, 0, 0, this.option.legendValueLeftPadding || 0],
        fontFamily: this.option.legendValueFontFamily || "Arial",
        fontSize: this.option.legendValueFontSize || 0,
        color:
          (this.option.legendValueColorFollow ? this.option.seriesColor[index] : this.option.legendValueColor) ||
          "rgba(255, 255, 255, 1)",
        fontStyle: this.option.legendValueFontStyle || "normal",
        fontWeight: this.option.legendValueFontWeight || "normal",
        width: this.option?.legendSeriesWidthType === "custom" ? this.option?.legendSeriesWidth : "auto"
      };
      option.legend.textStyle.rich[`unit_${index}`] = {
        padding: [0, 0, 0, this.option.legendUnitLeftPadding || 0],
        fontFamily: this.option.legendValueFontFamily || "Arial",
        fontSize: this.option.legendUnitFontSize || 0,
        color:
          (this.option.legendValueColorFollow ? this.option.seriesColor[index] : this.option.legendValueColor) ||
          "rgba(255, 255, 255, 1)"
      };
    });

    // 添加调试信息
    console.log("Series:", series);
    console.log("Legend Data:", legendData);

    return option;
  }

  getChartLegend(legendData: any) {
    if (!legendData) return;
    let sortData = cloneDeep(legendData);
    switch (this.option.legendOrder) {
      // 从大到小
      case "desc":
        sortData = orderBy(legendData, ["value"], ["desc"]);
        break;
      // 从小到大
      case "asc":
        sortData = orderBy(legendData, ["value"], ["asc"]);
        break;
      case "default":
        break;
    }

    return {
      show: this.validData(this.option.legendShow, false),
      orient: this.option.legendOrient || "vertical",
      ...this.option.legendGrid,
      width: this.option.legendWidth || 0,
      height: this.option.legendHeight || 0,
      itemWidth: this.option.legendItemWidth || 0,
      itemHeight: this.option.legendItemHeight || 0,
      itemGap: this.option.legendItemGap || 0,
      padding: (() => {
        const { legendOffsetX, legendOffsetY, legendGrid } = this.option;
        const { top = 0, right = 0, bottom = 0, left = 0 } = legendGrid;
        return [
          top ? 0 : legendOffsetY,
          right ? 0 : -1 * legendOffsetX,
          bottom ? 0 : -1 * legendOffsetY,
          left ? 0 : legendOffsetX
        ];
      })(),
      selectedMode: this.option.legendSelectedMode,
      data: sortData.map((item: any) => item.name),
      formatter: (name: string) => {
        const index = legendData.findIndex((item: any) => {
          return item["name"] === name;
        });
        return `{name_${index}|${this.option.legendSeriesShow ? legendData[index].name : ""}}{value_${index}|${
          this.option.legendValueShow ? legendData[index].value : ""
        }}{unit_${index}|${this.option.legendValueShow ? this.option.legendUnit : ""}}{percent_${index}|${
          this.option.legendPercentShow
            ? this.option.legendValueShow
              ? "(" + legendData[index].percent + ")"
              : legendData[index].percent
            : ""
        }}`;
      },
      textStyle: {
        fontFamily: this.option.legendSeriesFontFamily || "Arial",
        fontSize: this.option.legendSeriesFontSize || 0,
        color: this.option.legendSeriesColor || "rgba(255, 255, 255, 1)",
        fontStyle: this.option.legendSeriesFontStyle || "normal",
        fontWeight: this.option.legendSeriesFontWeight || "normal",
        padding: [0, 0, 0, this.option.legendTextLeftPadding || 0],
        rich: {}
      }
    };
  }
  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    this.setPieSeriesData(this.option);
    const options = this.getPie3D(await this.getChartData(), this.option.size);

    this.options = options;
  }
  async getChartData() {
    // let optionData = cloneDeep(this.baseChartProps?.data) || [];
    let optionData = (await this.transformOptionsDataByDataFilter()) || [];
    optionData = optionData.map((a: ArrayDataItem) => {
      return {
        ...a,
        value: parseFloat(a.value + "")
      };
    });
    let seriesName: any[] = [];
    seriesName = optionData.map((item: ArrayDataItem) => item.seriesName);
    // 删除系列时seriesColor被删除那项还是缓存着，刷新页面后重新设置seriesColor才是对的，所以在刷新配置是重置this[field]
    this.seriesFieldList.forEach((field) => {
      if (this.option[field]) (this[field as keyof EchartthreePie] as any) = [];
    });
    this.option.dataSeriesName.forEach((item: any, index: number) => {
      const idx = seriesName.indexOf(item);
      if (idx !== -1) {
        optionData[idx].seriesName = this.option.seriesTabsName[index].value;
        this.seriesFieldList.forEach((field) => {
          (this[field as keyof EchartthreePie] as any[])[idx] = this.option[field][index];
        });
      }
    });
    let sum = 0;

    optionData.forEach((item: ArrayDataItem) => {
      sum += item.value;
    });
    const data = optionData.map((item: ArrayDataItem, index: number) => {
      return {
        name: item.seriesName || "",
        value: item.value,
        percent: ((item.value / sum) * 100).toFixed(this.option.legendPercent) + "%",
        itemStyle: {
          color: this.seriesColor[index]
        }
      };
    });
    switch (this.option.seriesOrder) {
      case "desc":
        data.sort((a: ArrayDataItem, b: ArrayDataItem) => {
          return b.value - a.value;
        });
        break;
      case "asc":
        data.sort((a: ArrayDataItem, b: ArrayDataItem) => {
          return a.value - b.value;
        });
        break;
      default:
        break;
    }
    return data;
  }
}

export { EchartthreePie };
