import axios from "axios";
import { ElLoading, ElMessage } from "element-plus";
import { cloneDeep } from "lodash-es";
// @ts-ignore 忽略类型检查
import PSD from "psd.js";

import { addLayers, minioUploadImageFile } from "@/api/layer";
import { getModuleInfo, updateLayers } from "@/api/library";
import { fontFamily } from "@/utils/config";
import { dataURLtoFile } from "@/utils/utils";

/**
 * figma 格式解析 Client
 * @param {*} option
 * @returns
 */
const Client = (option: any) => {
  const headers = option.accessToken
    ? {
        Authorization: "Bearer ".concat(option.accessToken)
      }
    : {
        "X-Figma-Token": option.personalAccessToken
      };
  const client = axios.create({
    baseURL: "https://".concat(option.apiRoot || "api.figma.com", "/v1/"),
    headers: headers
  });
  return {
    client,
    file: (fileId: string, params: Record<string, any> = {}) => {
      if (params === void 0) {
        params = {};
      }
      return client.get("files/".concat(fileId), {
        params: { ids: Array.isArray(params.ids) ? params.ids.join(",") : params.ids || "" }
      });
    },
    fileVersions: function (fileId: string) {
      return client.get("files/".concat(fileId, "/versions"));
    },
    fileNodes: function (fileId: string, params: Record<string, any> = {}) {
      return client.get("files/".concat(fileId, "/nodes"), { params });
    },
    fileImages: function (fileId: string, params: Record<string, any> = {}) {
      return client({
        url: "images/".concat(fileId),
        method: "get",
        params: params,
        timeout: 0
      });
    },
    fileImageFills: function (fileId: string) {
      return client.get("files/".concat(fileId, "/images"));
    },
    comments: function (fileId: string) {
      return client.get("files/".concat(fileId, "/comments"));
    },
    postComment: function (fileId: string, params: Record<string, any>) {
      return client.post("files/".concat(fileId, "/comments"), params);
    },
    deleteComment: function (fileId: string, commentId: string) {
      return client.delete("files/".concat(fileId, "/comments/").concat(commentId));
    },
    me: function () {
      return client.get("me");
    },
    teamProjects: function (teamId: string) {
      return client.get("teams/".concat(teamId, "/projects"));
    },
    projectFiles: function (projectId: string) {
      return client.get("projects/".concat(projectId, "/files"));
    },
    teamComponents: function (teamId: string, params: Record<string, any> = {}) {
      if (params === void 0) {
        params = {};
      }
      return client.get("teams/".concat(teamId, "/components"), { params: params });
    },
    fileComponents: function (fileId: string) {
      return client.get("files/".concat(fileId, "/components"));
    },
    component: function (key: string) {
      return client.get("components/".concat(key));
    },
    teamComponentSets: function (teamId: string, params: Record<string, any> = {}) {
      if (params === void 0) {
        params = {};
      }
      return client.get("teams/".concat(teamId, "/component_sets"), { params: params });
    },
    fileComponentSets: function (fileId: string) {
      return client.get("files/".concat(fileId, "/component_sets"));
    },
    componentSet: function (key: string) {
      return client.get("component_set/".concat(key));
    },
    teamStyles: function (teamId: string, params: Record<string, any> = {}) {
      if (params === void 0) {
        params = {};
      }
      return client.get("teams/".concat(teamId, "/styles"), { params: params });
    },
    fileStyles: function (fileId: string) {
      return client.get("files/".concat(fileId, "/styles"));
    },
    style: function (key: string) {
      return client.get("styles/".concat(key));
    }
  };
};
const client = Client({
  personalAccessToken: "figd_UQXVZCbFUbt3Jzzq1X06W9hAZ6FwlQkkSImwagcQ" // 个人访问令牌
});

/**
 * 获取 Figma 文件节点
 * @param {*} fileId
 * @param {*} params
 * @returns
 */
