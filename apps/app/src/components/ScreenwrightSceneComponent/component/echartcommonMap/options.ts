import { validData } from "@screenwright/material/text";
import { ElMessage } from "element-plus";

import { setMinioUrl } from "@/utils/config";

import GeoDataUtils from "./geoDataUtils";
import { getEchartsColor, getObjectAndIndexFromArrayByField, getPointByProj4 } from "./utils";

interface geoJsonProps {
  type: string;
  features: any[];
}
interface startProps {
  adcode: string;
  option: Record<string, any>;
  childComponent: any[];
  childDataChart: Record<number, any>;
  name?: string;
}
class echartCommonMapOptions {
  myOption: Record<string, any>;
  geoJson: geoJsonProps;
  geoUtils: GeoDataUtils;
  name: string;
  constructor() {
    this.name = "";
    this.myOption = {};
    this.geoJson = {
      type: "FeatureCollection",
      features: []
    };
    this.geoUtils = new GeoDataUtils().init();
  }
  getGeoJson() {
    return this.geoJson;
  }
  getRegionByName(regionName: string) {
    const adcode = this.geoJson.features.find((item) => item.properties.name === regionName)?.properties.adcode;
    if (adcode) {
      /**
       * @type {Region}
       */
      const region = {
        name: regionName,
        adcode: adcode + ""
      };
      return region;
    }
    return null;
  }
  async getGeoJsonFromAdcode(adcode: string) {
    const geoJsonResponse = await this.getGeoJsonFromAdcodeApi(adcode);
    this.transformGeoFeatures(geoJsonResponse);
  }
  async getGeoJsonFromAdcodeApi(adcode: string) {
    console.log(adcode, "adcode");

    const response = await this.geoUtils.getGeoData(adcode);
    if (response) {
      return response.fullData;
    }
    ElMessage.error(`${this.name || ""}目前该区域尚未开放数据`);
    return null;
  }
  transformGeoFeatures(geoJsonResponse: any) {
    if (geoJsonResponse) {
      this.geoJson.features = geoJsonResponse.features.map((item: any) => {
        return {
          type: item.type,
          properties: item.properties,
          geometry: {
            type: item.geometry.type,
            coordinates: (() => {
              try {
                if (Array.isArray(item.geometry.coordinates[0][0][0])) {
                  return item.geometry.coordinates.map((coordinate: any) => {
                    return [
                      coordinate[0].map((point: any) => {
                        return getPointByProj4(point);
                      })
                    ];
                  });
                } else {
                  return item.geometry.coordinates.map((coordinate: any) => {
                    return coordinate.map((point: any) => {
                      return getPointByProj4(point);
                    });
                  });
                }
              } catch (error) {
                console.log(item.geometry.coordinates, "item.geometry.coordinates", error);
              }
            })()
          }
        };
      });
    }
  }

