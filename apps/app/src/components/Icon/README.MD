# 使用方式 

```js
import Icon from "@/components/Icon/index.vue"
<icon type="plus" size="14" color="red"/>
<icon type="iconfont-bianji" size="14" color="red"/>
```

### Attributes[​]

| 属性名   | 说明                    | 类型                  | 默认值    |
| ----- | --------------------- | ------------------- | ------ |
| color | svg 的 fill 颜色         | `string`            | 继承颜色   |
| size  | SVG 图标的大小，size x size | `number` / `string` | 继承字体大小
| type  | 图标名称 |  `string` | el-icon名称 / iconfont名称 