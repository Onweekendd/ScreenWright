import { getTcpNoticeWebsocketUrl } from "@/utils/utils";

/**
 * 导出包需要从当前站点 public/ 下带走的运行时文件（相对 public/ 的路径）。
 * lib/ 下的 screenwright.* 由 `pnpm build:lib` 产出，lib/vendor/ 由同一构建从 node_modules 拷贝，
 * 见 vite.lib.config.ts 的 copyExportVendor。
 */
export const EXPORT_RUNTIME_FILES = [
  "lib/vendor/vue.global.prod.js",
  "lib/vendor/vue-router.global.prod.js",
  "lib/vendor/element-plus.full.min.js",
  "lib/vendor/element-plus.css",
  "lib/screenwright.umd.js",
  "lib/screenwright.css",
  "lib/fontface.css",
  "cdn/componentAnimate/componentAnimate.css"
] as const;

/** 导出包里字体文件所在目录（相对 public/），与 lib/fontface.css 里的 `./fonts/` 对应 */
export const EXPORT_FONT_DIR = "lib/fonts";

/**
 * screenwright.css 里兜底的默认字体（html/body 的 font-family），不来自任何图层的 fontFamily 配置，
 * 所以 collectUsedFonts 扫不到——每次导出都要无条件带上，否则浏览器请求 @font-face 会 404。
 */
export const DEFAULT_FONT_FAMILY = "思源黑体-Normal";

/**
 * 导出包 index.html。依赖的脚本顺序：vue → element-plus → vue-router → screenwright.umd.js，
 * 与 vite.lib.config.ts 的 external / globals 一一对应。
 */
export const renderIndexHtml = (title: string) => {
  const basePath = "./public";
  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <meta http-equiv="Cache-Control" content="no-cache" />
    <meta name="referrer" content="same-origin" />
    <title>${title}</title>
    <script src="./view.js"></script>
    <link rel="stylesheet" href="${basePath}/cdn/componentAnimate/componentAnimate.css" />
    <link rel="stylesheet" href="${basePath}/lib/vendor/element-plus.css" />
    <link rel="stylesheet" href="${basePath}/lib/screenwright.css" />
    <link rel="stylesheet" href="${basePath}/lib/fontface.css" />
    <script>
      // 全局配置：终端控制 websocket 地址可在此处按部署环境修改
      window.webconfig = {
        controlWebsocketUrl: "",
        tcpNoticeWebsocketUrl: "${getTcpNoticeWebsocketUrl()}"
      };
    </script>
    <script src="${basePath}/lib/vendor/vue.global.prod.js"></script>
    <script src="${basePath}/lib/vendor/element-plus.full.min.js"></script>
    <script src="${basePath}/lib/vendor/vue-router.global.prod.js"></script>
    <script src="${basePath}/lib/screenwright.umd.js"></script>
    <style>
      body {
        padding: 0;
        margin: 0;
      }
      html,
      body,
      #screenwrightApp {
        height: 100%;
        width: 100%;
        font-family: Source Han Sans CN-Regular, Source Han Sans CN;
      }
    </style>
  </head>
  <body>
    <div id="screenwrightApp">
      <screenwright-app :data="option"></screenwright-app>
    </div>
    <script>
      const app = Vue.createApp({
        setup() {
          return { option };
        }
      });
      app.use(screenwright.router);
      app.use(ElementPlus);
      app.use(screenwright.default);
      app.mount("#screenwrightApp");
    </script>
  </body>
</html>`;
};

/** 导出包 README.md：终端控制接入说明 */
export const renderReadme = ({
  system,
  appId,
  encodedList
}: {
  system: string;
  appId: number;
  encodedList: string[];
}) =>
  `# 1. 文件结构说明
|-- assets/ 静态资源
|-- public/ 依赖脚本
|-- index.html 入口文件
|-- view.js 图层配置

# 2. 终端指令配置
## a. 大屏端：BI连接地址（实际机器IP、端口地址; 备注：可在根目录的index.html中找到controlWebsocketUrl赋值替换）
ws://[localhost:port]${system}/encodedControl/bi/${appId}

## b. 控制端：第三方连接地址（实际机器IP、端口地址）
ws://[localhost:port]${system}/encodedControl/thirdParty/${appId}

## 备注：私有部署使用系统内置的终端交互控制面板，则只需配置大屏端、控制端信息连接地址即可，如上方；
## 若使用的是第三方控制端页面，需要配置控制编码以及组装发送指令的信息数据结构，如下

## 发送的消息数据结构如下：
type: 类型(String)，消息类型，bi
code: 编码(String)，对应图层的控制编码+数据value值
data: 数据(String|Object|Array)，消息数据

{
  "type": "bi",
  "code": "button-1",
  "data": ""
}

# 当前大屏应用的控制编码集合如下:
[图层id]-[图层控制编码]-[图层数据value值]
${encodedList.length ? encodedList.join("\n") : "--"}
`;
