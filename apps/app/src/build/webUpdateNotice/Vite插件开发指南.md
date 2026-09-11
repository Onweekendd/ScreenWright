# Vite插件开发指南

## 概述

本文档详细介绍了Vite插件开发的核心概念、最佳实践以及webUpdateNotice插件的实现原理。

## 1. webUpdateNotice插件功能解析

### 核心功能
- **自动检测版本更新**：在构建时生成版本信息（Git提交哈希、时间戳、包版本等）
- **注入更新检测脚本**：向HTML中注入JavaScript代码来检测新版本
- **显示更新通知**：当检测到新版本时，向用户显示更新提示

### 插件工作流程

```typescript
// 插件的主要生命周期钩子
{
  name: 'vue-vite-web-update-notice',    // 插件名称
  apply: 'build',                        // 仅在构建时应用
  enforce: 'post',                       // 后置执行
  configResolved() { ... },              // 配置解析完成后
  generateBundle() { ... },              // 生成bundle时
  transformIndexHtml() { ... }           // 转换HTML时
}
```

### 具体实现步骤

1. **版本生成**
```typescript
const { versionType, customVersion, silence } = options
let version = ''
if (versionType === 'custom')
  version = getVersion(versionType, customVersion!)
else
  version = getVersion(versionType!)
```

2. **文件哈希计算**
```typescript
const cssFileSource = readFileSync(`${resolve(get__Dirname(), INJECT_STYLE_FILE_NAME)}.css`, 'utf8').toString()
cssFileHash = getFileHash(cssFileSource)
```

3. **资源注入**
```typescript
generateBundle(_) {
  // 生成版本JSON文件
  this.emitFile({
    type: 'asset',
    name: JSON_FILE_NAME,
    source: generateJSONFileContent(version, silence),
    fileName: `${DIRECTORY_NAME}/${JSON_FILE_NAME}.json`,
  })
  // 注入CSS和JS文件
}
```

4. **HTML注入**
```typescript
transformIndexHtml: {
  handler(html: string, { chunk }) {
    if (version && chunk)
      return injectPluginHtml(html, version, options, { jsFileHash, cssFileHash })
    return html
  }
}
```

## 2. Vite插件开发要点和流程

### Vite插件基础结构

```typescript
import type { Plugin } from 'vite'

export function myPlugin(options = {}): Plugin {
  return {
    // 插件基本信息
    name: 'my-plugin',                    // 插件名称，用于调试和错误信息
    apply: 'build' | 'serve' | ((config, env) => boolean), // 何时应用插件
    
    // 插件执行顺序
    enforce: 'pre' | 'post',             // 前置或后置执行
    
    // 配置相关钩子
    config(config, { command }) { ... },           // 修改配置
    configResolved(resolvedConfig) { ... },        // 配置解析完成后
    configureServer(server) { ... },               // 开发服务器配置
    
    // 构建相关钩子
    buildStart() { ... },                          // 构建开始
    resolveId(id, importer) { ... },               // 解析模块ID
    load(id) { ... },                              // 加载模块内容
    transform(code, id) { ... },                   // 转换代码
    generateBundle(options, bundle) { ... },       // 生成bundle
    
    // HTML相关钩子
    transformIndexHtml(html, context) { ... },     // 转换HTML
    
    // 构建结束钩子
    buildEnd() { ... },                            // 构建结束
    writeBundle(bundle) { ... },                   // 写入文件
  }
}
```

### 核心钩子详解

#### 1. **configResolved** - 配置解析完成
```typescript
async configResolved(resolvedConfig: ResolvedConfig) {
  // 在这里可以获取到最终解析的配置
  // 常用于设置默认值或基于配置进行初始化
  viteConfig = resolvedConfig
  if (options.injectFileBase === undefined)
    options.injectFileBase = viteConfig.base
}
```

