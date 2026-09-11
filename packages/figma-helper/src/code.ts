/// <reference types="@figma/plugin-typings" />

/**
 * Screenwright Figma 规范助手插件 - 主入口
 *
 * 这是 Figma 插件的主要执行文件，负责：
 * 1. UI 界面初始化
 * 2. 事件监听（选择变化、消息接收）
 * 3. 消息路由分发
 * 4. 各服务类的实例化和协调
 */

import type { PluginMessage, UIMessage } from "./types/index";
import { BoundsCalculator } from "./classes/BoundsCalculator";
import { TreeTraversalService } from "./classes/TreeTraversalService";
import { NamingService } from "./classes/NamingService";
import { AutoNamingService } from "./classes/AutoNamingService";
import { SelectionManager } from "./classes/SelectionManager";
import { PanelMergeAnalyzer } from "./classes/PanelMergeAnalyzer";
import { ImageCollectionService } from "./classes/ImageCollectionService";
import { ImageExportService } from "./classes/ImageExportService";
import { NamingValidationService } from "./classes/NamingValidationService";
import { FigmaRawConverter } from "./classes/FigmaRawConverter";

// ═══════════════════════════════════════════════════════════════════════════
// 服务实例化
// ═══════════════════════════════════════════════════════════════════════════

const selectionManager = new SelectionManager();
const naming = new NamingService();
const autoNaming = new AutoNamingService(naming);
const treeTraversal = new TreeTraversalService();
const panelMergeAnalyzer = new PanelMergeAnalyzer(treeTraversal);
const imageCollection = new ImageCollectionService();
const imageExport = new ImageExportService((msg) => figma.ui.postMessage(msg));
const namingValidation = new NamingValidationService();
const figmaRawConverter = new FigmaRawConverter();

// ═══════════════════════════════════════════════════════════════════════════
// UI 初始化
// ═══════════════════════════════════════════════════════════════════════════

figma.showUI(__html__, {
  width: 360,
  height: 580,
  title: "Screenwright 规范助手"
});

// ═══════════════════════════════════════════════════════════════════════════
// 事件监听：选择变化
// ═══════════════════════════════════════════════════════════════════════════

figma.on("selectionchange", () => {
  const msg: UIMessage = {
    type: "selectionChange",
    nodes: selectionManager.getSelectionInfo()
  };
  figma.ui.postMessage(msg);
});

// ═══════════════════════════════════════════════════════════════════════════
// 消息处理：来自 UI 的请求
// ═══════════════════════════════════════════════════════════════════════════

