# ftRichtext (富文本) 配置说明

## dataChart 数据格式

```typescript
interface FtRichtextDataItem {
  value: string;  // 富文本HTML内容
}

type dataChart = FtRichtextDataItem[];
```

**示例**：
```json
[
  { "value": "<p>这是<strong>富文本</strong>内容</p>" }
]
```

---

## option 完整字段参考

基于配置文件：ftRichtextGlobal.vue / ftRichtextLoadingEffect.vue

### 内容配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `content` | string | "<p>...</p>" | 富文本HTML内容 |

### 文字动画配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `textAnimationType` | string | "" | 动画类型 |
| `textAnimationTiming` | number | 50 | 动画速度 |
| `textAnimationDelay` | number | 0 | 动画延迟(ms) |

### 滚动配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `startScroll` | boolean | false | 是否开启滚动 |
| `scrollLoop` | boolean | false | 是否循环滚动 |
| `scrollInterval` | number | 10 | 滚动间隔 |

---

## 常用配置示例

### 静态富文本
```json
{
  "content": "<p><span style='font-size:20px;'>标题文字</span></p>",
  "textAnimationType": "",
  "startScroll": false
}
```

### 带动画的滚动富文本
```json
{
  "startScroll": true,
  "scrollLoop": true,
  "scrollInterval": 5,
  "textAnimationType": "fade",
  "textAnimationTiming": 80
}
```
