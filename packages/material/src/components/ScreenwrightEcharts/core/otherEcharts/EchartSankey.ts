import { cloneDeep, uniqBy } from "lodash-es";

import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { otherEchartType } from "../type";

class EchartSankey extends BaseChart {
  // 原始数据的option
  option: Record<string, any> = {};
  constructor() {
    const baseChartProps = {
      name: "漏斗图",
      prop: otherEchartType.echartsankey,
      img: "/img/funnel.20240514.png",
      groupName: "其他"
    };
    super(baseChartProps);
  }
  getOptions() {
    return this.options;
  }
  getData(data: any) {
    const optionData = cloneDeep(data) || [];
    const leftData = optionData
      .map((item: any) => item.source)
      .map((item: any) => {
        return {
          name: item,
          itemStyle: {
            position: "left"
          }
        };
      });
    const rightData = optionData
      .map((item: any) => item.target)
      .map((item: any) => {
        return {
          name: item,
          itemStyle: {
            position: "right"
          }
        };
      });
    return uniqBy([...leftData, ...rightData], "name");
  }
  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    // const optionsData = cloneDeep(baseChartProps.data);
    const optionsData = (await this.transformOptionsDataByDataFilter()) || [];
    const options: any = {
      grid: {
        left: 0,
        right: 0,
        bottom: 0,
        top: 0,
        containLabel: true
      },
      tooltip: {
        show: this.option.tooltip.show,
        backgroundColor: this.option.tooltip.backgroundColor,
        textStyle: {
          color: this.option.tooltip.color
        }
      },
      series: {
        type: "sankey",
        layout: "none",
        nodeWidth: this.option.seriesLabel.nodeWidth,
        top: this.option.seriesTop || 0,
        bottom: this.option.seriesBottom || 0,
        left: this.option.seriesLeft || 0,
        right: this.option.seriesRight || 0,
        focusNodeAdjacency: "allEdges",
        draggable: this.option.series.draggable,
        nodeGap: this.option.series.nodeGap,
        label: {
          show: this.validData(this.option.seriesLabelShow, false), //开启显示
          position: ["50%", "50%"], //在上方显示,
          //数值样式
          fontFamily: this.option.seriesLabelFontFamily || "Source Han Sans CN-Normal, Source Han Sans CN",
          fontStyle: this.option.seriesLabelFontStyle || "normal",
          fontSize: this.option.seriesLabelFontSize || 0,
          color: this.option.seriesLabelColor || "#333",
          fontWeight: this.option.seriesLabelFontWeight || "normal",
          offset: [this.option.seriesLabelOffsetX || 0, this.option.seriesLabelOffsetY || 0],
          padding: this.option.seriesLabel.padding,
          align: this.option.seriesLabel.align,
          verticalAlign: this.option.seriesLabel.verticalAlign
        },
        lineStyle: {
          color:
            this.option.series.lineStyle.color === "自定义"
              ? this.option.series.lineStyle.customColor
              : this.option.series.lineStyle.color,
          curveness: this.option.series.lineStyle.curveness,
          opacity: this.option.series.lineStyle.opacity
        },
        data: this.getData(optionsData),
        links: []
      }
    };
    options.series.data = options.series.data.map((item: any, index: number) => {
      return {
        ...item,
        itemStyle: {
          color: this.option.pointColor[index]
        }
      };
    });
    options.series.links = optionsData.map((item: any) => {
      return {
        // ...item,
        source: item.source,
        target: item.target,
        value: item.value || 0,
        lineStyle: {
          color: item.color
        }
      };
    });
    this.options = options;
  }
}

export { EchartSankey };
