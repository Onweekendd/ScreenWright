# 天气 (ft-weather)

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| weather | string | 天气信息(如"晴"、"多云") |
| temperature | object | 气温数据 |
| temperature.min | number | 最低温度 |
| temperature.max | number | 最高温度 |
| wind | object | 风力信息 |
| wind.direction | string | 风向(如"东南风") |
| wind.level | string | 风力等级(如"3") |

## option 字段说明

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| weatherType | string | "base" | 天气类型(base/custom) |
| isIcon | boolean | true | 是否显示天气图标 |
| isWeather | boolean | true | 是否显示天气文字 |
| isTemperature | boolean | true | 是否显示温度 |
| isWind | boolean | true | 是否显示风力 |
| direction | string | "horizontal" | 排列方向(horizontal/vertical) |
| fontSize | number | 20 | 字号 |
| fontWeight | string | "" | 字重 |
| fontStyle | string | "" | 字体样式 |
| fontFamily | string | "sans-serif" | 字体 |
| fontColor | string | "rgba(255, 255, 255, 1)" | 字体颜色 |
| textTranslateX | number | 0 | 文字X偏移 |
| textTranslateY | number | 0 | 文字Y偏移 |
| baseTime | number | 30 | 自动刷新间隔(分钟) |
| currentCity | any | null | 当前城市 |
| iconWidth | number | 50 | 天气图标宽度 |
| iconHeight | number | 50 | 天气图标高度 |
| connector | string | "~" | 温度区间连接符 |
| suffix | string | "℃" | 温度后缀 |
| seriesTabsList | array | [...] | 天气类型系列配置列表(name/fieldName/icon) |
