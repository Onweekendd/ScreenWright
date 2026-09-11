# 动态面板 Hooks 模块

本目录包含了动态面板功能的所有子模块，通过模块化设计实现职责分离和代码复用。

## 📁 模块结构

```
hooks/
├── index.ts                      # 统一导出入口
├── useStateManagement.ts         # 状态管理模块
├── useStatusSwitch.ts            # 状态切换模块
├── useStyles.ts                  # 样式计算模块
├── useRotation.ts                # 轮播和自动播放模块
├── useCardProperty.ts            # 卡片属性管理模块
├── useGesture.ts                 # 手势处理模块
├── useDynamicPanelProvide.ts     # Provide/Inject 功能模块
└── README.md                     # 本文档
```

## 🎯 模块职责

### 1. useStateManagement
**职责**: 动态面板状态管理

**主要功能**:
- 状态克隆和恢复
- 状态切换时的重载逻辑处理
- 退出动画的执行和管理
- `changeStatus` 核心功能实现

**导出内容**:
- `clonedPanelStates`: 克隆的面板状态列表
- `changeStatus`: 切换面板状态
- `initStateManagement`: 初始化状态管理

### 2. useStatusSwitch
**职责**: 上一个/下一个状态切换

**主要功能**:
- 上一个状态切换 (`toPrevStatus`)
- 下一个状态切换 (`toNextStatus`)
- 循环切换支持（边界处理）
- 不透明度动画应用

**导出内容**:
- `switchStatus`: 切换到上一个或下一个状态
- `toPrevStatus`: 切换到上一个状态
- `toNextStatus`: 切换到下一个状态

### 3. useStyles
**职责**: 样式计算和管理

**主要功能**:
- 当前激活状态计算
- 箭头样式计算
- 3D 透视和变换样式计算
- 背景样式计算
- 面板样式计算

**导出内容**:
- `activeStatus`: 当前激活的面板状态
- `arrowContainStyle`: 箭头容器样式
- `arrowLStyle`: 左侧箭头样式
- `arrowRStyle`: 右侧箭头样式
- `setPerspective`: 3D 透视样式
- `setTranslate3d`: 3D 变换样式
- `bgStyle`: 背景样式
- `panelStyle`: 面板样式

### 4. useRotation
**职责**: 轮播和自动播放功能

**主要功能**:
- 卡片轮播切换
- 自动播放启动/停止
- 轮播方向控制
- 定时器管理

**导出内容**:
- `currentIdx`: 当前卡片索引
- `autoPlay`: 是否自动播放
- `handleSwitch`: 卡片轮播切换
- `startAutoPlay`: 启动自动播放
- `stopAutoPlay`: 停止自动播放
- `restartAutoPlay`: 重启自动播放

### 5. useCardProperty
**职责**: 卡片属性管理

**主要功能**:
- 卡片 CSS 变量设置
- 位移、缩放、透明度属性管理
- 卡片模式和普通模式的属性处理
- 动画样式设置

**导出内容**:
- `setAniStyle`: 设置卡片动画样式
- `updateProperty`: 更新卡片属性

### 6. useGesture
**职责**: 手势滑动处理

**主要功能**:
- 默认模式手势滑动
- 卡片模式手势滑动
- 手势事件绑定和清理
- 滑动方向判断和处理

**导出内容**:
- `defaultTouchFun`: 默认视图手势函数引用
- `cardTouchFun`: 卡片视图手势函数引用
- `setupTouchEvents`: 设置手势滑动
- `cleanupTouchEvents`: 清理手势事件

### 7. useDynamicPanelProvide
**职责**: Provide/Inject 功能

**主要功能**:
- 父子组件状态共享
- 状态 ID 注入和提供
- 变更键管理（用于触发子组件刷新）

**导出内容**:
- `parentIds`: 父级面板 IDs
- `injectParentActiveStatusIds`: 注入的父级状态 IDs
- `currentActiveStatusId`: 当前激活状态 ID
- `provideValue`: 提供给子组件的值
- `changeKey`: 变更键

## 🔄 模块依赖关系

```
useDynamicPanel (主入口)
    ├── useStateManagement (状态管理)
    │   └── 无外部依赖
    │
    ├── useStyles (样式计算)
    │   └── 无外部依赖
    │
    ├── useStatusSwitch (状态切换)
    │   ├── 依赖: useStateManagement.changeStatus
    │   └── 依赖: rotationType
    │
    ├── useRotation (轮播)
    │   ├── 依赖: useStatusSwitch.switchStatus
    │   └── 依赖: rotationType
    │
    ├── useCardProperty (卡片属性)
    │   └── 依赖: rotationType
    │
    ├── useGesture (手势处理)
    │   ├── 依赖: useStatusSwitch.switchStatus
    │   ├── 依赖: useRotation.handleSwitch
    │   └── 依赖: rotationType
    │
    └── useDynamicPanelProvide (Provide/Inject)
        └── 无外部依赖
```

## 📖 使用示例

### 在主 Hook 中使用

```typescript
import {
  useStateManagement,
  useStatusSwitch,
  useStyles,
  useRotation,
  useCardProperty,
  useGesture,
  useDynamicPanelProvide
} from './hooks'

export function useDynamicPanel(params) {
  // 1. 初始化基础模块
  const stateManagement = useStateManagement({ ... })
  const styles = useStyles({ ... })
  
  // 2. 初始化依赖模块
  const statusSwitch = useStatusSwitch({
    changeStatus: stateManagement.changeStatus,
    ...
  })
  
  // 3. 返回组合后的功能
  return {
    ...stateManagement,
    ...styles,
    ...statusSwitch,
    ...
  }
}
```

### 单独使用某个模块

```typescript
import { useStyles } from './hooks/useStyles'

// 只使用样式计算功能
const { arrowLStyle, arrowRStyle, bgStyle } = useStyles({
  dynamicPanel,
  instance,
  isBuild
})
```

## 🎨 设计原则

1. **单一职责**: 每个 Hook 只负责一个特定领域的功能
2. **低耦合**: 模块间通过参数传递依赖，避免直接引用
3. **高内聚**: 相关功能集中在同一模块内
4. **可测试**: 每个模块都可以独立测试
5. **可复用**: 模块可以在不同场景中复用

## 🔧 重构说明

本次重构将原来 800+ 行的 `useDynamicPanel.ts` 拆分为 7 个功能模块：

### 重构前的问题
- ❌ 文件过大，难以维护
- ❌ 职责混乱，耦合度高
- ❌ 复杂的条件判断难以理解
- ❌ 难以进行单元测试

### 重构后的优势
- ✅ 模块化清晰，易于维护
- ✅ 职责明确，每个函数都有清晰的 JSDoc 注释
- ✅ 复杂逻辑被拆分成小函数，可读性强
- ✅ 每个模块可独立测试和复用

## 📝 代码规范

所有模块都遵循以下规范：

1. **函数命名**: 使用动词开头，语义清晰
2. **JSDoc 注释**: 每个导出函数都有完整的文档注释
3. **类型定义**: 所有参数和返回值都有明确的类型
4. **错误处理**: 适当的错误验证和抛出
5. **代码格式**: 统一的代码风格

## 🚀 后续优化建议

1. 为每个模块添加单元测试
2. 提取公共类型定义到独立的 `types.ts` 文件
3. 考虑使用 Composition API 的 `setup` 语法糖
4. 添加性能监控和优化
5. 完善错误处理和边界情况

## 📞 维护联系

如有问题或建议，请联系开发团队。