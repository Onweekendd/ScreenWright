# FunBI 事件触发类型参考

当需要确认或选择 `Event.trigger` 字段的值时读取本文件。

## 完整 EventTypeEnum 列表

```json
[
  {
    "value": "dataChange",
    "label": "当请求完成或数据变化时",
    "note": "组件自身数据更新时触发，适用于大多数数据展示组件"
  },
  {
    "value": "change",
    "label": "文件内容改变时",
    "note": "仅适用于搜索框组件 ft-search"
  },
  {
    "value": "click",
    "label": "鼠标点击",
    "note": "点击图表、交互组件等触发；在下拉/图例等组件中表示「选中值改变」"
  },
  {
    "value": "contextmenuClick",
    "label": "鼠标右键单击",
    "note": "仅适用于 ft-mutual 互动组件"
  },
  {
    "value": "ended",
    "label": "视频播放结束",
    "note": "仅适用于 ft-video、ft-open-video"
  },
  {
    "value": "mouseEnter",
    "label": "鼠标移入",
    "note": "适用于 subtabs、multiSubtabs、rollSubtabs、ft-mutual、ft-customselect"
  },
  {
    "value": "mouseLeave",
    "label": "鼠标移出",
    "note": "适用于 subtabs、multiSubtabs、rollSubtabs、ft-mutual、ft-customselect"
  },
  {
    "value": "ueToFunEvent",
    "label": "接收到UE信息时",
    "note": "仅适用于 ue-vessel 子组件 UeMessageReceiver"
  },
  {
    "value": "projectToFunEvent",
    "label": "接收项目模板信息时",
    "note": "预留，暂无组件"
  },
  {
    "value": "modelClick",
    "label": "鼠标点击对象",
    "note": "3D 场景（threescene / industryscene / maptalks）中点击模型对象"
  },
  {
    "value": "layerClick",
    "label": "鼠标点击图层",
    "note": "地图场景中点击图层（maptalks）"
  },
  {
    "value": "vectorClick",
    "label": "鼠标点击矢量图层",
    "note": "仅适用于 maptalks"
  },
  {
    "value": "3DTilesClick",
    "label": "鼠标点击倾斜摄影",
    "note": "仅适用于 maptalks"
  },
  {
    "value": "multiplyModelClick",
    "label": "鼠标点击模型（批量识别）",
    "note": "适用于 threescene / industryscene，点击时通过关键词批量识别模型"
  },
  {
    "value": "multiplyIconClick",
    "label": "鼠标点击图标（批量识别）",
    "note": "适用于 threescene / industryscene，点击图标批量识别"
  },
  {
    "value": "childComponentClick",
    "label": "鼠标点击子组件",
    "note": "适用于 threeSceneIconList / threeSceneTwinIconList / threeSceneTwinPanelIconList / threeMapMapGlIcon"
  },
  {
    "value": "afterSceneInit",
    "label": "场景初始化结束",
    "note": "适用于 threescene / industryscene，场景加载完成后触发"
  },
  {
    "value": "afterUpdateState",
    "label": "场景切换状态结束",
    "note": "适用于 threescene / industryscene，状态切换动画完成后触发"
  },
  {
    "value": "modelNodeClick",
    "label": "鼠标点击模型子节点",
    "note": "适用于 threescene / industryscene，点击模型内部子节点"
  },
  {
    "value": "controls",
    "label": "视频控制（未知事件）",
    "note": "仅适用于 ft-video"
  },
  {
    "value": "signatureSubmit",
    "label": "签名提交",
    "note": "仅适用于 ft-signature-pad"
  },
  {
    "value": "videocontrols",
    "label": "视频控制",
    "note": "仅适用于 ft-video"
  },
  {
    "value": "cardDropEnd",
    "label": "卡片滑落结束",
    "note": "仅适用于 verticalCard"
  },
  {
    "value": "cardBeforeExpand",
    "label": "卡片开始展开前",
    "note": "仅适用于 verticalCard"
  },
  {
    "value": "cardEndExpand",
    "label": "卡片展开结束",
    "note": "仅适用于 verticalCard"
  },
  {
    "value": "cardStartCollapse",
    "label": "卡片开始收缩",
    "note": "仅适用于 verticalCard"
  },
  {
    "value": "cardEndCollapse",
    "label": "卡片收缩结束",
    "note": "仅适用于 verticalCard"
  },
  {
    "value": "scrollEnd",
    "label": "滚动结束",
    "note": "仅适用于 dynamicPanel"
  }
]
```

## 注意事项

- 使用 `listAvailableEvents` 工具查询指定组件（prop）支持哪些触发类型
- 若工具返回列表不包含用户期望的触发类型，终止流程并告知用户
- `click` 事件在下拉选择、图例等交互组件中语义为"选中值改变"，而非字面意义的鼠标点击
