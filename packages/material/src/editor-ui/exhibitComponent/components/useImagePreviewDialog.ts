import { useDialog } from "@screenwright/ui";

import type { ImageItem } from "../types";
import imagePreviewContent from "./imagePreviewContent.vue";

export const useImagePreviewDialog = () => {
  const { dialog } = useDialog();

  const openImagePreview = (initial: ImageItem[], draggable?: boolean): Promise<ImageItem[]> => {
    return new Promise((resolve) => {
      let current: ImageItem[] = initial;
      dialog({
        DialogProps: {
          title: "图片预览",
          width: "800",
          modalClass: "build-render-ignore"
          //   .build-render-ignore
        },
        componentProps: {
          isDraggable: draggable,
          data: initial,
          onChange: (data: ImageItem[]) => {
            current = data.filter((v) => v.src);
          },
          onDragEnd: (data: ImageItem[]) => {
            current = data.filter((v) => v.src);
          }
        },
        onClose: () => {
          resolve(current);
        },
        component: imagePreviewContent
      });
    });
  };

  return {
    openImagePreview
  };
};
