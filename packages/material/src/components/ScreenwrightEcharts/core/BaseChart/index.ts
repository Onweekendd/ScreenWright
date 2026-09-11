import { setMinioUrl } from "@material/minioUrl";
import type { ComponentInstanceType } from "@screenwright/core";
import type { ComponentType } from "@screenwright/types";
import { cloneDeep, isUndefined } from "lodash-es";

// import { groupBy, forOwn } from "lodash-es"
import { getEchartsColorFromCssLinearColor } from "../../utils";
import { FilterData } from "../filterData/index";
import type { BaseChartProps, componentType, Filter } from "../type";

type optionsProps = Record<string, any>;

interface BaseChartOptions {
  name: string;
  prop: componentType;
  img: string;
  groupName: string;
}
export function validateNull(val: any) {
  // 特殊判断
  if (val && parseInt(val) === 0) {
    return false;
  }
  const list = ["$parent"];
  if (
    val instanceof Date ||
    typeof val === "boolean" ||
    typeof val === "number"
  ) {
    return false;
  }
  if (val instanceof Array) {
    if (val.length === 0) {
      return true;
    }
  } else if (val instanceof Object) {
    val = cloneDeep(val);
    list.forEach((ele) => {
      delete val[ele];
    });
    for (const o in val) {
      return false;
    }
    return true;
  } else {
    if (
      val === "null" ||
      val == null ||
      val === "undefined" ||
      val === undefined ||
      val === ""
    ) {
      return true;
    }
    return false;
  }
  return false;
}
abstract class BaseChart implements ComponentInstanceType {
  baseChartProps: BaseChartProps | null;
  name: string;
  type: string;
  prop: componentType;
  img: string;
  groupName: string;
  // 渲染 Echarts 的 option
  options: any = {};
  filter: Record<string, Filter>;
  filterData: FilterData;
  screenScale: number;
  autoRefreshInterval: NodeJS.Timeout | null;
  constructor(baseChartProps: BaseChartOptions) {
    this.filterData = new FilterData();
    this.baseChartProps = null;
    this.name = baseChartProps.name || "基础图表";
    this.prop = baseChartProps.prop;
    this.img = baseChartProps.img;
    this.groupName = baseChartProps.groupName;
    this.screenScale = 0.6;
    this.options = {
      title: {},
      tooltip: {},
      grid: {},
      legend: {},
      xAxis: {},
      yAxis: {},
      dataZoom: "",
      series: [],
    };
    this.type = "BaseChart";
    this.filter = {};
    this.autoRefreshInterval = null;
  }
  // 注册全局过滤器
  registerDataFilter(filter: Record<string, Filter>) {
    this.filter = filter;
  }