  getVisualMapOption = (option: any) => {
    const pos = option.autoGrid
      ? option.visualMapGrid || { right: 0, bottom: 0 }
      : { top: (option.visualMapTop || 0) + "%", left: (option.visualMapLeft || 0) + "%" };
    return {
      seriesIndex: this.myOption.series.length - 1,
      show: true,
      ...pos,
      max: Number(option.visualMapMax),
      min: Number(option.visualMapMin),
      inRange: {
        color: (() => {
          return option.visualMapColor || "#fff";
        })()
      },
      text: [option.textHigh, option.textLow],
      textGap: option.visualMapTextGap || 0,
      textStyle: {
        fontFamily: option.visualMapTextFontFamily || "Arial",
        fontSize: option.visualMapTextFontSize || 0,
        color: option.visualMapTextColor || "rgba(255, 255, 255, 1)",
        fontStyle: option.visualMapTextFontStyle || "normal",
        fontWeight: option.visualMapTextFontWeight || "normal"
      },
      itemWidth: option.visualMapItemWidth || 0,
      itemHeight: option.visualMapItemHeight || 0,
      orient: option.visualMapOrient || "vertical",
      calculable: true
    };
  };
  setDefaultOptions(option: Record<string, any>) {
    this.myOption = {
      tooltip: {
        trigger: "item",
        showDelay: 0,
        transitionDuration: 0.2
      },
      visualMap: [],
      geo: {
        show: true,
        map: "China",
        roam: option.roam || true,
        aspectScale: 1,
        label: {
          show: validData(option.geoLabelShow, false),
          fontFamily: option.geoLabelFontFamily || "Source Han Sans CN-Normal, Source Han Sans CN",
          fontStyle: option.geoLabelFontStyle || "normal",
          fontSize: option.geoLabelFontSize || 0.01,
          color: option.geoLabelColor || "#333",
          fontWeight: option.geoLabelFontWeight || "normal"
        },
        itemStyle: {
          areaColor: option.areaColor || "#171a24",
          borderWidth: option.borderWidth || 0,
          borderColor: option.borderColor || "#87c0ff",
          shadowColor: option.shadowColor || "#87c0ff",
          shadowOffsetX: option.shadowOffsetX || 0,
          shadowOffsetY: option.shadowOffsetY || 0,
          shadowBlur: option.shadowBlur || 0
        },
        emphasis: {
          label: {
            color: option.geoLabelColor || "#333"
          },
          itemStyle: {
            areaColor: option.areaColor || "#171a24",
            borderWidth: option.borderWidth + 3 || 0,
            shadowBlur: option.shadowBlur + 10 || 0,
            borderColor: option.borderColor || "#87c0ff"
          }
        }
      },
      series: []
    };
  }
  transformOption(childComponent: any[], childDataChart: Record<number, any>) {
    for (let i = 0; i < childComponent.length; i++) {
      const item = childComponent[i];
      console.log(childDataChart, "this.childDataChartwwwwwww");

      const childData = childDataChart[item.id] || [];
      if (childData.length === 0) {
        continue;
      }

      const option = item.option || {};

      switch (item.name) {
        case "飞线":
          if (item.show) {
            this.myOption.series.push({
              name: "线路",
              type: "lines",
              coordinateSystem: "geo",
              zlevel: 20,
              large: true,
              effect: {
                show: validData(option.effectShow, false),
                period: option.effectType === "period" ? option.period || 0 : 0,
                constantSpeed: option.effectType === "constantSpeed" ? option.constantSpeed || 0 : 0,
                delay: option.delay * 1000 || 0,
                symbol:
                  option.effectSymbol === "image"
                    ? `image://${setMinioUrl(option.effectSymbolImage)}`
                    : option.effectSymbol,
                symbolSize: [option.effectSymbolWidth || 0, option.effectSymbolHeight || 0],
                color: getEchartsColor(option.effectColor) || "#3e43f4",
                opacity: option.effectOpacity / 100 || 0,
                trailLength: option.trailLength || 0,
                loop: validData(option.loop, true)
              },
              lineStyle: {
                color: getEchartsColor(option.lineColor) || "#3e43f4",
                width: option.lineWidth || 0,
                opacity: option.lineOpacity / 100 || 0,
                curveness: option.lineCurveness || 0
              },
              label: {
                show: validData(option.lineLabelShow, false),
                position: option.lineLabelPosition || "end",
                fontFamily: option.lineLabelFontFamily || "Source Han Sans CN-Normal, Source Han Sans CN",
                fontStyle: option.lineLabelFontStyle || "normal",
                fontSize: option.lineLabelFontSize || 0,
                color: option.lineLabelColor || "#333",
                fontWeight: option.lineLabelFontWeight || "normal"
              },
              data: childData
                .filter((it: any) => Array.isArray(it.coords))
                .map((item: any) => {
                  return {
                    name: item.name,
                    coords: item.coords.map((point: any) => {
                      return getPointByProj4(point);
                    })
                  };
                })
            });
          }
          break;

        case "散点":
          if (item.show) {
            this.myOption.series.push({
              type: "effectScatter",
              coordinateSystem: "geo",
              symbol: "circle",
              tooltip: {
                extraCssText: `box-shadow :inset 0 0 0.23rem #008aff;color:#fff;padding:0.05rem 0.28rem 0.05rem 0.28rem;border-radius:0;line-height:0.30rem;`,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                formatter: (params: any) => {
                  if (!params.value[2]) {
                    return "";
                  }
                  let str = "";
                  str += `<p style="color:#fff;font-size:0.16rem;text-align:center;"><span style="font-family:'Source Han Sans CN-Normal, Source Han Sans CN';font-size:0.18rem;">${
                    params.name
                  }：${parseFloat(params.value[2] || 0)}</span></p>`;
                  return str;
                }
              },
              data: childData
                .filter((it: any) => Array.isArray(it.value))
                .map((item: any) => {
                  return {
                    name: item.name,
                    value: [...getPointByProj4([item.value[0], item.value[1]]), item.value[2]]
                  };
                }),
              showEffectOn: option.showEffectOn,
              rippleEffect: {
                period: option.rippleEffectPeriod || 0,
                scale: option.rippleEffectScale || 0,
                brushType: option.rippleEffectBrushType || "fill"
              },
              symbolSize: option.symbolSize,
              label: {
                show: true,
                formatter: (params: any) => {
                  const res = [];
                  if (option.seriesLabelNameShow) {
                    res.push(`{name|${params.name}}`);
                  }
                  if (option.seriesLabelValueShow) {
                    res.push(`{value|${params.value[2] || ""}}`);
                  }
                  return res.join("\n");
                },
                align: "center",
                verticalAlign: "middle",
                rich: {
                  name: {
                    fontFamily: option.seriesLabelNameFontFamily || "Arial",
                    fontSize: option.seriesLabelNameFontSize || 0,
                    color: option.seriesLabelNameColor || "rgba(255, 255, 255, 1)",
                    fontStyle: option.seriesLabelNameFontStyle || "normal",
                    fontWeight: option.seriesLabelNameFontWeight || "normal"
                  },
                  value: {
                    fontFamily: option.seriesLabelValueFontFamily || "Arial",
                    fontSize: option.seriesLabelValueFontSize || 0,
                    color: option.seriesLabelValueColor || "rgba(255, 255, 255, 1)",
                    fontStyle: option.seriesLabelValueFontStyle || "normal",
                    fontWeight: option.seriesLabelValueFontWeight || "normal"
                  }
                }
              },
              emphasis: {
                label: { show: true }
              },
              itemStyle: {
                color: {
                  type: "radial",
                  x: 0.5,
                  y: 0.5,
                  r: 0.5,
                  colorStops: [
                    {
                      offset: 0.25,
                      color: option.insideColor
                    },
                    {
                      offset: 1,
                      color: option.outsideColor
                    }
                  ]
                },
                shadowBlur: 10,
                shadowColor: "rgba(120, 36, 50, 0)",
                borderWidth: option.borderWidth || 0,
                borderColor: option.borderColor || "#fff"
              },
              zlevel: 1
            });
          }
          break;

        case "热力图":
          (() => {
            if (!(item.show && Array.isArray(childData))) {
              return;
            }

            const heatMapData = [];
            for (let j = 0; j < this.geoJson.features.length; j++) {
              const element = this.geoJson.features[j];
              const value = getObjectAndIndexFromArrayByField(childData, "adcode", element.properties.adcode)?.obj
                ?.value;
              if (value) {
                heatMapData.push([...getPointByProj4(element.properties.center), value]);
              }
            }

            this.myOption.series.push({
              name: "热力图",
              type: "heatmap",
              coordinateSystem: "geo",
              silent: true,
              pointSize: option.pointSize || 0,
              blurSize: option.blurSize || 0,
              minOpacity: option.minOpacity || 0,
              maxOpacity: option.maxOpacity || 0,
              data: heatMapData
            });
            this.myOption.visualMap.push(this.getVisualMapOption(option));
          })();
          break;

        case "行政区色块图":
          if (!(item.show && Array.isArray(childData))) {
            continue;
          }

          this.myOption.series.push({
            name: "行政区色块图",
            type: "map",
            geoIndex: 0,
            tooltip: {
              extraCssText: `box-shadow :inset 0 0 0.23rem #008aff;color:#fff;padding:0.05rem 0.28rem 0.05rem 0.28rem;border-radius:0;line-height:0.30rem;`,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              formatter: (params: any) => {
                let str = "";
                str += `<p style="color:#fff;font-size:0.16rem;text-align:center;"><span style="font-family:'Source Han Sans CN-Normal, Source Han Sans CN';font-size:0.18rem;">${
                  params.name
                }：${parseFloat(params.value || 0)}</span></p>`;
                return str;
              }
            },
            data: childData
          });
          this.myOption.visualMap.push(this.getVisualMapOption(option));
          break;

        default:
          break;
      }
    }
  }
  async start(props: startProps) {
    const { adcode, option, childComponent, childDataChart, name } = props;
    this.name = name || "";
    await this.getGeoJsonFromAdcode(adcode);
    this.setDefaultOptions(option);
    this.transformOption(childComponent, childDataChart);
    return this.myOption;
  }
}
export { echartCommonMapOptions };
