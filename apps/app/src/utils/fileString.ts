import { getActive } from "./auth";
// const { WEB_APP_PUBLIC_PATH } = (window as any).webconfig
// const { PUBLIC_PATH } = process.env
const publicPath = "/";
export const fontFamilyList = [
  {
    label: "06_方正兰亭中黑_简体",
    filename: "06_方正兰亭中黑_简体.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/06_方正兰亭中黑_简体.otf`
  },
  {
    label: "Alibaba-PuHuiTi-Regular",
    filename: "Alibaba-PuHuiTi-Regular.ttf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/Alibaba-PuHuiTi-Regular.ttf`
  },
  {
    label: "AlimamaShuHeiTi-Bold",
    filename: "AlimamaShuHeiTi-Bold.ttf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/AlimamaShuHeiTi-Bold.ttf`
  },
  {
    label: "ChuangKeTieJinGangTi",
    filename: "ChuangKeTieJinGangTi.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/ChuangKeTieJinGangTi.otf`
  },
  {
    label: "D-DINCondensed-Bold",
    filename: "D-DINCondensed-Bold.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/D-DINCondensed-Bold.otf`
  },
  {
    label: "D-DINCondensed",
    filename: "D-DINCondensed.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/D-DINCondensed.otf`
  },
  {
    label: "DigifaceWide_Regular",
    filename: "DigifaceWide_Regular.ttf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/DigifaceWide_Regular.ttf`
  },
  {
    label: "DIN-Black",
    filename: "DIN-Black.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/DIN-Black.otf`
  },
  {
    label: "DIN-BlackItalic",
    filename: "DIN-BlackItalic.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/DIN-BlackItalic.otf`
  },
  {
    label: "DIN-Bold",
    filename: "DIN-Bold.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/DIN-Bold.otf`
  },
  {
    label: "DIN-BoldItalic",
    filename: "DIN-BoldItalic.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/DIN-BoldItalic.otf`
  },
  {
    label: "DIN-Light",
    filename: "DIN-Light.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/DIN-Light.otf`
  },
  {
    label: "DIN-LightItalic",
    filename: "DIN-LightItalic.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/DIN-LightItalic.otf`
  },
  {
    label: "DIN-MediumItalic",
    filename: "DIN-MediumItalic.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/DIN-MediumItalic.otf`
  },
  {
    label: "DIN-Regular",
    filename: "DIN-Regular.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/DIN-Regular.otf`
  },
  {
    label: "DIN-RegularItalic",
    filename: "DIN-RegularItalic.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/DIN-RegularItalic.otf`
  },
  {
    label: "DINCond-Bold",
    filename: "DINCond-Bold.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/DINCond-Bold.otf`
  },
  {
    label: "DINCond-Light",
    filename: "DINCond-Light.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/DINCond-Light.otf`
  },
  {
    label: "DINCond-Medium",
    filename: "DINCond-Medium.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/DINCond-Medium.otf`
  },
  {
    label: "DingTalk_JinBuTi_Regular",
    filename: "DingTalk_JinBuTi_Regular.ttf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/DingTalk_JinBuTi_Regular.ttf`
  },
  {
    label: "DOUYU_Font",
    filename: "DOUYU_Font.ttf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/DOUYU_Font.ttf`
  },
  {
    label: "DY追光体2.0",
    filename: "DY追光体2.0.ttf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/DY追光体2.0.ttf`
  },
  {
    label: "FZLTZHJW",
    filename: "FZLTZHJW.ttf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/FZLTZHJW.ttf`
  },
  {
    label: "GrtskTera-Light",
    filename: "GrtskTera-Light.ttf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/GrtskTera-Light.ttf`
  },
  {
    label: "GrtskTera-Medium",
    filename: "GrtskTera-Medium.ttf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/GrtskTera-Medium.ttf`
  },
  {
    label: "GrtskTera-Semibold",
    filename: "GrtskTera-Semibold.ttf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/GrtskTera-Semibold.ttf`
  },
  {
    label: "GrtskTera-Thin",
    filename: "GrtskTera-Thin.ttf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/GrtskTera-Thin.ttf`
  },
  {
    label: "LeagueGothic-Regular",
    filename: "LeagueGothic-Regular.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/LeagueGothic-Regular.otf`
  },
  {
    label: "MiSans-Bold",
    filename: "MiSans-Bold.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/MiSans-Bold.otf`
  },
  {
    label: "MiSans-Heavy",
    filename: "MiSans-Heavy.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/MiSans-Heavy.otf`
  },
  {
    label: "MiSans-Light",
    filename: "MiSans-Light.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/MiSans-Light.otf`
  },
  {
    label: "MiSans-Medium",
    filename: "MiSans-Medium.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/MiSans-Medium.otf`
  },
  {
    label: "MiSans-Regular",
    filename: "MiSans-Regular.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/MiSans-Regular.otf`
  },
  {
    label: "OPPOSans-R-2",
    filename: "OPPOSans-R-2.ttf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/OPPOSans-R-2.ttf`
  },
  {
    label: "PangMenZhengDaoBiaoTiTi-1",
    filename: "PangMenZhengDaoBiaoTiTi-1.ttf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/PangMenZhengDaoBiaoTiTi-1.ttf`
  },
  {
    label: "PangMenZhengDaoCuShuTi-2",
    filename: "PangMenZhengDaoCuShuTi-2.ttf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/PangMenZhengDaoCuShuTi-2.ttf`
  },
  {
    label: "SourceHanSansCN-Bold",
    filename: "SourceHanSansCN-Bold.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/SourceHanSansCN-Bold.otf`
  },
  {
    label: "SourceHanSansCN-Normal",
    filename: "SourceHanSansCN-Normal.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/SourceHanSansCN-Normal.otf`
  },
  {
    label: "SourceHanSansCN-Regular",
    filename: "SourceHanSansCN-Regular.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/SourceHanSansCN-Regular.otf`
  },
  {
    label: "TimesNewRoman",
    filename: "TimesNewRoman.ttf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/TimesNewRoman.ttf`
  },
  {
    label: "优设标题黑",
    filename: "优设标题黑.ttf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/优设标题黑.ttf`
  },
  {
    label: "方正兰亭中黑_简体",
    filename: "方正兰亭中黑_简体.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/方正兰亭中黑_简体.otf`
  },
  {
    label: "方正兰亭纤黑简体",
    filename: "方正兰亭纤黑简体.ttf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/方正兰亭纤黑简体.ttf`
  },
  {
    label: "方正兰亭黑简体",
    filename: "方正兰亭黑简体.ttf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/方正兰亭黑简体.ttf`
  },
  {
    label: "造字工房悦黑",
    filename: "造字工房悦黑.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/造字工房悦黑.otf`
  },
  {
    label: "阿里妈妈灵动体",
    filename: "阿里妈妈灵动体.ttf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/阿里妈妈灵动体.ttf`
  },
  {
    label: "AlimamaFangYuanTiVF-Thin",
    filename: "AlimamaFangYuanTiVF-Thin.ttf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/AlimamaFangYuanTiVF-Thin.ttf`
  },
  {
    label: "阿里妈妈黑体",
    filename: "阿里妈妈黑体.otf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/阿里妈妈黑体.otf`
  },
  {
    label: "施耐德正文字体",
    filename: "arialmt.ttf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/arialmt.otf`
  },
  {
    label: "施耐德标题字体",
    filename: "ARIALROUNDEDMT.ttf",
    filedir: "public/lib/fonts",
    filepath: `${publicPath}lib/fonts/ARIALROUNDEDMT.otf`
  }
];
// 获取字体包资源
const getFontTTf = () => {
  // const res = await getFontFilesName("./public/lib/fonts");
  // console.log(res, "resresres");
  return fontFamilyList.map((item) => {
    return {
      filename: item.filename,
      filedir: "public/lib/fonts",
      filepath: `${item.filepath}`
    };
  });
};

