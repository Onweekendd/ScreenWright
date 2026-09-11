# ftImg 自定义动画帧说明

本文说明 `ftImg` 组件中“自定义关键帧动画”的数据结构、执行流程与注意事项，基于当前实现文件：

- `apps/app/src/components/ScreenwrightMedia/components/ftImg/index.vue`

## 1. 功能目标

当 `option.animationType === "customize"` 时，不再走预置 `@keyframes`（如 `opacity/zoom/...`），而是读取 `option.customizeArray`，把每一帧转换成图片元素（`<img ref="imageRef">`）的局部动画执行。

关键点：

- 不向 `document.head` 注入全局样式
- 仅作用于当前组件实例的 `imageRef`
- 支持循环、延时、间隔、结束隐藏

---

## 2. 关键帧数据结构

每一项帧数据（`CustomizeAnimationFrame`）：

- `name`: 帧名称（例如 `帧1`）
- `keyFrameTime`: 时间轴百分比（`0 ~ 100`）
- `keyFrameOpacity`: 透明度（支持 `0~1`，若传 `0~100` 会自动归一化）
- `keyFrameSpeed`: 当前帧速度曲线（可选，空则用全局速度）
- `showKeyFrameRotate`: 是否启用旋转
- `keyFrameRotateX/Y/Z`: 旋转角度（deg）
- `showKeyFrameScale`: 是否启用缩放
- `keyFrameScaleX/Y`: 缩放百分比（100 表示 1）
- `showKeyFrameTranslate`: 是否启用平移
- `keyFrameTranslateX/Y`: 平移像素（px）

建议：

- 至少配置两帧（`0` 和 `100`）
- 帧内数值尽量完整，避免视觉跳变

---

## 3. 执行流程（当前代码）

## 3.1 入口

`updateChart()` 内根据 `option.animationType` 分支：

- 非 `customize`：走原有 CSS `animation` 字符串逻辑
- `customize`：调用 `setCustomizeAnimation(animationSpeed, speedNum)`

## 3.2 数据标准化

`normalizeCustomizeFrames()` 做了三件事：

1. 从 `option.customizeArray` 读取帧列表
2. 对时间、透明度、旋转、缩放、平移做数值归一
3. 按 `keyFrameTime` 升序排序

## 3.3 帧转 Keyframes

`buildCustomizeKeyframes()` 将每帧映射为浏览器动画帧对象：

- `offset = keyFrameTime / 100`
- `opacity = keyFrameOpacity`
- `transform = buildCustomizeTransform(frame)`
- 若配置了 `keyFrameSpeed`，会写入帧级 `easing`

`buildCustomizeTransform(frame)` 会按开关拼接：

- translate(...)
- rotateX/rotateY/rotateZ(...)
- scale(x, y)

## 3.4 播放方式

`setCustomizeAnimation()` 通过 `imageRef.value.animate(keyframes, options)` 播放：

- `duration = option.animationTime * 1000`
- `easing = 全局速度曲线`
- `fill = "forwards"`
- `iterations = 1`（循环由外层逻辑调度）

播放结束后在 `onfinish` 中处理：

- 非循环：可按 `animationendHidden` 隐藏组件
- 循环：等待 `animationInterval` 后重新按 `animationDelayed` 启动下一轮

---

## 4. 与预置动画的关系

预置动画与自定义动画互斥：

- 切到预置动画：会调用 `clearCustomizeAnimation()`，取消自定义播放器
- 切到自定义动画：只驱动 `imageRef` 局部动画，不污染全局

---

## 5. 监听更新策略（已优化）

没有使用 deep watch 全量监听 `option`。  
改为 `animationWatchSignature`（computed + JSON 签名）监听关键字段：

- `animationShow`
- `animationLoop`
- `animationendHidden`
- `animationSpeed`
- `animationSpeedNum`
- `animationTime`
- `animationDelayed`
- `animationInterval`
- `animationType`
- `customizeArray`

一旦这些字段变化，触发 `updateChart()`。

---

## 6. 清理与防污染机制

`clearCustomizeAnimation()`：

- `cancel()` 当前 `Animation` 实例
- 置空播放器引用
- 递增 `customizeRunId`，让旧异步回调失效

生命周期：

- `onMounted` 初始化动画
- `onBeforeUnmount` 清理 `timer` 与自定义动画播放器

---

## 7. 常见问题

### 7.1 为什么有时候看起来“没播”？

- `customizeArray` 为空
- `imageRef` 未挂载
- `animationTime` 为 0（代码中最小保护为 1ms，但视觉上近似瞬时）

### 7.2 透明度填 50 是 0.5 还是 50？

都支持。`normalizeOpacity()` 会把大于 1 的值按百分比转换（`50 -> 0.5`）。

### 7.3 帧顺序乱了怎么办？

代码会按 `keyFrameTime` 自动排序，但建议面板端保存前也做一次排序与去重校验。

---

## 8. 使用建议

1. 帧时间尽量稀疏、语义清晰（例如 `0/25/50/75/100`）
2. 关键属性（透明度/旋转/缩放/平移）每帧尽量显式配置
3. 高频拖拽编辑场景建议在面板侧做节流，减少重建动画次数

