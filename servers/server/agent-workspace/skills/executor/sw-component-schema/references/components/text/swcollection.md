# swcollection (卡片滚动) 配置说明

## dataChart 数据格式

```typescript
interface FtcollectionDataItem {
  src: string;    // 资源地址（图片/视频URL）
  title: string;  // 卡片标题
}

type dataChart = FtcollectionDataItem[];
```

**示例**：
```json
[
  { "src": "https://example.com/img1.jpg", "title": "标题1" },
  { "src": "https://example.com/img2.jpg", "title": "标题2" },
  { "src": "", "title": "标题3" }
]
```

---

## option 完整字段参考

基于配置文件：swcollectionGlobal.vue / swcollectionCardSetting.vue / swcollectionTitle.vue / swcollectionSeries.vue

### 滚动配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | string | "scroll" | 类型标识 |
| `scroll` | boolean | true | 是否滚动 |
| `scrollBar` | boolean | false | 是否显示滚动条 |
| `speed` | number | 10 | 滚动速度 |
| `speedPosition` | string | "ToLeft" | 滚动方向(ToLeft/ToRight/ToTop/ToBottom) |

### 容器背景配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `padding` | number[] | [0,0,0,0] | 容器内边距[上,右,下,左] |
| `backgroundType` | string | "color" | 背景类型(color/image) |
| `background` | string | "rgba(24,144,255,0.2)" | 背景颜色 |
| `backgroundImage` | string | "none" | 背景图片 |

### 卡片配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `cardLen` | number | 3 | 可见卡片数量 |
| `cardMarginRight` | number | 10 | 卡片右边距(px) |
| `cardBackgroundType` | string | "color" | 卡片背景类型(color/image) |
| `cardBackgroundColor` | string | "rgba(24,144,255,0.2)" | 卡片背景颜色 |
| `cardBackgroundImage` | string | "none" | 卡片背景图片 |
| `cardPadding` | number[] | [0,0,0,0] | 卡片内边距[上,右,下,左] |
| `cardObjectFit` | string | "contain" | 卡片图片适配(contain/cover/fill) |
| `cardBgObjectFit` | string | "contain" | 卡片背景图适配 |

### 媒体播放配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `controls` | boolean | false | 是否显示播放控件 |
| `loopPlay` | boolean | true | 是否循环播放 |
| `autoPlay` | boolean | true | 是否自动播放 |
| `muted` | boolean | true | 是否静音 |

### 标题文字配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fontFamily` | string | "Source Han Sans CN-Normal" | 字体 |
| `fontSize` | number | 26 | 字号 |
| `color` | string | "rgba(255,255,255,1)" | 字体颜色 |
| `fontWeight` | string | "normal" | 字重 |
| `fontStyle` | string | "normal" | 字体样式 |
| `spacing` | number | 1 | 字间距 |

### 标题区域配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `titleWidth` | number | 100 | 标题区域宽度(px) |
| `titleHeight` | number | 42 | 标题区域高度(px) |
| `textTranslateX` | number | 0 | 文字X偏移 |
| `textTranslateY` | number | 0 | 文字Y偏移 |
| `titleBackgroundType` | string | "color" | 标题背景类型 |
| `titleBackgroundColor` | string | "rgba(24,144,255,0.2)" | 标题背景颜色 |
| `titleBackgroundImage` | string | "none" | 标题背景图片 |

---

## 常用配置示例

### 3卡片横向滚动
```json
{
  "cardLen": 3,
  "speed": 15,
  "scroll": true,
  "speedPosition": "ToLeft",
  "cardMarginRight": 20
}
```

### 带背景图的卡片
```json
{
  "cardBackgroundType": "image",
  "cardBackgroundImage": "version-test/assets/card-bg.png",
  "cardPadding": [10, 10, 10, 10],
  "titleHeight": 50,
  "titleBackgroundColor": "rgba(0,0,0,0.5)"
}
```
