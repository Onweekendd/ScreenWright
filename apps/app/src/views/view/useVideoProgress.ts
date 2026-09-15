import { type ComponentType, MediaEnum } from "@screenwright/types";

import { interactiveEnum } from "@/components/componentEntry/type";
import { useActionEvent } from "@/hooks/eventHandling/useActionEvent";
import { setMinioUrl } from "@/utils/config";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

const useVideoProgress = () => {
  const { allComponentMap } = useGlobalComponentData();
  const { eventList } = useActionEvent();

  /**
   * 获取远程视频总时长（秒）
   * 仅加载元数据，不下载完整视频，自动释放内存
   */
  const getVideoDuration = (videoUrl: string): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.crossOrigin = "anonymous";

      // 元数据加载完成
      video.onloadedmetadata = () => {
        const duration = video.duration;
        // 释放资源
        video.removeAttribute("src");
        video.load();
        resolve(duration);
      };

      // 加载失败
      video.onerror = (e) => {
        reject(new Error(`视频时长获取失败：${videoUrl}`, { cause: e }));
      };

      video.src = videoUrl;
    });
  };

  /**
   * 初始化视频进度条控制
   * 关联视频组件 → 获取视频时长 → 同步给进度条组件
   */
  const initVideoProgressControl = async (components: ComponentType[]) => {
    // 筛选视频进度组件
    const videoProgressComponents = components.filter((item) => item.component.prop === interactiveEnum.videoProgress);
    if (videoProgressComponents.length === 0) {
      return;
    }

    // 遍历所有进度条组件
    for (const progressComp of videoProgressComponents) {
      const { relateComponentId = [] } = progressComp.option;

      // 遍历关联的视频组件ID
      for (const compId of relateComponentId) {
        const videoComponent = allComponentMap.value.get(String(compId));
        if (!videoComponent) {
          continue;
        }

        // 判断是否为视频组件
        const isVideo = videoComponent.component.prop === MediaEnum.SwVideo;
        if (!isVideo) {
          continue;
        }

        // 获取视频地址
        const videoData = videoComponent.data;
        if (!videoData?.length) {
          continue;
        }

        try {
          const rawUrl = videoData[0].value;
          const videoUrl = setMinioUrl(rawUrl);
          const duration = await getVideoDuration(videoUrl);

          // 同步总时长到进度条事件
          const prefix = `${progressComp.component.prop}-${progressComp.id}` as any;
          const videoProgress = eventList.value[prefix];
          if (videoProgress) {
            videoProgress.setTotalTime(duration);
          }
        } catch (err) {
          console.warn("[视频进度条] 获取时长失败：", err);
        }
      }
    }
  };

  return { initVideoProgressControl };
};

export { useVideoProgress };
