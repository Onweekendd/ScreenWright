// import { cloneDeep } from "lodash-es";

import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { otherEchartType } from "../type";

class EchartTreemap extends BaseChart {
  // 原始数据的option
  option: Record<string, any> = {};
  seriesColor: Array<string | Record<string, any>> = [];
  constructor() {
    const baseChartProps = {
      name: "矩形树图",
      prop: otherEchartType.echarttreemap,
      img: "/img/recttree.20240514.png",
      groupName: "其他"
    };
    super(baseChartProps);
    this.seriesColor = [];
  }
  getOptions() {
    return this.options;
  }

  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    // let optionsData = cloneDeep(baseChartProps.data) || [];
    let optionsData = (await this.transformOptionsDataByDataFilter()) || [];
    if (!Array.isArray(optionsData)) {
      console.log("数据格式不正确");

      return false;
    }
    let seriesName = [];
    seriesName = optionsData.map((item: any) => item.name);
    seriesName.map((seriesNameItem, seriesNameItemIndex) => {
      const targetItemIndex = this.option.seriesTabsName.findIndex(
        (seriesTabsNameItem: any) => seriesTabsNameItem === seriesNameItem
      );
      if (targetItemIndex !== -1) {
        this.seriesColor[seriesNameItemIndex] = this.option.seriesColor[targetItemIndex];
      } else {
        this.seriesColor[seriesNameItemIndex] = "rgba(255, 255, 255, 0)";
      }
    });
    optionsData = optionsData.filter((item, index, arr) => {
      for (let i = 0; i < arr.length; i++) {
        if (index === i) continue;
        if (item.name === arr[i].name) return false;
      }
      return true;
    });

    const options: any = {
      tooltip: {
        trigger: "item",
        formatter: "{b}",
        confine: true,
        extraCssText: `box-shadow: 0 0 0px;
            -moz-background-size:100% 100%; background-size:100% 100%;color:#fff`,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderWidth: 0
      },
      series: [
        {
          type: "treemap",
          width: "100%",
          height: "100%",
          roam: false, //是否开启拖拽漫游（移动和缩放）
          nodeClick: false, //点击节点后的行为,false无反应
          breadcrumb: {
            show: false
          },
          label: {
            // 描述了每个矩形中，文本标签的样式。
            show: this.option.seriesLabelShow,
            position: ["10%", "40%"],
            textStyle: {
              color: this.option.seriesLabelColor,
              fontSize: this.option.seriesLabelFontSize,
              fontWeight: this.option.seriesLabelFontWeight,
              fontFamily: this.option.seriesLabelFontFamily,
              fontStyle: this.option.seriesLabelFontStyle
            }
          },
          data: optionsData.map((item: any, index: number) => {
            let children = item.children || [];
            if (typeof children == "string") {
              children = JSON.parse(children);
            }
            return {
              ...item,
              name: item.name + "\n" + item.value,
              valuevisualDimension: 0,
              itemStyle: {
                show: true,
                borderWidth: this.option.seriesBorderWidth,
                borderColor: this.option.seriesBorderColor,
                color: this.seriesColor[index],
                emphasis: {
                  label: {
                    show: true
                  }
                }
              },
              children: children.map((subItem: any) => ({
                ...subItem,
                visualDimension: 1,
                itemStyle: {
                  show: true,
                  borderWidth: this.option.seriesChildBorderWidth,
                  borderColor: this.option.seriesChildBorderColor,
                  emphasis: {
                    label: {
                      show: true
                    }
                  }
                }
              }))
            };
          })
        }
      ]
    };
    this.options = options;
  }
}

export { EchartTreemap };
