import { ElMessage } from "element-plus";
import JSZip from "jszip";
import { isArray } from "lodash-es";

import { queryBlueprint } from "@/api/build";
import { downloadMinioFile, getJSFile, getMinoZip } from "@/api/version";
import { getQuoteScreenObj, getScreenObj } from "@/api/visual";
import { useBluePrint } from "@/hooks/useBluePrint";
import { useNotify } from "@/hooks/useNotify";
import { deleteActive, getActive } from "@/utils/auth";
import to from "@/utils/await-to-js";
import { BaseName } from "@/utils/config";
import { downFile } from "@/utils/config";
import { fileContent, fontFamilyList, publicFileList } from "@/utils/fileString";
import { pipeValidator } from "@/utils/pipeValidator";
import { request } from "@/utils/service";
import { roleEquitiesMessage, setExpirationDate } from "@/utils/utils";

import type {
  // AsyncQuoteParams,
  Component,
  ExportConfig,
  ExportParams,
  InstructionParams,
  LayerConfigParams,
  TempMode
} from "./type";
import { PackageType } from "./type";

const { notify } = useNotify();
const { initBluePrint, eventListMap } = useBluePrint();
const { System } = BaseName;
// 默认外层配置
const config: ExportConfig = {
  tempMode: {} as TempMode,
  appId: 0,
  appName: "",
  outputType: "package", // 默认值
  outputName: "cloudBI",
  prohibitionZone: {},
  filterFields: ["引用面板"],
  exportNotify: null
};
export const parseJSONString = (str: string | object | null): any => {
  if (!str) {
    return null;
  }
  return typeof str === "string" ? JSON.parse(str) : str;
};

/**
 * outputExportFile 输出文件
 * @param {*} id 大屏id
 * @param {*} type 整个工程或者exe程序 package|package_exe|package_nginx
 * @param {*} name 输出名称
 * @param {*} prohibition 第一层禁制:ihl隐藏加载图标、iwm去掉水印、ed有效期等
 */
export const outputExportFile = async (configParam: ExportParams) => {
  const { id, type = "package", name = "", prohibition } = configParam;
  config.appId = id;
  config.appName = name;
  config.outputType = type;
  config.prohibitionZone = prohibition;
  config.outputName = name ? name + type?.replace("package", "") : "cloudBI";
  const [error, res] = await to(getScreenObj(id));

  if (error || !res?.result) {
    notify({ message: "获取大屏配置失败", type: "error" });
    return false;
  }

  const { result } = res;
  const aniFrameSet = parseJSONString(result.aniFrameSet ?? "{}");
  const statusAnimation = parseJSONString(result.statusAnimation ?? "{}");
  const detail = parseJSONString(result.detail);
  const dataFilterArr = parseJSONString(result.dataFilterArr);
  const layers = parseJSONString(result.layers);
  const encodedControl = parseJSONString(result.encodedControl);
  const configControl = parseJSONString(result.config);

  const component = layers.map((item: string) => JSON.parse(item));
  await handleBluePrint(component, id);

  // 处理模板
  const canHandleTemplate = await new pipeValidator().add(() => handleUETemplate(component)).validate();
  if (!canHandleTemplate) {
    return false;
  }
  config.tempMode = {
    aniFrameSet,
    dataFilterArr,
    detail,
    component,
    prohibition,
    encodedControl,
    config: configControl,
    statusAnimation
  };

  // 判断是否存在引用面板
  const hasExtend = component.some((ey: Component) => config.filterFields.includes(ey.title));
  if (!hasExtend) {
    return await outputZip(config.tempMode);
  }

  const extendLayers = component.filter((ft: Component) => config.filterFields.includes(ft.title));

  return await handleQuote(extendLayers);
};

