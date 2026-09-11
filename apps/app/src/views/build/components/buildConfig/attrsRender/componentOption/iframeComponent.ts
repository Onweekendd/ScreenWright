import { optionType } from "@screenwright/material/media";
import { MediaEnum } from "@screenwright/types";

import ftiframeExtend from "@/views/build/components/buildConfig/mediaComponent/mediaExtend/ftiframeExtend.vue";
import ftiframeGlobal from "@/views/build/components/buildConfig/mediaComponent/mediaGlobal/ftiframeGlobal.vue";

// ftiframe 并非严格意义的物料组件，深度耦合大屏编辑器能力，配置面板留在 app 本地
export const iframeComponentOptions = {
  [MediaEnum.FtIframe]: [
    { label: "全局", value: optionType.global, component: ftiframeGlobal },
    { label: "扩展", value: optionType.extend, component: ftiframeExtend }
  ]
};