  // 创建 title
  createTooltip(
    option: optionsProps,
    tooltipUnit: Record<string, any>,
    screenScale: number,
    tooltipMarkerColor: any[],
  ) {
    return {
      show: true,
      trigger: "axis",
      triggerOn: option.tooltipTriggerOn ? "mousemove|click" : "none",
      confine: true,
      extraCssText: `${option.tooltipBackground ? "box-shadow: 0 0 0px;" : ""}
          background-image: url(${setMinioUrl(option.tooltipBackground)});
          -moz-background-size:100% 100%; background-size:100% 100%;width:${option.tooltipWidth}px;height:${
            option.tooltipHeight
          }px;`,
      backgroundColor: option.tooltipBackground
        ? "rgba(0, 0, 0, 0)"
        : "rgba(0, 0, 0, 0.8)",
      borderWidth: 0,
      padding: [
        option.tooltipPaddingTop || 0,
        option.tooltipPaddingRight || 0,
        option.tooltipPaddingBottom || 0,
        option.tooltipPaddingLeft || 0,
      ],
      position: (point: any) => {
        return [
          point[0] + (option.tooltipOffsetX || 0),
          point[1] + (option.tooltipOffsetY || 0),
        ];
      },
      axisPointer: {
        lineStyle: {
          width: option.tooltipAxisPointerWidth || 0,
          color: option.tooltipAxisPointerColor || "#555",
        },
      },
      formatter: (params: any) => {
        let str = `<div style="width:100%;height:100%";>`;
        // xName
        str += `<p style="padding-top: ${5 + (option.tooltipNameOffsetY || 0)}px; padding-left: ${
          option.tooltipNameOffsetX || 0
        }px;width:100%;text-align:${option.tooltipAlign};margin:0;">
            <span style="font-family:${option.tooltipNameFontFamily};
            font-size:${option.tooltipNameFontSize * screenScale}px;
            color:${option.tooltipNameColor};
            font-weight:${option.tooltipNameFontWeight};
            font-style:${option.tooltipNameFontStyle};">
            ${params[0].name}
            </span>
            </p>`;
        str += `<div style="padding-top: ${
          option.tooltipLabelGapSapce >= 0
            ? option.tooltipLabelGapSapce
            : screenScale * 20
        }px">`;
        params.forEach((item: any, index: number) => {
          const param = item;
          // if (!param.value) return;
          param.marker = `<span style="display:${option.tooltipMarkerShow ? "inline-block" : "none"};margin-right:4px;
              width:${option.tooltipMarkerSize}px;
              height:${option.tooltipMarkerSize}px;background-color:${tooltipMarkerColor[index]};"></span>`;
          str += `<p style="color:#fff;font-size:${16 * screenScale}x;text-align:left;margin:0;line-height:${
            (option.tooltipArrLineHeight || 0) + 16
          }px">
    
              <span style="font-family:'Source Han Sans CN-Normal, Source Han Sans CN';font-size:${
                19 * screenScale
              }px;">${param.marker}</span>
    
              <span style="font-family:${option.tooltipSeriesNameFontFamily};
              font-size:${option.tooltipSeriesNameFontSize * screenScale}px;
              color:${option.tooltipSeriesNameColor};
              font-weight:${option.tooltipSeriesNameFontWeight};
               display: inline-block;
              transform:translate(${option.tooltipLabelOffsetX || 0}px, ${option.tooltipLabelOffsetY || 0}px);
              font-style:${option.tooltipSeriesNameFontStyle};">${param.seriesName}：</span>
    
              <span style="font-family:${option.tooltipValueFontFamily};
              font-size:${option.tooltipValueFontSize * screenScale}px;
              color:${option.tooltipValueColor};
              font-weight:${option.tooltipValueFontWeight};
              display: inline-block;
             transform:translate(${option.tooltipValueOffsetX || 0}px, ${option.tooltipValueOffsetY || 0}px);
              font-style:${option.tooltipValueFontStyle};">${
                Array.isArray(param.value) ? param.value[1] : param.value
              }</span>
              <span>
              <span style="
              display: inline-block;
               transform:translate(${option.tooltipUnitOffsetX || 0}px, ${option.tooltipUnitOffsetY || 0}px);
              font-family:${option.tooltipUnitFontFamily};
              font-size:${option.tooltipUnitFontSize * screenScale}px;
              color:${option.tooltipUnitColor};
              font-weight:${option.tooltipUnitFontWeight};
              font-style:${option.tooltipUnitFontStyle};">${tooltipUnit?.[index] || ""}</span>
              </span>
              </p>`;
        });
        str += "</div></div>";
        return str;
      },
    };
  }
  // 创建 grid
  createGrid(option: optionsProps) {
    return {
      left: option.gridLeft || 0,
      top: option.gridTop || 0,
      right: option.gridRight || 0,
      bottom: option.gridBottom || 0,
    };
  }
  // 创建 legend
  createLegend(option: optionsProps) {
    return {
      show: this.validData(option.legendShow, false),
      orient: option.legendOrient || "horizontal",
      ...option.legendGrid,
      width: option.legendWidth || 0,
      height: option.legendHeight || 0,
      itemWidth: option.legendItemWidth || 0,
      itemHeight: option.legendItemHeight || 0,
      itemGap: option.legendItemGap || 0,
      padding: (() => {
        const { legendOffsetX, legendOffsetY, legendGrid } = option;
        const { top = 0, right = 0, bottom = 0, left = 0 } = legendGrid;
        return [
          top ? 0 : legendOffsetY,
          right ? 0 : -1 * legendOffsetX,
          bottom ? 0 : -1 * legendOffsetY,
          left ? 0 : legendOffsetX,
        ];
      })(),
      selectedMode: option.legendSelectedMode,
      textStyle: {
        fontFamily: option.legendFontFamily || "Arial",
        fontSize: option.legendFontSize || 0,
        color: option.legendColor || "rgba(255, 255, 255, 1)",
        fontStyle: option.legendFontStyle,
        fontWeight: option.legendFontWeight,
        padding: [0, 0, 0, option.legendTextLeftPadding || 0],
        rich: {},
      },
    };
  }
  // 处理 x 轴数据 为 time 类型
  transformAxisData(data: any[], yAxisType: string) {
    if (yAxisType === "time") {
      return data.map((items) => {
        return {
          name: items.name,
          list: items.list.map((item: any) => {
            return {
              name: item.name,
              seriesName: item.seriesName,
              value: [item.value, item.name],
            };
          }),
        };
      });
    }
    return data;
  }

  async transformOptionsDataByDataFilter() {
    const data = await this.filterData.run({
      filterConfig: this.filter,
      target: this.baseChartProps as BaseChartProps,
    });
    return data as any;
  }

  // 自动刷新
  autoRefresh = (element: ComponentType) => {
    if (element.autoRefresh) {
      this.autoRefreshInterval = setInterval(async () => {
        await this.filterData.getInputData(element);
        element.option.refreshKey = !element.option.refreshKey;
      }, element.time * 1000);
    }
  };

