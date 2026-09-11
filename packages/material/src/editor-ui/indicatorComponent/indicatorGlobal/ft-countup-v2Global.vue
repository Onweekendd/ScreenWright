<template>
  <div class="ft-countup-v2-global">
    <el-form-item label="千分位" :label-width="firstLabelWidth">
      <el-checkbox @change="update" v-model="selectTargetData[0].option.useGrouping" />
    </el-form-item>
    <el-form-item label="启动数值自增" :label-width="firstLabelWidth">
      <el-checkbox @change="update" v-model="selectTargetData[0].option.autoIncrement" />
    </el-form-item>
    <el-form-item label="总位数" :label-width="firstLabelWidth">
      <sw-input-number
        @change="update"
        controls
        v-model="selectTargetData[0].option.completeCount"
        :max="10"
        :min="3"
      />
    </el-form-item>
    <el-form-item label="数值间距" :label-width="firstLabelWidth">
      <sw-input-number @change="update" controls v-model="selectTargetData[0].option.spanMangin" />
    </el-form-item>
    <el-form-item label="千分位大小" :label-width="firstLabelWidth" v-if="selectTargetData[0].option.useGrouping">
      <sw-input-number @change="update" v-model="selectTargetData[0].option.pointSize" />
    </el-form-item>
    <template v-if="selectTargetData[0].option.autoIncrement">
      <el-form-item label="自增频率" :label-width="firstLabelWidth">
        <template #label>
          <span
            >自增频率
            <el-tooltip class="item" effect="dark" placement="right">
              <Icon type="QuestionFilled" :size="12" />
              <template #content>
                <p style="width: 200px">启动数值自增，可以设置自增频率，时间单位为秒</p>
              </template>
            </el-tooltip>
          </span>
        </template>
        <sw-input-number v-model="selectTargetData[0].option.incrementFrequency" @change="update" />
      </el-form-item>
    </template>
    <template v-if="selectTargetData[0].option.autoIncrement">
      <el-form-item label="自增总值" :label-width="firstLabelWidth">
        <template #label>
          <span
            >自增总值
            <el-tooltip class="item" effect="dark" placement="right">
              <Icon type="QuestionFilled" :size="12" />
              <template #content>
                <p style="width: 200px">启动数值自增，数值持续自增，到达总值将自动停止</p>
              </template>
            </el-tooltip>
          </span>
        </template>
        <sw-input-number v-model="selectTargetData[0].option.incrementTotal" @change="update" />
      </el-form-item>
    </template>
    <template v-if="selectTargetData[0].option.autoIncrement">
      <el-form-item label="随机数范围" :label-width="firstLabelWidth">
        <template #label>
          <span
            >自增范围
            <el-tooltip class="item" effect="dark" placement="right">
              <Icon type="QuestionFilled" :size="12" />
              <template #content>
                <p style="width: 200px">启动数值自增，增加的数值为该范围获取的随机数</p>
              </template>
            </el-tooltip>
          </span>
        </template>
        <sw-input-number v-model="selectTargetData[0].option.randomRange" @change="update" />
      </el-form-item>
    </template>
  </div>
</template>
<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui/input-number";
import Icon from "@editor/base/Icon/index.vue";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