figma.ui.onmessage = async (msg: PluginMessage) => {
  switch (msg.type) {
    /**
     * 获取当前选择
     */
    case "getSelection": {
      const response: UIMessage = {
        type: "selectionChange",
        nodes: selectionManager.getSelectionInfo()
      };
      figma.ui.postMessage(response);
      break;
    }

    /**
     * 应用规范后缀
     * - mode: "append" 追加后缀，"replace" 替换现有后缀
     */
    case "applySuffix": {
      const count = naming.applySpecSuffix(msg.suffix, msg.mode);
      figma.ui.postMessage({ type: "applyResult", count } as UIMessage);
      figma.ui.postMessage({
        type: "selectionChange",
        nodes: selectionManager.getSelectionInfo()
      } as UIMessage);
      break;
    }

    /**
     * 一键规范命名
     * 从选中的顶层文件帧开始递归，按 Figma 节点类型批量打 BI 后缀
     */
    case "autoNameStructure": {
      const count = await autoNaming.autoName(msg.nodeId);
      figma.ui.postMessage({ type: "autoNameResult", count } as UIMessage);
      figma.ui.postMessage({
        type: "selectionChange",
        nodes: selectionManager.getSelectionInfo()
      } as UIMessage);
      break;
    }

    /**
     * 分析 Panel Merge 关系
     * 支持三种场景：
     * - 节点本身是 -merge frame → 列出兄弟 frames
     * - 节点是 -status → 列出兄弟 status 节点
     * - 节点在 -merge 内部 → 按名称路径/位置匹配
     */
    case "analyzePanelMerge": {
      const { sourceInfo, matches } = await panelMergeAnalyzer.analyze(msg.nodeId);
      figma.ui.postMessage({
        type: "panelMergeResult",
        sourceInfo,
        matches
      } as UIMessage);
      break;
    }

    /**
     * 选择指定的节点
     */
    case "selectNodes": {
      await selectionManager.selectNodes(msg.nodeIds);
      break;
    }

    /**
     * 同步节点名称
     */
    case "syncNodeName": {
      const success = await selectionManager.syncNodeName(msg.nodeId, msg.newName);
      if (success) {
        figma.ui.postMessage({
          type: "syncResult",
          nodeId: msg.nodeId,
          newName: msg.newName
        } as UIMessage);
      }
      break;
    }

    /**
     * 扫描图片节点
     * 处理 -merge/-panel 去重逻辑
     */
    case "scanImageNodes": {
      const nodes = await imageCollection.scan(msg.nodeId);
      figma.ui.postMessage({
        type: "scanImageResult",
        nodes
      } as UIMessage);
      break;
    }

    /**
     * 导出图片
     * 支持普通节点和 Instance（自动转为 MainComponent）
     */
    case "exportImages": {
      await imageExport.export(msg.nodeIds);
      break;
    }

    /**
     * 导出图片（给 Minio 上传流程）
     */
    case "exportImagesForMinio": {
      await imageExport.exportForMinio(msg.nodeIds, figma.fileKey ?? null);
      break;
    }

    /**
     * UI 上传完一张，通知主线程继续导出下一张
     */
    case "minioUploadNext": {
      imageExport.notifyMinioUploadDone();
      break;
    }

    /**
     * 扁平化处理并返回树状结构
     * 经过 StructuralProcessor 处理后，返回携带语义标签的树
     */
    case "scanStructureTree": {
      const tree = await imageCollection.scanStructureTree(msg.nodeId);
      figma.ui.postMessage({
        type: "scanStructureTreeResult",
        tree
      } as UIMessage);
      break;
    }

    /**
     * 扫描命名不规范的子节点
     * 遍历选中节点下所有 -panel/-merge/-group 容器，
     * 收集其直接子节点中命名不合规的项
     */
    case "scanNamingIssues": {
      const issues = await namingValidation.scan(msg.nodeId);
      figma.ui.postMessage({
        type: "scanNamingIssuesResult",
        issues
      } as UIMessage);
      break;
    }

    /**
     * 创建选项卡模板（subtab + 3个 tabitem）
     */
    case "createSubtabTemplate": {
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });

      const ITEM_W = 200;
      const ITEM_H = 120;
      const ITEM_GAP = 16;

      // ── 创建 tabitem 组件的两个变体 ──────────────────────────────────────
      function buildTabItemVariant(state: "active" | "noaction"): ComponentNode {
        const comp = figma.createComponent();
        comp.name = `State=${state}`;
        comp.resize(ITEM_W, ITEM_H);
        comp.clipsContent = true;
        comp.fills = [];

        const img = figma.createRectangle();
        img.name = "image";
        img.resize(ITEM_W, ITEM_H);
        img.x = 0;
        img.y = 0;
        img.fills = [
          { type: "SOLID", color: state === "active" ? { r: 0.78, g: 0.82, b: 0.96 } : { r: 0.86, g: 0.86, b: 0.86 } }
        ];
        comp.appendChild(img);

        const text = figma.createText();
        text.name = "label";
        text.characters = "标题";
        text.fontSize = 14;
        text.fills = [
          { type: "SOLID", color: state === "active" ? { r: 0.263, g: 0.275, b: 0.792 } : { r: 1, g: 1, b: 1 } }
        ];
        text.x = Math.round((ITEM_W - text.width) / 2);
        text.y = ITEM_H - text.height - 12;
        comp.appendChild(text);

        return comp;
      }

      const tabLabels = ["三大发展历程", "四大核心技术", "五大深耕行业"] as const;

      // ── 为每个 tabitem 创建独立的组件集（active + noaction 两个变体）───────
      const tabitemSets: ComponentSetNode[] = [];
      const activeComps: ComponentNode[] = [];

      tabLabels.forEach((label) => {
        const activeComp = buildTabItemVariant("active");
        const noactionComp = buildTabItemVariant("noaction");

        // 将各自的标题写入默认文字
        for (const comp of [activeComp, noactionComp]) {
          const t = comp.findOne((n) => n.name === "label") as TextNode | null;
          if (t) t.characters = label;
          const img = comp.findOne((n) => n.name === "image") as RectangleNode | null;
          if (img) img.name = `${label}-image`;
        }

        noactionComp.x = ITEM_W + 40;

        figma.currentPage.appendChild(activeComp);
        figma.currentPage.appendChild(noactionComp);

        const set = figma.combineAsVariants([activeComp, noactionComp], figma.currentPage);
        set.name = `${label}-tabitem`;

        tabitemSets.push(set);
        activeComps.push(activeComp);
      });

      // ── 创建 subtab 组件，内含每个 tabitem 的 active 实例 ────────────────
      const subtabComp = figma.createComponent();
      subtabComp.name = "主题选择1-subtab";
      subtabComp.resize(ITEM_W * tabLabels.length + ITEM_GAP * (tabLabels.length - 1), ITEM_H);
      subtabComp.fills = [];
      subtabComp.clipsContent = false;

      activeComps.forEach((activeComp, index) => {
        const instance = activeComp.createInstance();
        instance.x = index * (ITEM_W + ITEM_GAP);
        instance.y = 0;
        subtabComp.appendChild(instance);
      });

      // ── 在画布上定位 ──────────────────────────────────────────────────────
      const center = figma.viewport.center;

      // tabitem 组件集横排放在上方
      let setX = center.x - (ITEM_W * tabLabels.length) / 2;
      tabitemSets.forEach((set) => {
        set.x = setX;
        set.y = center.y - set.height - 80;
        setX += set.width + 40;
      });

      subtabComp.x = center.x - subtabComp.width / 2;
      subtabComp.y = center.y;

      figma.currentPage.selection = [subtabComp];
      figma.viewport.scrollAndZoomIntoView([...tabitemSets, subtabComp]);

      figma.ui.postMessage({ type: "createSubtabTemplateResult", success: true } as UIMessage);
      break;
    }

    /**
     * 关闭插件
     */
    case "close": {
      figma.closePlugin();
      break;
    }

    /**
     * 获取当前文件 fileKey，并从选中节点向上查找 -exhibition 根节点
     */
    case "getNodeRawData": {
      const node = await figma.getNodeByIdAsync(msg.nodeId);
      const rawData = node ? figmaRawConverter.toNodesResponse(node) : { nodes: {} };
      const jsonStr = JSON.stringify(rawData);
      const bytes: number[] = [];
      for (let i = 0; i < jsonStr.length; i++) {
        const code = jsonStr.charCodeAt(i);
        if (code < 0x80) {
          bytes.push(code);
        } else if (code < 0x800) {
          bytes.push(0xc0 | (code >> 6));
          bytes.push(0x80 | (code & 0x3f));
        } else {
          bytes.push(0xe0 | (code >> 12));
          bytes.push(0x80 | ((code >> 6) & 0x3f));
          bytes.push(0x80 | (code & 0x3f));
        }
      }

      figma.ui.postMessage({
        type: "getNodeRawDataResult",
        nodeId: msg.nodeId,
        fileKey: figma.fileKey ?? null,
        bytes
      } as UIMessage);
      break;
    }

    /**
     * 下载节点数据：直接转换当前节点为 JSON 并返回
     */
    case "getNodeRawDataForDownload": {
      const node = await figma.getNodeByIdAsync(msg.nodeId);
      const rawData = node ? figmaRawConverter.toNodesResponse(node) : { nodes: {} };
      const jsonStr = JSON.stringify(rawData);
      const bytes: number[] = [];
      for (let i = 0; i < jsonStr.length; i++) {
        const code = jsonStr.charCodeAt(i);
        if (code < 0x80) {
          bytes.push(code);
        } else if (code < 0x800) {
          bytes.push(0xc0 | (code >> 6));
          bytes.push(0x80 | (code & 0x3f));
        } else {
          bytes.push(0xe0 | (code >> 12));
          bytes.push(0x80 | ((code >> 6) & 0x3f));
          bytes.push(0x80 | (code & 0x3f));
        }
      }
      figma.ui.postMessage({
        type: "getNodeRawDataForDownloadResult",
        nodeId: msg.nodeId,
        bytes
      } as UIMessage);
      break;
    }

    /**
     * 代理 HTTP 请求（绕过 UI iframe 的 Mixed Content 限制）
     */
    case "httpRequest": {
      try {
        const res = await fetch(msg.url, {
          method: msg.method,
          headers: msg.headers,
          body: msg.body
        });
        const body = await res.text();
        figma.ui.postMessage({
          type: "httpResponse",
          requestId: msg.requestId,
          ok: res.ok,
          status: res.status,
          body
        } as UIMessage);
      } catch (e) {
        const errMsg = e instanceof Error ? `${e.name}: ${e.message}` : JSON.stringify(e);
        console.error("[httpRequest] fetch failed:", msg.url, errMsg);
        figma.ui.postMessage({
          type: "httpResponse",
          requestId: msg.requestId,
          ok: false,
          status: 0,
          body: errMsg
        } as UIMessage);
      }
      break;
    }

    /**
     * 未知消息类型
     */
    default: {
      const _exhaustive: never = msg;
      return _exhaustive;
    }
  }
};