#### 2. **generateBundle** - 生成bundle资源
```typescript
generateBundle(options, bundle) {
  // 可以添加新的资源文件到bundle中
  this.emitFile({
    type: 'asset',
    name: 'my-asset',
    source: 'content',
    fileName: 'path/to/file.ext'
  })
  
  // 或者添加chunk
  this.emitFile({
    type: 'chunk',
    id: 'virtual-module-id',
    name: 'chunk-name'
  })
}
```

#### 3. **transformIndexHtml** - HTML转换
```typescript
transformIndexHtml: {
  order: 'pre' | 'post',  // 执行顺序
  handler(html, context) {
    // 修改HTML内容
    return html.replace('<head>', '<head><script>...</script>')
  }
}
```

### Vite插件开发最佳实践

#### 1. **插件选项设计**
```typescript
interface PluginOptions {
  // 使用明确的类型定义
  enabled?: boolean
  include?: string | RegExp | (string | RegExp)[]
  exclude?: string | RegExp | (string | RegExp)[]
  
  // 提供合理的默认值
  transformMode?: 'web' | 'ssr'
  ssr?: boolean
}

export function myPlugin(options: PluginOptions = {}): Plugin {
  // 合并默认选项
  const resolvedOptions = {
    enabled: true,
    transformMode: 'web',
    ssr: false,
    ...options
  }
  
  return {
    name: 'my-plugin',
    // 插件实现...
  }
}
```

#### 2. **条件应用插件**
```typescript
export function myPlugin(options = {}): Plugin {
  return {
    name: 'my-plugin',
    
    // 根据条件决定是否应用
    apply(config, { command }) {
      return command === 'build' && options.enabled
    },
    
    // 或者使用字符串
    apply: 'build',  // 只在构建时应用
    
    // 插件实现...
  }
}
```

#### 3. **模块解析和转换**
```typescript
{
  // 解析虚拟模块
  resolveId(id, importer) {
    if (id === 'virtual:my-module') {
      return id  // 返回模块ID
    }
  },
  
  // 加载模块内容
  load(id) {
    if (id === 'virtual:my-module') {
      return `export default ${JSON.stringify(options.data)}`
    }
  },
  
  // 转换代码
  transform(code, id) {
    if (id.endsWith('.vue') || id.endsWith('.jsx')) {
      // 转换特定类型的文件
      return transformCode(code, id)
    }
  }
}
```

#### 4. **开发服务器集成**
```typescript
{
  configureServer(server) {
    // 添加中间件
    server.middlewares.use('/api', (req, res, next) => {
      // 处理API请求
    })
    
    // 监听文件变化
    server.watcher.on('change', (file) => {
      if (file.endsWith('.config')) {
        server.reload()
      }
    })
  }
}
```

## 3. JSON文件的作用机制

### 为什么需要单独的JSON文件？

#### **版本检测机制**
JSON文件是前端检测版本更新的关键：

```typescript
// 前端定期请求这个JSON文件来检查版本
window.fetch(`${injectFileBase}${DIRECTORY_NAME}/${JSON_FILE_NAME}.json?t=${Date.now()}`)
  .then(response => response.json())
  .then(({ version: versionFromServer, silence }) => {
    const localeVersion = getLocaleVersion() // 从script标签获取当前版本
    
    // 比较版本，发现更新就显示通知
    if (localeVersion !== versionFromServer) {
      showNotification(options)
    }
  })
```

#### **架构设计优势**

1. **解耦设计**
   - **当前版本**：存储在HTML中script标签的`data-v`属性里
   - **最新版本**：存储在独立的JSON文件中
   - 这样可以在不修改HTML/JS的情况下更新版本信息

2. **轻量级检测**
   ```json
   {
     "version": "abc123def",  // 版本号
     "silence": false        // 是否静默模式
   }
   ```

3. **实际工作流程**
   ```
   构建时生成JSON文件 → JSON文件部署到服务器 → 用户访问页面 → 前端定期请求JSON文件 → 比较本地版本vs服务器版本 → 显示更新通知
   ```

## 4. 部署要求 - 无需后端配合

### 工作原理

