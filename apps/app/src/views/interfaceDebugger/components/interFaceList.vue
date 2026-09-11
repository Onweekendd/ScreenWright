<template>
  <Grid class="inter-face-list">
    <TemplateAdd @click="handleAddClick" labelText="新建调式器" class="inter-face-item" />
    <GridItem v-for="item in listData" :key="item.id" class="inter-face-item">
      <div class="content__info flex flex-align-center">
        <img class="info__type" :src="getRenderTypeImg(item.renderType)" />
        <img :src="setMinioUrl(item.backgroundUrl)" v-if="item.backgroundUrl" />
        <img :src="defaultContentItem" alt="" v-else />
        <div class="content__menu flex flex-row">
          <div class="content__btn">编辑</div>
          <div class="content__view">
            <el-tooltip content="复制">
              <Icon type="iconfont-copy" size="14" @click="handleCopy(item)" />
            </el-tooltip>
            <el-tooltip content="修改">
              <Icon type="iconfont-bianji" size="14" @click="handleEdit(item)" />
            </el-tooltip>
            <el-tooltip content="删除">
              <Icon type="iconfont-shanchu1" size="14" @click="handleDeleteFun(item)" />
            </el-tooltip>
          </div>
        </div>
      </div>
      <div class="content__main">
        <span class="content__name">{{ item.name }}</span>
      </div>
    </GridItem>
  </Grid>
</template>
<script setup lang="ts">
import defaultContentItem from "@/assets/image/bg/default_content_item.png";
import renderTypeScene from "@/assets/image/interfaceDebugger/renderType_scene.png";
import renderTypeUe from "@/assets/image/interfaceDebugger/renderType_ue.png";
import Grid from "@/components/ScreenwrightList/components/grid/grid.vue";
import GridItem from "@/components/ScreenwrightList/components/grid/grid-item.vue";
import TemplateAdd from "@/components/ScreenwrightList/components/templateList/templateAdd.vue";
import Icon from "@/components/Icon/index.vue";
import type { InterfaceItem } from "@/model/InterfaceDebugger";
import { setMinioUrl } from "@/utils/config";

import { useInterAction } from "../useInterAction";

interface Props {
  listData: InterfaceItem[];
  getListData: () => void;
}
const props = defineProps<Props>();

const { handleAddClick, handleDelete, handleEdit, handleCopy } = useInterAction({
  refreshList: props.getListData
});
const handleDeleteFun = (item: InterfaceItem) => {
  handleDelete(item);
};
const getRenderTypeImg = (renderType: string) => {
  return renderType === "ue" ? renderTypeUe : renderTypeScene;
};
</script>
<style lang="scss" scoped>
@import "../style/interFaceList.scss";
</style>
