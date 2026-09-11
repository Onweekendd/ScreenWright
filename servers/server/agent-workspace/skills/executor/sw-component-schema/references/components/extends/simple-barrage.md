# 弹幕组件 (simple-barrage)

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| text | string | 弹幕文本内容 |

## option 字段说明

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| imageWidth | number | 400 | 弹幕区域宽度 |
| imageHeight | number | 400 | 弹幕区域高度 |
| imageMinHeight | number | 20 | 弹幕最小高度 |
| imageMaxHeight | number | 20 | 弹幕最大高度 |
| imageObjectFit | string | "none" | 弹幕内容适配方式 |
| scale | number | 1.3 | 缩放比例 |
| importType | string | "systemInterface" | 数据导入类型(systemInterface/custom) |
| importConfig.apiUrl | string | "" | 接口地址 |
| importConfig.method | string | "POST" | 请求方法 |
| importConfig.body | array | [] | 请求体参数 |
| importConfig.headers | array | [] | 请求头参数 |
| loop | boolean | true | 是否循环播放弹幕 |
| lineNum | number | 5 | 弹幕轨道行数 |
| isHover | boolean | false | 鼠标悬停时是否暂停 |
| speed | number | 0.2 | 弹幕滚动速度 |
| stylesList | array | [...] | 弹幕样式列表(name/fontSize/fontWeight/fontStyle/letterSpacing/fontFamily/fontColor/isTextShadow/textShadow) |
