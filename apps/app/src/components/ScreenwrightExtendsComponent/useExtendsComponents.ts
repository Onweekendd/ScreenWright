import type { Component } from "vue";
import { shallowRef } from "vue";

import { component as MaterialExtendsComponentMap } from "@screenwright/material/extends";
import { ExtendsEnum } from "@screenwright/types";

export interface ExtendComponent {
  name: string;
  title: string;
  component: Component;
}

// 扩展组件全部来自已物料化的 @screenwright/material/extends（UE 串流 / 数字人已移除）。
const materialMap = MaterialExtendsComponentMap as Partial<Record<ExtendsEnum, Component>>;

export const useExtendsComponents = () => {
  const componentList = shallowRef<ExtendComponent[]>([
    { name: ExtendsEnum.SimpleStar, title: "闪点组件", component: materialMap[ExtendsEnum.SimpleStar]! },
    { name: ExtendsEnum.FullScreenSwitch, title: "全屏切换", component: materialMap[ExtendsEnum.FullScreenSwitch]! },
    { name: ExtendsEnum.PageReload, title: "页面刷新", component: materialMap[ExtendsEnum.PageReload]! },
    { name: ExtendsEnum.FtMaskLayer, title: "放射性/线性渐变遮罩层", component: materialMap[ExtendsEnum.FtMaskLayer]! },
    { name: ExtendsEnum.SimpleParticle, title: "上升粒子", component: materialMap[ExtendsEnum.SimpleParticle]! },
    { name: ExtendsEnum.SimpleBarrage, title: "弹幕组件", component: materialMap[ExtendsEnum.SimpleBarrage]! },
    { name: ExtendsEnum.FtDataContainer, title: "数据容器", component: materialMap[ExtendsEnum.FtDataContainer]! },
    { name: ExtendsEnum.FtWeather, title: "天气", component: materialMap[ExtendsEnum.FtWeather]! },
    { name: ExtendsEnum.PhotoSphereViewer, title: "360全景图", component: materialMap[ExtendsEnum.PhotoSphereViewer]! }
  ]);

  return {
    componentList
  };
};
