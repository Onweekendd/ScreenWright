# 数字人beta (ft-digital-human)

## dataChart 数据格式

| 字段 | 类型 | 说明 |
|------|------|------|
| label | string | 标签名称 |
| value | string | 文本内容 |

## option 字段说明

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| autoPlay | boolean | false | 是否自动播放 |
| loopBack | boolean | false | 是否循环返回 |
| autoHide | boolean | false | 是否自动隐藏 |
| showQrcode | boolean | true | 是否显示二维码 |
| showCaptions | boolean | true | 是否显示字幕 |
| showMsgInput | boolean | true | 是否显示消息输入框 |
| currentSession | boolean | false | 是否使用当前会话 |
| welcome | string | "你好，欢迎使用数字人服务" | 欢迎语 |
| defaultImage | string | "/img/digitalHuman.dbc58503.png" | 默认图片路径 |
| defaultVideo | string | "version-test/assets/defaultImg/human-man.webm" | 默认视频路径 |
| humanType | string | "online" | 数字人类型(online/offline) |
| aiChatShow | boolean | false | 是否显示AI聊天 |
| aiChatAct | string | "manual" | AI聊天触发方式(manual/auto) |
| aiChatInt | string | "text" | AI聊天交互类型(text/voice) |
| aiChatModel | string | "aibase" | AI聊天模型 |
| aiChatWidth | number | 500 | AI聊天窗口宽度 |
| aiChatHeight | number | 600 | AI聊天窗口高度 |
| aiChatBottom | number | 300 | AI聊天窗口底部偏移 |
| aiChatLeft | number | -400 | AI聊天窗口左侧偏移 |
| aiChatCompWidth | number | 360 | AI聊天组件宽度 |
| aiChatCompHeight | number | 180 | AI聊天组件高度 |
| acFontFamily | string | "sans-serif" | AI聊天字体 |
| acFontSize | number | 13 | AI聊天字号 |
| acFontColor | string | "rgba(191, 191, 191, 1)" | AI聊天字体颜色 |
| borderRadius | number | 10 | 圆角大小 |
| backgroundType | string | "color" | 背景类型(color/image) |
| backgroundColor | string | "rgba(43, 42, 62, 1)" | 背景颜色 |
| backgroundImage | string | "" | 背景图片路径 |
| voiceImg | string | (默认图片) | 语音按钮默认图片 |
| voiceStartImg | string | (默认图片) | 语音按钮激活图片 |
| renderHumanUrl | string | "" | 数字人渲染服务地址 |
| sendMsgUrl | string | "" | 消息发送服务地址 |
| instructionCodeSet | array | [] | 指令代码集 |
| compositeOption | object | {...} | 合成配置(含形象/动作/语音/知识库等子配置) |
| compositeList | array | [] | 合成列表 |
| sendQrcodeX | number | 0 | 二维码X偏移 |
| sendQrcodeY | number | 0 | 二维码Y偏移 |
| sendQrcodeSize | number | 100 | 二维码大小 |
| sendCaptionsStaleTimer | number | 10 | 字幕过期计时(秒) |
| sendInputX | number | 0 | 输入框X偏移 |
| sendInputY | number | 0 | 输入框Y偏移 |
| sendInputFontFamily | string | "sans-serif" | 输入框字体 |
| sendInputFontSize | number | 16 | 输入框字号 |
| sendInputFontColor | string | "rgba(255,255,255,1)" | 输入框字体颜色 |
| sendInputAskTitle | string | "您好，我是小凡..." | 输入框提示标题 |
| sendInputAskWords | string | "请介绍下凡拓数创,..." | 输入框推荐问题 |
| sendQrcodeUrl | string | (URL) | 二维码链接地址 |
| sendDialogX | number | 600 | 对话框X偏移 |
| sendDialogY | number | -120 | 对话框Y偏移 |
| sendDialogW | number | 860 | 对话框宽度 |
| sendDialogH | number | 680 | 对话框高度 |
| sendDialogBgImage | string | (默认图片) | 对话框背景图片 |
| sendDialogBgColor | string | "rgba(255,255,255,0.1)" | 对话框背景颜色 |
| sendDialogBgType | string | "image" | 对话框背景类型(image/color) |
| sendDialogFontFamily | string | "sans-serif" | 对话框字体 |
| sendDialogFontSize | number | 16 | 对话框字号 |
| sendDialogFontColor | string | "rgba(255,255,255,1)" | 对话框字体颜色 |
| sendDialogFontBgColorL | string | "rgba(0,160,226,0.1)" | 左侧消息背景颜色 |
| sendDialogFontBgColorR | string | "rgba(255,255,255,0.1)" | 右侧消息背景颜色 |
| sendDialogHeadBgImageL | string | (默认图片) | 左侧头像图片 |
| sendDialogHeadBgImageR | string | (默认图片) | 右侧头像图片 |
| analysisDialogWidth | number | 30 | 分析面板宽度 |
| analysisDialogHeight | number | 60 | 分析面板高度 |
| analysisDialogMoveX | number | 0 | 分析面板X偏移 |
| analysisDialogMoveY | number | 100 | 分析面板Y偏移 |
| analysisDialogBgType | string | "color" | 分析面板背景类型 |
| analysisDialogBgImage | string | "" | 分析面板背景图片 |
| analysisDialogBgColor | string | "rgba(17,19,23,0.8)" | 分析面板背景颜色 |
| analysisFontFamily | string | "sans-serif" | 分析面板字体 |
| analysisFontSize | number | 16 | 分析面板字号 |
| analysisFontColor | string | "rgba(255,255,255,1)" | 分析面板字体颜色 |
| wakeWord | string | "小凡小凡" | 唤醒词 |
| asrUrl | string | "ws://..." | 语音识别服务地址 |
| asrType | string | "BAIDU" | 语音识别类型 |
| baiduASRAppid | any | null | 百度语音AppID |
| baiduASRAppKey | string | "" | 百度语音AppKey |
| baiduASRUrl | string | "wss://..." | 百度语音服务地址 |
| showAnalysis | boolean | false | 是否显示分析面板 |
