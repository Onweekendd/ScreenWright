import exampleVideo from "@/assets/video/monitor.mp4";
import { setMinioUrl } from "@/utils/config";

interface CustomActionProps {
  type: "popover";
  width?: number;
  height?: number;
  widthIcon?: number;
  heightIcon?: number;
  backgroundImage?: string;
  paddingX?: number;
  paddingTop?: number;
  paddingBottom?: number;
  closeIcon?: string;
  topIcon?: number;
  rightIcon?: number;
  videoBoxShow?: boolean;
  closeShow?: boolean;
  fileType?: string;
  src?: string;
  source?: string;
  link?: string;
  mixBlendMode?: string;
  controls?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  visible?: boolean;
}

export const customAction: CustomActionProps = {
  type: "popover",
  width: 212,
  height: 150,
  widthIcon: 10,
  heightIcon: 10,
  backgroundImage: setMinioUrl("assets/scene/icon/example_bg1.png"),
  paddingX: 12,
  paddingTop: 16,
  paddingBottom: 38,
  closeIcon: setMinioUrl("assets/scene/icon/close.svg"),
  topIcon: 4,
  rightIcon: 4,

  videoBoxShow: false,
  closeShow: false,

  fileType: "mp4",
  src: exampleVideo,
  source: "upload",
  link: "",
  mixBlendMode: "normal",
  controls: true,
  autoplay: true,
  loop: true,
  muted: true,
  visible: true
};

interface defaultStatusOptionProps {
  name: string;
  url: string;
  iconScale: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  textBackground: string;
  fontWeight: string;
  fontStyle: string;
}

export const defaultStatusOption: defaultStatusOptionProps = {
  name: "",
  url: "version-test/assets/publicResource/publicIcon/3/point01.png",
  iconScale: 1,
  fontSize: 5,
  fontFamily: "Source Han Sans CN-Normal, Source Han Sans CN",
  color: "rgba(255, 255, 255, 1)",
  textBackground: "rgba(255, 255, 255, 0)",
  fontWeight: "normal",
  fontStyle: "normal"
};

interface twinPanelIconOfModelNodeProps {
  type: string;
  options: {
    action: string;
    scaleLock: boolean;
    isLock: boolean;
    visible: boolean;
    position: number[];
    scale: number[];
    rotation: number[];
    width: number;
    height: number;
    isOriginalSize: boolean;
    iconSize: string;
    sizeAttenuation: boolean;
    followCamera: string;
    originPoint: string;
    iconDisplayType: string;
    componentId?: string | number;
    correlation?: string;
    childComponentName?: string;
  };
}
// 用于根据模型节点位置生成孪生面板的默认配置
export const twinPanelIconOfModelNode: twinPanelIconOfModelNodeProps = {
  type: "twinPanelIcon",
  options: {
    action: "none",
    scaleLock: true,
    isLock: false,
    visible: true,
    position: [0, 0, 0],
    scale: [1, 1, 1],
    rotation: [0, 0, 0],
    width: 200,
    height: 100,
    isOriginalSize: false,
    iconSize: "fix",
    sizeAttenuation: false,
    followCamera: "all",
    originPoint: "center",
    iconDisplayType: "dom"
  }
};
