import { setMinioUrl } from "@/utils/config";

import { BaseChart } from "../BaseChart/index";
import type { BaseChartProps } from "../type";
import { indicatorEchartType } from "../type";

class Echartwordcloud extends BaseChart {
  option: Record<string, any> = {};
  constructor() {
    const baseChartProps = {
      name: "字符云",
      prop: indicatorEchartType.echartwordcloud,
      img: "/img/progress.1e8fda59.png",
      groupName: "指标"
    };
    super(baseChartProps);
  }
  getOptions() {
    return this.options;
  }
  loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;

      img.onload = () => resolve(img);
      img.onerror = (error) => reject(error);

      // 检查图片是否已经加载完成（缓存情况）
      if (img.complete) {
        resolve(img);
      }
    });
  }
  setCloudOptions(maskImage: HTMLImageElement | null, optionsData: any[]) {
    const options = {
      series: [
        {
          type: "wordCloud",
          shape: this.option.shape || "circle",
          keepAspect: this.validData(this.option.keepAspect, true),
          maskImage: this.validData(this.option.maskImageShow, true) ? maskImage : undefined,
          left: (this.option.left || 0) + "%",
          top: (this.option.top || 0) + "%",
          right: null,
          bottom: null,
          width: "100%",
          height: "100%",

          // 尺寸范围
          sizeRange: [this.option.sizeRangeMin || 0, this.option.sizeRangeMax || 0],

          // 旋转范围
          rotationRange: [this.option.rotationRangeMin || 0, this.option.rotationRangeMax || 0],
          // 旋转步长
          rotationStep: this.option.rotationStep || 1,

          // 网格尺寸（网格越大 词间距越大）
          gridSize: this.option.gridSize || 0,

          // 绘制是否超出边界
          drawOutOfBound: !this.validData(this.option.drawOutOfBound, true),

          // 布局动画
          layoutAnimation: true,

          textStyle: {
            fontFamily: this.option.fontFamily || "Source Han Sans CN-Normal, Source Han Sans CN",
            fontWeight: "bold",

            color: () => {
              let colors =
                "rgb(" +
                [
                  Math.round(Math.random() * 255),
                  Math.round(Math.random() * 255),
                  Math.round(Math.random() * 255)
                ].join(",") +
                ")";
              if (this.option.seriesColor && this.option.seriesColor.length > 0) {
                const index = Math.floor(Math.random() * this.option.seriesColor.length);
                colors = this.option.seriesColor[index] || this.option.seriesColor[0];
              }
              return colors;
            }
          },
          emphasis: {
            focus: "self",

            textStyle: {
              textShadowBlur: 10,
              textShadowColor: "#333"
            }
          },

          data: optionsData
        }
      ],
      tooltip: {
        show: true
      }
    };
    this.options = options;
  }
  async init(baseChartProps: BaseChartProps) {
    this.baseChartProps = baseChartProps;
    this.option = baseChartProps.option;

    let maskImage: any = null;
    // const optionsData = cloneDeep(baseChartProps.data) || [];
    const optionsData: any = await this.transformOptionsDataByDataFilter();
    if (this.option.maskImageShow && this.option.maskImage) {
      maskImage = await this.loadImage(setMinioUrl(this.option.maskImage) || "");
      this.setCloudOptions(maskImage, optionsData);
    } else {
      this.setCloudOptions(maskImage, optionsData);
    }
  }
}
export { Echartwordcloud };
