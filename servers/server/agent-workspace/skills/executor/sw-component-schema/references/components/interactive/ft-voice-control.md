# 语音控件beta (ft-voice-control)

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| value | string | 文本内容（语音识别结果） |

## option 字段说明

### 识别配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| asrUrl | string | "" | 语音识别服务地址 |
| isWakeUp | boolean | false | 是否启用唤醒词 |
| wakeUpWord | string | "小凡同学" | 唤醒词 |
| hotwords | string | "凡拓数创 20" | 热词列表 |
| mode | string | "2pass" | 识别模式 |
| itn | boolean | false | 是否启用逆文本归一化 |
| showResult | boolean | false | 是否显示识别结果 |

### 音频配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| wav_name | string | "h5" | 音频名称 |
| is_speaking | boolean | false | 是否正在说话 |
| chunk_size | number[] | [5,10,5] | 音频块大小 |
| chunk_interval | number | 10 | 音频块间隔 |

### 样式配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| voiceImg | string | "default-voice.png" | 语音按钮默认图片 |
| voiceStartImg | string | "default-voicestart.png" | 语音按钮激活图片 |
