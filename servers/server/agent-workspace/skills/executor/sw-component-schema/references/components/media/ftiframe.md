# iframe (ftiframe) 配置说明

## dataChart 数据格式

```typescript
interface FtiframeDataItem {
  value: string;  // iframe嵌入地址
}

type dataChart = FtiframeDataItem[];
```

**示例**：
```json
[
  { "value": "https://www.example.com" }
]
```

---

## option 完整字段参考

基于配置文件：ftiframeGlobal.vue

### URL配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `extendIframeUrl` | string | "" | 扩展iframe地址 |

### 布局配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `gridTop` | number | 0 | 上边距 |
| `gridBottom` | number | 0 | 下边距 |
| `gridLeft` | number | 0 | 左边距 |
| `gridRight` | number | 0 | 右边距 |

### 关闭按钮配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `closeColor` | string | "rgba(255,255,255,1)" | 关闭按钮颜色 |
| `closeSize` | number | 20 | 关闭按钮大小 |
| `showClose` | boolean | false | 是否显示关闭按钮 |
| `closeTop` | number | 0 | 关闭按钮上边距 |
| `closeBottom` | number | 0 | 关闭按钮下边距 |
| `closeLeft` | number | 0 | 关闭按钮左边距 |
| `closeRight` | number | 0 | 关闭按钮右边距 |

### 权限配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `allowScripts` | boolean | false | 是否允许脚本 |
| `allowForms` | boolean | false | 是否允许表单 |
| `allowSameOrigin` | boolean | false | 是否允许同源 |
| `allowTopNavigation` | boolean | false | 是否允许顶层导航 |
| `allowMicrophone` | boolean | false | 是否允许麦克风 |
| `allowCamera` | boolean | false | 是否允许摄像头 |
| `allowFullscreen` | boolean | false | 是否允许全屏 |

### 边框配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `frameborder` | boolean | false | 是否显示边框 |
| `scrolling` | boolean | false | 是否允许滚动 |

### 字体配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fontFamily` | string | "Source Han Sans CN-Normal, Source Han Sans CN" | 字体 |
| `fontStyle` | string | "normal" | 字体样式 |
| `fontWeight` | string | "normal" | 字重 |

### 引用配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `isQuote` | boolean | false | 是否引用 |
| `quoteId` | string | "" | 引用ID |
| `quoteVersion` | string | "" | 引用版本 |
| `isQuoteReload` | boolean | false | 引用是否重新加载 |

---

## 常用配置示例

### 嵌入外部网页
```json
{
  "extendIframeUrl": "https://www.example.com",
  "frameborder": false,
  "scrolling": true,
  "allowScripts": true,
  "showClose": false
}
```

### 引用其他大屏页面
```json
{
  "isQuote": true,
  "quoteId": "dashboard-001",
  "quoteVersion": "v1.0",
  "isQuoteReload": false,
  "showClose": true,
  "closeColor": "rgba(255,0,0,1)",
  "closeSize": 24
}
```
