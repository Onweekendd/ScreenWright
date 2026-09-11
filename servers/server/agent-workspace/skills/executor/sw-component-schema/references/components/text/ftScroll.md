# ftScroll (轮播表格) 配置说明

## dataChart 数据格式

```typescript
// 动态键值对记录，键由 column 配置定义
interface ScrollDataItem {
  [key: string]: string | number;
}

type dataChart = ScrollDataItem[];
```

**示例**：
```json
[
  { "accidentType": "car", "status": "已解决", "time": "07:33:40", "content": "左侧OBU无响应" },
  { "accidentType": "config", "status": "处理中", "time": "07:31:22", "content": "金链路5G基站信号丢失" }
]
```

---

## option 完整字段参考

总计 **120+ 个配置字段**，分组如下：

### 基础配置 (17字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `refresh` | boolean | true | 数据更新时重绘 |
| `columnShow` | boolean | true | 是否显示列 |
| `columnViews` | boolean | true | 列视图开关 |
| `animationShow` | boolean | true | 启用动画效果 |
| `cursorShow` | boolean | true | 显示光标 |
| `textStyleShow` | boolean | false | 显示文本样式 |
| `align` | string | "center" | 整体对齐方式 |
| `header` | boolean | false | 显示表头 |
| `scroll` | boolean | true | 启用滚动 |
| `scrollTime` | number | 84 | 滚动间隔时间 |
| `scrollTimeType` | boolean | true | 滚动时间类型 |
| `scrollSingleTime` | number | 3 | 单次滚动时间 |
| `fontSize` | number | 15 | 默认字号 |
| `count` | number | 5 | 可视行数 |
| `lineMarginBottom` | number | 10 | 行底部间距 |
| `index` | boolean | true | 显示序号 |
| `scrollCount` | number | 1 | 每次滚动行数 |

### 表头配置 (16字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `headerHeight` | number | 1 | 表头高度 |
| `headerFontSize` | number | 12 | 表头字号 |
| `headerFontFamily` | string | - | 表头字体 |
| `headerlineHeight` | number | 35 | 表头行高 |
| `borderShow` | boolean | true | 显示边框 |
| `backgroundType` | string | "custom" | 背景类型 |
| `backgroundImage` | string | - | 背景图片 |
| `headerletterSpacing` | number | 12 | 表头字间距 |
| `headerFontStyle` | string | "normal" | 表头字体风格 |
| `headerFontWeight` | string | "normal" | 表头字体粗细 |
| `headerBackground` | string | - | 表头背景色 |
| `headerColor` | string | - | 表头文字颜色 |
| `activeKeys` | string | "" | 激活键 |
| `headerShow` | boolean | true | 是否显示表头 |
| `headerTextAlign` | string | "center" | 表头文字对齐 |

### 列定义 (1字段)

| 字段 | 类型 | 说明 |
|------|------|------|
| `column` | {name:string, alias:string, icon?:string}[] | 列定义数组，name为显示名，alias为数据字段名 |

### 选中配置 (13字段)

| 字段 | 类型 | 说明 |
|------|------|------|
| `selectedShow` | boolean | 是否启用选中效果 |
| `selectedFontSize` | number | 选中字号 |
| `selectedFontFamily` | string | 选中字体 |
| `selectedletterSpacing` | number | 选中字间距 |
| `selectedFontStyle` | string | 选中风格 |
| `selectedFontWeight` | string | 选中粗细 |
| `selectedColor` | string | 选中文字颜色 |
| `selectedlineHeight` | number | 选中行高 |
| `selectedMode` | string | 选中模式:"single"/"multiple" |
| `selectedBgType` | string | 选中背景类型 |
| `selectedBgColor` | string | 选中背景色(支持渐变) |
| `selectedBgOpacity` | number | 选中背景透明度 |
| `selectedBgImage` | string | 选中背景图片 |

### 阴影配置 (6字段)