export async function fetchFigmaFileNodes(fileId: string, params = {}) {
  const loadingInstance = ElLoading.service({
    lock: true,
    text: "",
    background: "rgba(0, 0, 0, 0.5)",
    spinner: ""
  });
  try {
    const response = await client.fileNodes(fileId, params);
    console.log("Figma file nodes response:", response);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching Figma file:", error);
    if (error.response && error.response.status === 429) {
      ElMessage.error("请求过于频繁，请稍后再试！");
    }
    throw error;
  } finally {
    loadingInstance.close();
  }
}

/**
 * 获取 Figma 文件图片
 * @param {*} fileId
 * @param {*} params
 * @returns
 */
export const fetchImageUrls = async (fileId: string, params: Record<string, any>) => {
  // const loadingInstance = Loading.service({ text: '', background: 'rgba(0,0,0,0.25)', spinner: '' });
  try {
    // const ids = Array.isArray(imageRefs) ? Object.keys(imageRefs).join(',') : imageRefs
    const response = await client.fileImages(fileId, params);
    return response.data.images;
  } catch (error) {
    console.error("Error fetching image URLs:", error);
    // throw error;
    return {};
  } finally {
    // loadingInstance.close();
  }
};

function parseGradientAngle(gradientHandlePositions: any[]) {
  if (!gradientHandlePositions || gradientHandlePositions.length < 2) {
    console.warn("Invalid gradient handle positions:", gradientHandlePositions);
    return null;
  }

  const [p1, p2] = gradientHandlePositions;

  // 计算向量 (dx, dy)
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  // 使用 atan2 计算弧度值
  const theta = Math.atan2(dy, dx);

  // 将弧度转换为角度
  const angle = (theta * 180) / Math.PI;

  // 确保角度在 [0, 360) 范围内
  return (angle + 360) % 360;
}

/**
 * 获取文本填充颜色
 * @param {*} fills
 * @param {*} flag
 * @returns
 */
function getTextFillColor(fills: any[], flag: boolean) {
  if (!fills || fills.length === 0) {
    return "#ffffff"; // 默认白色
  }
  // 纯色 - solid
  const solidFill = fills.find((fill) => fill.type === "SOLID");
  if (solidFill && solidFill.color) {
    const { color, opacity } = solidFill;
    return flag ? "" : `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${opacity || color.a})`;
  }
  // 渐变色 - gradient-linear
  const gradientFill = fills.find((fill) => fill.type === "GRADIENT_LINEAR");
  if (gradientFill && gradientFill.gradientStops) {
    const { opacity, gradientStops, gradientHandlePositions } = gradientFill;
    const angle = parseGradientAngle(gradientHandlePositions) || 0;
    const color = gradientStops.map(
      (i: any) =>
        `rgba(${i.color.r * 255},${i.color.g * 255},${i.color.b * 255},${opacity || i.color.a}) ${i.position * 100}%`
    );
    /* {
      'background-image': `linear-gradient(${angle + 90}deg, ${color.join(',')})`,
      'background-clip': 'text',
      '-webkit-text-fill-color': 'transparent'
      }
    */
    return flag ? `linear-gradient(${angle + 90}deg, ${color.join(",")})` : `${color[0] || "#ffffff"}`;
  }

  return "#ffffff"; // 默认白色
}