// 处理蓝图事件函数
const handleBluePrint = async (component: Component[], id: number) => {
  await initBluePrint(`${id}`);
  if (eventListMap.value && Object.keys(eventListMap.value).length > 0) {
    for (let i = 0; i < component.length; i++) {
      const target = component[i];
      const id = target.id;
      if (eventListMap.value[id]) {
        target.events = [...target.events, ...eventListMap.value[id]];
      }
    }
  }
};

export async function handleUETemplate(component: Component[]) {
  const currentUeTemplateIdx = component.findIndex((item) => item.title === "UE模板");
  if (currentUeTemplateIdx >= 0) {
    const currentUeTemplate = component[currentUeTemplateIdx];
    const ueSceneId = currentUeTemplate.option.id || null;
    if (!ueSceneId) {
      return false;
    }
    const bluePrintRes = await queryBlueprint({ largeId: ueSceneId, password: "", type: 1 });
    if (bluePrintRes.code == 200) {
      const data = bluePrintRes.result;
      console.log(data, "UE模板数据");
      currentUeTemplate.option.outLineBlueprintUEResult = [
        {
          config: JSON.parse(data[0]?.config) || {},
          nodes: JSON.parse(data[0]?.nodes) || {}
        }
      ];
      console.log(currentUeTemplate.option, "UE模板数据");
      // component.splice(currentUeTemplateIdx, 1, currentUeTemplate);
      return true;
    } else {
      return false;
    }
  }
  return true;
}

/**
 * asyncQuote 获取引用面板的相关配置
 * @param {*} quoteArr 列表
 * @param {*} isQuote 是否引用请求
 * @param {*} quoteItem 引用对象
 * @param {*} isOuterTrigger 是否外层触发
 * @returns
 */
const handleQuote = async (quoteArr: Component[]) => {
  console.log("handleQuote", quoteArr);
  for (let i = 0; i < quoteArr.length; i++) {
    const quoteItem = quoteArr[i];
    const { displayList } = quoteItem.option;
    if (displayList && isArray(displayList)) {
      const hasDisplayList = displayList.filter((a) => a.value)?.length;
      if (hasDisplayList) {
        const res = await handleQuoteComponent(quoteItem, Number(config.appId));
        if (res && isArray(quoteItem.panelData) && quoteItem.panelData[res.status]) {
          quoteItem.panelData[res.status].id = res.id;
          quoteItem.panelData[res.status].config = [...res.component];
          quoteItem.panelData[res.status].detail = res.detail;
          quoteItem.status = res.status;
        } else {
          continue;
        }
      } else {
        continue;
      }
    }
  }
  console.log("onfig.tempMode", config.tempMode);
  return await outputZip(config.tempMode);
};
// 处理一层
export const handleQuoteComponent = async (quoteItem: Component, appid: number) => {
  if (quoteItem) {
    const { option, status } = quoteItem;
    if (option.displayList && isArray(option.displayList)) {
      const [error, res]: any = await to(
        getQuoteScreenObj({
          largeScreenId: appid,
          quoteId: option.displayList[Number(status)].value,
          status: 1,
          largeVersion: getActive("versionCode") || "1",
          quoteVersion: option.displayList[Number(status)].version || "1"
        })
      );

      if (error) {
        return false;
      }

      const datas = res.result;
      const layers = typeof datas.layers === "string" ? JSON.parse(datas.layers) : datas.layers;
      const component: any[] = [];
      if (layers.length) {
        layers.forEach((item: string) => {
          component.push(JSON.parse(item));
        });
      }
      return {
        status: Number(status),
        id: option.displayList[Number(status)].value,
        component: component,
        detail: JSON.parse(datas?.detail)
      };
    }
  }
};