| 字段 | 类型 | 说明 |
|------|------|------|
| `shadowShow` | boolean | 是否显示阴影 |
| `shadowColor` | string | 阴影颜色 |
| `shadowX` | number | 阴影X偏移 |
| `shadowY` | number | 阴影Y偏移 |
| `shadowFuzzy` | number | 阴影模糊度 |
| `shadowExtension` | number | 阴影扩展 |

### 行序号配置 (22字段)

| 字段 | 类型 | 说明 |
|------|------|------|
| `rowName` | string[] | 行名称列表 |
| `rowTitle` | string | 序号列标题 |
| `initialValue` | number | 序号起始值 |
| `rowWidth` | number | 序号列宽度 |
| `rowSpace` | number | 序号列间距 |
| `rowAlign` | string | 序号对齐方式 |
| `rowKey` | string[] | 行键值 |
| `rowOffsetX` | number[] | 行X偏移 |
| `rowOffsetY` | number[] | 行Y偏移 |
| `rowBgWidth` | number[] | 行背景宽度 |
| `rowBgHeight` | number[] | 行背景高度 |
| `rowBgType` | string[] | 行背景类型 |
| `rowBgColor` | string[] | 行背景颜色 |
| `rowBgOpacity` | number[] | 行背景透明度 |
| `rowBgImage` | string[] | 行背景图片 |
| `rowFontSize` | number[] | 行字号 |
| `rowFontFamily` | string[] | 行字体 |
| `rowletterSpacing` | number[] | 行字间距 |
| `rowFontStyle` | string[] | 行风格 |
| `rowFontWeight` | string[] | 行粗细 |
| `rowColor` | string[] | 行颜色 |
| `rowlineHeight` | number[] | 行行高 |
| `rowShow` | boolean | 是否显示序号列 |

### 主体配置 (6字段)

| 字段 | 类型 | 说明 |
|------|------|------|
| `bodyBackground` | string | 主体背景色 |
| `bodyColor` | string | 主体文字颜色 |
| `borderColor` | string | 边框颜色 |
| `bodyTextAlign` | string | 主体文字对齐 |
| `nthColor` | string | 奇数行颜色 |
| `othColor` | string | 偶数行颜色 |

### 行样式/X轴 (8字段，均为数组，按行分组)

| 字段前缀 | 类型 | 说明 |
|------|------|------|
| `seriesXTabsName` | string[] | 行标签名 |
| `seriesXbackgroundType` | string[] | 行背景类型 |
| `seriesXbackgroundImage` | string[] | 行背景图片 |
| `seriesXBackground` | string[] | 行背景色 |
| `seriesXBorderColor` | string[] | 行边框色 |
| `seriesXBorderWidth` | number[] | 行边框宽度 |
| `seriesXRadius` | number[] | 行圆角 |
| `seriesXOffsetX` | number[] | 行X偏移 |

### 列样式/Y轴 (18字段，均为数组，按列分组)

| 字段前缀 | 类型 | 说明 |
|------|------|------|
| `seriesYWidth` | number[] | 列宽度 |
| `seriesYMarginLeft` | number[] | 列左边距 |
| `seriesYbackgroundImage` | string[] | 列背景图 |
| `seriesYBackground` | string[] | 列背景色 |
| `seriesYBorderColor` | string[] | 列边框色 |
| `seriesYBorderWidth` | number[] | 列边框宽度 |
| `seriesYFontSize` | number[] | 列字号 |
| `seriesYFontFamily` | string[] | 列字体 |
| `seriesYletterSpacing` | number[] | 列字间距 |
| `seriesYFontStyle` | string[] | 列风格 |
| `seriesYFontWeight` | string[] | 列粗细 |
| `seriesYColor` | string[] | 列颜色 |
| `seriesYContentType` | string[] | 列内容类型:"word"/"number"/"statusImg" |
| `seriesYTextAlign` | string[] | 列对齐 |
| `seriesYOverFlow` | string[] | 列溢出处理:"ellipsis"/"carousel" |
| `seriesYlineHeight` | number[] | 列行高 |
| `seriesYOffsetX` | number[] | 列X偏移 |
| `seriesYOffsetY` | number[] | 列Y偏移 |
| `seriesYTabsName` | string[] | 列标签名 |

