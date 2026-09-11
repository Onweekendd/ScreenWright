# ft-panel (动态面板) 配置说明

基于配置文件：`systemGlobal/ftPanelGlobal.vue` / `systemTransform/ftPanelTransform.vue` / `systemFrostedGlass/ftPanelFrostedGlass.vue` / `systemGlobal/components/CustomPositionConfig.vue`

## dataChart 数据格式

动态面板为容器组件，不绑定数据。`template` 为空数组，无需配置 dataChart。面板的内容通过其 `panelStatus` 和 `panelData` 管理各状态下的子组件。

---

## option 完整字段参考

### 全局配置（ftPanelGlobal.vue）

| 字段 | 类型 | 说明 |
|------|------|------|
| enableScroll | boolean | 是否允许内容溢出滚动 |
| gestureSliding | boolean | 是否开启手势滑动切换状态 |
| rotationShow | boolean | 是否开启状态轮播 |
| rotationType | `'' \| 'normal' \| 'card'` | 轮播类型：`''` 一般模式 / `'normal'` 常态模式 / `'card'` 卡片模式 |
| autoRotation | boolean | 是否自动轮播 |
| timingFunction | number | 轮播间隔时长（秒），默认 5 |
| animationType | `'none' \| 'opacity'` | 状态切换动画：无 / 渐隐渐现（仅一般模式） |
| arrowShow | boolean | 是否显示轮播箭头图标（仅一般模式） |
| imgLeft | string | 左箭头图标路径（arrowShow 为 true 时生效） |
| imgRight | string | 右箭头图标路径（arrowShow 为 true 时生效） |
| arrowWidth | number | 箭头图标宽度（px） |
| arrowHeight | number | 箭头图标高度（px） |
| enableHorizontalScroll | boolean | 是否开启内容滚动（仅一般模式 rotationType=''） |
| horizontalScrollDirection | `'scrollLeft' \| 'scrollRight' \| 'scrollUp' \| 'scrollDown'` | 内容滚动方向 |
| horizontalScrollSpeed | number | 内容滚动速度（秒） |
| isCard3Show | boolean | 卡片模式下其他卡片是否默认隐藏（仅卡片模式） |
| card1TranslateX | number | 中间卡片 X 偏移（px，仅卡片模式） |
| card1TranslateY | number | 中间卡片 Y 偏移（px，仅卡片模式） |
| card1ScaleX | number | 中间卡片 X 缩放 |
| card1ScaleY | number | 中间卡片 Y 缩放 |
| card1Opacity | number | 中间卡片透明度（0~1） |
| card2TranslateX | number | 两侧卡片 X 偏移（px，仅卡片模式） |
| card2TranslateY | number | 两侧卡片 Y 偏移（px，仅卡片模式） |
| card2ScaleX | number | 两侧卡片 X 缩放 |
| card2ScaleY | number | 两侧卡片 Y 缩放 |
| card2Opacity | number | 两侧卡片透明度，默认 0.25 |
| card3TranslateX | number | 其他卡片 X 偏移（px，仅卡片模式） |
| card3TranslateY | number | 其他卡片 Y 偏移（px，仅卡片模式） |
| card3ScaleX | number | 其他卡片 X 缩放 |
| card3ScaleY | number | 其他卡片 Y 缩放 |
| card3Opacity | number | 其他卡片透明度，默认 0.1 |
| isSwitchStatusReload | boolean | 切换状态时是否重新初始化子组件数据 |
| isPreLoad | boolean | 是否预加载所有状态（默认 true） |
| display | boolean | 是否显示（运行时控制） |

### 自定义位置配置（CustomPositionConfig.vue）

| 字段 | 类型 | 说明 |
|------|------|------|
| customPosition | boolean | 启用自定义位置，启用后以此配置为优先 |
| customPositionType | `'toLeft' \| 'toRight' \| 'toCenter' \| 'toCenterTop' \| 'toCenterBottom' \| 'toCustom'` | 位置类型 |
| customPositionX | number | 自定义 X 位置（%，仅 toCustom） |
| customPositionY | number | 自定义 Y 位置（%，仅 toCustom） |
| customPositionLeft | number | 靠左位置（%，仅 toLeft） |
| customPositionRight | number | 靠右位置（%，仅 toRight） |
| customPositionTop | number | 居中靠上偏移（%，仅 toCenterTop/toCenterBottom） |
| customPositionBottom | number | 居中靠下偏移（%，仅 toCenterBottom） |

### 变换配置（ftPanelTransform.vue）

| 字段 | 类型 | 说明 |
|------|------|------|
| transform | boolean | 是否启用变换 |
| perspective | number | 透视距离（px） |
| originGrid | `{ left: string, top: string }` | 视点位置 |
| rotateX | number | 绕 X 轴旋转（°），范围 -180 ~ 180 |
| rotateY | number | 绕 Y 轴旋转（°），范围 -180 ~ 180 |
| rotateZ | number | 绕 Z 轴旋转（°），范围 -180 ~ 180 |
| skewX | number | X 方向斜切（°），范围 -90 ~ 90 |
| skewY | number | Y 方向斜切（°），范围 -90 ~ 90 |
| scaleX | number | X 轴缩放（%） |
| scaleY | number | Y 轴缩放（%） |
| translateX | number | X 轴平移（px） |
| translateY | number | Y 轴平移（px） |
| translateZ | number | Z 轴平移（px） |
| originX | number | 变换原点 X（%） |
| originY | number | 变换原点 Y（%） |

### 毛玻璃配置（ftPanelFrostedGlass.vue）

| 字段 | 类型 | 说明 |
|------|------|------|
| backdropFilter | boolean | 启用毛玻璃效果 |
| backdropFilterBlur | number | 高斯模糊半径（px），默认 4 |
| backdropFilterSaturate | number | 饱和度（%），范围 100 ~ 300 |

---

## 常用配置示例

### 普通静态面板（无轮播）

```json
{
  "isPreLoad": true,
  "enableScroll": false,
  "rotationShow": false,
  "isSwitchStatusReload": false,
  "customPosition": false,
  "customPositionType": "toCenter",
  "backdropFilter": false
}
```

### 自动轮播面板（一般模式）

```json
{
  "rotationShow": true,
  "rotationType": "",
  "autoRotation": true,
  "timingFunction": 3,
  "animationType": "opacity",
  "arrowShow": false
}
```

### 卡片轮播面板

```json
{
  "rotationShow": true,
  "rotationType": "card",
  "autoRotation": true,
  "timingFunction": 5,
  "isCard3Show": true,
  "card1TranslateX": 0, "card1TranslateY": 0, "card1ScaleX": 1, "card1ScaleY": 1, "card1Opacity": 1,
  "card2TranslateX": 200, "card2TranslateY": 0, "card2ScaleX": 0.8, "card2ScaleY": 0.8, "card2Opacity": 0.25,
  "card3TranslateX": 300, "card3TranslateY": 0, "card3ScaleX": 0.6, "card3ScaleY": 0.6, "card3Opacity": 0.1
}
```

### 弹窗面板（居中弹出）

```json
{
  "customPosition": true,
  "customPositionType": "toCenter",
  "isPreLoad": false,
  "enableScroll": false
}
```