// 返回minio匹配的资源路径集合
export const returnMinioList = (str: string) => {
  return [
    ...new Set(
      str.match(
        /(?<=version-test\/)[^"']{1,100}\.(gif|pdf|svg|png|jpg|jpeg|webm|mp4|glb|gltf|hdr|CUBE|db|webp|mov|geojson|ftg|fbx|splat|ply|ksplat)/gi
      )
    ),
    ...new Set(str.match(/(?<=metahuman\/public\/)[^"']{1,100}\.(webm|png)/gi))
  ];
};
/**
 * outputZip 执行文件输出
 * @param {*} mode
 */
const outputZip = async (mode: TempMode) => {
  const zip = new JSZip();
  let modeStr = JSON.stringify(mode);
  const modeList = returnMinioList(modeStr); // 返回minio匹配的资源路径集合
  let usedFontFamilyList = getUsedFontFamilyList(modeStr); // 提取被使用的字体
  let ueSceneConfig: any = null;
  // 判断场景是否添加UE/fte/ftcity/h5player
  const includeSet =
    modeStr.match(
      /"name":"(ue-vessel|map-talks|three-scene|ft-h5player|ct-video-panel|pdfjs-viewer|ft-carousel-image-v2|ft-unreal-engine)"/g
    ) || [];
  // 扁平化处理下提取的字体集合
  usedFontFamilyList = usedFontFamilyList.map((a: string) => a.split(",")).flat(1);
  // 过滤出被使用的字体的配置
  const filterFontFamilyList = fontFamilyList.filter((item: { label: any }) => usedFontFamilyList.includes(item.label));
  // 与默认导出的本地文件列表合并
  const publicFileLibrary: string[] = [...publicFileList(includeSet), ...filterFontFamilyList];
  console.log(mode, "publicFileLibrarypublicFileLibrarypublicFileLibrary");
  modeStr = modeStr.replace(/(version-test\/)|(metahuman\/public\/)/g, "./assets/"); // 统一匹配资源路径

  if (mode.component.find((a: { title: string }) => a.title === "UE模板")) {
    const ueTemplateOption = mode.component.find((a) => a.title === "UE模板")?.option || {};
    const { publishPath } = ueTemplateOption;
    const ueRes =
      publishPath !== undefined && typeof publishPath === "string" && publishPath
        ? await request({ url: publishPath, method: "get" })
        : null;
    console.log("UE模板数据", ueTemplateOption);
    ueSceneConfig = ueRes
      ? {
          code: (ueRes as any).code,
          result: {
            id: (ueRes as any).result.id,
            path: (ueRes as any).result.path,
            pakList: (ueRes as any).result.pakList,
            personalPakList: (ueRes as any).result.personalPakList
          }
        }
      : null;
  }
  // 默认cdn-draco
  // const [_error, cdnFile]: any = await to(getMinoZip("assets/public/cdn-draco.zip"))
  const [_error, cdnFile]: any = await to(getMinoZip("assets/public/cdn-new-draco.zip"));
  console.log(_error);
  setExportNotify(true, config.outputName, Math.floor(Math.random() * 10 + 50));
  const { iv, encryptedData, secretKey } = setExpirationDate(config.prohibitionZone.ed) || {};
  switch (config.outputType) {
    case "package":
      zip.file("view.js", getLayerConfigText({ modeStr, iv, encryptedData, secretKey }));
      zip.file("license.json", `{"a": "${iv}","b": "${encryptedData}","s": "${secretKey}","id": ${config.appId}}`);
      zip.file("index.html", fileContent(config.outputName, includeSet, ueSceneConfig));
      await zip
        .folder("public")
        ?.loadAsync(cdnFile)
        .then(() => true)
        .catch(() => false);
      // 组件内容（用于三维与组件的交互通信）
      // eslint-disable-next-line no-case-declarations
      const components = mode.component.map(({ name, title, id, data, children = [], panelData = [] }) => {
        // 动态面板
        const panelChilds = panelData.map((status) => {
          return {
            name: status.name,
            id: status.id,
            component: status.config.map((item: { name: any; title: any; id: any; data: any }) => {
              return {
                name: item.name,
                title: item.title,
                id: item.id,
                data: item.data
              };
            })
          };
        });
        // 分组
        const groupChilds = children.map((child: { id: any; name: any; title: any; data: any }) => {
          return {
            id: child.id,
            name: child.name,
            title: child.title,
            data: child.data
          };
        });
        return {
          name,
          title,
          id,
          data,
          children: panelChilds.length ? panelChilds : groupChilds
        };
      });
      zip.file(
        "components.xlsx",
        jsonToExcel(
          components.map((item: { data: any; children: any }) => {
            return {
              ...item,
              data: JSON.stringify(item.data),
              children: JSON.stringify(item.children)
            };
          }),
          "名称,类型,ID,数据,子组件",
          "str",
          "",
          "组件通信方法链接\n"
        )
      );
      if (mode.encodedControl) {
        zip.file(
          "README.md",
          getInstructionText({ system: System, appId: config.appId, encodedList: mode.encodedControl })
        );
      }
      break;
    case "package_exe":
      {
        const [_error, electronFile]: [any, any] = await to(getMinoZip("assets/public/FunBI-win32-x64.zip"));
        console.log(_error);
        setExportNotify(true, config.outputName, Math.floor(Math.random() * 10 + 60));
        // 解压electron基础包并整合
        await zip
          .loadAsync(electronFile)
          .then(() => true)
          .catch(() => false);
        await zip
          .folder("resources/app/screenwright/public")
          ?.loadAsync(cdnFile)
          .then(() => true)
          .catch(() => false);
        zip
          .folder("resources/app/screenwright")
          ?.file("view.js", getLayerConfigText({ modeStr, iv, encryptedData, secretKey, isExe: true }));
        zip
          .folder("resources/app/screenwright")
          ?.file("license.json", `{"a": "${iv}","b": "${encryptedData}","s": "${secretKey}","id": ${config.appId}}`);
        zip
          .folder("resources/app/screenwright")
          ?.file("index.html", fileContent(config.outputName, includeSet, ueSceneConfig));
      }
      break;
    case "package_nginx":
      {
        const [__error, nginxFile]: [any, any] = await to(getMinoZip("assets/public/FunBI-nginx-x64.zip"));
        console.log(__error);
        setExportNotify(true, config.outputName, Math.floor(Math.random() * 10 + 60));
        // 解压electron基础包并整合
        await to(zip.loadAsync(nginxFile));

        await zip
          .folder("html/public")
          ?.loadAsync(cdnFile)
          .then(() => true)
          .catch(() => false);
        zip.folder("html")?.file("view.js", getLayerConfigText({ modeStr, iv, encryptedData, secretKey }));
        zip.folder("html")?.file("license.json", `{"a": "${iv}","b": "${encryptedData}","s": "${secretKey}"}`);
        zip.folder("html")?.file("index.html", fileContent(config.outputName, includeSet, ueSceneConfig));
      }
      break;
    default:
      break;
  }

  // 离线版本处理逻辑
  const mapScene = mode.component.find((item: { title: string }) => item.title === "场景模板"); // 一个场景模型
  const { id: mapId } = mapScene?.option || {};
  const quoteScenes = mode.component.filter((item: { title: string }) => config.filterFields.includes(item.title)); // 多个引用面板
  const quoteSceneIds = quoteScenes.map((b: any) => {
    return b.option.displayList.map((c: { value: any }) => c.value);
  });
  downloadFileForOffline({
    zip,
    mapId,
    fileNameList: modeList,
    quoteSceneIds: quoteSceneIds.flat(1),
    publicFileLibrary
  });
  return true;
};
// 提取被使用过的字体
export const getUsedFontFamilyList = (str: string) => {
  return [...new Set(str.match(/(?<=('|")(.+?)fontFamily('|"): ?('|"))(.+?)(?=('|"))/gi))];
};

// 导出包用法说明txt
export const getInstructionText = ({ system, appId, encodedList }: InstructionParams) => {
  return `# 1. 文件结构说明
|-- assets/ 静态资源
|-- public/ 依赖脚本
|-- components.xlsx 图层信息
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
type: 类型(String)，消息类型，bi | ue（默认bi）
code: 编码(String)，对应图层的控制编码+数据value值，ue控制编码默认websocketCallUE
data: 数据(String|Object|Array)，消息数据

{
  "type": "bi",
  "code": "button-1",
  "data": ""
}
或
{
  "type": "ue",
  "code": "websocketCallUE",
  "data": "Monitor1"
}

# 当前大屏应用的控制编码集合如下:
[图层id]-[图层控制编码]-[图层数据value值]
${encodedList ? encodedList.join("\n") : "--"}
`;
};

/**
 * 导出 json 数据为 Excle 表格
 * @param {json} data 要导出的 json 数据
 * @param {String} head 表头, 可选 参数示例：'名字,邮箱,电话'
 * @param {String} type str为直接返回string内容,download为下载文件
 * @param {String} name 导出的文件名, 可选
 * @param {String} extend 拓展的内容
 */
const jsonToExcel = (data: any, head = "", type = "str", _name = "导出的文件名", extend: string): string => {
  console.log(_name);
  let str = "";
  const indent = type === "download" ? ",\t" : "\t";
  let curData = data;
  if (!Array.isArray(data)) {
    curData = [data];
  }
  if (!head && typeof curData[0] === "object") {
    for (const key in curData[0]) {
      str += key + indent;
    }
  } else {
    str += head.replace(/,/g, indent);
  }
  str += "\n";
  curData.forEach((item: { [x: string]: string }) => {
    for (const key in item) {
      str = `${str + item[key] + indent}`;
    }
    str += "\n";
  });
  if (extend) {
    str += `\n\n${extend}`;
  }
  return str; // 确保返回值为 string
};
// 导出包图层配置

export const getLayerConfigText = ({ modeStr, iv, encryptedData, secretKey, isExe }: LayerConfigParams): string => {
  return `const option = ${modeStr}; window.allCptsData = option.component; window.isFunBI_exe = ${
    isExe || false
  }; window.prohibitionZone = option.prohibitionZone;
  window.absSecretKey = { "a": "${iv}","b": "${encryptedData}","s": "${secretKey}" }`;
};

// 通知提示
export const setExportNotify = (isShow: boolean, name?: string, progress?: number | string, title?: string) => {
  if (isShow) {
    config.exportNotify = notify({
      title: "",
      message: `<div>
                    <div style="color: #555c75; font-size: 16px; font-weight: 600">${title ? title : "导出进度"}</div>
                    ${name} 正在构建 <span style="color: #555c75; font-weight: 600">${
                      progress || Math.floor(Math.random() * 10)
                    }%</span>，请稍等!
                  </div>`,
      customClass: "el-notification-custom",
      position: "bottom-right"
    });
  } else {
    config.exportNotify = null;
    if (!name) {
      ElMessage({
        type: "success",
        message: "导出完成，如果浏览器提示下载请允许！"
      });
    } else {
      ElMessage({
        type: "success",
        message: name
      });
    }
  }
};

/**
 * 下载本地资源库
 * * @param {*} { zip, fileNameList }
 * * @return {*}
 */
export const downloadFileForOffline = async ({ zip, fileNameList, publicFileLibrary }: any): Promise<any> => {
  const { outputName, outputType, appId } = config;
  const resource: any = await resDownloadMinioFile("", [...new Set(fileNameList)].join(","));
  if (resource === 984) {
    // 导出超限错误码
    // setExportNotify(false, "984");
    ElMessage({
      type: "error",
      message: "当前该用户已无导出大屏次数"
    });
    return roleEquitiesMessage();
  }
  setExportNotify(true, outputName, Math.floor(Math.random() * 10 + 80));

  // resource 资源如果大于1900MB则单独下载
  const assetsDir = zip.folder(getPackageAssetsDir(outputType));
  // 如果 resource 为 null（超时情况），跳过资源处理
  if (resource !== null) {
    if (resource && resource.size / 2 ** 20 > 1900) {
      downFile(resource, `${outputName}-${appId}-SR.zip`);
    } else if (resource) {
      // 存放资源的目录
      const files = new window.File([resource], String(appId), { type: "zip" });
      await to(assetsDir.loadAsync(files));
    }
  }

  // 本地引用库
  let addTotal = 0; // 文件插入时序
  publicFileLibrary.forEach(async (item: { filepath: any; filedir: string; filename: any }) => {
    try {
      console.log("加载本地库", item.filepath);
      const [_error, data] = await to(getJSFile(item.filepath));
      console.log(_error);
      // setExportNotify(true, outputName, Math.floor(90 + i));
      let file_dir =
        outputType === "package" ? zip : zip.folder(outputType == "package_exe" ? "resources/app/screenwright" : "html");
      // 目录分割
      const file_dir_arr = item.filedir.split("/");
      // 目录创建
      file_dir_arr.forEach((dir: any) => {
        if (dir) {
          file_dir = file_dir.folder(dir);
        }
      });
      // 目录下添加文件
      file_dir.file(item.filename, data);
    } catch (e) {
      console.log("文件异常：", e);
    } finally {
      addTotal = addTotal + 1;
      // 添加文件结束后执行导出
      if (addTotal === publicFileLibrary.length) {
        deleteActive("versionCode");
        await setExportNotify(false);
        /**
         * 在当前的文件夹级别生成一个完整的Zip文件
         */
        const [_error, zipFile]: [any, any] = await to(zip.generateAsync({ type: "blob" }));
        console.log(_error);
        downFile(zipFile, `${outputName}-${appId}.zip`);
      }
    }
  });
  setExportNotify(false, "导出完成");
};
// 下载资源文件zip包
export const resDownloadMinioFile = async (folder: string, fileName: string) => {
  const minioDownloadParam = {
    folder,
    fileName,
    id: config.appId,
    name: config.appName,
    type: 1,
    exportType: config.outputType === "package_nginx" ? 2 : config.outputType === "package_exe" ? 3 : 1,
    domain: "large_screen"
  };
  /**
   * @param fileName 需要下载的文件名，多个文件，逗号隔开
   * @param folder 需要下载的文件的上层目录
   * @returns 输出一个zip包地址，如果超时则返回 null
   */
  const startTime = Date.now();
  const [_error, res] = await to(downloadMinioFile(minioDownloadParam));
  if (_error || !res || !res.result) {
    return res?.code || _error;
  }

  // 检查是否超过 3 分钟（180000 毫秒）
  const elapsedTime = Date.now() - startTime;
  const TIMEOUT_MS = 3 * 60 * 1000; // 3 分钟

  if (elapsedTime > TIMEOUT_MS) {
    // 超时：直接下载文件，不加载到内存
    const downloadUrl = res.result.replace("version-test/", "");
    notify({
      message: "资源包较大，已启动浏览器下载，请手动解压并放入输出包的assets目录",
      type: "warning",
      duration: 10000
    });

    const { MINIO_DEFAULT_PREFIX, MINIO_BASE_URL } = process.env;
    downFile(
      `${MINIO_BASE_URL || ""}${MINIO_DEFAULT_PREFIX || ""}${downloadUrl}`,
      `${config.appName}-${config.appId}-SR.zip`
    );
    return null;
  }

  const [_error2, zipRes] = await to(getMinoZip(res.result.replace("version-test/", "")));
  if (_error2) {
    return _error2;
  }

  return zipRes;
};

export const getPackageAssetsDir = (field: string): string => {
  const assetPaths: Record<keyof typeof PackageType, string> = {
    [PackageType.package_exe]: "resources/app/screenwright/assets",
    [PackageType.package_nginx]: "html/assets",
    [PackageType.default]: "assets"
  };

  // 使用枚举中的键进行索引
  return assetPaths[field as keyof typeof PackageType] || assetPaths[PackageType.default];
};