export const parseFigmaData = (figmaData: any) => {
  const components: any[] = [];
  const { id, name, fileId, position, backgroundColor } = figmaData;
  const option = {
    id,
    name,
    fileId,
    backgroundColor,
    ...position
  };
  /**
   * 遍历 Figma 节点
   * @param {*} nodes
   * 目前已配置的节点类型
   * 框架frame | 分组group | 组件component 文本text 图片image 方形rectangle 椭圆ELLIPSE 矢量VECTOR
   * 未配置的节点类型
   * 组合subtract | 按钮button 等等
   * @param {*} isFrame
   */
  function traverseNodes(nodes: any[], isFrame = false, parentId = null, parentName = "") {
    console.log(isFrame, "isFrame");
    for (const node of nodes) {
      // node隐藏存在字段visible:false
      if (!("visible" in node && node.visible === false)) {
        // 框架frame | 分组group | 组件component 文本text 图片image 方形rectangle 椭圆ELLIPSE 矢量VECTOR
        if (node.type === "FRAME" || node.type === "GROUP" || node.type === "COMPONENT") {
          traverseNodes(node.children, false, node.id, node.name);
        } else {
          // const nodeType = node.fills?.[0]?.type;
          const component: any = {
            id: node.id,
            name: node.name,
            type: node.type,
            parentId,
            parentName,
            style: {
              width: node.absoluteBoundingBox.width,
              height: node.absoluteBoundingBox.height,
              position: node.absoluteBoundingBox
            }
          };
          // 除文本保持原类型，其他统一设置为IMAGE
          if (node.type === "TEXT") {
            component.text = node.characters;
            component.style.color = getTextFillColor(node.fills, false);
            component.style.fontSize = node.style?.fontSize || 16;
            component.style.fontFamily = node.style?.fontFamily;
            component.style.fontStyle = node.style?.fontStyle;
            component.style.letterSpacing = node.style?.letterSpacing;
            component.style.fontWeight = node.style?.fontWeight || "normal";
            component.style.lineHeight = node.style?.lineHeight || 40;
            component.style.textAlign = node.style?.textAlign || "left";
            component.style.gradient = getTextFillColor(node.fills, true);
            component.style.width = component.style.width + node.style?.fontSize / 3;
          } else {
            component.type = "IMAGE";
            component.image = ""; // node.fills?.[0]?.imageRef
          }

          components.push(component);
        }
      }
    }
  }

  traverseNodes(figmaData.children, true);

  return { components, option };
};

