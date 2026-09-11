/**
 * 适配类型
 */
enum AdaptationType {
  /**
   * 铺满屏幕
   */
  fill = 1,

  /**
   * 屏幕比例适配
   */
  scale = 2,

  /**
   * 原分辨率溢出滚动
   */
  overflow = 3,

  /**
   * 按约束布局自适应
   */
  constraint = 4
}

const adaptationType = [
  { label: "铺满屏幕", value: AdaptationType.fill },
  { label: "屏幕比例适配", value: AdaptationType.scale },
  { label: "按约束布局自适应", value: AdaptationType.constraint },
  { label: "原分辨率溢出滚动", value: AdaptationType.overflow }
];

export { AdaptationType, adaptationType };
