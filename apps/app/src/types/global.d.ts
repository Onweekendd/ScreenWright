import { EventTypeEnum } from "@/views/build/components/buildConfig/constants/event";
import { ScreenwrightSdk } from "@/views/view/exportEntry";
import { IPeerStream } from "./peer-stream";

declare global {
  const __BUILD_MODE__: string;
  /**
   * @description 全局事件类型
   */
  type EventType =
    | EventTypeEnum.DataChange
    | EventTypeEnum.Change
    | EventTypeEnum.Click
    | EventTypeEnum.ContextmenuClick
    | EventTypeEnum.Ended
    | EventTypeEnum.MouseEnter
    | EventTypeEnum.MouseLeave
    | EventTypeEnum.UeToFunEvent
    | EventTypeEnum.ProjectToFunEvent
    | EventTypeEnum.ModelClick
    | EventTypeEnum.LayerClick
    | EventTypeEnum.VectorClick
    | EventTypeEnum.ThreeDTilesClick
    | EventTypeEnum.MultiplyModelClick
    | EventTypeEnum.MultiplyIconClick
    | EventTypeEnum.ChildComponentClick
    | EventTypeEnum.AfterSceneInit
    | EventTypeEnum.AfterUpdateState
    | EventTypeEnum.ModelNodeClick
    | EventTypeEnum.Controls
    | EventTypeEnum.SignatureSubmit
    | EventTypeEnum.VideoControls
    | EventTypeEnum.CardDropEnd
    | EventTypeEnum.CardBeforeExpand
    | EventTypeEnum.CardEndExpand
    | EventTypeEnum.CardStartCollapse
    | EventTypeEnum.CardEndCollapse
    | EventTypeEnum.ScrollEnd;

  /**
   * 仅供「离线导出包」使用：导出的静态 HTML 在打包时把这份配置内联进 index.html
   * （见 exportTemplate.ts 的 renderIndexHtml），运行 app 本身不再依赖它——
   * 接口/minio 等地址已改为构建期直接读 process.env，不再支持运行时用 webconfig.js 覆盖。
   */
  interface WebConfig {
    /** 终端控制websocket地址 */
    controlWebsocketUrl?: string;
    /** tcp通知websocket地址 */
    tcpNoticeWebsocketUrl?: string;
    [key: string]: any;
  }

  /**
   * @description UE4 回调函数接口
   */
  interface UeCallback {
    callback: (data: unknown) => void;
  }

  /**
   * @description UE4 接口定义
   */
  interface Ue4Interface {
    v2?: (name: string, data: unknown) => void;
    [key: string]: UeCallback | boolean | undefined;
  }

  /**
   * @description UE 接口定义
   */
  interface UeInterface {
    interface: {
      [key: string]: UeCallback;
    };
  }

  interface Window {
    funPS: IPeerStream | null;
    ue4: any;
    funPS: IPeerStream | null;
    ue4: Ue4Interface;
    ue: UeInterface;
    playerStream: any;

    /**
     * 录音器构造函数 (recorder-core.js)
     * recorder-core.js 会将 Recorder 对象挂载到 window.RecorderIns
     */
    RecorderIns?: any;
    Recorder?: any;

    /**
     * 只有在开发中才会存在
     * 用于调试
     */
    allComponentMap?: Map<string, ComponentType>;

    playerStream: any;
    /** 只有离线导出包会内联注入，正常运行的 app 里不存在，读取前要判空 */
    webconfig?: WebConfig;
    screenwright: {
      sdk: ScreenwrightSdk;
    };
    ftapi: any;

    importDiaplayCallback?: (data?: unknown) => void;
  }
}

export {};
