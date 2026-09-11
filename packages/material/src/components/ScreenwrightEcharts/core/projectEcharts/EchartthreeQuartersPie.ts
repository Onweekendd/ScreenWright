import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { projectEchartType } from "../type";

class EchartthreeQuartersPie extends BaseChart {
  // 原始数据的option
  option: Record<string, any> = {};

  seriesFieldList: string[] = [];
  seriesColor: any[] = [];
  seriesOpacity: number[] = [];
  dataLength = 0;
  constructor() {
    const defaultChartProps = {
      name: "环形饼图",
      prop: projectEchartType.echartthreeQuartersPie,
      img: "/img/threeQuartersPie.25154957.png",
      groupName: "项目"
    };
    super(defaultChartProps);

    this.seriesFieldList = ["seriesColor", "seriesOpacity"];
  }

  getOptions() {
    return this.options;
  }

  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    // let optionsData = cloneDeep(baseChartProps.data);
    // optionsData = optionsData.map((a: any) => {
    //   return {
    //     ...a,
    //     seriesName: a.seriesName + "",
    //     value: parseFloat(a.value)
    //   };
    // });
    const optionsData = await this.transformOptionsDataByDataFilter();
    let seriesName: string[] = [];
    seriesName = optionsData.map((item: { seriesName: any }) => item.seriesName);
    // 删除系列时seriesColor被删除那项还是缓存着，刷新页面后重新设置seriesColor才是对的，所以在刷新配置是重置this[field]
    this.seriesFieldList.forEach((field) => {
      if (this.option[field]) (this[field as keyof EchartthreeQuartersPie] as any) = [];
    });
    this.option.dataSeriesName.forEach((item: any, index: number) => {
      const idx = seriesName.indexOf(item);
      if (idx !== -1) {
        optionsData[idx].seriesName = this.option.seriesTabsName[index].value;
        this.seriesFieldList.forEach((field) => {
          (this[field as keyof EchartthreeQuartersPie] as any[])[idx] = this.option[field][index];
        });
      }
    });
    let sum = 0;
    optionsData.forEach((item: { value: number }) => {
      sum += item.value;
    });
    const data = optionsData.map((item: { seriesName: string; value: number }, index: number) => {
      return {
        name: item.seriesName,
        value: item.value,
        percent: ((item.value / sum) * 100).toFixed(this.option.seriesLabelPercentValue) + "%",
        color: this.seriesColor[index]
      };
    });
    switch (this.option.seriesOrder) {
      case "desc":
        data.sort((a: { value: number }, b: { value: number }) => {
          return b.value - a.value;
        });
        break;
      case "asc":
        data.sort((a: { value: number }, b: { value: number }) => {
          return a.value - b.value;
        });
        break;
      default:
        break;
    }
    this.seriesColor = data.map((item: { color: string }) => item.color);
    // css线性渐变色转为echarts线性渐变色
    this.seriesColor = this.createSeriesColor(this.seriesColor);
    const titleColor = this.seriesColor.map((item) => {
      return item?.colorStops?.[0]?.color;
    });
    const legendData = optionsData.map((item: { seriesName: string; value: number }) => {
      return {
        name: item.seriesName,
        value: item.value,
        percent: ((item.value / sum) * 100).toFixed(this.option.legendPercent) + "%"
      };
    });
    switch (this.option.legendOrder) {
      case "desc":
        legendData.sort((a: { value: number }, b: { value: number }) => {
          return b.value - a.value;
        });
        break;
      case "asc":
        legendData.sort((a: { value: number }, b: { value: number }) => {
          return a.value - b.value;
        });
        break;
      default:
        break;
    }
    let total = 0;
    const name: string[] = [];
    data.forEach((item: { value: number; name: string }) => {
      total += item.value;
      name.push(item.name);
    });
    const center = [this.option.seriesOffsetX + "%", this.option.seriesOffsetY + "%"];
    interface EChartTitle {
      z?: number;
      text: string;
      left: string;
      top: string;
      textStyle?: {
        fontSize: number;
        color: string;
        fontFamily: string;
        fontStyle?: any;
        fontWeight?: string;
      };
    }

