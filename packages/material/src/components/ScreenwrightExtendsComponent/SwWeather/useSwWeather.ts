import { useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import axios from "axios";
import type { CSSProperties } from "vue";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";

interface WeatherTypeItem {
  label: string;
  value: string;
}

interface WeatherData {
  weather: string;
  temperature: {
    min: string | number;
    max?: string | number;
  };
  wind: {
    direction: string;
    level: string;
  };
}

export const useFtWeather = (options: ComponentType | any) => {
  const weatherType = ref<WeatherTypeItem[]>([
    { label: "实时", value: "base" },
    { label: "全天", value: "all" },
  ]);
  const timer = ref<any>(null);
  const { isBuild, dataChart, option } = useBaseData(options);
  const dataChartItemList = ref<WeatherData[] | null>(null);
  const styleDefaultFont = computed<CSSProperties>(() => {
    return {
      color: option.value.fontColor,
      fontSize: `${option.value.fontSize || 12}px`,
      fontWeight: option.value.fontWeight ? option.value.fontWeight : "normal",
      fontFamily: option.value.fontFamily,
      fontStyle: option.value.fontStyle ? option.value.fontStyle : "normal",
      transform: `translate(${option.value.textTranslateX || 0}px, ${option.value.textTranslateY || 0}px)`,
      paddingLeft: `${option.value.isIcon ? option.value.iconWidth : 0}px`,
      alignItems: `${option.value.direction === "horizontal" ? "center" : "flex-start"}`,
      justifyContent: `${option.value.direction === "horizontal" ? "flex-start" : "center"}`,
      flexDirection: `${option.value.direction === "horizontal" ? "row" : "column"}`,
    };
  });
  const styleIcon = computed<CSSProperties>(() => {
    return {
      width: `${option.value.iconWidth || 10}px`,
      height: `${option.value.iconHeight || 10}px`,
    };
  });

  const getWeather = (name: string): string => {
    return (
      option.value.seriesTabsList.find((i: any) => i.fieldName == name)?.icon ||
      ""
    );
  };

  const formatData = (data: any): WeatherData => {
    try {
      if (typeof data.temperature == "string") {
        data.temperature = JSON.parse(data.temperature);
      }
      if (typeof data.wind == "string") {
        data.wind = JSON.parse(data.wind);
      }
    } catch (error) {
      console.log(error);
    }
    return data;
  };

  const initDataChartItemList = (data: any): void => {
    if (data) {
      // 数组情况
      if (Array.isArray(data)) {
        // 空数组不处理，为null
        if (data.length) {
          dataChartItemList.value = data.map((item: any) => formatData(item));
        }
      } else {
        // 对象则赋值
        dataChartItemList.value = [formatData(data)];
      }
    }
  };

  const setWeather = async (code: string | number): Promise<void> => {
    if (!code) {
      return;
    }
    // 高德开放平台-天气API
    const cityValue =
      typeof option.value.currentCity === "string"
        ? option.value.currentCity
        : "Guangzhou";
    const response = await axios.get(
      `https://api.seniverse.com/v3/weather/now.json?key=SlTIFPD7HpZsecgpE&location=${cityValue}&language=zh-Hans&unit=c`,
    );
    const data = response.data.results || [];
    const { now } = data[0] || {};
    if (!now) {
      clearInterval(timer.value);
      return;
    }
    dataChartItemList.value = [
      {
        weather: now.text,
        temperature: {
          min: now.temperature,
        },
        wind: {
          direction: "东南风",
          level: "3",
        },
      },
    ];

    // switch (option.value.weatherType) {
    //   case "base": {
    //     const { lives } = data
    //     if (!lives || !lives.length) {
    //       clearInterval(timer.value)
    //       return
    //     }
    //     const weatherInfo = lives.map((a: any) => {
    //       return {
    //         weather: a.weather,
    //         temperature: {
    //           min: a.temperature
    //         },
    //         wind: {
    //           direction: a.winddirection,
    //           level: a.windpower
    //         }
    //       }
    //     })
    //     dataChartItemList.value = [...weatherInfo]
    //     break
    //   }
    //   case "all": {
    //     const { forecasts } = data
    //     if (!forecasts || !forecasts.length) {
    //       clearInterval(timer.value)
    //       return
    //     }
    //     const weatherInfo = forecasts.map((a: any) => {
    //       // 当天
    //       const dayWeather = a.casts[0]
    //       const thisHour = new Date().getHours()
    //       // 是否是夜晚
    //       const isNight = thisHour > 18 || thisHour < 6
    //       return {
    //         weather: isNight ? dayWeather.nightweather : dayWeather.dayweather,
    //         temperature: {
    //           min: dayWeather.nighttemp,
    //           max: dayWeather.daytemp
    //         },
    //         wind: {
    //           direction: isNight ? dayWeather.nightwind : dayWeather.daywind,
    //           level: isNight ? dayWeather.nightpower : dayWeather.daypower
    //         }
    //       }
    //     })
    //     dataChartItemList.value = [...weatherInfo]
    //     break
    //   }
    // }
  };

  const updateWeather = (code: string | number): void => {
    clearInterval(timer.value);
    timer.value = setInterval(
      () => {
        setWeather(code);
      },
      1000 * 60 * 30,
    );
  };
  // 初始数据监听
  watch(
    () => dataChart.value,
    (nv) => {
      if (!option.value.currentCity || !option.value.currentCity.length) {
        initDataChartItemList(nv);
      }
    },
    {
      immediate: true,
      deep: true,
    },
  );
  // 切换城市数据
  watch(
    () => option.value.currentCity,
    (v) => {
      console.log(v, "code = v[v.length - 1] || 0");
      if (!options.dataType) {
        if (v?.length) {
          const code = v[v.length - 1] || 0;
          console.log(v, code, "code = v[v.length - 1] || 0");
          setWeather(code);
        } else {
          // 清空城市选择，则初始化数据(用静态数据)
          initDataChartItemList(dataChart);
        }
      }
    },
    {
      deep: true,
    },
  );
  // 切换天气类型
  watch(
    () => option.value.weatherType,
    () => {
      if (!options.dataType) {
        const code = option.value.currentCity
          ? option.value.currentCity.length
            ? option.value.currentCity[option.value.currentCity.length - 1]
            : 0
          : 0;
        setWeather(code);
      }
    },
    {
      deep: true,
    },
  );

  onMounted(() => {
    nextTick(() => {
      if (
        !options.dataType &&
        option.value.currentCity &&
        option.value.currentCity.length
      ) {
        const code =
          option.value.currentCity[option.value.currentCity.length - 1] || 0;
        setWeather(code);
        if (
          option.value.weatherType === weatherType.value[0].value &&
          !isBuild.value &&
          code
        ) {
          updateWeather(code);
        }
      }
    });
  });

  onBeforeUnmount(() => {
    if (timer.value) {
      clearInterval(timer.value);
    }
  });

  return {
    dataChartItemList,
    styleDefaultFont,
    styleIcon,
    weatherType,
    getWeather,
  };
};
