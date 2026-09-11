import { nextTick } from "vue";

import Flv from "flv.js";
import Hls from "hls.js";

// 取视频首帧 base64（用于视频封面预览）
export function getVideoBase64(url: string, type = "jpeg"): Promise<string> {
  return new Promise(function (resolve) {
    let dataURL = "";
    const video = document.createElement("video");
    video.setAttribute("crossOrigin", "anonymous"); // 处理跨域
    video.setAttribute("src", url);
    video.setAttribute("preload", "auto");
    video.addEventListener("loadeddata", function () {
      const canvas = document.createElement("canvas");
      const width = video.videoWidth || 400; // canvas的尺寸和图片一样
      const height = video.videoHeight || 240; // 设置默认宽高为 400 240
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")?.drawImage(video, 0, 0, width, height); // 绘制canvas
      dataURL = canvas.toDataURL(`image/${type}`); // 转换为base64
      resolve(dataURL);
    });
  });
}

export function isSupportedFlv(url: any, videoTips: HTMLElement, video: HTMLMediaElement, player?: any) {
  videoTips.innerHTML = "";
  const flvPlayer = Flv.createPlayer(
    {
      type: "flv",
      url,
      isLive: true,
      hasAudio: false,
      hasVideo: true,
      //@ts-ignore
      enableStashBuffer: true,
      stashInitialSize: 128
    },
    { deferLoadAfterSourceOpen: false }
  );
  flvPlayer.attachMediaElement(video);
  flvPlayer.load();
  // 在 this.player.load() 之后增加如下代码, 初始化 _remuxer
  const controller = player._transmuxer._controller;
  controller._remuxer = {
    flushStashedSamples: function () {
      console.log("flushStashedSamples");
    }
  };
  const playPromise = flvPlayer.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        flvPlayer.play();
      })
      .catch((err: unknown) => {
        console.log(err);
      });
  }
  return flvPlayer;
}
// 支持Hls格式回调 如果存在callback，返回实例不做事件监听
export function isSupportedHls(
  url: string,
  videoTips: HTMLElement,
  video: HTMLVideoElement,
  callback?: (hls: Hls) => void
) {
  const hls = new Hls();
  if (!url) return;
  hls.loadSource(url);
  hls.attachMedia(video);
  if (callback) return callback(hls);
  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    nextTick(() => {
      video.play();
      videoTips.innerHTML = "";
    });
  });
  hls.on(Hls.Events.ERROR, (event: string, data: any) => {
    if (data.fatal) {
      videoTips.innerHTML = "设备离线";
      switch (data.type) {
        case Hls.ErrorTypes.NETWORK_ERROR:
          // try to recover network error
          if (
            data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR ||
            data.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT ||
            data.details === Hls.ErrorDetails.MANIFEST_PARSING_ERROR
          ) {
            //@ts-ignore
            hls.loadSource(url);
          } else {
            hls.startLoad();
          }
          break;
        case Hls.ErrorTypes.MEDIA_ERROR:
          hls.recoverMediaError();
          break;
        default:
          hls.destroy();
          break;
      }
    }
  });
  // if (hls) hls.destroy();
  return hls;
}
