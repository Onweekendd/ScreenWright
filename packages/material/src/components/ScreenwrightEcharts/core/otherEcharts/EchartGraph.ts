import { setMinioUrl } from "@material/minioUrl";

import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { otherEchartType } from "../type";

class EchartGraph extends BaseChart {
  // 原始数据的option
  option: Record<string, any> = {};
  constructor() {
    const baseChartProps = {
      name: "关系图",
      prop: otherEchartType.echartgraph,
      img: "/img/graph.b13fc475.png",
      groupName: "其他"
    };
    super(baseChartProps);
  }
  getOptions() {
    return this.options;
  }
  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    const filterData = await this.transformOptionsDataByDataFilter();
    let optionsData = filterData || [];
    console.log("optionsData", optionsData);
    if (!Array.isArray(optionsData)) {
      console.log("数据格式不正确");

      return false;
    }
    optionsData = optionsData.filter((item, index, arr) => {
      for (let i = 0; i < arr.length; i++) {
        if (index === i) continue;
        if (item.name === arr[i].name) return false;
      }
      return true;
    });

    const options: any = {
      series: {
        type: "graph",
        layout: "circular",
        circular: {
          rotateLabel: false
        },
        emphasis: {
          focus: "adjacency" // 新的配置项 focusNodeAdjacency: true, // 已弃用的配置项
        },
        categories: [],
        label: {
          offset: [this.option.seriesLabelOffsetX || 0, this.option.seriesLabelOffsetY || 0]
        },
        lineStyle: {
          curveness: 0.2
        },
        data: [],
        links: []
      }
    };

    options.series.data = optionsData.map((item: any, index: number) => {
      return {
        ...item,
        category: item.name,
        symbol:
          this.option.pointsSymbol[index] === "image"
            ? `image://${setMinioUrl(this.option.pointsSymbolImage[index])}`
            : this.option.pointsSymbol[index],
        symbolSize: item.value * (this.option.seriesLinksSymbolSize || 0),
        label: {
          show: true,
          position: this.option.labelPosition[index] || "left",
          align: this.option.seriesLabelAlign[index] || "center",
          verticalAlign: this.option.seriesLabelVerticalAlign[index] || "middle",
          formatter: (params: any) => {
            const res = [];
            if (this.validData(this.option.seriesLabelValueShow[index], true)) res.push(`{value|${params.value}}`);
            if (this.validData(this.option.seriesLabelNameShow[index], true)) res.push(`{name|${params.name}}`);
            return res.join("\n");
          },
          rich: {
            name: {
              fontFamily:
                this.option.seriesLabelNameFontFamily[index] || "Source Han Sans CN-Normal, Source Han Sans CN",
              fontStyle: this.option.seriesLabelNameFontStyle[index] || "normal",
              fontSize: this.option.seriesLabelNameFontSize[index] || 0,
              color: this.option.seriesLabelNameColor[index] || "#333",
              fontWeight: this.option.seriesLabelNameFontWeight[index] || "normal"
            },
            value: {
              fontFamily:
                this.option.seriesLabelValueFontFamily[index] || "Source Han Sans CN-Normal, Source Han Sans CN",
              fontStyle: this.option.seriesLabelValueFontStyle[index] || "normal",
              fontSize: this.option.seriesLabelValueFontSize[index] || 0,
              color: this.option.seriesLabelValueColor[index] || "#333",
              fontWeight: this.option.seriesLabelValueFontWeight[index] || "normal"
            }
          }
        },
        itemStyle: {
          color: this.option.pointColor[index] || "#fff"
        }
      };
    });
    options.series.categories = options.series.data;
    options.series.links = this.option.links.map((item: any, index: number) => {
      return {
        ...item,
        lineStyle: {
          color: item.color || "#fff",
          opacity: 0.5,
          width: item.value * (this.option.seriesLinksLineWidth || 0),
          type: this.option.seriesLinksLineType[index] || "solid"
        }
      };
    });
    this.options = options;
  }
}

export { EchartGraph };