// 解析PSD并获取数据
export const getDataFromPSD = (url: string) => {
  return PSD.fromURL(url).then((psd: any) => {
    // 获取到整个psd的预览图
    const background = psd.image.toBase64();
    // 获取整个psd文件的实例
    const exportData = psd.tree().export();
    // 获取整个psd文件的宽度跟高度
    const { width, height } = exportData.document;
    // 获取整个psd文件的图层数据
    const children = psd.tree().children();
    // 时间戳
    const timestamp = Date.now() + 1 * 60 * 1000;

    const resultData: any[] = [];
    const layerData: any[] = [];
    function getChildrenData(parentGroup: any[], data: any[], count = 0) {
      let currentCount = count;
      data.forEach((item, index) => {
        if (item._children && item._children.length && item.layer.visible) {
          // 多层图层信息
          // const { name, type, left, top, width, height } = item;
          // parentGroup.push({
          //   name,
          //   type,
          //   left,
          //   top,
          //   width,
          //   height,
          //   children: []
          // });
          const zIndexlen = item._children.length;
          // getChildrenData(parentGroup[parentGroup.length - 1].children, item._children.reverse(), currentCount + index);
          getChildrenData([], item._children.reverse(), currentCount + index);
          currentCount += zIndexlen;
        } else if (item.layer.visible) {
          // 单层图层信息
          const typeTool = item.get("typeTool");
          currentCount += 1;
          if (typeof typeTool !== "undefined") {
            // 文本图层
            const { name, type, value, font, transform } = typeTool.export();
            // 字体样式
            const { colors, styles, alignment } = font;
            // 字体颜色
            const color = colors[0];
            const fontColor = `rgba(${color[0]},${color[1]},${color[2]}, ${item.layer.opacity / 255})`;
            // 获取文字的详细属性配置
            const StyleSheet =
              item.layer.adjustments.typeTool.obj.engineData.EngineDict.StyleRun.RunArray[0].StyleSheet || {};
            const { StyleSheetData } = StyleSheet;
            // 获取实际的字体大小。存在psd设置的单位可能为pt，所以要转成px单位
            const sizes = typeTool.sizes();
            let size = sizes[0];
            if (sizes && sizes[0]) {
              if (transform.yy !== 1) {
                size = Math.round(sizes[0] * transform.yy);
              } else {
                // transform.yy为1时，sizes[0]的值就是字体显示大小的值，不须要计算
                size = sizes[0];
              }
            }
            // 字体大小
            const fontSize = size;
            // 获取字体样式
            const fontFamily = typeTool.engineData.ResourceDict.FontSet[StyleSheetData.Font]?.Name;
            // 获取字体的排版
            const writingMode = item.layer.adjustments.typeTool.obj.textData.Ornt.value;
            const textAlign = alignment[0];
            // 获取字体间隙
            const letterSpacing = StyleSheetData.Tracking ? fontSize * (StyleSheetData.Tracking / 1000) : 0;
            // 获取行高
            const lineHeight = StyleSheetData.Leading;
            // const leading = (Math.round(lineHeight * transform.yy * 100) * 0.01) / fontSize
            // 获取字体是否加粗
            const fontWeight = !!(fontFamily.indexOf("Bold") !== -1 || fontFamily.indexOf("Bold") !== -1);
            const fontStyle = styles[0];
            // 文本图层阴影特效
            const objectEffects = item.layer.objectEffects ? item.layer.objectEffects() : {};
            let textShadow = "none";
            const { DrSh } = objectEffects.data || {};
            if (DrSh) {
              const clrStr = JSON.stringify(DrSh["Clr "]).split(",");
              let r = null;
              let g = null;
              let b = null;
              clrStr.forEach((item) => {
                if (item.indexOf("Rd") !== -1) {
                  r = item.replace('"Rd  ":', "");
                } else if (item.indexOf("Bl") !== -1) {
                  b = item.replace('"Bl  ":', "").replace("}", "");
                } else if (item.indexOf("Grn") !== -1) {
                  g = item.replace('"Grn ":', "");
                }
              });
              const angle = DrSh.lagl.value;
              const distance = DrSh.Dstn.value;
              const shadowColor = `rgba(${parseInt(r ?? "0")},${parseInt(g ?? "0")},${parseInt(b ?? "0")},${
                DrSh.Opct.value / 100
              })`;
              const x = distance * Math.tan((angle * Math.PI) / 180);
              const y = distance * Math.tan(((90 - angle) * Math.PI) / 180);
              textShadow = x + "px " + y + "px " + DrSh.blur.value + "px " + shadowColor;
            }
            const { width, height, left, top } = item.layer;
            const layerInfo = {
              moduleId: 63,
              name: name || item.name,
              type: type || item.type,
              value,
              left,
              top,
              width,
              height,
              zIndex: currentCount,
              font: {
                color: fontColor,
                fontSize,
                fontFamily,
                writingMode,
                lineHeight,
                textAlign,
                letterSpacing,
                fontWeight,
                fontStyle,
                textShadow,
                iswrap: alignment.length > 1
              }
            };
            // parentGroup.push(layerInfo);
            layerData.push(layerInfo);
          } else {
            // 图片图层
            const src = item.layer.image.length < 2000 ? item.layer.image.toBase64() : "";
            const { name, type, left, top, width, height } = item;
            const imageFile = dataURLtoFile(item.layer.image.toBase64(), `${name}.png`);
            const layerInfo = {
              name,
              type,
              left,
              top,
              width,
              height,
              src,
              imageFile,
              moduleId: 43,
              zIndex: currentCount,
              opacity: item.layer.opacity / 255
            };
            // parentGroup.push(layerInfo);
            layerData.push(layerInfo);
          }
        }
      });
    }
    getChildrenData(resultData, children.reverse());
    return {
      width,
      height,
      layerData,
      // resultData,
      background,
      timestamp
    };
  });
};
export const getModuleConfigById = async (moduleId: any) => {
  const moduleResult = await getModuleInfo(moduleId, false).then((res) => res.result || {});
  return moduleResult.javaScript ? JSON.parse(moduleResult.javaScript) : null;
};
// 更新图层数据
async function generalUpdateDesignLayer(info: any) {
  const { id, config, title } = info;
  let updateInfo = null;
  if (config) {
    updateInfo = JSON.parse(config);
  } else {
    updateInfo = info;
  }
  let params = {};
  if (title === "分组") {
    updateInfo.children = updateInfo.children.map((a: any) => a.id);
    params = { moduleId: 75 };
  }
  return await updateLayers({
    id,
    config: JSON.stringify(updateInfo),
    ...params,
    status: false,
    minioIds: "[]",
    dataJson: "{}"
  }).then((res) => res.result);
}
/**
 * 生成PSD图层
 * @param {*} params
 * @param {*} result
 * @returns
 */
