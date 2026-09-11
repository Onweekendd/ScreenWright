# @screenwright/eslint-config

Screenwright 项目的 ESLint 共享配置，基于 ESLint 9.x 扁平配置格式。

## 📦 安装

在 monorepo 的子包中安装：

```bash
pnpm add @screenwright/eslint-config -D -w
```

或在 package.json 中添加：

```json
{
  "devDependencies": {
    "@screenwright/eslint-config": "workspace:*",
    "eslint": "^9.32.0"
  }
}
```

## 🚀 使用

### 基础配置（JavaScript + TypeScript）

创建 `eslint.config.js`：

```javascript
// @ts-check
import baseConfig from '@screenwright/eslint-config';

export default [
  ...baseConfig,
  
  // 项目特定配置
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
```

### Vue 配置（JavaScript + TypeScript + Vue）

创建 `eslint.config.js`：

```javascript
// @ts-check
import vueConfig from '@screenwright/eslint-config/vue';

export default [
  ...vueConfig,
  
  // 项目特定配置
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
```

## ⚙️ 配置说明

### 基础配置 (`index.js`)

包含以下规则：

- ✅ ESLint 推荐规则
- ✅ TypeScript 推荐规则
- ✅ Prettier 集成
- ✅ 严格遵循原 `.eslintrc.js` 配置

### Vue 配置 (`eslintForVue.js`)

在基础配置之上增加：

- ✅ Vue 3 Essential 规则
- ✅ Vue 模板语法支持
- ✅ Vue + TypeScript 集成

## 📝 注意事项

### 1. package.json type 字段

如果你的项目 `package.json` 中 `"type": "module"`：

```javascript
// eslint.config.js - 可以使用 import 语法
import vueConfig from '@screenwright/eslint-config/vue';
export default [...vueConfig];
```

如果你的项目 `package.json` 中 `"type": "commonjs"`：

```javascript
// eslint.config.mjs - 必须使用 .mjs 扩展名
import vueConfig from '@screenwright/eslint-config/vue';
export default [...vueConfig];
```

### 2. 迁移 .eslintignore

ESLint 9.x 不再支持 `.eslintignore` 文件，请将忽略规则迁移到配置文件中：

```javascript
export default [
  ...vueConfig,
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'public/**',
      '**/*.d.ts',
    ],
  },
];
```

### 3. Prettier 配置

如果在 `"type": "module"` 环境下，需要将 `prettier.config.js` 改为 ESM 语法：

```javascript
// prettier.config.js
export default {
  printWidth: 120,
  tabWidth: 2,
  // ... 其他配置
};
```

## 🔧 包含的规则

### TypeScript 规则

- `@typescript-eslint/explicit-function-return-type`: off
- `@typescript-eslint/no-explicit-any`: warn
- `@typescript-eslint/explicit-module-boundary-types`: off
- `@typescript-eslint/ban-types`: off
- `@typescript-eslint/ban-ts-comment`: off
- `@typescript-eslint/no-empty-function`: off
- `@typescript-eslint/no-non-null-assertion`: off
- `@typescript-eslint/no-unused-vars`: error（忽略 `_` 开头的变量）

### Vue 规则

- `vue/no-v-html`: off
- `vue/require-default-prop`: off
- `vue/require-explicit-emits`: off
- `vue/multi-word-component-names`: off
- `vue/html-self-closing`: error（要求自闭合标签）

### 通用规则

- `no-debugger`: off
- `no-unused-vars`: error（忽略 `_` 开头的变量）
- `prettier/prettier`: error（endOfLine: auto）

## 📚 相关文档

- [ESLint 9.x 配置迁移指南](https://eslint.org/docs/latest/use/configure/migration-guide)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [ESLint Plugin Vue](https://eslint.vuejs.org/)
- [Prettier](https://prettier.io/)

## 📄 License

ISC