    interface EChartOptions {
      title: EChartTitle[];
      legend: any[];
      tooltip: any;
      series: any[];
      animationDelay: (idx: number) => number;
      animationEasing: string;
    }
    const options: EChartOptions = {
      title: [],
      legend: [],
      tooltip: {
        show: false,
        trigger: "item",
        position: (point: number[]) => {
          // 固定在顶部
          return [point[0] - 20, point[1] - 60];
        },
        extraCssText: `box-shadow :inset 0 0 0.23rem #008aff;color:#fff;padding:0.05rem 0.23rem 0.05rem 0.23rem;border-radius:0;line-height:0.30rem;`,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderWidth: 0,
        formatter: (params: { value: any }) => {
          let str = "";
          str += `<div style="width:0.3rem;height:0.3rem">`;
          str += `<p style="position: relative;"> <span style="width: 0;height: 0;border-bottom: 0.11rem solid #008aff;border-left: 0.11rem solid transparent;border-right: 0.11rem solid transparent;position: absolute;top:0.36rem;left:0.06rem;transform:rotate(-180deg);"></span></p>`;
          str += `<p style="color:#fff;font-size:0.16rem;text-align:center;"><span style="font-family:'LcdD';font-size:0.28rem;">${params.value}</span></p>`;
          str += `</div>`;
          return str;
        }
      },
      series: [],
      animationDelay: (idx: number) => {
        idx += 0.5;
        // 越往后的数据延迟越大
        return idx * 100;
      },
      animationEasing: "linear"
    };
    const p = this.option.pieRadiusOuter; // 外圈半径
    const offset = (p - 80) / 2; // 核心偏移量，跟随p动态变化
    // 70->-5 80->0 90->5 100->10
    data.forEach((item: { value: number; name: string }, index: number) => {
      if (this.option.seriesLabelShow) {
        // 图右侧值
        options.title.push({
          z: 100,
          text: `${Math.round((item.value / total) * 100)}%`,
          left: this.option.seriesLabelOffsetX + "%",
          top: `${index * 8 + this.option.seriesLabelOffsetY - offset}%`,
          textStyle: {
            fontFamily: this.option.seriesLabelFontFamily,
            fontSize: this.option.seriesLabelFontSize,
            color: this.option.seriesLabelColor,
            fontStyle: this.option.seriesLabelFontStyle,
            fontWeight: this.option.seriesLabelFontWeight
          }
        });
      }

      options.legend.push({
        show: this.option.legendShow,
        left: this.option.legendOffsetX + "%",
        top: `${index * this.option.legendItemGap + this.option.legendOffsetY}%`,
        width: 2000,
        itemWidth: this.option.legendItemWidthHeight,
        itemHeight: this.option.legendItemWidthHeight,
        icon: "path://M480 64C250.24 64 64 250.24 64 480 64 709.76 250.24 896 480 896c229.76 0 416-186.24 416-416C896 250.24 709.76 64 480 64zM480 832C285.44 832 128 674.56 128 480 128 285.44 285.44 128 480 128 674.56 128 832 285.44 832 480 832 674.56 674.56 832 480 832z",
        formatter: (params: any) => {
          return `{label|${this.option.legendSeriesShow ? params : ""}}{value|${
            this.option.legendValueShow ? item.value : ""
          }}{util|${this.option.legendUnit}}{percent|${
            this.option.legendPercentShow ? `${((item.value / total) * 100).toFixed(this.option.legendPercent)}%` : ""
          }}`;
        },
        textStyle: {
          color: "#fff",
          fontSize: 22,
          padding: [0, 0, 0, 5],
          rich: {
            label: {
              fontFamily: this.option.legendSeriesFontFamily,
              fontSize: this.option.legendSeriesFontSize,
              color: this.option.legendSeriesColor,
              fontStyle: this.option.legendSeriesFontStyle,
              fontWeight: this.option.legendSeriesFontWeight
            },
            value: {
              fontFamily: this.option.legendValueFontFamily,
              fontSize: this.option.legendValueFontSize,
              color: this.option.legendValueColorFollow ? titleColor[index] : this.option.legendValueColor,
              fontStyle: this.option.legendValueFontStyle,
              fontWeight: this.option.legendValueFontWeight,
              padding: [0, 0, 0, this.option.legendValueLeftPadding || 0]
            },
            util: {
              fontFamily: this.option.legendValueFontFamily,
              fontSize: this.option.legendUnitFontSize,
              color: this.option.legendValueColorFollow ? titleColor[index] : this.option.legendValueColor,
              fontStyle: this.option.legendValueFontStyle,
              fontWeight: this.option.legendValueFontWeight,
              padding: [0, 0, 0, this.option.legendUnitLeftPadding || 0]
            },
            percent: {
              fontFamily: this.option.legendPercentFontFamily,
              fontSize: this.option.legendPercentFontSize,
              color: this.option.legendPercentColorFollow ? titleColor[index] : this.option.legendPercentColor,
              fontStyle: this.option.legendPercentFontStyle,
              fontWeight: this.option.legendPercentFontWeight,
              padding: [0, 0, 0, this.option.legendPercentLeftPadding || 0],
              textAlign: "right"
            }
          }
        },
        data: [
          {
            name: item.name
          }
        ]
      });
      options.series.push({
        name,
        type: "pie",
        clockWise: false,
        hoverAnimation: false,
        radius: [`${p - index * 15}%`, `${p - 6 - index * 15}%`],
        center,
        label: {
          show: false
        },
        data: [
          {
            value: item.value * 0.75,
            name: item.name,
            itemStyle: {
              color: this.seriesColor[index],
              opacity: this.seriesOpacity[index] / 100 || 0
            }
          },
          {
            value: total - item.value * 0.75,
            name: "",
            itemStyle: {
              color: this.option.seriesRemainColor
            }
          }
        ]
      });
      options.series.push({
        name: "",
        type: "pie",
        silent: true,
        z: 100,
        clockWise: false, // 顺时加载
        hoverAnimation: false, // 鼠标移入变大
        radius: [`${p - index * 15}%`, `${74 - index * 15}%`],
        center,
        label: {
          show: false
        },
        data: [
          {
            value: 7.5,
            itemStyle: {
              color: "#E3F0FF",
              opacity: 0
            }
          },
          {
            value: 2.5,
            name: "",
            itemStyle: {
              color: this.option.seriesBottomColor
            }
          }
        ]
      });
    });
    // 分隔线
    if (this.option.legendShow && this.option.legendUnderlineShow) {
      for (let index = 0; index < data.length - 1; index += 1) {
        options.title.push({
          z: 100,
          text: (() => {
            let res = "";
            for (let i = 0; i < this.option.legendUnderlineWidth; i++) {
              res += "------";
            }
            return res;
          })(),
          left: this.option.legendUnderlineOffsetX + "%",
          top: `${index * this.option.legendUnderlineInterval + this.option.legendUnderlineOffsetY}%`,
          textStyle: {
            fontSize: 18,
            color: "rgb(200,205,214)",
            fontFamily: "AlibabaPuHuiTiR"
          }
        });
      }
    }
    this.options = options;
  }
}

export { EchartthreeQuartersPie };
