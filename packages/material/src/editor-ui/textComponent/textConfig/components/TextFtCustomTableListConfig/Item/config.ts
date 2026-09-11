// 全局
export const globalConfig = [
  {
    key: "globalRowCount", // 行数
    defaultValue: ""
  },
  {
    key: "globalRowLineMarginBottom", // 行间距
    defaultValue: ""
  },
  {
    key: "globalColCount", // 列数
    defaultValue: ""
  },
  {
    key: "animationShow", // 是否显示动画
    defaultValue: ""
  },
  {
    key: "globalScroll", // 动画开启滚动
    defaultValue: ""
  },
  {
    key: "globalScrollTime", // 动画滚动延迟
    defaultValue: ""
  },
  {
    key: "scrollYBarShow", // 是否显示纵向滚动条
    defaultValue: ""
  },
  {
    key: "globalScrollYTrackWidth", // 滚动条轨道粗细
    defaultValue: ""
  },
  {
    key: "globalScrollYTrackBackground", // 滚动条轨道颜色
    defaultValue: ""
  },
  {
    key: "globalScrollYTrackBorderRadius", // 滚动条轨道圆角
    defaultValue: ""
  },
  {
    key: "globalScrollYThumbWidth", // 滚动条滑块粗细
    defaultValue: ""
  },
  {
    key: "globalScrollYThumbBackground", // 滚动条滑块颜色
    defaultValue: ""
  },
  {
    key: "globalScrollYThumbBorderRadius", // 滚动条滑块圆角
    defaultValue: ""
  },
  {
    key: "globalBgType", // 背景填充方式
    defaultValue: ""
  },
  {
    key: "globalBgColor", // 背景颜色
    defaultValue: ""
  },
  {
    key: "globalBgImage", // 背景图片
    defaultValue: ""
  }
];
// 行配置
export const rowConfig = [
  {
    key: "listRowWidth", // 表样式行宽
    defaultValue: ""
  },
  {
    key: "listRowHeight", // 表样式行高
    defaultValue: ""
  },
  {
    key: "listRowBgType", // 表样式行背景填充方式
    defaultValue: ""
  },
  {
    key: "listRowBgColor", // 表样式行背景颜色
    defaultValue: ""
  },
  {
    key: "listRowBgImage", // 表样式行背景图片
    defaultValue: ""
  },
  {
    key: "selectedShow", // 选中高亮是否启用
    defaultValue: ""
  },
  {
    key: "selectedBgType", // 选中高亮背景填充方式
    defaultValue: ""
  },
  {
    key: "selectedBgColor", // 选中高亮背景颜色
    defaultValue: ""
  },
  {
    key: "selectedBgImage", // 选中高亮背景图片
    defaultValue: ""
  },
  {
    key: "hoverShow", // 鼠标悬停是否启用
    defaultValue: ""
  },
  {
    key: "hoverBgType", // 鼠标悬停背景填充方式
    defaultValue: ""
  },
  {
    key: "hoverBgColor", // 鼠标悬停背景颜色
    defaultValue: ""
  },
  {
    key: "hoverBgImage", // 鼠标悬停背景图片
    defaultValue: ""
  },
  {
    key: "listRowStatusShow", // 行状态是否启用
    defaultValue: ""
  },
  {
    key: "listRowMappingKey", // 行状态映射字段
    defaultValue: ""
  },
  {
    key: "seriesXTabsName", // 行状态值数组
    defaultValue: []
  },
  {
    key: "seriesXBackgroundMappingStatus", // 行状态-状态值
    defaultValue: ""
  },
  {
    key: "seriesXBackgroundType", // 行状态-背景填充方式
    defaultValue: ""
  },
  {
    key: "seriesXBackgroundColor", // 行状态-背景颜色
    defaultValue: ""
  },
  {
    key: "seriesXBackgroundImage", // 行状态-背景图片
    defaultValue: ""
  }
];
// 指定样式
export const styleAssignConfig = [
  {
    key: "styleAssignKeyValue",
    defaultValue: ""
  },
  {
    key: "styleAssignFontFamily",
    defaultValue: "Source Han Sans CN-Normal, Source Han Sans CN"
  },
  {
    key: "styleAssignFontSize",
    defaultValue: 12
  },
  {
    key: "styleAssignLineHeight",
    defaultValue: 12
  },
  {
    key: "styleAssignLetterSpacing",
    defaultValue: 0
  },
  {
    key: "styleAssignColor",
    defaultValue: "rgba(241, 242, 245, 1)"
  },
  {
    key: "styleAssignFontStyle",
    defaultValue: "normal"
  },
  {
    key: "styleAssignFontWeight",
    defaultValue: "normal"
  },
  {
    key: "styleAssignBgImg",
    defaultValue: ""
  },
  {
    key: "styleAssignWdith",
    defaultValue: 20
  },
  {
    key: "styleAssignHeight",
    defaultValue: 12
  },
  {
    key: "styleAssignMarginLeft",
    defaultValue: 0
  }
];
// 子项
export const seriesYColumnConfig = [
  {
    key: "alias",
    defaultValue: ""
  },
  {
    key: "icon",
    defaultValue: ""
  },
  // {
  //     key: 'name',
  //     defaultValue: ''
  // },
  {
    key: "word",
    defaultValue: ""
  },
  {
    key: "seriesYColor",
    defaultValue: "rgba(255,255,255,1)"
  },
  {
    key: "seriesYContentType",
    defaultValue: "word"
  },
  {
    key: "seriesYFontFamily",
    defaultValue: "Alibaba-PuHuiTi-Regular"
  },
  {
    key: "seriesYFontSize",
    defaultValue: 24
  },
  {
    key: "seriesYFontStyle",
    defaultValue: "normal"
  },
  {
    key: "seriesYFontWeight",
    defaultValue: "normal"
  },
  {
    key: "seriesYIsMapping",
    defaultValue: false
  },
  {
    key: "seriesYLetterSpacing",
    defaultValue: 1
  },
  {
    key: "seriesYLineHeight",
    defaultValue: 24
  },
  {
    key: "seriesYOffsetHeight",
    defaultValue: 40
  },
  {
    key: "seriesYOffsetWidth",
    defaultValue: 120
  },
  {
    key: "seriesYOffsetX",
    defaultValue: 0
  },
  {
    key: "seriesYOffsetY",
    defaultValue: 0
  },
  {
    key: "seriesYOverFlow",
    defaultValue: "carousel"
  },
  {
    key: "seriesYTabsName",
    defaultValue: "" // handleSeriesYChange里设置seriesYTabsName: `内容${len + 1}`
  },
  {
    key: "seriesYTextAlign",
    defaultValue: "left"
  },
  {
    key: "seriesYTextWritingMode",
    defaultValue: "horizontal-tb"
  },
  {
    key: "seriesYZIndex",
    defaultValue: 2
  },
  {
    key: "styleAssignList",
    defaultValue: []
  }
];
// 内容类型为按钮的 defaultObj
export const seriesYContentType_btn_defaultObj = [
  {
    key: "backgroundColor",
    defaultValue: "rgba(255,255,255,0)"
  },
  {
    key: "backgroundImage",
    defaultValue: ""
  },
  {
    key: "backgroundImageType",
    defaultValue: "contain"
  },
  {
    key: "backgroundType",
    defaultValue: "color"
  },
  {
    key: "borderColor",
    defaultValue: "rgba(255,255,255,1)"
  },
  {
    key: "borderLineType",
    defaultValue: "dotted"
  },
  {
    key: "borderWidth",
    defaultValue: 1
  },
  {
    key: "btnBorderShow",
    defaultValue: false
  },
  {
    key: "btnShadowInBlur",
    defaultValue: 2
  },
  {
    key: "btnShadowInColor",
    defaultValue: "rgba(255,255,255,1)"
  },
  {
    key: "btnShadowInX",
    defaultValue: 1
  },
  {
    key: "btnShadowInY",
    defaultValue: 1
  },
  {
    key: "btnShadowOutBlur",
    defaultValue: 2
  },
  {
    key: "btnShadowOutColor",
    defaultValue: "rgba(255,255,255,1)"
  },
  {
    key: "btnShadowOutX",
    defaultValue: 1
  },
  {
    key: "btnShadowOutY",
    defaultValue: 1
  },
  {
    key: "btnShadowShow",
    defaultValue: false
  },
  {
    key: "isTextShadow",
    defaultValue: false
  },
  {
    key: "seriesYColor",
    defaultValue: "rgba(241,242,245,1)"
  },
  {
    key: "seriesYFontFamily",
    defaultValue: "Alibaba-PuHuiTi-Regular"
  },
  {
    key: "seriesYFontSize",
    defaultValue: 20
  },
  {
    key: "seriesYFontStyle",
    defaultValue: "normal"
  },
  {
    key: "seriesYFontWeight",
    defaultValue: "normal"
  },
  {
    key: "seriesYLetterSpacing",
    defaultValue: 0
  },
  {
    key: "seriesYLineHeight",
    defaultValue: 20
  },
  {
    key: "styleAssignList",
    defaultValue: []
  },
  {
    key: "textShadowBlur",
    defaultValue: 4
  },
  {
    key: "textShadowColor",
    defaultValue: "rgba(245, 7, 7, 1)"
  },
  {
    key: "textShadowX",
    defaultValue: 2
  },
  {
    key: "textShadowY",
    defaultValue: 2
  },
  {
    key: "textTranslateX",
    defaultValue: 0
  },
  {
    key: "textTranslateY",
    defaultValue: 0
  }
];
// 内容类型为开关的默认配置
export const seriesYContentType_switch_defaultObj = [
  {
    key: "switchType",
    defaultValue: "default"
  },
  {
    key: "switchActiveText",
    defaultValue: "打开"
  },
  {
    key: "switchInactiveText",
    defaultValue: "关闭"
  },
  {
    key: "switchActiveColor",
    defaultValue: "rgba(12,12,19,1)"
  },
  {
    key: "switchInactiveColor",
    defaultValue: "rgba(12,12,19,1)"
  },
  {
    key: "switchPointSize",
    defaultValue: 50
  },
  {
    key: "switchActiveIcon",
    defaultValue: "version-test/assets/defaultImg/switch-on-icon.png"
  },
  {
    key: "switchInactiveIcon",
    defaultValue: "version-test/assets/defaultImg/switch-off-icon.png"
  },
  {
    key: "switchActiveImage",
    defaultValue: "version-test/assets/defaultImg/switch-on-image.png"
  },
  {
    key: "switchInactiveImage",
    defaultValue: "version-test/assets/defaultImg/switch-off-image.png"
  },
  {
    key: "switchFontFamily",
    defaultValue: "sans-serif"
  },
  {
    key: "switchFontSize",
    defaultValue: 16
  },
  {
    key: "switchFontColor",
    defaultValue: "rgba(255,255,255,1.00)"
  },
  {
    key: "switchFontWeight",
    defaultValue: false
  },
  {
    key: "switchFontStyle",
    defaultValue: false
  },
  {
    key: "switchLetterSpacing",
    defaultValue: 0
  },
  {
    key: "switchIsTextShadow",
    defaultValue: false
  },
  {
    key: "switchTextShadowColor",
    defaultValue: "rgba(255, 255, 255, 1)"
  },
  {
    key: "switchTextShadowX",
    defaultValue: 0
  },
  {
    key: "switchTextShadowY",
    defaultValue: 0
  },
  {
    key: "switchTextShadowBlur",
    defaultValue: 0
  }
];
// 内容类型为文字的默认配置-适配新加的值类型对应字段
export const seriesYContentType_word_defaultObj = [
  {
    key: "wordValueType",
    defaultValue: "string"
  },
  {
    key: "wordUnit",
    defaultValue: ""
  }
];
