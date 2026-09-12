# swdatetime (实时时间) 配置说明

## dataChart 数据格式

实时时间组件不需要数据源，直接显示系统当前时间。dataChart 为空数组。

```typescript
// 无数据接口
type dataChart = never[];
```

---

## option 完整字段参考

基于配置文件：swdatetimeGlobal.vue

### 基础配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `format` | string | "yyyy-MM-dd HH:mm:ss" | 时间显示格式 |

### 字体配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fontFamily` | string | "Source Han Sans CN-Normal" | 字体 |
| `fontSize` | number | 20 | 字号 |
| `color` | string | "rgba(255,255,255,1)" | 字体颜色 |
| `fontWeight` | string | "normal" | 字重 |
| `fontStyle` | string | "normal" | 字体样式 |

### 布局配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `textAlign` | string | "center" | 水平对齐(left/center/right) |
| `textAlignVertical` | string | "center" | 垂直对齐(top/center/bottom) |
| `split` | number | 0 | 字间距 |
| `backgroundColor` | string | "rgba(255,255,255,0)" | 背景颜色 |

---

## 常用配置示例

### 日期+时间（完整格式）
```json
{
  "format": "yyyy-MM-dd HH:mm:ss",
  "fontSize": 24,
  "color": "rgba(0,168,255,1)"
}
```

### 仅显示时间
```json
{
  "format": "HH:mm:ss",
  "fontSize": 36,
  "fontFamily": "DIN-Bold"
}
```

### 仅显示日期
```json
{
  "format": "yyyy年MM月dd日",
  "fontSize": 20,
  "textAlign": "left"
}
```
