<template>
  <div class="photo-sphere-viewer-global">
    <SwCollapseItem title="默认配置">
      <template #content>
        <el-form-item label="最小视野" :label-width="secondLabelWidth">
          <sw-slider @change="update" v-model="selectTargetData[0].option.minFov" :min="1" :max="180" :step="1" />
        </el-form-item>
        <el-form-item label="最大视野" :label-width="secondLabelWidth">
          <sw-slider @change="update" v-model="selectTargetData[0].option.maxFov" :min="1" :max="180" :step="1" />
        </el-form-item>
        <el-form-item label="初始变焦级别" :label-width="63" title="初始变焦级别">
          <sw-slider
            @change="update"
            v-model="selectTargetData[0].option.defaultZoomLvl"
            :min="0"
            :max="100"
            :step="1"
            style="margin-left: 10px"
          />
        </el-form-item>
        <el-form-item label="加载文本" :label-width="secondLabelWidth">
          <SwInput v-model="selectTargetData[0].option.loadingTxt" @change="update" />
        </el-form-item>

        <el-form-item label="加载图片" :label-width="secondLabelWidth">
          <sw-upload v-model="selectTargetData[0].option.loadingImg" @change="update" @delete="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="自动旋转">
      <template #content>
        <el-form-item label="启用" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.autostart" @change="update" />
        </el-form-item>
        <el-form-item label="空闲旋转" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.autostartOnIdle" @change="update" />
        </el-form-item>
        <el-form-item label="延时" :label-width="secondLabelWidth">
          <sw-input-number v-model="selectTargetData[0].option.autostartDelay" :min="0" unit="ms" @change="update" />
        </el-form-item>
        <el-form-item label="速度" :label-width="secondLabelWidth">
          <sw-input-number v-model="selectTargetData[0].option.autorotateSpeed" :min="0" unit="rpm" @change="update" />
        </el-form-item>
        <el-form-item label="角度" :label-width="secondLabelWidth">
          <sw-input-number
            v-model="selectTargetData[0].option.autorotatePitch"
            unit="deg"
            :controls="false"
            @change="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>

    <SwCollapseItem title="导航栏">
      <template #content>
        <el-form-item label="启用" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.showNavbar" @change="update" />
        </el-form-item>
        <el-form-item label="按钮" :label-width="secondLabelWidth">
          <el-checkbox-group v-model="selectTargetData[0].option.navbarList" @change="update">
            <el-checkbox label="zoom">缩放</el-checkbox>
            <el-checkbox label="zoomOut">缩小</el-checkbox>
            <el-checkbox label="zoomIn">放大</el-checkbox>
            <el-checkbox label="moveUp">向上移动</el-checkbox>
            <el-checkbox label="moveDown">向下移动</el-checkbox>
            <el-checkbox label="moveLeft">向左移动</el-checkbox>
            <el-checkbox label="moveRight">向右移动</el-checkbox>
            <el-checkbox label="download">下载</el-checkbox>
            <el-checkbox label="fullscreen">全屏</el-checkbox>
            <el-checkbox label="gallery">图库</el-checkbox>
            <el-checkbox label="markers">标记</el-checkbox>
            <el-checkbox label="markersList">标记列表</el-checkbox>
            <el-checkbox label="autorotate">自动旋转</el-checkbox>
            <el-checkbox label="caption">说明文字</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="标记" open>
      <template #content>
        <el-form-item label="启用" :label-width="secondLabelWidth">
          <el-checkbox @change="update" v-model="selectTargetData[0].option.showMarkers" disabled />
        </el-form-item>
        <div class="btn-control" v-if="selectTargetData[0].option.showMarkers" @click="isVisible = true">标记设置</div>
      </template>
    </SwCollapseItem>
    <markersComposite v-if="isVisible" @onClose="isVisible = false" />
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui";
import { SwInput } from "@screenwright/ui";
import { SwInputNumber } from "@screenwright/ui";
import { SwSlider } from "@screenwright/ui";
import SwUpload from "@editor/base/SwUpload/index.vue";

import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import markersComposite from "../components/markersComposite.vue";

const { update, selectTargetData } = useUpdateInstance();
const isVisible = ref(false);
console.log(selectTargetData.value[0], "selectTargetData.value[0]");
</script>
<style lang="scss" scoped>
:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
}
.btn-control {
  position: relative;
  z-index: 1;
  font-size: 12px;
  color: #b4b7c1;
  text-align: center;
  cursor: pointer;
  padding: 5px 0;
  margin: 5px 20px 0;
  background-color: rgba(55, 58, 71, 0.8);
  &:hover {
    color: #ffffff;
    background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
  }
}
</style>
