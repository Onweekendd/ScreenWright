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

  interface WebConfig {
    /** 打包主目录 */
    WEB_APP_PUBLIC_PATH?: string;
    /** 系统接口服务 */
    WEB_APP_API_BASE_URL?: string;
    /** minio服务 */
    WEB_APP_MINIO_BASE_URL?: string;
    /** minio服务对应的库: version-test/ */
    WEB_APP_MINIO_DEFAULT_PREFIX?: string;
    /** 资源下载 */
    WEB_APP_RESOURCE_BASE_URL?: string;
    /** 说明文档 */
    WEB_APP_DOCUMENT?: string;
    /** 城市编辑器 */
    WEB_APP_CITY_EDITOR?: string;
    /** 私有化部署 */
    WEB_APP_PRIVATE_DEPLOYMENT?: boolean;

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
    webconfig: WebConfig;
    screenwright: {
      sdk: ScreenwrightSdk;
    };
    ftapi: any;

    importDiaplayCallback?: (data?: unknown) => void;
  }
}

export {};
