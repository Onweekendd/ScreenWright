import type { LargeScreenDetailInfo } from "@screenwright/types";

import type { ComponentType } from "@/views/build/components/buildRender/type";

export interface FTIframeOptions {
  quoteInfo: {
    component: ComponentType[];
    dataFilterArr: string;
    id: number;
    detail: LargeScreenDetailInfo & {
      enableScroll: boolean;
      setTypeOne: boolean;
    };
  };
  [key: string]: any;
}
