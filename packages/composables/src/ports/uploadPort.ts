import { useDialog } from "@screenwright/ui/use-dialog";
import type { Component } from "vue";

import { uploadFile } from "../upload/uploadFile";

/**
 * SwUpload 组件（物料包 60+ 配置面板复用）需要“上传文件”和“打开素材选择弹窗”两个能力：
 * 上传文件（含压缩 + minio 上传）已下沉为 use 包内建实现（见 upload/uploadFile）；
 * “打开素材选择弹窗”仍依赖 app 内的素材库数据与浏览 UI，是真正的 IO/业务边界，继续以端口形式注入。
 *
 * 素材选择弹窗拆成两半：
 * - “弹窗怎么弹出来”这套通用机制（/ui 的 useDialog）留在这里，由 useUpload() 自己持有——
 *   useDialog() 内部用 getCurrentInstance() 拿组件的 appContext（弹窗里的子组件才能正常用
 *   useRoute()/全局插件等），这要求它必须在“组件 setup 执行期间”被调用，不能放进点击时才执行的
 *   注入回调里，所以只能在 useUpload() 自身被调用（即物料组件 setup 阶段）时调用一次。
 * - “弹窗里显示什么、怎么把选中结果转成标准 payload”是真正的 app 业务边界，通过 initAssetsPicker
 *   注入（素材库数据拉取、分类展示都是 app 专属逻辑，不下沉）。
 */
export enum FileType {
  img = "img",
  video = "video",
  audio = "audio",
  model = "model",
  file = "file",
  imgAndVideo = "imgAndVideo"
}

export interface FtUploadChangePayload {
  url: string;
  [key: string]: any;
}

export type UploadFn = (
  file: File,
  fileType: FileType,
  largeId?: string | number
) => Promise<FtUploadChangePayload | null>;

export interface AssetsPickerImpl {
  /** 素材选择器的具体 UI 组件（如 SelectAssets），需通过 defineExpose 暴露 validate() */
  component: Component;
  /** 把组件 validate() 返回的原始结果转换为标准 payload；返回 null 表示校验未通过，不触发选中回调 */
  toPayload: (validated: any, fileType: FileType) => FtUploadChangePayload | null;
}

let assetsPickerImpl: AssetsPickerImpl | null = null;

/** 由主应用在启动时调用一次，注入素材选择器组件（未注入时“选择素材”按钮不显示）。 */
export function initAssetsPicker(impl: AssetsPickerImpl): void {
  assetsPickerImpl = impl;
}

export function useUpload() {
  const { dialog } = useDialog();

  const upload: UploadFn = (file, fileType, largeId) => uploadFile(file, fileType, largeId);

  const openAssets = (onSelect: (payload: FtUploadChangePayload) => void, fileType: FileType) => {
    if (!assetsPickerImpl) {
      return;
    }
    const picker = assetsPickerImpl;
    dialog({
      DialogProps: {
        title: "选择素材",
        width: "980px",
        modalClass: "build-render-ignore"
      },
      componentProps: {},
      component: picker.component as any,
      closeBefore: (componentData: any, done: () => void) => {
        const payload = picker.toPayload(componentData.validate(), fileType);
        if (payload) {
          onSelect(payload);
        }
        done();
      }
    });
  };

  return {
    upload,
    openAssets,
    hasAssets: !!assetsPickerImpl
  };
}
