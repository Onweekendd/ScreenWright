# ft-folder (分组) 配置说明

基于配置文件：`systemTransform/ftPanelTransform.vue` / `frostedGlassConfig/index.vue`

## dataChart 数据格式

分组为纯容器组件，不绑定数据。`template` 为空数组，无需配置 dataChart。

---

## option 完整字段参考

> 分组没有专用全局配置面板，仅包含变换（Transform）和毛玻璃效果两组通用配置。

### 变换配置

| 字段 | 类型 | 说明 |
|------|------|------|
| perspective | number | 透视距离（px），0 为无透视 |
| originGrid | `{ left: string, top: string }` | 视点位置，如 `{ left: 'center', top: 'center' }` |
| rotateX | number | 绕 X 轴旋转（°），范围 -180 ~ 180 |
| rotateY | number | 绕 Y 轴旋转（°），范围 -180 ~ 180 |
| rotateZ | number | 绕 Z 轴旋转（°），范围 -180 ~ 180 |
| skewX | number | X 方向斜切（°），范围 -90 ~ 90 |
| skewY | number | Y 方向斜切（°），范围 -90 ~ 90 |
| scaleX | number | X 轴缩放（%），默认 100 |
| scaleY | number | Y 轴缩放（%），默认 100 |
| translateX | number | X 轴平移（px） |
| translateY | number | Y 轴平移（px） |
| translateZ | number | Z 轴平移（px） |
| transform | boolean | 是否启用变换，false 时以上变换字段不生效 |

### 毛玻璃配置

| 字段 | 类型 | 说明 |
|------|------|------|
| backdropFilter | boolean | 启用毛玻璃效果，背后元素被模糊处理 |
| backdropFilterBlur | number | 高斯模糊半径（px），默认 4 |
| backdropFilterSaturate | number | 饱和度（%），范围 100 ~ 300，默认 100 |

---

## 常用配置示例

### 默认（无变换）

```json
{
  "transform": false,
  "perspective": 0,
  "originGrid": { "left": "center", "top": "center" },
  "rotateX": 0, "rotateY": 0, "rotateZ": 0,
  "skewX": 0, "skewY": 0,
  "scaleX": 100, "scaleY": 100,
  "translateX": 0, "translateY": 0, "translateZ": 0,
  "backdropFilter": false,
  "backdropFilterBlur": 4,
  "backdropFilterSaturate": 100
}
```
