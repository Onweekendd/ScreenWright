# vue2 片段 (vue-part) 配置说明

## dataChart 数据格式

```typescript
interface VuePartDataItem {
  name: string;    // 类目名称
  value: number;   // 数值
}

type dataChart = VuePartDataItem[];
```

**示例**：
```json
[
  { "name": "广州", "value": 10 },
  { "name": "深圳", "value": 10 },
  { "name": "佛山", "value": 10 }
]
```

---

## option 完整字段参考

### 自定义函数名

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `funName` | string | "" | 自定义交互函数名称，用于事件通信标识。触发时事件名为 fireCustomCode_${funName} |

### 模板代码

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `template` | string | "" | Vue模板代码，定义组件的 HTML 结构。支持 Vue 2 模板语法（v-for、v-if、@click 等） |

### 脚本代码

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `js` | string | "" | Vue脚本代码，以函数形式定义 Vue 组件选项。函数接收 info 参数，包含 id（组件id）、list（绑定数据）、emitEvent（通信函数）、defaultFun（内置工具函数如 cloneDeep、debounce、throttle） |

### 样式代码

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `css` | string | "" | CSS样式代码，定义组件的外观样式 |

---

## 常用配置示例

### 默认列表配置

```json
{
  "funName": "",
  "template": "<template>\n  <div class=\"wrapper\">\n    <div class=\"sub-title\">{{ message }}</div>\n    <div class=\"sub-tabs\" v-for=\"item in dataList\" :key=\"item.value\" @click.stop=\"onClick(item)\">\n      {{ item.name }}\n    </div>\n  </div>\n</template>",
  "js": "function generate(info) {\n  const { id, list, emitEvent, defaultFun } = info || {};\n  return {\n    name: 'customCode',\n    data() { return { dataList: list, message: 'vue2 片段' } },\n    methods: {\n      onClick(item) {\n        if (id && emitEvent) {\n          emitEvent(`fireCustomCode_${id}`, item);\n        }\n      }\n    }\n  }\n}",
  "css": ".wrapper { height: 100%; font-size: 20px; color: #ffffff; text-align: center; }"
}
```