export const generateLayersByPSD = async (params: any, result: any, callback: any) => {
  const { layerData } = params;
  //   const { id } = result
  const largeId = result.id;
  const currentIndex = result.zIndex || 0;
  const isUnshift = result.isUnshift || false;
  const panelDataConfig = []; // 组件图层id数据
  const panelDataNav = []; // 组件图层数据
  const asyncLayers = layerData.map((item: any, index: number) => {
    return {
      ...item,
      zIndex: currentIndex + index,
      func: async () => {
        return await addLayers({
          moduleId: item.moduleId,
          largeId,
          status: true,
          isSaved: 1
        }).then((res) => res.result);
      }
    };
  });
  for (const operation of asyncLayers) {
    try {
      const { name, width, height, top, left, moduleId, zIndex, imageFile } = operation;
      const layersResult = await operation.func();
      const option = await getModuleConfigById(moduleId);
      // 同步id、位置
      let optionObj = {
        ...option,
        cbArgs: [],
        name,
        left,
        top,
        zIndex: zIndex,
        id: layersResult.id,
        data: [
          {
            value: moduleId === 43 ? operation.src : operation.value
          }
        ]
      };
      // 图片43|文本框63的宽高
      Object.assign(optionObj.component, {
        width,
        height
      });
      // 图片
      if (operation.moduleId === 43 && imageFile) {
        const formData = new FormData();
        formData.append("name", `${name}.png`);
        formData.append("file", imageFile);
        formData.append("largeId", largeId);
        formData.append("fileType", "1");
        formData.append("resourceType", "1");
        const imageUrl = await minioUploadImageFile(formData).then((a) => a.result?.url || "");
        optionObj.data[0].value = imageUrl;
      }
      // 文本框
      if (operation.moduleId === 63) {
        const { font } = operation;
        optionObj.option.iswrap = font.iswrap;
        optionObj.option.color = font.color || "#ffffff";
        optionObj.option.fontSize = font.fontSize || 16;
        optionObj.option.fontStyle = font.fontStyle || "normal";
        optionObj.option.fontWeight = font.fontWeight === "normal" ? false : true;
        optionObj.option.textAlign = font.textAlign || "center";
        optionObj.option.lineHeight = font.lineHeight || 40;
        optionObj.option.split = font.letterSpacing || 0;
        // 字体渐变暂未兼容
      }
      // 同时更新一次
      await generalUpdateDesignLayer(optionObj);
      panelDataConfig.push(optionObj.id);
      if (isUnshift) panelDataNav.push(optionObj);
      optionObj = null;
    } catch (error) {
      console.error("异步操作出错:", error);
    }
  }
  console.log("结束了，============");
  if (callback) {
    callback(panelDataConfig, panelDataNav);
  }
};
export const getChildrenRect = (children: any[]) => {
  const rect = {
    left: Number.MAX_SAFE_INTEGER,
    right: Number.MIN_SAFE_INTEGER,
    top: Number.MAX_SAFE_INTEGER,
    bottom: Number.MIN_SAFE_INTEGER
  };
  children.forEach((child) => {
    rect.left = Math.min(rect.left, child.left);
    rect.top = Math.min(rect.top, child.top);
    rect.right = Math.max(rect.right, child.left + child.component.width);
    rect.bottom = Math.max(rect.bottom, child.top + child.component.height);
  });
  return rect;
};
// 插入到分组：75
async function saveAndComposeLayers({ largeId, child, name, zIndex } = {} as any) {
  const layersResult = await addLayers({
    moduleId: 75,
    largeId,
    status: true,
    isSaved: 1
  }).then((res) => res.result);
  const groupOption = await getModuleConfigById(layersResult.moduleId);
  const optionObj = { ...groupOption };
  // 同步id、位置
  Object.assign(optionObj, { id: layersResult.id });
  for (let i = 0; i < child.length; i++) {
    const item = child[i];
    item.parent = optionObj.id;
    optionObj.children.unshift(item);
  }
  const rect = getChildrenRect(optionObj.children);
  optionObj.name = name;
  optionObj.top = rect.top;
  optionObj.left = rect.left;
  optionObj.zIndex = zIndex;
  optionObj.component.width = rect.right - rect.left;
  optionObj.component.height = rect.bottom - rect.top;
  optionObj.isOuter = true;
  optionObj.isExpand = false;
  await generalUpdateDesignLayer({ ...optionObj });
  // 最后再同步分组内图层
  for (let i = 0; i < optionObj.children.length; i++) {
    await generalUpdateDesignLayer(optionObj.children[i]);
  }
  // optionObj = null;
  return optionObj;
}

