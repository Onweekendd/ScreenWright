# ftSwiperCard (轮播卡片) 配置说明

## dataChart 数据格式

数据为空数组，所有内容通过 option 中的 cardList 配置。

```typescript
type dataChart = never[];
```

**示例**：
```json
[]
```

---

## option 完整字段参考

总计 **3** 个顶层配置字段，但嵌套结构复杂。

### 全局配置 (globalConfig，20字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `cameraPositionX` | number | 100 | 摄像机X坐标 |
| `cameraPositionY` | number | 360 | 摄像机Y坐标 |
| `cameraPositionZ` | number | 1100 | 摄像机Z坐标 |
| `roateRadius` | number | 700 | 旋转半径 |
| `layoutMethod` | string | "horizontal" | 布局方式 |
| `transitionTime` | number | 2 | 过渡时间（秒） |
| `hoverPause` | boolean | true | 悬停是否暂停 |
| `autoPlay` | boolean | true | 是否自动播放 |
| `intervalTime` | number | 1 | 轮播间隔时间（秒） |
| `rotateDirection` | number | 1 | 旋转方向 |
| `perspective` | number | 1000 | 透视距离 |
| `cameraRotateX` | number | 0 | 摄像机X旋转角度 |
| `cameraRotateY` | number | 0 | 摄像机Y旋转角度 |
| `cameraRotateZ` | number | 0 | 摄像机Z旋转角度 |
| `controlBtnWidth` | number | 80 | 控制按钮宽度 |
| `controlBtnHeight` | number | 80 | 控制按钮高度 |
| `controlBtnShow` | boolean | true | 是否显示控制按钮 |
| `controlBtnRBg` | string | - | 右控制按钮背景图 |
| `controlBtnLBg` | string | - | 左控制按钮背景图 |
| `controlBtnOffsetLeftOrRight` | number | 10 | 控制按钮左右偏移 |
| `controlBtnOffsetTop` | number | 0 | 控制按钮上下偏移 |

### 卡片列表 (cardList，数组，每项4个基础字段 + 2个嵌套样式对象)

#### 卡片基础字段 (4字段)

| 字段 | 类型 | 说明 |
|------|------|------|
| `tabsName` | string | 卡片标签名 |
| `titleContent` | string | 标题内容 |
| `textContent` | string | 正文内容 |
| `backgroundImg` | string | 背景图片路径 |

#### 卡片样式配置 (defaultObj/activeObj，各28字段)

defaultObj 为默认状态样式，activeObj 为激活（当前选中）状态样式，字段结构相同：

| 字段 | 类型 | 默认值(default/active) | 说明 |
|------|------|------|------|
| `markOpacity` | number | 30 / 0 | 遮罩透明度 |
| `width` | number | 400 / 400 | 卡片宽度 |
| `height` | number | 700 / 700 | 卡片高度 |
| `titleShow` | boolean | true / true | 是否显示标题 |
| `titleWidth` | number | 200 / 200 | 标题宽度 |
| `titleHeight` | number | 100 / 100 | 标题高度 |
| `titleFontFamily` | string | - | 标题字体 |
| `titleFontSize` | number | 44 / 44 | 标题字号 |
| `titleLineHeight` | number | 40 / 40 | 标题行高 |
| `titleLetterSpacing` | number | 4 / 4 | 标题字间距 |
| `titleColor` | string | - | 标题颜色 |
| `titleFontStyle` | string | "normal" | 标题字体风格 |
| `titleFontWeight` | string | "normal" | 标题字体粗细 |
| `titleOffsetLeft` | number | 100 / 100 | 标题左边距 |
| `titleOffsetTop` | number | 580 / 580 | 标题上边距 |
| `textShow` | boolean | false / true | 是否显示正文 |
| `textWidth` | number | 300 / 300 | 正文宽度 |
| `textHeight` | number | 150 / 150 | 正文高度 |
| `textFontFamily` | string | - | 正文字体 |
| `textFontSize` | number | 20 / 20 | 正文字号 |
| `textLineHeight` | number | 30 / 30 | 正文行高 |
| `textLetterSpacing` | number | 2 / 2 | 正文字间距 |
| `textColor` | string | - | 正文颜色 |
| `textFontStyle` | string | "normal" | 正文字体风格 |
| `textFontWeight` | string | "normal" | 正文字体粗细 |
| `textOffsetLeft` | number | 50 / 50 | 正文左边距 |
| `textOffsetTop` | number | 100 / 100 | 正文上边距 |

### 刷新配置 (1字段)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `refresh` | boolean | true | 是否启用刷新 |

---

## 常用配置示例

### 基础3D卡片轮播
```json
{
  "globalConfig": {
    "layoutMethod": "horizontal",
    "autoPlay": true,
    "intervalTime": 3,
    "transitionTime": 2,
    "perspective": 1000,
    "roateRadius": 700,
    "controlBtnShow": true
  },
  "refresh": true
}
```

### 卡片激活时显示正文
```json
{
  "cardList": [
    {
      "tabsName": "卡片1",
      "titleContent": "标题",
      "textContent": "正文内容",
      "backgroundImg": "path/to/bg.webp",
      "defaultObj": {
        "markOpacity": 30,
        "titleShow": true,
        "textShow": false
      },
      "activeObj": {
        "markOpacity": 0,
        "titleShow": true,
        "textShow": true
      }
    }
  ]
}
```

### 调整摄像机视角
```json
{
  "globalConfig": {
    "cameraPositionX": 100,
    "cameraPositionY": 360,
    "cameraPositionZ": 1100,
    "cameraRotateX": 0,
    "cameraRotateY": 0,
    "cameraRotateZ": 0
  }
}
```