  // 处理 系类 line bar 数据
  async transformOptionsData(array: any[], field = "seriesName") {
    const cloneData = cloneDeep(array);

    if (!this.baseChartProps) {
      return [];
    }
    if (cloneData?.length < 1) {
      return [];
    }
    const filterData = await this.transformOptionsDataByDataFilter();
    try {
      const newArr: any[] = [];
      filterData.map((mapItem: any) => {
        if (newArr.length == 0) {
          newArr.push({ name: mapItem[field], list: [mapItem] });
        } else {
          const res = newArr.some((item) => {
            //判断相同的部门，有就添加到当前项
            if (item.name === mapItem[field]) {
              item.list.push(mapItem);
              return true;
            }
          });
          if (!res) {
            //如果没找相同的部门添加一个新对象
            newArr.push({ name: mapItem[field], list: [mapItem] });
          }
        }
      });
      return newArr;
    } catch (error) {
      console.log(error, "error");
      return [];
    }
  }
  // 处理 系类 line bar 数据
  getEchartsAxisNameAndSeriesData(optionData: any[]): {
    axisName: string[];
    optionData: any[];
  } {
    // 获取所有的 axisName
    let axisName: any[] = [];
    optionData.forEach((item) => {
      axisName = [...axisName, ...item.list.map((ele: any) => ele.name)];
    });
    axisName = [...new Set(axisName)];

    optionData = optionData.map((item) => {
      const seriesData: any[] = [];
      axisName.forEach((ele) => {
        let flag = 0;
        for (const { name, value } of item.list) {
          if (ele === name) {
            seriesData.push({
              seriesName: item.name,
              name: ele,
              value: isUndefined(value) ? 100 : value,
            });
            flag = 1;
            break;
          }
        }
        if (flag !== 1) {
          seriesData.push({
            seriesName: item.name,
            name: ele,
            value: null,
          });
        }
      });
      return {
        name: item.name,
        list: seriesData,
      };
    });
    return {
      axisName,
      optionData,
    };
  }
  // 处理 系类 line bar 数据
  setTooltipUnit(option: optionsProps, seriesName: any[]) {
    const tooltipUnit: Record<string, any> = {};
    if (option.dataUnitName) {
      option.dataUnitName.forEach((item: any, index: any) => {
        const idx = seriesName.indexOf(item);
        if (idx !== -1) {
          tooltipUnit[idx] = option.unitTabsName?.[index]?.value || "";
        }
      });
    }
    return tooltipUnit;
  }
  // 处理 系类 line bar title
  createTitle(option: optionsProps) {
    const titleShow = this.validData(option.titleShow, false);
    return titleShow
      ? {
          text: option.title,
          subtext: option.subtext || "",
          textStyle: {
            color: option.titleColor || "#333",
            fontSize: option.titleFontSize || 0,
          },
          left: option.titlePostion || "auto",
          subtextStyle: {
            color: option.subTitleColor || "#aaa",
            fontSize: option.subTitleFontSize || 0,
          },
        }
      : {};
  }
  createSeriesColor(seriesColor: any[]) {
    return seriesColor.map((item) => {
      if (typeof item === "object" && !item.colorStops) {
        return getEchartsColorFromCssLinearColor(item);
      }
      return item;
    });
  }
  // 设置饼图的 legendSeriesWidthType 和 legendSeriesWidth
  setPieSeriesData(option: optionsProps) {
    option.legendSeriesWidthType = isUndefined(option.legendSeriesWidthType)
      ? "auto"
      : option.legendSeriesWidthType;

    option.legendSeriesWidth = isUndefined(option.legendSeriesWidth)
      ? 100
      : option.legendSeriesWidth;
  }

  validData = (val: any, defaultBoolean: boolean) => {
    if (typeof val === "boolean") {
      return val;
    }
    return !validateNull(val) ? val : defaultBoolean;
  };
  // 将数组根据字段拆分成二维数组
  splitArray(array: any[], field: any) {
    if (array?.length < 1) {
      return [];
    }
    try {
      const newArr: any[] = [];
      array.map((mapItem) => {
        if (newArr.length == 0) {
          newArr.push({ name: mapItem[field], list: [mapItem] });
        } else {
          const res = newArr.some((item) => {
            //判断相同的部门，有就添加到当前项
            if (item.name === mapItem[field]) {
              item.list.push(mapItem);
              return true;
            }
          });
          if (!res) {
            //如果没找相同的部门添加一个新对象
            newArr.push({ name: mapItem[field], list: [mapItem] });
          }
        }
      });
      return newArr;
    } catch (error) {
      console.log(error, "error");
      return [];
    }
  }

  renderDataByDataRemark(
    dataRemark: {
      key: string;
      map: string;
      description: string;
    }[],
    data: any[],
  ): any[] {
    return data.map((item) => {
      const newItem: any = {};
      dataRemark.forEach((remark) => {
        if (item[remark.map] !== undefined) {
          newItem[remark.key] = item[remark.map];
        }
      });
      return newItem;
    });
  }
  abstract init(baseChartProps: BaseChartProps): void;
  abstract getOptions(): void;
}

export { BaseChart };
