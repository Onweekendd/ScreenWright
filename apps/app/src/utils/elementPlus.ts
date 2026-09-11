import type { App } from "vue";

import {
  ElAside,
  ElBreadcrumb,
  ElBreadcrumbItem, // 没有全局注册的建议在组件内部单独引入
  ElCard,
  ElCarousel,
  ElCarouselItem,
  ElCol,
  ElContainer,
  ElHeader,
  ElImage,
  ElInfiniteScroll,
  ElLoading,
  ElMain,
  ElMenu,
  ElMenuItem,
  ElMenuItemGroup,
  ElPopover,
  ElRow,
  ElScrollbar,
  ElSkeleton,
  ElSkeletonItem,
  ElSubMenu,
  ElTabPane,
  ElTabs,
  ElTag
} from "element-plus";

export const components = [
  ElCard,
  ElCarousel,
  ElCarouselItem,
  ElContainer,
  ElHeader,
  ElAside,
  ElImage,
  ElMain,
  ElMenu,
  ElMenuItem,
  ElMenuItemGroup,
  ElScrollbar,
  ElSubMenu,
  ElTabs,
  ElTabPane,
  ElTag,
  ElRow,
  ElCol,
  ElSkeleton,
  ElSkeletonItem,
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElPopover
];

const plugins = [ElInfiniteScroll, ElLoading];

export const elementPlus = (app: App) => {
  components.forEach((component) => {
    if (component.name) {
      app.component(component.name, component);
    }
  });
  plugins.forEach((plugin) => app.use(plugin));
  const options = {}; // 全局配置z-index等信息
  app.config.globalProperties.$ELEMENT = options;
};
