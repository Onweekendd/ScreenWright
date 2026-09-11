# 音频 (ft-embed-audio) 配置说明

## dataChart 数据格式

```typescript
interface FtEmbedAudioDataItem {
  value: string;  // 音频地址
}

type dataChart = FtEmbedAudioDataItem[];
```

**示例**：
```json
[
  { "value": "version-test/assets/defaultImg/embedAudio.mp3" }
]
```

---

## option 完整字段参考

基于配置文件：ftEmbedAudioGlobal.vue

### 播放控制

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `url` | string | "version-test/assets/defaultImg/embedAudio.mp3" | 音频地址 |
| `controler` | boolean | false | 是否显示播放控件 |
| `autoPlay` | boolean | true | 是否自动播放 |
| `loopPlay` | boolean | true | 是否循环播放 |
| `autoHidden` | boolean | false | 是否自动隐藏控件 |

---

## 常用配置示例

### 自动播放背景音乐
```json
{
  "url": "background.mp3",
  "autoPlay": true,
  "loopPlay": true,
  "controler": false,
  "autoHidden": false
}
```

### 带控件的音频播放
```json
{
  "url": "audio.mp3",
  "autoPlay": false,
  "loopPlay": false,
  "controler": true,
  "autoHidden": true
}
```
