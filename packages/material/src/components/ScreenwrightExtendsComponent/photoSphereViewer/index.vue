<template>
  <div class="photo-sphere-viewer">
    <template
      v-if="isBuild.value && !props.isEdit && element.option.galleryItems && element.option.galleryItems.length > 0"
    >
      <canvasImage
        :src="setMinioUrl(element.option.galleryItems[0].panorama)"
        :loadingImg="setMinioUrl(element.option.loadingImg)"
      />
    </template>
    <div v-else class="viewer-box" ref="viewerBoxRef" />
  </div>
</template>
<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

import { AutorotatePlugin } from "@photo-sphere-viewer/autorotate-plugin";
import { DEFAULTS, Viewer } from "@photo-sphere-viewer/core";
import { GalleryPlugin } from "@photo-sphere-viewer/gallery-plugin";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";

import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";

import canvasImage from "./canvasImage.vue";

import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/gallery-plugin/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";

const langOption = {
  zoom: "缩放",
  zoomOut: "缩小",
  zoomIn: "放大",
  moveUp: "向上移动",
  moveDown: "向下移动",
  moveLeft: "向左移动",
  moveRight: "向右移动",
  description: "描述",
  download: "下载",
  fullscreen: "全屏",
  loading: "加载中...",
  menu: "菜单",
  close: "关闭",
  twoFingers: "使用两根手指进行导航",
  ctrlZoom: "使用 ctrl + 滚轮缩放图像",
  loadError: "全景图无法加载",
  webglError: "您的浏览器似乎不支持 WebGL",
  gallery: "图库",
  autorotate: "自动旋转",
  caption: "说明文字"
};
interface Props {
  element: ComponentType;
  isEdit?: boolean;
}
// const props = defineProps<{
//   element: ComponentType
//   isEdit: boolean
// }>()
const props = withDefaults(defineProps<Props>(), {
  isEdit: false
});
const { isBuild } = useBaseData(props.element);
let viewer: Viewer | null = null;
let markersPlugin: MarkersPlugin | null = null;
let autorotatePlugin: AutorotatePlugin | null = null;
let galleryPlugin: GalleryPlugin | null = null;
const viewerBoxRef = ref<HTMLElement | null>(null);
// const transformScale = ref(1)
const emits = defineEmits<{
  (e: "dblClick", data: any): void;
  (e: "clicked", data: any): void;
  (e: "selectMarker", marker: any): void;
  (e: "panoramaLoaded", id: string): void;
}>();

// const getScaleFactor = () => {
//   const element = viewerBoxRef.value
//   if (!element) return 1
//   const rect = element.getBoundingClientRect()
//   // return rect.width / element.offsetWidth;
//   return element.offsetWidth / rect.width
// }

const initViewerPanorama = (panorama: string) => {
  if (isBuild.value && !props.isEdit) {
    return;
  }
  const {
    showNavbar,
    navbarList,
    autostart,
    autostartDelay,
    autostartOnIdle,
    autorotateSpeed,
    autorotatePitch,
    thumbnailSize,
    loadingTxt,
    loadingImg,
    minFov,
    maxFov,
    defaultZoomLvl
  } = props.element.option;
  if (!viewerBoxRef.value) {
    return;
  }
  viewer = new Viewer({
    container: viewerBoxRef.value as HTMLElement,
    panorama,
    loadingTxt,
    loadingImg: setMinioUrl(loadingImg),
    minFov,
    maxFov,
    defaultZoomLvl,
    canvasBackground: "#000",
    lang: langOption,
    navbar: showNavbar ? navbarList : [],
    keyboard: "always",
    keyboardActions: {
      ...DEFAULTS.keyboardActions
    },
    caption: props.element.option.galleryItems[0].caption,
    plugins: [
      // 自动旋转插件
      AutorotatePlugin.withConfig({
        autostartDelay: !autostart ? 1000 * 60 * 60 * 24 * 7 : autostartDelay,
        autostartOnIdle,
        autorotatePitch: `${autorotatePitch}deg`,
        autorotateSpeed: `${autorotateSpeed}rpm`
      }),
      // 画廊插件
      GalleryPlugin.withConfig({
        visibleOnLoad: false,
        thumbnailSize
      }),
      // 标记插件
      MarkersPlugin
    ]
  });
  if (viewer) {
    markersPlugin = viewer.getPlugin(MarkersPlugin) as MarkersPlugin;
    autorotatePlugin = viewer.getPlugin(AutorotatePlugin) as AutorotatePlugin;
    galleryPlugin = viewer.getPlugin(GalleryPlugin) as GalleryPlugin;
    initViewerEvents();
    setGalleryItems();
    console.log(markersPlugin, "markersPlugin");
    console.log(autorotatePlugin, "autorotatePlugin");
    console.log(galleryPlugin, "galleryPlugin");
  }
  console.log(viewer, "viewer");
};

const setGalleryItems = () => {
  const { showGallery, galleryItems } = props.element.option;
  if (!galleryPlugin || !galleryItems || galleryItems.length === 0) {
    return;
  }
  if (showGallery) {
    const items = galleryItems.map((item: any, i: number) => {
      return {
        id: item.id,
        panorama: setMinioUrl(item.panorama),
        thumbnail: setMinioUrl(item.thumbnail),
        options: {
          caption: item.caption
        },
        markers: item.markers.map((citem: any) => {
          return {
            ...citem,
            id: citem.id || `marker-${i}-${citem.type}`
          };
        })
      };
    });
    galleryPlugin.setItems(items);
  }
};

