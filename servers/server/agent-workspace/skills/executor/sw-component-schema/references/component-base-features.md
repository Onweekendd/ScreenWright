# ComponentSchema - 动画与 Minio 扩展字段

> Source: `packages/type/src/schemas/animation.ts` / `minio.ts`
> iotConfig 已移至 [component-base-data.md](component-base-data.md)

## 目录
1. [loadAnimation - 加载动画配置](#1-loadanimation---加载动画配置)
2. [AnimationSchema 字段详情](#2-animationschema-字段详情)
3. [minioArr - Minio 资源列表](#3-minioarr---minio-资源列表)

---

## 1. loadAnimation - 加载动画配置

```ts
loadAnimation: AnimationSchema  // 必填，但可设置 type: "" 表示无动画
```

控制组件**进入/离开画面**时的过渡动画。

---

## 2. AnimationSchema 字段详情

```ts
{
  type: string,           // 动画类型（见下方枚举）
  direction?: string,     // 动画方向（见下方枚举）
  duration: number,       // 动画持续时间（毫秒）
  delay: number,          // 动画延迟时间（毫秒）
  timingFunction: string  // 缓动函数（见下方枚举）
}
```

### 动画类型 (AnimationTypeSchema)
| 值 | 说明 |
|----|------|
| `""` / `"none"` | 无动画 |
| `"slide-mini-in"` | 小幅度移入 |
| `"slide-in"` | 移入 |
| `"slide-in-blurred"` | 模糊移入 |
| `"slide-clip-in"` | 擦除移入 |
| `"slide-scale-in"` | 缩放移入 |
| `"opacity-in"` | 渐入 |
| `"slide-mini-out"` | 小幅度移出 |
| `"slide-out"` | 移出 |
| `"slide-out-blurred"` | 模糊移出 |
| `"slide-clip-out"` | 擦除移出 |
| `"slide-scale-out"` | 缩放移出 |
| `"opacity-out"` | 渐出 |

### 动画方向 (AnimationDirectionSchema)
`"left"` `"right"` `"top"` `"bottom"` `"center"` `"tl"` `"tr"` `"bl"` `"br"` `""` `"none"`

### 缓动函数 (TimingFunctionTypeSchema)
`"none"` `"linear"` `"ease"` `"ease-in"` `"ease-out"` `"ease-in-out"`

### 默认值（无动画时）
```ts
loadAnimation: {
  type: "",
  direction: "",
  duration: 0,
  delay: 0,
  timingFunction: "none"
}
```

---

## 3. minioArr - Minio 资源列表

```ts
minioArr?: Array<{
  id: number,                // 资源 ID
  userId: number,
  url: string,               // 资源访问 URL
  fileName: string,          // 文件名
  name: string,              // 资源名称
  resourceType: number,      // 资源类型
  fileType: number,          // 文件类型
  largeId: number,           // 所属大屏 ID
  resourceSize: number,      // 文件大小（字节）
  layerIds: string,          // 图层 ID 列表（JSON 字符串）
  largeUseIds: string,       // 大屏使用 ID 列表
  groupId: number | null,
  auth: any | null,          // 认证信息
  cover: any | null,         // 封面图
  coverName: string | null,
  hdrPreviewImg: any | null, // HDR 预览图
  vectorDataPreviewImg: any | null,
  createdBy, updatedBy, createdTime, updatedTime: string
}>
```

**作用：** 组件引用的 Minio 对象存储资源（图片、视频、3D 模型等）的元数据列表。组件渲染时通过 `minioArr` 中的 `url` 加载资源。
