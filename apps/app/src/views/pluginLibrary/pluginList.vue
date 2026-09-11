<template>
  <div class="plugin-list">
    <template v-if="pluginList.length > 0">
      <div class="plugin-list-item" v-for="item in pluginList" :key="item.id">
        <div class="item-header">
          <img :src="setMinioUrl(item.thumbnailPath)" v-if="item.thumbnailPath" />
          <img :src="defaultContentItem" alt="" v-else />
          <div class="item-header-menu flex flex-center">
            <div class="menu-remark">
              {{ `${item.type}` === "1" ? describeA : describeB }}
            </div>
          </div>
        </div>
        <div class="item-content">
          <div class="item-content-name">
            {{ item.name }}
          </div>
          <div class="item-content-other" :class="[item.plugPath ? '' : 'not-allowed']">
            <el-tooltip class="item" effect="dark" placement="bottom">
              <template #content>
                <span>下载</span>
              </template>
              <Icon type="iconfont-clouddownload" size="14" @click="handleDownloadPlugin(item)" />
            </el-tooltip>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <SwEmpty
        class="flex flex-center flex-column"
        size="40"
        :imgStyle="{ width: '120px', height: '120px' }"
        :desc="'暂无插件数据'"
        fontSize="12"
      />
    </template>
  </div>
</template>
<script setup lang="ts">
import { onMounted } from "vue";

import defaultContentItem from "@/assets/image/bg/default_content_item.png";
import SwEmpty from "@/components/SwEmpty/index.vue";
import Icon from "@/components/Icon/index.vue";
import type { itemPluginResponse } from "@/model/Plugin";
import { downFile, setMinioUrl } from "@/utils/config";

import { usePluginLibrary } from "./usePluginLibrary";

const { pluginList, getPluginList } = usePluginLibrary();
const describeA =
  "FT的BIM导出插件，能够设置、优化Revit软件中的所有模型，并将其以完整的建筑结构形式以及完整的材质表现导出到三维场景编辑器资产库中。";
const describeB =
  "FT的模型导出插件，提供从主流三维建模软件（3DMAX，MAYA）将模型一键导出到三维场景编辑器资产库中的功能。";
const handleDownloadPlugin = (info: itemPluginResponse) => {
  if (!info.plugPath) return;
  const { MINIO_BASE_URL } = process.env;
  const { WEB_APP_MINIO_BASE_URL } = (window as any).webconfig;
  const minioUrl = WEB_APP_MINIO_BASE_URL || MINIO_BASE_URL;
  downFile(minioUrl + info.plugPath);
};

onMounted(() => {
  getPluginList();
});
</script>
<style lang="scss" scoped>
.plugin-list {
  width: 100%;
  height: calc(100% - 80px);
  overflow: auto;
}
.plugin-list-item {
  width: calc(20% - 40px);
  height: 180px;
  margin: 8px 20px;
  float: left;
  background-color: #292b38;
  border-radius: 0 0 5px 5px;
  overflow: hidden;
  .item-header {
    width: 100%;
    height: calc(100% - 36px);
    position: relative;
    transition: all 0.5s ease;
    background-color: #020304;
    display: flex;
    align-items: center;
    img {
      height: auto;
      width: 100%;
      max-height: 100%;
    }
  }
  .item-header-menu {
    opacity: 0;
    position: absolute;
    top: 0;
    left: 0;
    background-color: rgba(29, 38, 46, 0.6);
    width: 100%;
    height: 100%;
  }
  .menu-remark {
    width: calc(100% - 40px);
    text-align: left;
    margin: 0 20px;
    font-size: 12px;
    color: #ffffff;
    letter-spacing: 1px;
  }
  .item-content {
    width: calc(100% - 20px);
    height: 36px;
    line-height: 36px;
    margin: 0 10px;
    font-size: 12px;
    color: #bcc9d4;
    display: flex;
  }
  .item-content-name {
    width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .item-content-other {
    width: 40%;
    font-size: 12px;
    text-align: right;
    color: #6d6d6d;
    cursor: pointer;
    &.not-allowed {
      cursor: not-allowed;
    }
  }
}
</style>
