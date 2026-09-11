export { ScreenwrightMediaMap as component } from "./components/ScreenwrightMedia";
export type {
  CardItem,
  DataItem,
  SpinnerItem,
} from "./components/ScreenwrightMedia/components/types";
export {
  isSupportedFlv,
  isSupportedHls,
} from "./components/ScreenwrightMedia/utils";
export {
  MediaConfigComponent as editor,
  optionType,
} from "./editor-ui/mediaComponent/index";

// 媒体配置面板内的通用常量/类型，供 app 内未物料化的配置面板（exhibit 等 Global/PicList）复用。
// swiperCard 的 CardItem 与上方 ScreenwrightMedia 的 CardItem 同名，故以 SwiperCardItem 别名导出以避免冲突
export { objectFit } from "./editor-ui/mediaComponent/ItemComponent/dict";
export type {
  CardStyleType,
  CardItem as SwiperCardItem,
} from "./editor-ui/mediaComponent/ItemComponent/swiperCard/swiperCard";
