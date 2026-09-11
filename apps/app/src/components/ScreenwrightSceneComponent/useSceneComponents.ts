import { defineAsyncComponent, shallowRef } from "vue";

export interface SceneComponent {
  name: string;
  title: string;
  component: ReturnType<typeof defineAsyncComponent>;
}

export const useScenesComponents = () => {
  const componentList = shallowRef<SceneComponent[]>([
    {
      name: "echartcommonMap",
      title: "2D地图",
      component: defineAsyncComponent(() => import("./component/echartcommonMap/index.vue"))
    },
    {
      name: "echart-glmap",
      title: "2D地图",
      component: defineAsyncComponent(() => import("./component/echartGlmap/index.vue"))
    }
  ]);

  return {
    componentList
  };
};
