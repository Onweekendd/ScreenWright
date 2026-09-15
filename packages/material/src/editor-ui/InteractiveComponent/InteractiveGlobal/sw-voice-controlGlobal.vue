<template>
  <div class="ft-voice-control-global">
    <el-form-item label="显示识别结果" :label-width="firstLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.showResult" @change="update" />
    </el-form-item>
    <el-form-item label="语音唤醒" :label-width="firstLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.isWakeUp" @change="update" />
    </el-form-item>
    <template v-if="selectTargetData[0].option.isWakeUp">
      <el-form-item label="唤醒词" :label-width="firstLabelWidth">
        <SwInput v-model="selectTargetData[0].option.wakeUpWord" @change="update" />
      </el-form-item>
    </template>
    <el-form-item label="ASR地址" :label-width="firstLabelWidth">
      <template #label>
        <span
          >ASR地址
          <el-tooltip class="item" effect="dark" placement="right">
            <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
            <template #content>
              <p style="width: 240px">输入语音识别ASR服务器地址(WebSocket)</p>
            </template>
          </el-tooltip>
        </span>
      </template>
      <SwInput v-model="selectTargetData[0].option.asrUrl" placeholder="请输入ASR服务器地址" @change="update" />
    </el-form-item>
    <el-form-item label="热词" :label-width="firstLabelWidth">
      <template #label>
        <span
          >热词设置
          <el-tooltip class="item" effect="dark" placement="right">
            <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
            <template #content>
              <p style="width: 200px">一行一个关键字，空格隔开权重，如"Screenwright 20"</p>
            </template>
          </el-tooltip>
        </span>
      </template>
      <SwInput type="textarea" v-model="selectTargetData[0].option.hotwords" @change="update" />
    </el-form-item>
    <el-form-item label="默认图标" :label-width="firstLabelWidth">
      <SwUpload v-model="selectTargetData[0].option.voiceImg" @change="update" @delete="update" />
    </el-form-item>
    <el-form-item label="激活图标" :label-width="firstLabelWidth">
      <SwUpload v-model="selectTargetData[0].option.voiceStartImg" @change="update" @delete="update" />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { SwInput as SwInput } from "@screenwright/ui/input";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";

@include common-element-style(".el-textarea__inner");
</style>
