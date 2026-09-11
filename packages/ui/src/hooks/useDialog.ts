import Dialog from "@/components/Dialog/index.vue";
import { useRenderBody } from "./useRenderBody";
import type { Options } from "./useRenderBody";
import type { ElDialog } from "element-plus";

type ElDialogInstance = InstanceType<typeof ElDialog>;
export type DialogProps = ElDialogInstance["$props"] & {};

type ExtractComponentProps<T> = T extends new (..._args: any) => { $props: infer P }
  ? P
  : T extends (..._args: any) => any
    ? T extends (..._args: any) => { __ctx: { props: infer P } }
      ? P
      : Record<string, unknown>
    : Record<string, unknown>;

export interface DialogOptions<T extends new (..._args: any) => { $props: any }> {
  DialogProps: DialogProps;
  componentProps: ExtractComponentProps<T>;
  component: T;
  closeBefore?: (_componentData: any, _done: () => void) => void;
  onClose?: () => void;
  center?: boolean;
  visible?: boolean;
  /**
   * 外层包裹容器的挂载点。不传时默认 document.body；传 string 选择器或 HTMLElement 可改挂到指定节点
   * （如构建页传 ".sw-build"，借助其 transform 堆叠上下文避免弹窗被遮挡）。
   */
  appendTo?: HTMLElement | string;
}

export const useDialog = () => {
  const dialog = useRenderBody(Dialog);
  return {
    dialog: <T extends new (..._args: any) => { $props: any }>(props: DialogOptions<T>) => dialog(props as unknown as Options),
    close: dialog.close
  };
};
