# customTableList (自定义列表) 配置说明

## dataChart 数据格式

```typescript
// 动态键值对记录，键由 column 配置中的 alias 字段定义
interface CustomTableListDataItem {
  [key: string]: string | number;
}

type dataChart = CustomTableListDataItem[];
```

**示例**：
```json
[
  { "id": "1", "姓名": "张三", "性别": "男", "岗位": "保安", "电话": 13265555444, "考勤班组": "班组1", "状态": "正常" },
  { "id": "2", "姓名": "李四", "性别": "男", "岗位": "保安组长", "电话": 132611112222, "考勤班组": "班组2", "状态": "正常" }
]
```

---

## option 完整字段参考

本组件与 swScroll/swProgress 结构不同，采用卡片式自由布局，主要由三个配置块组成。

### column 列定义（自由布局元素）

每列配置为一个独立的内容元素，可在卡片内自由定位。每个 column 对象包含以下字段组：

**基础属性**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 元素ID |
| `name` | string | 显示名称(数据列绑定时) |
| `alias` | string | 数据字段绑定名 |
| `icon` | string | 图标路径 |
| `word` | string | 静态文本内容(非数据绑定时) |
| `seriesYContentType` | string | 内容类型:"word"静态文本 / 映射数据字段 |
| `seriesYIsMapping` | boolean | 是否绑定数据字段 |
| `seriesYOverFlow` | string | 溢出处理:"carousel"/"ellipsis" |

**位置与尺寸**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesYZIndex` | number | 层级 |
| `seriesYOffsetWidth` | number | 元素宽度 |
| `seriesYOffsetHeight` | number | 元素高度 |
| `seriesYOffsetX` | number | X偏移 |
| `seriesYOffsetY` | number | Y偏移 |
| `seriesYTextAlign` | string | 文字对齐 |
| `seriesYTextWritingMode` | string | 文字书写模式:"horizontal-tb" |

**文字样式**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `seriesYFontFamily` | string | 字体 |
| `seriesYFontSize` | number | 字号 |
| `seriesYColor` | string | 颜色 |
| `seriesYFontStyle` | string | 风格 |
| `seriesYFontWeight` | string | 粗细 |
| `seriesYLineHeight` | number | 行高 |
| `seriesYLetterSpacing` | number | 字间距 |
| `seriesYTabsName` | string | 元素标签名 |

**状态样式对象** (defaultObj/hoverObj/activeObj 结构相同):

| 字段 | 类型 | 说明 |
|------|------|------|
| `backgroundColor` | string | 背景色 |
| `backgroundImage` | string | 背景图 |
| `backgroundImageType` | string | 图片适配:"contain" |
| `backgroundType` | string | 背景类型:"color" |
| `borderColor` | string | 边框色 |
| `borderLineType` | string | 边框线型:"dotted" |
| `borderWidth` | number | 边框宽度 |
| `btnBorderShow` | boolean | 显示按钮边框 |
| `btnShadowShow` | boolean | 显示按钮阴影 |
| `btnShadowInBlur/X/Y` | number | 内阴影参数 |
| `btnShadowOutBlur/X/Y` | number | 外阴影参数 |
| `isTextShadow` | boolean | 显示文字阴影 |
| `textShadowBlur/Color/X/Y` | number/string | 文字阴影参数 |
| `textTranslateX/Y` | number | 文字平移 |
| `seriesYColor` | string | 文字颜色 |
| `seriesYFontFamily` | string | 字体 |
| `seriesYFontSize` | number | 字号 |
| `seriesYFontStyle` | string | 风格 |
| `seriesYFontWeight` | string | 粗细 |
| `seriesYLetterSpacing` | number | 字间距 |
| `seriesYLineHeight` | number | 行高 |

### globalConfig 全局配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `globalBgShow` | boolean | 显示全局背景 |
| `globalRowCount` | number | 每页显示行数 |
| `globalRowLineMarginBottom` | number | 行间距 |
| `animationShow` | boolean | 启用动画 |
| `globalScroll` | boolean | 启用全局滚动 |
| `globalScrollTime` | number | 滚动间隔 |
| `scrollYBarShow` | boolean | 显示滚动条 |
| `globalScrollYTrackWidth` | number | 滚动条轨道宽度 |
| `globalScrollYTrackBackground` | string | 轨道背景色 |
| `globalScrollYThumbWidth` | number | 滑块宽度 |
| `globalScrollYThumbBackground` | string | 滑块颜色 |
| `globalScrollYTrackBorderRadius` | number | 轨道圆角 |
| `globalScrollYThumbBorderRadius` | number | 滑块圆角 |
| `globalBgType` | string | 背景类型:"color" |
| `globalBgImage` | string | 背景图片 |
| `globalBgColor` | string | 背景颜色 |
| `translateX` | number | 全局X平移 |
| `translateY` | number | 全局Y平移 |
| `globalTranslateX` | number | 全局X偏移 |
| `globalTranslateY` | number | 全局Y偏移 |

### rowConfig 行配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `listRowWidth` | number | 卡片宽度 |
| `listRowHeight` | number | 卡片高度 |
| `listRowBgType` | string | 卡片背景类型:"color"/"custom" |
| `listRowBgColor` | string | 卡片背景色 |
| `listRowBgImage` | string | 卡片背景图片 |
| `selectedShow` | boolean | 启用选中效果 |
| `selectedBgType` | string | 选中背景类型 |
| `selectedBgColor` | string | 选中背景色 |
| `selectedBgImage` | string | 选中背景图 |
| `hoverShow` | boolean | 启用悬停效果 |
| `hoverBgType` | string | 悬停背景类型 |
| `hoverBgColor` | string | 悬停背景色 |
| `listRowStatusShow` | boolean | 显示行状态 |
| `seriesXTabsName` | string[] | 状态标签名 |
| `listRowStatusList` | array | 状态列表配置 |
| `listRowMappingKey` | string | 行状态映射字段 |

### 其他字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `refresh` | boolean | 数据刷新开关 |
| `columns` | number | 列数(多列布局时使用) |

---

## 常用配置示例

### 基础人员信息卡片
```json
{
  "globalConfig": {
    "globalRowCount": 3,
    "globalScroll": true,
    "globalScrollTime": 100
  },
  "rowConfig": {
    "listRowWidth": 485,
    "listRowHeight": 170,
    "listRowBgType": "custom",
    "listRowBgImage": "path/to/card-bg.png"
  }
}
```

### 带选中状态的列表
```json
{
  "rowConfig": {
    "selectedShow": true,
    "selectedBgType": "color",
    "selectedBgColor": "rgba(0,0,17,1)"
  }
}
```