/**
 * 生成Figma图层
 */
export const generateLayersByFigma = async (params: any, result: any, callback: any) => {
  const { components, option } = params;
  const largeId = result.id;
  const currentIndex = result.zIndex || 0;
  const isUnshift = result.isUnshift || false;
  const imageConfig = await getModuleConfigById(43);
  const textConfig = await getModuleConfigById(63);
  // 图片43 文本63
  const defaultLayersMap = new Map();
  const defaultLayersImages = [];
  const panelDataConfig: any[] = []; // 组件图层id数据
  const panelDataNav: any[] = []; // 组件图层数据
  const asyncLayers = components.map((item: any, index: number) => {
    return {
      ...item,
      zIndex: currentIndex + index,
      func: async () => {
        return await addLayers({
          moduleId: item.type === "IMAGE" ? 43 : 63,
          largeId,
          status: true,
          isSaved: 1
        }).then((res) => res.result);
      }
    };
  });
  for (const layer of asyncLayers) {
    const { name, style, zIndex, parentId } = layer;
    const layersResult = await layer.func();
    const layerConfig = layersResult.moduleId === 43 ? cloneDeep(imageConfig) : cloneDeep(textConfig);
    // 同步id、位置
    let optionObj = {
      ...layerConfig,
      cbArgs: [],
      name,
      left: style.position.x - option.x,
      top: style.position.y - option.y,
      zIndex: zIndex,
      id: layersResult.id,
      data: [
        {
          value: layer.text || ""
        }
      ]
    };
    // 图片43|文本框63的宽高
    Object.assign(optionObj.component, {
      width: style.width,
      height: style.height
    });
    // 图片异步去加载完成后再赋值更新
    if (layer.type === "IMAGE") {
      defaultLayersImages.push(layer.id);
      optionObj.imageId = layer.id;
    } else {
      // 文本框
      const fontFamilyName =
        fontFamily.find((item) => item.label === style.fontFamily)?.value || "Alibaba-PuHuiTi-Regular";
      Object.assign(optionObj.option, {
        fontFamily: fontFamilyName,
        fontSize: style.fontSize || 16,
        fontWeight: style.fontWeight || "normal",
        textAlign: style.textAlign || "center",
        lineHeight: style.lineHeight || 40,
        split: style.letterSpacing || 0,
        color: style.color || "#ffffff",
        selectedTextType: style.gradient ? "gradient" : "normal",
        selectedTextColor: style.gradient || "linear-gradient(0.0deg,rgba(10,17,219,1) 0.0,rgba(137,181,252,1) 100.0%)"
      });
    }
    if (defaultLayersMap.get(parentId)) {
      defaultLayersMap.set(parentId, [...defaultLayersMap.get(parentId), optionObj]);
    } else {
      defaultLayersMap.set(parentId || optionObj.id, [optionObj]);
      // 同时更新一次
      await generalUpdateDesignLayer(optionObj);
    }
    optionObj = null;
  }
  // 插入分组
  let groupZIndex = currentIndex;
  for (const item of Array.from(defaultLayersMap.entries())) {
    const [key, value] = item;
    groupZIndex = groupZIndex + 1;
    if (key && value.length > 1) {
      const currentGroup = await saveAndComposeLayers({
        largeId,
        child: value,
        name: "分组" + key,
        zIndex: groupZIndex
      });
      panelDataConfig.push(currentGroup.id);
      if (isUnshift) panelDataNav.push(currentGroup);
    } else {
      panelDataConfig.push(value[0].id);
      if (isUnshift) panelDataNav.push(value[0]);
    }
  }
  await waitPatientlyUpdateLayers(Array.from(defaultLayersMap.entries()), option.fileId, largeId, (count) => {
    console.log("count:zzzzzzzz ", count, defaultLayersImages.length);
    if (callback && count === defaultLayersImages.length) {
      callback(panelDataConfig, panelDataNav);
    }
  });
};
export const fetchImageBlob = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("网络响应异常");
  return await response.blob();
};
export const processImage = async (imageUrl: string, fileName = "image.png") => {
  try {
    // 获取Blob
    const blob = await fetchImageBlob(imageUrl);

    // 转换为File对象
    return new File([blob], fileName, { type: blob.type });
  } catch (error) {
    console.error("处理失败:", error);
    throw error;
  }
};

