# 行为配置字段映射

确定 `action.action` 类型后，查阅对应的参考文件了解需要填写的配置字段：

| action 值 | 参考文件 | 说明 |
|-----------|---------|------|
| `show` / `hide` / `show/hide` | [action/show-hide.md](action/show-hide.md) | 显示 / 隐藏 / 显隐切换 |
| `moving` | [action/moving.md](action/moving.md) | 移动到指定坐标 |
| `scaling` / `scalingHide` | [action/scaling.md](action/scaling.md) | 缩放 / 缩放隐藏 |
| `switchState` | [action/switch-state.md](action/switch-state.md) | 切换动态面板状态 |
| `toPrevStatus` / `toNextStatus` | [action/prev-next-status.md](action/prev-next-status.md) | 上一个 / 下一个状态 |
| `SwitchFlyingScreenTheme` | [action/flying-screen-theme.md](action/flying-screen-theme.md) | 切换飞屏主题 |
| `switchSceneStatus` | [action/scene-status.md](action/scene-status.md) | 切换场景状态 |
| `switchSceneLevel` | [action/scene-level.md](action/scene-level.md) | 切换场景关卡 |
| `switchSceneObjVisible` | [action/scene-obj-visible.md](action/scene-obj-visible.md) | 切换场景对象显隐 |
| `handleSceneObjExplosion` | [action/scene-obj-explosion.md](action/scene-obj-explosion.md) | 场景对象爆炸动画 |
| `switchSceneChildComponentVisible` | [action/scene-child-component.md](action/scene-child-component.md) | 切换场景子组件显隐 |
| `switchMapChildComponentVisible` | [action/map-child-component.md](action/map-child-component.md) | 切换地图子组件显隐 |
| `handleApiInstruction` | [action/api-instruction.md](action/api-instruction.md) | API 指令集 |
| `setAnimationPlay` / `setAnimationPause` | [action/animation-play-pause.md](action/animation-play-pause.md) | 播放 / 暂停关键帧动画 |
| `setStateAnimationPlay` | [action/state-animation-play.md](action/state-animation-play.md) | 播放状态动画 |
| `followIcon` / `focusLayer` | [action/follow-focus.md](action/follow-focus.md) | 跟随图标 / 聚焦倾斜部件 |
| `videoToPlay` / `videoToPause` / `videoToStop` / `videoToRestart` / `videoToFullscreen` / `videoToUnmuted` / `videoToMuted` / `videoToAudioUp` / `videoToAudioDown` / `videoToFastin` / `videoToRewind` | [action/video-controls.md](action/video-controls.md) | 视频控制类 |
| `videoToPlayRange` | [action/video-play-range.md](action/video-play-range.md) | 视频播放区间 |
| `setIndex` | [action/set-index.md](action/set-index.md) | 设置选中项索引 |
| `swiperCardChangeIndex` | [action/swiper-card.md](action/swiper-card.md) | 设置轮播选中页 |
| `updateConfig` | [action/update-config.md](action/update-config.md) | 更新组件配置 |
| `sendUe4Msg` / `sendUe4MsgStatic` | [action/ue4.md](action/ue4.md) | 向 UE4 发送消息 |
| `sendAIManMsgStatic` | [action/ai-man.md](action/ai-man.md) | 向数字人发送消息 |
| `jumpPage` | [action/jump-page.md](action/jump-page.md) | 跳转页码 |
| `prevPage` / `nextPage` | [action/prev-next-page.md](action/prev-next-page.md) | 上一页 / 下一页 |
| `onExport` / `onClear` / `onRedo` / `onUndo` / `signature` | [action/signature-pad.md](action/signature-pad.md) | 签名板操作 |
| `turnOnPatrol` / `pausePatrol` / `restartPatrol` | [action/patrol.md](action/patrol.md) | 轮巡控制 |
| `convertTranslation` | [action/translation.md](action/translation.md) | 译文转换 |

## 其他参考文件

| 文件 | 何时读取 |
|------|---------|
| [event-types.md](event-types.md) | 需要了解某个触发类型的含义时（主要发现靠 listAvailableEvents） |
| [action-types.md](action-types.md) | 需要了解某个行为类型的含义时（主要发现靠 listAvailableActions） |
| [action/common-animation.md](action/common-animation.md) | 大多数行为共用的 `animation` 字段说明 |
