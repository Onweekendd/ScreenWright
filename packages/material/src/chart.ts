export { ScreenwrightEchartsMap as component } from "./components/ScreenwrightEcharts";
export { ScreenwrightEchartsConfigComponent as editor, optionType } from "./editor-ui/chartComponent/index";

// 通用 echarts 封装（BaseChart 组件 + 已注册好图表类型的 echarts 核心），
// 供 app 内非 ScreenwrightEcharts 的第三方/场景图表组件（echartcommon、echartcommonMap）复用，避免各自维护重复实现
export { default as BaseChart } from "./components/Echart/index.vue";
export { default as echartsCore } from "./components/Echart/utils";
export type { EChartsCoreOption } from "./components/Echart/type";

// 通用配置项 attrs 组装 hook，供 app 内未物料化的配置面板（xAxisConfigTab、configDistance 等）复用
export { useGenericAttrs } from "./editor-ui/chartComponent/useGenericAttrs";
