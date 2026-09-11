import { cloneDeep } from "lodash-es";

import { descSort, getTop3Label, setLinearColor } from "../../utils";
import { BaseChart } from "../BaseChart/index";
import type { ArrayDataItem, BaseChartProps } from "../type";
import { projectEchartType } from "../type";

class EchartmultiplyRankBar extends BaseChart {
  option: Record<string, any> = {};
  dataLength = 0;
  colorNameList: string[] = [];
  seriesColor: any[] = [];
  seriesOpacity: number[] = [];
  seriesFieldList: string[] = [];
  constructor() {
    const defaultChartProps = {
      name: "总数排名图",
      prop: projectEchartType.echartrankBar,
      img: "/img/rankBar3.20240514.png",
      groupName: "项目"
    };
    super(defaultChartProps);
    this.seriesFieldList = ["seriesColor", "seriesOpacity"];
  }
  nameObject() {
    return {
      nameFontFamily: this.option.nameFontFamily || "Arial",
      nameFontSize: this.option.nameFontSize || 0,
      nameColor: this.option.nameColor || "#fff",
      nameFontStyle: this.option.nameFontStyle || "normal",
      nameFontWeight: this.option.nameFontWeight || "normal",
      nameWidth: this.option.nameWidth || 0,
      nameLeftPadding: this.option.nameLeftPadding || 0
    };
  }
  getOptions() {
    return this.options;
  }
  // 修正图表x轴数据与实际数据对应关系 需配合splitArray方法使用
  getEchartsSeriesNameAndSeriesData(optionData: any) {
    let seriesName: any = [];
    optionData.forEach((item: { list: any[] }) => {
      seriesName = [...seriesName, ...item.list.map((ele) => ele.seriesName)];
    });
    seriesName = [...new Set(seriesName)];
    optionData = optionData.map((item: { list: any; name: any }) => {
      const seriesData: any[] = [];
      seriesName.forEach((ele: any) => {
        let flag = 0;
        for (const { seriesName, value } of item.list) {
          // console.log(ele, seriesName, 'seriesName');
          if (ele === seriesName) {
            seriesData.push({
              seriesName: ele,
              name: item.name,
              value: value
            });
            flag = 1;
            break;
          }
        }
        if (flag !== 1)
          seriesData.push({
            seriesName: ele,
            name: item.name,
            value: null
          });
      });
      return {
        name: item.name,
        list: seriesData
      };
    });
    return {
      seriesName,
      optionData
    };
  }

  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;
    const filterData = await this.transformOptionsDataByDataFilter();
    let optionsData = cloneDeep(filterData);
    const color = [
      setLinearColor({
        xy: [1, 0, 0, 0],
        colors: { 0: "rgb(0,120,255)", 1: "rgba(0,120,255,0)" }
      }),
      setLinearColor({
        xy: [1, 0, 0, 0],
        colors: { 0: "rgb(34,180,255)", 1: "rgba(34,180,255,0)" }
      }),
      setLinearColor({
        xy: [1, 0, 0, 0],
        colors: { 0: "rgb(40,255,247)", 1: "rgba(40,255,247,0)" }
      }),
      setLinearColor({
        xy: [1, 0, 0, 0],
        colors: {
          0: "rgb(239,253,255)",
          0.36: "rgb(176,247,255)",
          1: "rgba(62,235,255,0)"
        }
      })
    ];
    optionsData = optionsData.map((item: ArrayDataItem) => {
      return {
        ...item,
        value: parseFloat(item.value + "")
      };
    });
    this.dataLength = optionsData.length;

    let optionDataByName = await this.transformOptionsData(optionsData, "name");

    const { optionData: dataByName } = this.getEchartsSeriesNameAndSeriesData(optionDataByName);
    optionDataByName = dataByName;
    this.dataLength = optionDataByName.length;
    optionDataByName = optionDataByName.map((items) => {
      let sum = 0;
      items.list.forEach((item: { value: number }) => {
        sum += item.value;
      });
      return {
        ...items,
        total: sum
      };
    });
    descSort(optionDataByName, "total");
    const initialData = (() => {
      let res: any[] = [];
      optionDataByName.forEach((item) => {
        res = [...res, ...item.list];
      });
      return res;
    })();
    let optionData = await this.splitArray(initialData, "seriesName");
    const { optionData: dataBySeriesName } = this.getEchartsAxisNameAndSeriesData(optionData);
    optionData = dataBySeriesName;
    const seriesName = optionData.map((item) => item.name);
    // 删除系列时seriesColor被删除那项还是缓存着，刷新页面后重新设置seriesColor才是对的，所以在刷新配置是重置this[field]
    this.seriesFieldList.forEach((field) => {
      if (this.option[field]) (this[field as keyof EchartmultiplyRankBar] as any) = [];
    });
    this.option.dataSeriesName.forEach((item: any, index: number) => {
      const idx = seriesName.indexOf(item);
      if (idx !== -1) {
        seriesName[idx] = this.option.seriesTabsName[index].value;
        this.seriesFieldList.forEach((field) => {
          (this[field as keyof EchartmultiplyRankBar] as any[])[idx] = this.option[field][index];
        });
      }
    });
    // css线性渐变色转为echarts线性渐变色
    this.seriesColor = this.createSeriesColor(this.seriesColor);
    const totalList = optionDataByName.map((item) => item.total);
    let max = Math.max(...totalList);
    const maxArr: number[] = [];
    max += max / 10;
    const unit = "";
    const toFixedNum = 0;
    const stackData: number[] = [];
    optionDataByName.forEach((item, index) => {
      maxArr.push(max);
      stackData.push(max - totalList[index]);
    });

    const options = {
      color,
      legend: this.createLegend(this.option),
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
        data: optionDataByName.map((item) => item.name),
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
      series: (() => {
        // const barColor = this.option.barColor || [];
        const list = (optionData || []).map((item, index) => {
          return {
            name: seriesName[index],
            stack: "总量",
            // barGap: '-100%',
            type: "bar",
            barWidth: this.option.seriesWidth,
            itemStyle: {
              color: this.seriesColor[index] || "red",
              opacity: this.seriesOpacity[index] / 100 || 0
            },
            data: item.list,
            tooltip: {
              show: false
            }
          };
        });
        return list;
      })()
    };
    options.series.push(
      {
        stack: "总量",
        type: "bar",
        // barGap: '-100%',
        barWidth: this.option.seriesWidth,
        itemStyle: {
          //@ts-ignore
          normal: {
            color: "rgba(0, 214, 255, 0.2)"
          }
        },
        data: stackData,
        label: {
          show: this.option.valueShow,
          position: "right",
          offset: [this.option.valueOffSetX || 0, this.option.valueOffSetY || 0],
          color: this.option.valueColor || "#fff",
          fontFamily: this.option.valueFontFamily || "Arial",
          fontSize: this.option.valueFontSize || 0,
          fontStyle: this.option.valueFontStyle || "normal",
          fontWeight: this.option.valueFontWeight || "normal",
          formatter: (res: { dataIndex: number }) => {
            const val =
              (toFixedNum ? Number(totalList[res.dataIndex]).toFixed(toFixedNum) : totalList[res.dataIndex]) +
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
    );
    this.options = options;
  }
}

export { EchartmultiplyRankBar };
