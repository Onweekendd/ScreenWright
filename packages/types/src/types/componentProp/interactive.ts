/**
 * 交互组件类型
 * @description 交互类组件的类型标识
 */

/**
 * 交互组件枚举
 * @description 各种交互组件的类型标识
 */
export enum InteractiveEnum {
  /** 语音控制 */
  FtVoiceControl = "sw-voice-control",
  /** 复选框 */
  FormCheckbox = "formCheckbox",
  /** 导航菜单 */
  FormNavMenu = "formNavMenu",
  /** 滚动选择器 */
  ScrollPicker = "scrollPicker",
  /** 点时间轴 */
  PointTimeline = "pointTimeline",
  /** 开关 */
  FormSwitch = "formSwitch",
  /** 滑块 */
  FormSlider = "formSlider",
  /** 多级子标签 */
  MultiSubtabs = "multi-subtabs",
  /** 滚动子标签 */
  RollSubtabs = "roll-subtabs",
  /** 级联选择器 */
  FtCascader = "swCascader",
  /** 单选图例 */
  FtSingleSelectedLegend = "swSingleSelectedLegend",
  /** 日期时间选择器 */
  FtDateTimePicker = "swDateTimePicker",
  /** 自定义选择器 */
  FtCustomSelect = "swCustomSelect",
  /** 图例 */
  FtLegend = "swLegend",
  /** 分页查询 */
  FtPageQuery = "swPageQuery",
  /** 翻页 */
  FtPageTurning = "swPageTurning",
  /** 子标签页 */
  Subtabs = "subtabs",
  /** 互斥组件 */
  FtMutual = "sw-mutual",
  /** 集成交互 */
  FtIntegrationMutual = "sw-integration-mutual",
  /** 搜索 */
  FtSearch = "sw-search",
  /** 时间轴 */
  FtTimerShaft = "swTimerShaft",
  /** 视频进度条 */
  videoProgress = "videoProgress"
}

/** @deprecated 使用 InteractiveEnum 代替 */
export const interactiveEnum = InteractiveEnum;
