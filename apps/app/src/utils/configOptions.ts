export const configOpt = {
  width: 1920,
  height: 1080,
  scale: 1,
  initLoad: false,
  backgroundImage: "",
  backgroundColor: "rgba(35, 38, 48, 1)",
  showBackgroundImage: false,
  showScreenAdaptation: false,
  adaptationNorm: "default",
  adaptationType: 2,
  showScreenFilter: false,
  screenFilterInfo: {
    gaussianBlur: 0,
    brightness: 100,
    contrast: 100,
    grayscale: 0,
    hue: 0,
    saturate: 100,
    invert: 0,
    sepia: 0
  },
  showWaterMark: true,
  waterMark: {
    text: "Screenwright",
    fontFamily: "sans-serif",
    fontStyle: "normal",
    fontWeight: "normal",
    fontSize: 30,
    color: "rgba(100,100,100,0.5)"
  },
  gridDistance: 1,
  query: {},
  controlWebsocketUrl: "",
  heartbeatInterval: 15,
  terminalEnableArr: {}
  // dataFilterArr: {}
};