async function waitPatientlyUpdateLayers(
  ImageList: any[],
  fileId: string,
  largeId: string,
  callback: (count: number) => void
) {
  let count = 0;
  const layerList = [];
  for (const item of ImageList) {
    const [, value] = item;
    for (let i = 0; i < value.length; i++) {
      if (value[i].imageId) layerList.push(value[i]);
    }
  }
  // 1. 将数组分块
  const batches = [];
  for (let i = 0; i < layerList.length; i += 30) {
    batches.push(layerList.slice(i, i + 30));
  }
  // 2. 逐批处理
  for (const [index, batch] of batches.entries()) {
    try {
      const imageIds = batch.map((item) => item.imageId).join(",");
      fetchImageUrls(fileId, {
        ids: imageIds,
        format: "png",
        scale: 1
      }).then(async (imagesResult) => {
        for (let i = 0; i < batch.length; i++) {
          const item = batch[i];
          const imageFigmaURl = imagesResult[item.imageId];
          const imageFigmaFile = await processImage(imageFigmaURl, `${item.name}.png`);
          const formData = new FormData();
          formData.append("name", `${item.name}.png`);
          formData.append("file", imageFigmaFile);
          formData.append("largeId", largeId);
          formData.append("fileType", "1");
          formData.append("resourceType", "1");
          const imageUrl = await minioUploadImageFile(formData).then((a) => a.result?.url || "");
          item.data[0].value = imageUrl;
          count++;
          console.log(count, "countcount");
          await generalUpdateDesignLayer(item);
          if (callback) callback(count);
        }
      });
    } catch (error) {
      console.error(`第 ${index + 1} 批处理异常:`, error);
    }
  }
}