/**
 * public 下的公共包
 * @return Array
 */
export const publicFileList = (includeSet: string[] = []) => {
  const basePublic = [
    // 预览组件
    {
      filename: "screenwright.css",
      filedir: "public/lib",
      filepath: `${publicPath}lib/screenwright.css`
    },
    {
      filename: "componentAnimate/componentAnimate.css",
      filedir: "public/cdn",
      filepath: `${publicPath}cdn/componentAnimate/componentAnimate.css`
    },
    {
      filename: "screenwright.umd.js",
      filedir: "public/lib",
      filepath: `${publicPath}lib/screenwright.umd.js`
    },
    {
      filename: "expired.409e4947.jpg",
      filedir: "public/lib/img",
      filepath: `${publicPath}lib/img/expired.409e4947.jpg`
    },
    {
      filename: "loading.c73f7067.png",
      filedir: "public/lib/img",
      filepath: `${publicPath}lib/img/loading.c73f7067.png`
    },
    {
      filename: "fontface.css",
      filedir: "public/lib",
      filepath: `${publicPath}lib/fontface.css`
    },
    // {
    //   filename: "loading-mask-scene.7b605fb8.webm",
    //   filedir: "public/components/media",
    //   filepath: `${publicPath}components/media/loading-mask-scene.7b605fb8.webm`
    // },
    // {
    //   filename: "progress.3d68dc95.png",
    //   filedir: "public/components/img",
    //   filepath: `${publicPath}components/img/progress.3d68dc95.png`
    // },
    // {
    //   filename: "Alibaba PuHuiTi_Regular.json",
    //   filedir: "public/fonts",
    //   filepath: `${publicPath}fonts/Alibaba PuHuiTi_Regular.json`
    // },
    // {
    //   filename: "优设标题黑.1726685c.ttf",
    //   filedir: "public/lib/fonts",
    //   filepath: `${publicPath}lib/fonts/优设标题黑.1726685c.ttf`
    // },
    ...getFontTTf(),
    ...exportJsFoDepend(publicPath, includeSet).jsFile
  ];
  return basePublic;
};