### 列图片配置 (3字段，均为数组)

| 字段 | 类型 | 说明 |
|------|------|------|
| `maskImage` | string[] | 遮罩图片 |
| `imageWidth` | number[] | 图片宽度 |
| `imageHeight` | number[] | 图片高度 |

### 后缀配置 (11字段，均为数组，按列分组)

| 字段 | 类型 | 说明 |
|------|------|------|
| `suffixShow` | boolean[] | 是否显示后缀 |
| `thousandSplit` | boolean[] | 是否千分位 |
| `suffixFontSize` | number[] | 后缀字号 |
| `suffixFontFamily` | string[] | 后缀字体 |
| `suffixletterSpacing` | number[] | 后缀字间距 |
| `suffixFontStyle` | string[] | 后缀风格 |
| `suffixFontWeight` | string[] | 后缀粗细 |
| `suffixColor` | string[] | 后缀颜色 |
| `suffixlineHeight` | number[] | 后缀行高 |
| `suffixOffsetX` | number[] | 后缀X偏移 |
| `suffixOffsetY` | number[] | 后缀Y偏移 |
| `suffixContent` | string[] | 后缀内容文本 |

### 状态图标配置 (5字段，均为二维数组)

| 字段 | 类型 | 说明 |
|------|------|------|
| `statusConfigValue` | string[][] | 状态值映射 |
| `statusConfigImg` | string[][] | 状态图标路径 |
| `statusConfigWidth` | number[][] | 状态图标宽度 |
| `statusConfigHeight` | number[][] | 状态图标高度 |
| `statusConfigName` | string[][] | 状态名称 |

### 样式指定配置 (12字段，均为二维数组)

| 字段 | 类型 | 说明 |
|------|------|------|
| `styleAssignKeyValue` | string[][] | 指定样式匹配值 |
| `styleAssignFontFamily` | string[][] | 指定字体 |
| `styleAssignFontSize` | number[][] | 指定字号 |
| `styleAssignHeight` | number[][] | 指定高度 |
| `styleAssignletterSpacing` | number[][] | 指定字间距 |
| `styleAssignColor` | string[][] | 指定颜色 |
| `styleAssignFontStyle` | string[][] | 指定风格 |
| `styleAssignFontWeight` | string[][] | 指定粗细 |
| `styleAssignName` | string[][] | 指定名称 |
| `styleAssignBgImg` | string[][] | 指定背景图 |
| `styleAssignBgWdith` | number[][] | 指定背景宽度(注意拼写) |
| `styleAssignBgHeight` | number[][] | 指定背景高度 |
| `styleAssignBgLeft` | number[][] | 指定背景左边距 |

### 全局滚动条配置 (6字段)

| 字段 | 类型 | 说明 |
|------|------|------|
| `globalScrollYTrackWidth` | number | 滚动条轨道宽度 |
| `globalScrollYTrackBackground` | string | 轨道背景色 |
| `globalScrollYTrackBorderRadius` | number | 轨道圆角 |
| `globalScrollYThumbWidth` | number | 滑块宽度 |
| `globalScrollYThumbBackground` | string | 滑块颜色 |
| `globalScrollYThumbBorderRadius` | number | 滑块圆角 |

### 进度条配置 (1字段)

| 字段 | 类型 | 说明 |
|------|------|------|
| `progressYConfig` | object[] | 每列的进度条配置，包含type/status/color/fontFamily/fontSize等 |

---

## 常用配置示例

### 基础滚动表格
```json
{
  "scroll": true,
  "scrollTime": 84,
  "count": 5,
  "scrollCount": 1,
  "headerShow": true
}
```

### 带选中效果的表格
```json
{
  "selectedShow": true,
  "selectedMode": "single",
  "selectedBgColor": "linear-gradient(0deg, rgba(10,17,219,1) 0%, rgba(137,181,252,1) 100%)"
}
```