const getGalleryItems = (index: number) => {
  if (!props.element.option.galleryItems || props.element.option.galleryItems.length === 0) {
    return "";
  }
  const panorama = props.element.option.galleryItems[index].panorama;
  if (!panorama) {
    return "";
  }
  return setMinioUrl(panorama);
};
const initViewerEvents = () => {
  if (!viewer || !markersPlugin) {
    return;
  }
  viewer.addEventListener("ready", handelViewerReady, { once: true });
  viewer.addEventListener("dblclick", handelViewerDblClick);
  viewer.addEventListener("click", handelViewerClick);
  viewer.addEventListener("panorama-loaded", handelViewerPanoramaLoaded);
  markersPlugin.addEventListener("select-marker", handelViewerClickMarker);
};
const handelViewerReady = () => {
  console.log("Viewer is ready");
  if (!viewer) {
    return;
  }
  viewer
    .animate({
      yaw: 0.8768201528983143,
      pitch: 0.09524571491766554,
      speed: 1500
    })
    .then(() => {
      // this.markersPlugin.showMarkerTooltip('custom-tooltip');
    });
};
const handelViewerDblClick = ({ data }: any) => {
  emits("dblClick", data);
};
const handelViewerClick = ({ data }: any) => {
  console.log("Viewer clicked at position:", data);
  emits("clicked", data);
};
const handelViewerClickMarker = ({ marker }: any) => {
  emits("selectMarker", marker);
};
const createElementLayer = (item: any) => {
  let ele = null;
  const resData: Record<string, any> = {
    elementLayer: null,
    image: "",
    html: "",
    tooltip: ""
  };
  switch (item.type) {
    case "image":
      ele = document.createElement("img");
      ele.src = setMinioUrl(item.image);
      ele.width = item.size.width;
      ele.height = item.size.height;
      resData.elementLayer = ele;
      break;
    case "video":
      ele = document.createElement("video");
      ele.src = setMinioUrl(item.srcObj.src);
      ele.loop = item.srcObj.loop;
      ele.muted = item.srcObj.muted;
      ele.preload = "auto";
      ele.autoplay = item.srcObj.autoplay;
      ele.controls = item.srcObj.controls;
      ele.width = item.size.width;
      ele.height = item.size.height;
      resData.elementLayer = ele;
      break;
    case "html":
      console.log(item, "fff");
      resData.html = `<div style="font-family: ${item.fontFamily};font-size: ${item.fontSize}px;color: ${item.fontColor};">
              ${item.innerHTML}
            <div>`;
      break;
    default:
      resData.image = setMinioUrl(item.image);
      resData.tooltip = item.tooltip;
      break;
  }
  if (ele) ele.remove();
  return resData;
};

const handelViewerPanoramaLoaded = ({ target }: any) => {
  if (!markersPlugin) {
    return;
  }
  const gallery = target.plugins.gallery;
  console.log(gallery, "gallerygallerygallery");
  const { galleryItems } = props.element.option;
  const markerItems = galleryItems.find((a: any) => a.id === gallery.currentId)?.markers || [];
  // 先删除
  markersPlugin.clearMarkers();
  console.log(markerItems, "markerItemsmarkerItemsmarkerItems");
  // 在插入当前的
  markerItems.forEach((item: any, i: number) => {
    const resData = createElementLayer(item);
    if (markersPlugin) {
      markersPlugin.addMarker({
        ...item,
        ...resData,
        id: item.id || `marker-${i}-${item.type}`
      });
    }
  });
  emits("panoramaLoaded", gallery.currentId);
};
const addMarker = (res: any) => {
  if (markersPlugin) {
    markersPlugin.addMarker(res);
  }
};

const updateMarker = (res: any) => {
  if (markersPlugin) {
    markersPlugin.updateMarker(res);
  }
};
const removeMarker = (id: string) => {
  if (markersPlugin) {
    markersPlugin.removeMarker(id);
  }
};

onBeforeUnmount(() => {
  if (viewer && markersPlugin) {
    viewer.removeEventListener("ready", handelViewerReady);
    viewer.removeEventListener("dblclick", handelViewerDblClick);
    viewer.removeEventListener("click", handelViewerClick);
    markersPlugin.removeEventListener("select-marker", handelViewerClickMarker);
    viewer.destroy();
    viewer = null;
    markersPlugin = null;
    galleryPlugin = null;
    autorotatePlugin = null;
  }
});
onMounted(async () => {
  await nextTick();
  const panorama = getGalleryItems(0);
  initViewerPanorama(panorama);
  //   if (!isBuild.value) {
  //     transformScale.value = getScaleFactor()
  //   }
});
defineExpose({
  createElementLayer,
  addMarker,
  updateMarker,
  removeMarker
});
</script>
<style lang="scss" scoped>
.photo-sphere-viewer {
  width: 100%;
  height: 100%;
  .viewer-box,
  img {
    width: 100%;
    height: 100%;
  }
}
</style>