export const fileContent = (title = "Screenwright", includeSet: any[] = [], ueSceneConfig?: any) => {
  const userInfo = getActive("publishInfo") || {};
  const basePath = "./public";
  return `<!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="utf-8" />
              <meta http-equiv="X-UA-Compatible" content="IE=edge" />
              <meta name="viewport" content="width=device-width,initial-scale=1.0" />
              <link rel="icon" href="${basePath}/favicon.ico" />
              <meta http-equiv="Pragma" content="no-cache" />
              <meta http-equiv="Cache-Control" content="no-cache" />
              <meta http-equiv="Expires" content="0" />
              <meta name="referrer" content="same-origin" />
              <script src="./view.js"></script>
               <link rel="stylesheet" href="${basePath}/cdn/componentAnimate/componentAnimate.css" />
              <link rel="stylesheet" href="${basePath}/cdn/element-plus/2.11.2/index.css"/>
              <link rel="stylesheet" href="${basePath}/lib/screenwright.css" />
              <link rel="stylesheet" href="${basePath}/lib/fontface.css" />
              <script>
                // 全局配置属性
                window.webconfig = {
                  controlWebsocketUrl: '',
                  projectIframeUrl: '',
                  pixelStreamingUrl: '',
                  ueAppOfflineConfig: ${ueSceneConfig ? JSON.stringify(ueSceneConfig, null, 2) : null},
                  tcpNoticeWebsocketUrl: '${getTcpNoticeWebsocketUrl()}'
                };
                // GLTFCache.js 引用 draco 路径问题-标识
                window.isProductionForYarnWC = true;
              </script>
              <script src="${basePath}/cdn/echarts/5.3.0/echarts.min.js"></script>
              <script src="${basePath}/cdn/echarts/echarts-gl.min.js"></script>
              <script src="${basePath}/cdn/echarts/echarts-wordcloud.min.js"></script>
              <script src="${basePath}/cdn/echarts/echarts-liquidfill.min.js"></script>
              
              ${exportJsFoDepend(basePath, includeSet).jsScript}
              <script src="${basePath}/cdn/vue/3.5.21/vue.global.prod.js" ></script>
              <!-- <script src="./public/getters/getters.umd.min.js"></script> -->
              <script src="${basePath}/cdn/axios/1.0.0/axios.min.js"></script>
              <script src="${basePath}/cdn/element-plus/2.11.2/index.full.min.js"></script>
              <script src="${basePath}/cdn/mitt/mitt.umd.js"></script>
              <script src="${basePath}/cdn/vue-router/4.6.3/vue-router.global.prod.js"></script>
              <script src="${basePath}/lib/screenwright.umd.js"></script>
              <title>${title}</title>
              <style>
                body {
                  padding: 0;
                  margin: 0;
                  text-decoration: unset;
                }
                html, body, #screenwrightApp {
                  height: 100%;
                  width: 100%;
                  font-family: Source Han Sans CN-Regular, Source Han Sans CN;
                }
              </style>
              <script>
                window.emitter = window.mitt();
                window.emitter.on('post-inside-message', (data) => {
                  window.parent.postMessage({ ...data }, '*');
                })
                window.addEventListener('message', (e) => {
                  e.preventDefault()
                  window.emitter.emit('post-outside-message', { ...e.data })
                }, false)

                function GetQueryString(name) {
                  var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
                  var r = window.location.search.substr(1).match(reg);
                  if (r != null) return unescape(r[2]);
                  return null;
                }
                // 特殊处理
                const htmlDom = document.querySelector('html');
                if(htmlDom) htmlDom.addEventListener('mousedown', (e) => {
                  if (e.target.tagName !== 'HTML') return;
                  window.parent.postMessage({ key: 'down' }, '*');
                })
              </script>
            </head>

            <body>
              <div id="screenwrightApp">
                <screenwright-app :data="option"></screenwright-app>
              </div>
              <script>
                const { createApp } = Vue;
                const app = createApp({
                  setup() {
                    return {
                      props: {
                        id: GetQueryString("id"),
                        name: "view",
                        userInfo: '${userInfo}'
                      },
                      option: option
                    };
                  },
                });
                app.use(screenwright.router);
                app.use(ElementPlus);
                app.use(screenwright.default)
                app.mount("#screenwrightApp");
              </script>
            </body>
          </html>`;
};