#### **构建时生成静态文件**
插件在构建时会自动生成JSON文件到输出目录：

```
dist/
├── index.html
├── assets/
│   ├── main.js
│   └── main.css
└── pluginWebUpdateNotice/          // 插件生成的目录
    ├── web_version_by_plugin.json  // 版本信息文件
    ├── webUpdateNoticeInjectStyle.abc123.css
    └── webUpdateNoticeInjectScript.def456.js
```

#### **前端请求静态资源**
前端直接请求这个JSON文件，就像请求CSS或JS文件一样：

```typescript
// 实际请求的URL示例
fetch('/pluginWebUpdateNotice/web_version_by_plugin.json?t=1703123456789')
// 或者
fetch('https://your-domain.com/pluginWebUpdateNotice/web_version_by_plugin.json?t=1703123456789')
```

### 部署要求

你只需要确保：

#### **静态文件服务器配置**
```nginx
# Nginx 配置示例
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    
    # 确保JSON文件可以被正常访问
    location ~* \.json$ {
        add_header Cache-Control "public, max-age=300";  # 5分钟缓存
        add_header Access-Control-Allow-Origin "*";
    }
}
```

#### **网络请求流程**
```
用户访问页面 → 加载HTML/CSS/JS → 插件脚本执行 → 定期请求JSON文件 → 静态文件服务器返回JSON → 比较版本信息 → 显示更新通知
```

### 缓存策略

```typescript
// 前端请求时添加时间戳避免缓存
fetch(`${url}?t=${Date.now()}`)

// 服务器可以设置合适的缓存头
Cache-Control: public, max-age=300  // 5分钟缓存
```

## 5. 具体示例和最佳实践

### 示例1：简单的文件处理插件
```typescript
import { readFileSync } from 'fs'
import { resolve } from 'path'
import type { Plugin } from 'vite'

interface FileProcessorOptions {
  include?: string[]
  exclude?: string[]
  processor: (content: string, filePath: string) => string
}

export function fileProcessor(options: FileProcessorOptions): Plugin {
  const { include = ['**/*'], exclude = [], processor } = options
  
  return {
    name: 'file-processor',
    apply: 'build',
    
    transform(code, id) {
      // 检查文件是否应该被处理
      const shouldProcess = include.some(pattern => 
        id.includes(pattern.replace('**', ''))
      ) && !exclude.some(pattern => id.includes(pattern))
      
      if (shouldProcess) {
        return {
          code: processor(code, id),
          map: null // 可以生成source map
        }
      }
    }
  }
}

// 使用示例
// vite.config.ts
export default {
  plugins: [
    fileProcessor({
      include: ['**/*.css'],
      processor: (content) => content.replace(/\/\*.*?\*\//g, '') // 移除注释
    })
  ]
}
```

### 示例2：环境变量注入插件
```typescript
import type { Plugin } from 'vite'

interface EnvInjectionOptions {
  envFile?: string
  prefix?: string
}

export function envInjection(options: EnvInjectionOptions = {}): Plugin {
  const { envFile = '.env', prefix = 'VITE_' } = options
  
  return {
    name: 'env-injection',
    
    configResolved(config) {
      // 读取环境变量文件
      const envContent = readFileSync(envFile, 'utf-8')
      const envVars = parseEnvFile(envContent)
      
      // 注入到配置中
      Object.assign(config.env, envVars)
    },
    
    transformIndexHtml(html) {
      // 向HTML注入环境变量
      const envScript = generateEnvScript()
      return html.replace('<head>', `<head>\n${envScript}`)
    }
  }
}

function parseEnvFile(content: string): Record<string, string> {
  return content
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .reduce((acc, line) => {
      const [key, value] = line.split('=')
      if (key && value) {
        acc[key.trim()] = value.trim()
      }
      return acc
    }, {} as Record<string, string>)
}

function generateEnvScript(): string {
  return `<script>
    window.__ENV__ = ${JSON.stringify(process.env)}
  </script>`
}
```

