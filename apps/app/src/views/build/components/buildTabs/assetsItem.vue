<template>
  <div class="assets-item-container build-render-ignore">
    <!-- 组件模式 -->
    <div class="usehove" v-if="navListType !== 'materialLibrary'">
      <div class="top-text">{{ option.title }}</div>

      <div class="inside-img" v-if="option.isVideo">
        <video crossorigin="anonymous" :src="setMinioUrl(option.img)" autoplay muted loop />
      </div>
      <div class="inside-img" v-else>
        <img :src="setMinioUrl(option.img)" />
      </div>
    </div>

    <!-- 素材模式：完全由资产类产出的 cardView 驱动渲染 -->
    <div v-else-if="cardView" :class="['usehove', cardView.groupLayout ? 'local-assets' : '']">
      <div class="top-text" v-if="cardView.showTitle">{{ cardView.title }}</div>

      <div class="assets-dash">
        <el-button v-if="cardView.showSelect" size="small" type="primary" class="assetsBtn" @click.stop="handleAssets">
          选择
        </el-button>
        <el-button v-if="cardView.showUpdate" size="small" type="primary" @click.stop="handleUpdateAssets">
          更新
        </el-button>
      </div>

      <img
        class="assets-icon"
        v-if="cardView.badge"
        :style="cardView.fullBleed ? 'top: 10px' : 'top: 25px'"
        :src="badgeIconSrc(cardView.badge)"
      />

      <i class="top-close iconfont iconfont-closeToHomepage" v-if="materialDelShow" @click.stop="deleteItem" />

      <div :class="[cardView.fullBleed ? 'inside-img-assets' : 'inside-img']" v-if="cardView.preview === 'video'">
        <video crossorigin="anonymous" :src="cover ? `${cover}?t=${Date.now()}` : ''" autoplay muted loop />
      </div>
      <div class="inside-img-assets" v-else-if="cardView.preview === 'archive'">
        <div class="archive-preview">
          <i class="iconfont iconfont-archive archive-icon" />
          <div class="archive-text">{{ getArchiveDisplayName(cardView.title) }}</div>
        </div>
      </div>
      <div :class="[cardView.fullBleed ? 'inside-img-assets' : 'inside-img']" v-else>
        <img :src="cover ? `${cover}?t=${Date.now()}` : ''" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import IconPicture from "@/assets/icon/assets-icon-picture.png?url";
import IconVideo from "@/assets/icon/assets-icon-video.png?url";
import IconArchive from "@/assets/icon/assets-icon-zip.png?url";
import { setMinioUrl } from "@/utils/config";
import type { AssetCardBadge, AssetCardView } from "@/views/build/components/buildTabs/selectAssets/assetsBaseClass";
import { assetsClassManager } from "@/views/build/components/buildTabs/selectAssets/assetsClass";
import type { MenuItemForRender } from "@/views/build/components/buildTabs/selectAssets/assetsMenuType";

interface Props {
  navListType: string;
  title: string;
  option: MenuItemForRender;
}

const props = defineProps<Props>();

/**
 * 卡片视图模型：素材模式下由对应资产类产出，统一驱动模板渲染。
 * 组件模式或未知标题时为 null（走组件模式分支）。
 */
const cardView = computed<AssetCardView | null>(() => {
  if (props.navListType !== "materialLibrary") {
    return null;
  }
  try {
    return assetsClassManager.getAssetsClassByTitle(props.title).getCardView(props.option);
  } catch (error) {
    console.error(`无法生成资产卡片视图: ${props.title}`, error);
    return null;
  }
});

/** 经 minio 处理后的封面地址 */
const cover = computed(() => setMinioUrl(cardView.value?.cover || ""));

const materialDelShow = computed(() => {
  return props.navListType == "materialLibrary" && assetsClassManager.canDeleteAsset(props.title);
});

const emits = defineEmits(["delItem", "handleAssets", "updateAssets"]);

/** 角标图标映射 */
const badgeIconSrc = (badge: NonNullable<AssetCardBadge>) => {
  if (badge === "video") {
    return IconVideo;
  }
  if (badge === "archive") {
    return IconArchive;
  }
  return IconPicture;
};

// 获取压缩包显示名称
const getArchiveDisplayName = (filename: string) => {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf("."));
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf("."));
  return `${nameWithoutExt}${ext.toUpperCase()}`;
};

const deleteItem = () => {
  emits("delItem");
};

const handleAssets = () => {
  emits("handleAssets");
};

const handleUpdateAssets = () => {
  emits("updateAssets");
};
</script>

<style lang="scss" scoped>
@import "../../style/buildTabsMenu.scss";

.el-button {
  width: 70px;
  height: 25px;
  background-image: -webkit-gradient(linear, left top, left bottom, from(#8b58e7), to(#642cff));
  background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
  border-color: transparent;
  border-radius: 4px;
  text-align: center;
  padding: 0 !important;
}

// 压缩包预览样式
.archive-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  box-sizing: border-box;
}

.archive-icon {
  font-size: 32px;
  color: #8b58e7;
  margin-bottom: 8px;
}

.archive-text {
  font-size: 12px;
  color: #666;
  text-align: center;
  word-break: break-all;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
