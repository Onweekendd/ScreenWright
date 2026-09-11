export const template = `<template>
  <div class='wrapper'>
    <el-button @click.stop="onClick">
      点我 {{ count }}
    </el-button>
    <span>{{ message }}</span>
  </div>
</template>`;

export const js = `function generate() {
  return {
    name: 'customCode',
    data() {
      return {
        message: 'vue2 片段',
        count: 1
      }
    },
    methods: {
      onClick() {
        this.count++
      }
    },
  };
}`;

export const css = `.wrapper {
  color: #ffffff;
  width: 450px;
  height: 200px;
  margin: 10px;
  padding: 10px;
  border: 1px solid #ccc;
}
`;
export const mdContentDefault =
  '\n ### 模板 \n *   组件的模板结构，当前组件的DOM结构，需要定义到template标签的内部 \n *   同时也可以使用系统自带 <u>**element-ui**</u> 的标签，如: ```<el-button size="mini">默认按钮</el-button>``` <br> \n ### 样式 \n * 组件的css样式 <br><br> \n ### 代码 \n * 组件的JavaScript行为，组件相关的data数据、method方法等，都需要定义到 <u>**generate**</u> 的 **return** 内 \n * 其中 <u>**info**</u> Object组件自带参数， 包含如下：\n | 参数 | 参数说明 | \n | ----- | ----- | \n | **id** | 组件id | \n | **list** | 绑定数据 | \n | **emitEvent** | 通信函数,固定交互通信函数名为fireCustomCode_${组件id}，或fireCustomCode_${配置自定义函数名} | \n | **defaultFun** | 内置的函数 如:深拷贝**cloneDeep**, 防抖**debounce**, 节流**throttle** | \n ```\n @function generate(info) { \n   return { \n     // 组件生命周期代码 \n     name: "customCode",\n     inject: ["main"],\n     data(){\n       return {\n         dataList: list,\n       } \n     }\n     watch: {},\n     computed: {},\n     created() {},\n     mounted() {},\n     methods: {}\n   } \n}';
