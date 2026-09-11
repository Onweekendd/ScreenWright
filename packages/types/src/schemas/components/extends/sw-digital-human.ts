import { z } from "zod";

/**
 * 数字人beta (ft-digital-human)
 * 扩展
 *
 * ## 数据结构
 * 数据字段:
 * - `label` - 标签名称
 * - `value` - 文本内容
 */

// 单个数据项的 Schema
const swDigitalHumanDataItemSchema = z.object({
  label: z.string().describe("标签名称"),
  value: z.string().describe("文本内容")
});

export const swDigitalHumanDataSchema = z.array(swDigitalHumanDataItemSchema);
export type ftDigitalHumanData = z.infer<typeof swDigitalHumanDataSchema>;

export const swDigitalHumanOptionSchema = z.object({
  autoPlay: z.boolean().describe("是否自动播放"),
  loopBack: z.boolean().describe("是否循环返回"),
  autoHide: z.boolean().describe("是否自动隐藏"),
  showQrcode: z.boolean().describe("是否显示二维码"),
  showCaptions: z.boolean().describe("是否显示字幕"),
  showMsgInput: z.boolean().describe("是否显示消息输入框"),
  currentSession: z.boolean().describe("是否使用当前会话"),
  welcome: z.string().describe("欢迎语"),
  defaultImage: z.string().describe("默认图片路径"),
  defaultVideo: z.string().describe("默认视频路径"),
  humanType: z.string().describe("数字人类型(online/Offline)"),
  aiChatShow: z.boolean().describe("是否显示AI聊天"),
  aiChatAct: z.string().describe("AI聊天触发方式(manual/auto)"),
  aiChatInt: z.string().describe("AI聊天交互类型(text/voice)"),
  aiChatModel: z.string().describe("AI聊天模型"),
  aiChatWidth: z.number().describe("AI聊天窗口宽度"),
  aiChatHeight: z.number().describe("AI聊天窗口高度"),
  aiChatBottom: z.number().describe("AI聊天窗口底部偏移"),
  aiChatLeft: z.number().describe("AI聊天窗口左侧偏移"),
  aiChatCompWidth: z.number().describe("AI聊天组件宽度"),
  aiChatCompHeight: z.number().describe("AI聊天组件高度"),
  acFontFamily: z.string().describe("AI聊天字体"),
  acFontSize: z.number().describe("AI聊天字号"),
  acFontColor: z.string().describe("AI聊天字体颜色"),
  borderRadius: z.number().describe("圆角大小"),
  backgroundType: z.string().describe("背景类型(color/image)"),
  backgroundColor: z.string().describe("背景颜色"),
  backgroundImage: z.string().describe("背景图片路径"),
  voiceImg: z.string().describe("语音按钮默认图片"),
  voiceStartImg: z.string().describe("语音按钮激活图片"),
  renderHumanUrl: z.string().describe("数字人渲染服务地址"),
  sendMsgUrl: z.string().describe("消息发送服务地址"),
  instructionCodeSet: z.array(z.unknown()).describe("指令代码集"),
  compositeOption: z.object({
    seriesId: z.unknown().describe("系列ID"),
    name: z.string().describe("名称"),
    image: z.string().describe("数字人形象"),
    clothes: z.unknown().describe("服装"),
    motion: z.number().describe("动作编号"),
    voice: z.number().describe("语音编号"),
    rate: z.number().describe("语速"),
    pitch: z.number().describe("音调"),
    volume: z.number().describe("音量"),
    type: z.string().describe("类型"),
    actions: z.array(z.object({
      tabsName: z.string().describe("动作标签名"),
      action: z.string().describe("动作标识"),
      text: z.string().describe("动作文本")
    })).describe("动作列表"),
    knowledgeBase: z.boolean().describe("是否启用知识库"),
    knowledgeBaseName: z.string().describe("知识库名称"),
    knowledgeBaseFile: z.string().describe("知识库文件路径"),
    knowledgeBaseData: z.array(z.record(z.string(), z.unknown())).describe("知识库数据"),
    userId: z.unknown().describe("用户ID"),
    emotion: z.number().describe("情感编号"),
    captions: z.boolean().describe("是否显示字幕"),
    fontFamily: z.string().describe("字幕字体"),
    fontSize: z.number().describe("字幕字号"),
    fontColor: z.string().describe("字幕字体颜色"),
    fontWeight: z.boolean().describe("字幕是否加粗"),
    fontStyle: z.boolean().describe("字幕是否斜体"),
    textTranslateX: z.number().describe("字幕X偏移"),
    textTranslateY: z.number().describe("字幕Y偏移")
  }).describe("合成配置"),
  compositeList: z.array(z.unknown()).describe("合成列表"),
  sendQrcodeX: z.number().describe("二维码X偏移"),
  sendQrcodeY: z.number().describe("二维码Y偏移"),
  sendQrcodeSize: z.number().describe("二维码大小"),
  sendCaptionsStaleTimer: z.number().describe("字幕过期计时(秒)"),
  sendInputX: z.number().describe("输入框X偏移"),
  sendInputY: z.number().describe("输入框Y偏移"),
  sendInputFontFamily: z.string().describe("输入框字体"),
  sendInputFontSize: z.number().describe("输入框字号"),
  sendInputFontColor: z.string().describe("输入框字体颜色"),
  sendInputAskTitle: z.string().describe("输入框提示标题"),
  sendInputAskWords: z.string().describe("输入框推荐问题"),
  sendQrcodeUrl: z.string().describe("二维码链接地址"),
  sendDialogX: z.number().describe("对话框X偏移"),
  sendDialogY: z.number().describe("对话框Y偏移"),
  sendDialogW: z.number().describe("对话框宽度"),
  sendDialogH: z.number().describe("对话框高度"),
  sendDialogBgImage: z.string().describe("对话框背景图片"),
  sendDialogBgColor: z.string().describe("对话框背景颜色"),
  sendDialogBgType: z.string().describe("对话框背景类型(image/color)"),
  sendDialogFontFamily: z.string().describe("对话框字体"),
  sendDialogFontSize: z.number().describe("对话框字号"),
  sendDialogFontColor: z.string().describe("对话框字体颜色"),
  sendDialogFontBgColorL: z.string().describe("左侧消息背景颜色"),
  sendDialogFontBgColorR: z.string().describe("右侧消息背景颜色"),
  sendDialogHeadBgImageL: z.string().describe("左侧头像图片"),
  sendDialogHeadBgImageR: z.string().describe("右侧头像图片"),
  analysisDialogWidth: z.number().describe("分析面板宽度"),
  analysisDialogHeight: z.number().describe("分析面板高度"),
  analysisDialogMoveX: z.number().describe("分析面板X偏移"),
  analysisDialogMoveY: z.number().describe("分析面板Y偏移"),
  analysisDialogBgType: z.string().describe("分析面板背景类型(color/image)"),
  analysisDialogBgImage: z.string().describe("分析面板背景图片"),
  analysisDialogBgColor: z.string().describe("分析面板背景颜色"),
  analysisFontFamily: z.string().describe("分析面板字体"),
  analysisFontSize: z.number().describe("分析面板字号"),
  analysisFontColor: z.string().describe("分析面板字体颜色"),
  wakeWord: z.string().describe("唤醒词"),
  asrUrl: z.string().describe("语音识别服务地址"),
  asrType: z.string().describe("语音识别类型"),
  baiduASRAppid: z.unknown().describe("百度语音AppID"),
  baiduASRAppKey: z.string().describe("百度语音AppKey"),
  baiduASRUrl: z.string().describe("百度语音服务地址"),
  showAnalysis: z.boolean().describe("是否显示分析面板")
});

export type ftDigitalHumanOption = z.infer<typeof swDigitalHumanOptionSchema>;
