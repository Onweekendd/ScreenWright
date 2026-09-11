# 导航菜单 (formNavMenu)

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| label | string | 导航名称 |
| value | string | 导航值 |
| image | string | 导航图标路径（可选） |
| disabled | boolean | 是否禁用（可选） |
| children | array | 子菜单列表（可选） |
| children[].label | string | 子菜单名称 |
| children[].value | string | 子菜单值 |
| children[].image | string | 子菜单图标（可选） |
| children[].disabled | boolean | 子菜单是否禁用（可选） |

## option 字段说明

### 基础配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| type | string | "vertical" | 菜单方向（vertical/horizontal） |
| disabled | boolean | false | 是否禁用 |
| paddingTop | number | 0 | 上内边距 |
| paddingLeft | number | 0 | 左内边距 |
| collapse | boolean | false | 是否折叠 |
| lineHeight | number | 60 | 行高 |
| defaultActive | string | "1-1" | 默认激活项 |
| uniqueOpened | boolean | false | 是否只保持一个子菜单展开 |
| menuTrigger | string | "click" | 子菜单触发方式 |
| collapseTransition | boolean | true | 是否开启折叠过渡动画 |

### 字体配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| textColor | string | "#d3d3d4" | 文本颜色 |
| backgroundColor | string | "#201f28" | 背景颜色 |
| activeTextColor | string | "#ffffff" | 激活项文本颜色 |
| fontColor | string | "rgba(255,255,255,1)" | 字体颜色 |
| fontSize | number | 16 | 字体大小 |
| letterSpacing | number | 0 | 字间距 |
| textAlign | string | "left" | 文本对齐方式 |
| fontWeight | boolean | false | 字体加粗 |
| fontFamily | string | "sans-serif" | 字体族 |
| fontStyle | boolean | false | 字体斜体 |

### 文本阴影
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| isTextShadow | boolean | false | 是否显示文本阴影 |
| textShadow | object | {...} | 文本阴影配置 |

### 背景圆角配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| radiusTop | number | 0 | 上圆角 |
| radiusBottom | number | 20 | 下圆角 |
| radiusLeft | number | 0 | 左圆角 |
| radiusRight | number | 20 | 右圆角 |
| backgroundRadius | number | 90 | 背景圆角 |
| backgroundColor1 | string | "#3066FF" | 背景渐变色1 |
| backgroundColor2 | string | "#1FC2FF" | 背景渐变色2 |

### 子菜单样式配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| isChildStyle | boolean | false | 是否自定义子菜单样式 |
| isHiddenArrow | boolean | false | 是否隐藏箭头 |
| isOpenedLine | boolean | false | 是否显示展开线 |
| childLineColor1 | string | "#2A2E3F" | 子菜单线条颜色1 |
| childLineColor2 | string | "#1FC2FF" | 子菜单线条颜色2 |
| childFontColor | string | "#737373" | 子菜单字体颜色 |
| childTextAlign | string | "left" | 子菜单文本对齐 |
| childFontWeight | boolean | false | 子菜单字体加粗 |
| childFontFamily | string | "sans-serif" | 子菜单字体族 |
| childFontStyle | boolean | false | 子菜单字体斜体 |
| childLetterSpacing | number | 0 | 子菜单字间距 |
| childBgRadius | number | 90 | 子菜单背景圆角 |
| childBgColor1 | string | "#101010" | 子菜单背景渐变色1 |
| childBgColor2 | string | "#101010" | 子菜单背景渐变色2 |

### 前缀后缀配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| showParentPrefix | boolean | true | 是否显示父级前缀 |
| showChildPrefix | boolean | false | 是否显示子级前缀 |
| showParentSuffix | boolean | false | 是否显示父级后缀 |
| showChildSuffix | boolean | false | 是否显示子级后缀 |
| checkboxTabs | object | {...} | 复选框选项卡配置 |