### 示例3：构建分析插件
```typescript
import type { Plugin } from 'vite'
import { writeFileSync } from 'fs'

interface BundleAnalyzerOptions {
  outputFile?: string
  gzip?: boolean
}

export function bundleAnalyzer(options: BundleAnalyzerOptions = {}): Plugin {
  const { outputFile = 'bundle-analysis.json', gzip = false } = options
  
  return {
    name: 'bundle-analyzer',
    apply: 'build',
    
    generateBundle(options, bundle) {
      const analysis = {
        timestamp: new Date().toISOString(),
        totalSize: 0,
        chunks: [],
        assets: []
      }
      
      // 分析chunks
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk') {
          analysis.chunks.push({
            name: fileName,
            size: chunk.code.length,
            modules: Object.keys(chunk.modules).length
          })
          analysis.totalSize += chunk.code.length
        }
      }
      
      // 分析assets
      for (const [fileName, asset] of Object.entries(bundle)) {
        if (asset.type === 'asset') {
          analysis.assets.push({
            name: fileName,
            size: asset.source.length
          })
          analysis.totalSize += asset.source.length
        }
      }
      
      // 写入分析结果
      this.emitFile({
        type: 'asset',
        name: 'bundle-analysis',
        source: JSON.stringify(analysis, null, 2),
        fileName: outputFile
      })
    }
  }
}
```

### 开发调试技巧

#### 1. **插件调试**
```typescript
export function debugPlugin(): Plugin {
  return {
    name: 'debug-plugin',
    
    config(config) {
      console.log('🔧 Config:', config)
    },
    
    configResolved(config) {
      console.log('✅ Config resolved:', config.root)
    },
    
    buildStart(options) {
      console.log('🚀 Build start:', options)
    },
    
    transform(code, id) {
      console.log('🔄 Transform:', id)
      return code
    },
    
    generateBundle(options, bundle) {
      console.log('📦 Generate bundle:', Object.keys(bundle))
    }
  }
}
```

#### 2. **性能监控**
```typescript
export function performancePlugin(): Plugin {
  const timers = new Map()
  
  return {
    name: 'performance-plugin',
    
    buildStart() {
      timers.set('build-start', Date.now())
    },
    
    generateBundle() {
      const buildTime = Date.now() - timers.get('build-start')
      console.log(`⏱️ Build completed in ${buildTime}ms`)
    }
  }
}
```

#### 3. **错误处理**
```typescript
export function errorHandlingPlugin(): Plugin {
  return {
    name: 'error-handling',
    
    transform(code, id) {
      try {
        // 可能出错的操作
        return processCode(code)
      } catch (error) {
        this.error({
          message: `Failed to process ${id}`,
          stack: error.stack,
          id
        })
      }
    }
  }
}
```

## 总结

### webUpdateNotice插件特点：
1. **自动化版本管理**：支持Git提交哈希、SVN版本号、包版本、时间戳等多种版本类型
2. **智能更新检测**：通过轮询、窗口焦点、文件加载错误等多种方式检测更新
3. **灵活的通知方式**：支持默认通知、自定义通知、静默模式等
4. **国际化支持**：内置多语言支持，可自定义本地化内容

### Vite插件开发要点：
1. **生命周期钩子**：合理使用各个钩子函数，在适当的时机执行相应操作
2. **配置选项设计**：提供清晰的类型定义和合理的默认值
3. **错误处理**：完善的错误处理和用户友好的错误信息
4. **性能考虑**：避免不必要的文件操作，合理使用缓存
5. **调试支持**：提供详细的日志和调试信息

### 部署要求：
- **完全不需要后端API配合**
- 只需要静态文件服务器（Nginx、Apache、CDN等）
- 能正常访问`.json`文件即可

这个插件是一个很好的Vite插件开发示例，展示了如何：
- 处理构建时的资源注入
- 修改HTML内容
- 生成和管理静态资源
- 提供灵活的配置选项
- 实现复杂的业务逻辑
