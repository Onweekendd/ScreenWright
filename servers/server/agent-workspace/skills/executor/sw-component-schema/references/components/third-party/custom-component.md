# 自定义组件 (custom-component) 配置说明

## dataChart 数据格式

```typescript
interface CustomComponentDataItem {
  value: string;   // 文本值
}

type dataChart = CustomComponentDataItem[];
```

**示例**：
```json
[
  { "value": "欢迎使用新BI自定义组件" }
]
```

---

## option 完整字段参考

### 代码库引用

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `codeLibraryIds` | string[] | [] | 代码库ID列表 |

### 用户代码文件

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `user` | Record<string, { userMain?: boolean, code?: string, compiled?: { js: string, css: string } }> | {} | 用户自定义代码文件映射，键为文件路径（如 "src/App.vue"、"global.css"） |

#### user 对象内单个文件字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `userMain` | boolean | false | 是否为用户主入口文件 |
| `code` | string | "" | 文件源代码 |
| `compiled.js` | string | "" | 编译后的JS代码 |
| `compiled.css` | string | "" | 编译后的CSS代码 |

### 系统代码文件

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `system` | Record<string, { systemMain?: boolean, code: string }> | {} | 系统代码文件映射，键为文件路径（如 "tsconfig.json"、"src/PlaygroundMain.vue"、"import-map.json"） |

#### system 对象内单个文件字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `systemMain` | boolean | false | 是否为系统主入口文件 |
| `code` | string | "" | 文件源代码 |

---

## 常用配置示例

### 默认自定义组件

```json
{
  "codeLibraryIds": [],
  "user": {
    "src/App.vue": {
      "userMain": true,
      "code": "<script setup lang=\"ts\">\nimport { ref } from \"vue\"\nconst msg = ref(\"Hello World!\")\n</script>\n<template>\n  <h1>{{ msg }}</h1>\n</template>"
    },
    "global.css": {
      "code": "h1 { color: red; }",
      "compiled": { "js": "", "css": "h1 { color: red; }" }
    }
  },
  "system": {
    "tsconfig.json": {
      "code": "{ \"compilerOptions\": { \"target\": \"ESNext\" } }"
    },
    "import-map.json": {
      "code": "{ \"imports\": { \"vue\": \"/codeLibs/@vue/@3.5.21/vue.esm-browser.prod.js\" } }"
    }
  }
}
```
