import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { otherEchartType } from "../type";

class EchartFunnel extends BaseChart {
  // 原始数据的option
  option: Record<string, any> = {};
  legendGridTop = 0;
  legendGridLeft = 0;
  legendGridBottom = 0;
  seriesColor: Array<string | Record<string, any>> = [];
  seriesOpacity: number[] = [];
  extremeData: number[] = [];
  extremeShow: boolean[] = [];
  extremeType: string[] = [];
  extremeColor: string[] = [];
  extremeOpacity: number[] = [];
  tooltipMarkerColor: string[] = [];
  seriesFieldList: string[] = [];
  constructor() {
    const baseChartProps = {
      name: "漏斗图",
      prop: otherEchartType.echartfunnel,
      img: "/img/funnel.20240514.png",
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
    const optionsData = (await this.transformOptionsDataByDataFilter()) || [];
    if (!Array.isArray(optionsData)) {
      console.log("数据格式不正确");

      return false;
    }

    const seriesName = optionsData.map((item) => item.seriesName);
    // 删除系列时seriesColor被删除那项还是缓存着，刷新页面后重新设置seriesColor才是对的，所以在刷新配置是重置this[field]
    this.seriesFieldList.forEach((field) => {
      if (this.option[field]) {
        (this as any)[field] = [];
      }
    });
    this.option.dataSeriesName.forEach((item: string, index: number) => {
      const idx = seriesName.indexOf(item);
      if (idx !== -1) {
        optionsData[idx].seriesName = this.option.seriesTabsName[index].value;
        this.seriesFieldList.forEach((field: any) => {
          (this[field as keyof EchartFunnel] as any[])[idx] = this.option[field][index];
        });
      }
    });
    const data = optionsData.map((item) => {
      return {
        name: item.seriesName,
        value: item.value
      };
    });
    const tooltipUnit = this.setTooltipUnit(
      this.option,
      optionsData.map((item) => item.name)
    );
    const options: any = {
      tooltip: this.createTooltip(this.option, tooltipUnit, this.screenScale, this.tooltipMarkerColor),
      grid: this.createGrid(this.option),
      legend: this.createLegend(this.option),

      series: (() => {
        return {
          type: "funnel",
          left: this.option.gridLeft || 0,
          top: this.option.gridTop || 0,
          right: this.option.gridRight || 0,
          bottom: this.option.gridBottom || 0,
          orient: this.option.seriesOrient,
          sort: this.option.seriesSort,
          gap: this.option.seriesGap,
          funnelAlign: this.option.seriesFunnelAlign,
          itemStyle: {
            color: (params: any) => {
              return this.seriesColor[params.dataIndex];
            },
            borderColor: this.option.borderColor,
            borderWidth: this.option.borderWidth,
            shadowBlur: this.option.shadowBlur,
            shadowColor: this.option.shadowColor,
            shadowOffsetX: this.option.shadowOffsetX,
            shadowOffsetY: this.option.shadowOffsetY
          },
          label: {
            show: this.validData(this.option.seriesLabelShow, false), //开启显示
            position: this.option.labelPosition,
            formatter: (name: { name: string; value: number }) => name.value,
            //数值样式
            fontFamily: this.option.seriesLabelFontFamily || "Source Han Sans CN-Normal, Source Han Sans CN",
            fontStyle: this.option.seriesLabelFontStyle || "normal",
            fontSize: this.option.seriesLabelFontSize || 0,
            color: this.option.seriesLabelColor || "#333",
            fontWeight: this.option.seriesLabelFontWeight || "normal",
            offset: [this.option.seriesLabelOffsetX || 0, this.option.seriesLabelOffsetY || 0]
          },
          data
        };
      })()
    };
    this.options = options;
  }
}

export { EchartFunnel };
