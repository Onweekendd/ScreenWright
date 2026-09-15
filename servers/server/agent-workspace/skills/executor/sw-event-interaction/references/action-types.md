# FunBI 行为类型参考

当需要确认或选择 `Action.action` 字段的值时读取本文件。

## 完整 ActionTypeEnum 列表

```json
[
  { "value": "show",                             "label": "显示",               "group": "显隐" },
  { "value": "hide",                             "label": "隐藏",               "group": "显隐" },
  { "value": "show/hide",                        "label": "显隐切换",           "group": "显隐" },
  { "value": "moving",                           "label": "移动",               "group": "变换" },
  { "value": "scaling",                          "label": "缩放",               "group": "变换" },
  { "value": "scalingHide",                      "label": "缩放隐藏",           "group": "变换" },
  { "value": "SwitchFlyingScreenTheme",          "label": "切换飞屏主题",       "group": "页面" },
  { "value": "updateConfig",                     "label": "更新组件配置",       "group": "数据" },
  { "value": "updateParams",                     "label": "更新组件数据",       "group": "数据" },
  { "value": "switchState",                      "label": "切换组件状态",       "group": "状态" },
  { "value": "switchTCState",                    "label": "切换终端状态",       "group": "状态" },
  { "value": "switchSceneStatus",                "label": "切换场景状态",       "group": "3D场景" },
  { "value": "switchSceneLevel",                 "label": "切换场景关卡",       "group": "3D场景" },
  { "value": "switchSceneObjVisible",            "label": "切换场景对象显隐",   "group": "3D场景" },
  { "value": "handleSceneObjExplosion",          "label": "场景对象爆炸动画",   "group": "3D场景" },
  { "value": "switchSceneChildComponentVisible", "label": "切换场景子组件显隐", "group": "3D场景" },
  { "value": "switchMapChildComponentVisible",   "label": "切换地图子组件显隐", "group": "地图" },
  { "value": "handleApiInstruction",             "label": "Api指令集",          "group": "3D场景" },
  { "value": "setAnimationPlay",                 "label": "播放关键帧动画",     "group": "3D动画" },
  { "value": "setAnimationPause",                "label": "暂停关键帧动画",     "group": "3D动画" },
  { "value": "setStateAnimationPlay",            "label": "播放状态动画",       "group": "3D动画" },
  { "value": "setIndex",                         "label": "设置选中项",         "group": "交互" },
  { "value": "followIcon",                       "label": "跟随图标",           "group": "3D场景" },
  { "value": "focusLayer",                       "label": "聚焦倾斜部件",       "group": "地图" },
  { "value": "sendUe4Msg",                       "label": "向ue发送消息(动态)", "group": "UE4" },
  { "value": "sendUe4MsgStatic",                 "label": "向ue发送消息(静态)", "group": "UE4" },
  { "value": "videoToPlay",                      "label": "视频播放",           "group": "视频" },
  { "value": "videoToPause",                     "label": "视频暂停",           "group": "视频" },
  { "value": "videoToStop",                      "label": "视频停止",           "group": "视频" },
  { "value": "videoToRestart",                   "label": "视频重播",           "group": "视频" },
  { "value": "videoToFullscreen",                "label": "视频全屏",           "group": "视频" },
  { "value": "videoToSwitch",                    "label": "切换视频",           "group": "视频" },
  { "value": "videoToUnmuted",                   "label": "视频声音开",         "group": "视频" },
  { "value": "videoToMuted",                     "label": "视频声音关",         "group": "视频" },
  { "value": "videoToAudioUp",                   "label": "视频音量+",          "group": "视频" },
  { "value": "videoToAudioDown",                 "label": "视频音量-",          "group": "视频" },
  { "value": "videoToFastin",                    "label": "视频快进",           "group": "视频" },
  { "value": "videoToRewind",                    "label": "视频快退",           "group": "视频" },
  { "value": "videoToPlayRange",                 "label": "视频播放区间",       "group": "视频" },
  { "value": "sendAIManMsgStatic",               "label": "向数字人发送消息",   "group": "AI" },
  { "value": "swiperCardChangeIndex",            "label": "设置轮播选中页",     "group": "展示" },
  { "value": "projectSpecificFun",               "label": "项目特有Api指令",    "group": "项目" },
  { "value": "voiceControlStart",               "label": "麦克风开始",          "group": "语音" },
  { "value": "voiceControlStop",                "label": "麦克风结束",          "group": "语音" },
  { "value": "prevPage",                         "label": "上一页",             "group": "分页" },
  { "value": "nextPage",                         "label": "下一页",             "group": "分页" },
  { "value": "turnOnPatrol",                     "label": "轮巡开启",           "group": "轮巡" },
  { "value": "pausePatrol",                      "label": "轮巡暂停",           "group": "轮巡" },
  { "value": "restartPatrol",                    "label": "轮巡重启",           "group": "轮巡" },
  { "value": "toPrevStatus",                     "label": "上一个状态",         "group": "状态" },
  { "value": "toNextStatus",                     "label": "下一个状态",         "group": "状态" },
  { "value": "convertTranslation",               "label": "译文转换",           "group": "多语言" }
]
```

## 注意事项

- 使用 `listAvailableActions` 工具查询指定目标组件（prop）支持哪些行为
- 若工具返回列表不包含用户期望的行为，告知用户该组件不支持此行为
- `show`、`hide`、`show/hide` 适用于所有组件（通用行为）
- 视频相关行为仅适用于 `ft-video` 组件
