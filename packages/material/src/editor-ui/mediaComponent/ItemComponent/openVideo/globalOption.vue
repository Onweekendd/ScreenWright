<template>
  <div class="global-option">
    <div class="flex flex-center-between">
      <el-form-item label="鼠标事件" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.pointerEvents" @change="update" />
      </el-form-item>
      <el-form-item label="非预览时播放" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.isBuildPlay" @change="update" />
      </el-form-item>
    </div>
    <el-form-item label="视频" :label-width="firstLabelWidth">
      <sw-upload
        v-model="selectTargetData[0].option.url"
        :fileType="FileType.video"
        :multiple="false"
        :showFileList="false"
        @change="update"
        @delete="update"
      />
    </el-form-item>
    <el-form-item label="封面" :label-width="firstLabelWidth">
      <sw-upload
        v-model="selectTargetData[0].option.cover"
        :multiple="false"
        :showFileList="false"
        @change="update"
        @delete="update"
      />
    </el-form-item>
    <el-form-item label="混合模式" :label-width="firstLabelWidth">
      <el-select
        style="width: 100%"
        popper-class="sw-select-dropdown"
        v-model="selectTargetData[0].option.mixBlendMode"
        @change="update"
      >
        <el-option v-for="item in mixBlendMode" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>

    <SwCollapseItem title="播放控制">
      <template #content>
        <div class="flex flex-center-between flex-wrap">
          <div class="flex flex-justify-between" style="width: 90%">
            <el-form-item label="控制条" :label-width="secondLabelWidth">
              <el-checkbox v-model="selectTargetData[0].option.controler" @change="update" />
            </el-form-item>
            <el-form-item label="静音" :label-width="secondLabelWidth">
              <el-checkbox v-model="selectTargetData[0].option.muted" @change="update" />
            </el-form-item>
          </div>
          <div class="flex flex-justify-between" style="width: 100%">
            <el-form-item :label-width="secondLabelWidth">
              <template #label>
                <span
                  >默认动作
                  <el-tooltip class="item" effect="dark" placement="right">
                    <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
                    <template #content>
                      <p>开场视频默认动作，启动后，等开场视频开始播放，结合延迟加载再去加载其他资源</p>
                    </template>
                  </el-tooltip>
                </span>
              </template>
              <el-checkbox v-model="selectTargetData[0].option.openDelayLoading" @change="update" />
            </el-form-item>
            <el-form-item label="延迟加载" :label-width="secondLabelWidth">
              <sw-input-number
                v-model.number="selectTargetData[0].option.delayLoadingTime"
                :min="0"
                unit="s"
                @change="update"
                width="50"
              />
            </el-form-item>
          </div>
          <div class="flex flex-justify-between" style="width: 100%">
            <el-form-item :label-width="secondLabelWidth">
              <template #label>
                <span
                  >自动播放
                  <el-tooltip class="item" effect="dark" placement="right">
                    <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
                    <template #content>
                      <p>自动播放时延时播放不生效</p>
                    </template>
                  </el-tooltip>
                </span>
              </template>

              <el-checkbox v-model="selectTargetData[0].option.autoPlay" @change="update" />
            </el-form-item>
            <el-form-item label="延迟播放" :label-width="secondLabelWidth">
              <sw-input-number
                v-model.number="selectTargetData[0].option.delayPlayTime"
                :min="0"
                unit="s"
                :disabled="selectTargetData[0].option.autoPlay"
                @change="update"
                width="50"
              />
            </el-form-item>
          </div>
          <div class="flex flex-justify-between" style="width: 90%">
            <el-form-item :label-width="secondLabelWidth">
              <template #label>
                <span
                  >循环播放
                  <el-tooltip class="item" effect="dark" placement="right">
                    <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
                    <template #content>
                      <p>循环播放时自动隐藏不生效</p>
                    </template>
                  </el-tooltip>
                </span>
              </template>
              <el-checkbox v-model="selectTargetData[0].option.loopPlay" @change="update" />
            </el-form-item>
            <el-form-item label="自动隐藏" :label-width="secondLabelWidth">
              <template #label>
                <span
                  >自动隐藏
                  <el-tooltip class="item" effect="dark" placement="right">
                    <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
                    <template #content>
                      <p>播放结束自动隐藏</p>
                    </template>
                  </el-tooltip>
                </span>
              </template>
              <el-checkbox
                v-model="selectTargetData[0].option.autoHidden"
                :disabled="selectTargetData[0].option.loopPlay"
                @change="update"
              />
            </el-form-item>
          </div>
        </div>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="旋转设置" v-model="selectTargetData[0].option.rotateShow" @change="update" showIcon>
      <template #content>
        <el-form-item label="绕X轴" :label-width="secondLabelWidth">
          <SwSlider
            v-model="selectTargetData[0].option.rotateX"
            :max="180"
            :min="-180"
            :step="0.1"
            unit="°"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="绕Y轴" :label-width="secondLabelWidth">
          <SwSlider
            v-model="selectTargetData[0].option.rotateY"
            :max="180"
            :min="-180"
            :step="0.1"
            unit="°"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="绕Z轴" :label-width="secondLabelWidth">
          <SwSlider
            v-model="selectTargetData[0].option.rotateZ"
            :max="180"
            :min="-180"
            :step="0.1"
            unit="°"
            @change="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
// import videoUpload from "./videoUpload/index.vue"
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSlider } from "@screenwright/ui/slider";
import { FileType } from "@editor/base/SwUpload/SwUpload";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import { firstLabelWidth, secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";
import { mixBlendMode } from "../dict";

const { update, selectTargetData } = useUpdateInstance();
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
</style>