// 单独依赖的文件处理
const exportJsFoDepend = (path: string, includeSet: any[] = []) => {
  let jsScript = "";
  let jsFile: any[] = [];
  for (let i = 0; i < includeSet.length; i++) {
    if (includeSet[i].includes("sw-h5player") || includeSet[i].includes("ct-video-panel")) {
      jsScript += `<script src="${path}/cdn/h5player/h5player.min.js"></script>`;
      jsFile.push({
        filename: "h5player.min.js",
        filedir: "public/cdn/h5player",
        filepath: `${path}cdn/h5player/h5player.min.js`
      });
    }
    if (includeSet[i].includes("pdfjs-viewer")) {
      jsScript += `<script src="${path}/cdn/pdfjs/pdf.min.js"></script>
                  <script src="${path}/cdn/pdfjs/pdf.worker.min.js"></script>`;
      jsFile = jsFile.concat([
        {
          filename: "pdf.min.js",
          filedir: "public/cdn/pdfjs",
          filepath: `${path}cdn/pdfjs/pdf.min.js`
        },
        {
          filename: "pdf.worker.min.js",
          filedir: "public/cdn/pdfjs",
          filepath: `${path}cdn/pdfjs/pdf.worker.min.js`
        }
      ]);
    }
  }
  jsFile = jsFile.concat([
    {
      filename: "vue-router.global.prod.js",
      filedir: "public/cdn/vue-router/4.6.3",
      filepath: `${path}cdn/vue-router/4.6.3/vue-router.global.prod.js`
    }
  ]);

  return {
    jsScript,
    jsFile
  };
};

export function getTcpNoticeWebsocketUrl() {
  let url = "";
  let websocketHost = "";
  let protocol = "";
  const { VUE_APP_API_BASE_URL } = process.env || {};
  const { WEB_APP_API_BASE_URL } = (window as any).webconfig || {};
  const baseURL = WEB_APP_API_BASE_URL || VUE_APP_API_BASE_URL;
  if (baseURL) {
    websocketHost = baseURL.slice(baseURL.indexOf("//")).split(":")[0] + "/bi-application";
    protocol = baseURL.slice(0, baseURL.indexOf("//")) === "https:" ? "wss:" : "ws:";
    url = `${protocol + websocketHost}/webSocket`;
  }
  return url;
}
