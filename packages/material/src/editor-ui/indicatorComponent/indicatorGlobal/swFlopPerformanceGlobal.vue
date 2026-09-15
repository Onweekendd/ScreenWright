<template>
  <div class="ft-flop-global">
    <div class="flex flex-justify-between" style="width: 86%">
      <el-form-item label="启动动画" :label-width="firstLabelWidth">
        <el-checkbox @change="update" v-model="selectTargetData[0].option.autoplay" />
      </el-form-item>
      <el-form-item label="不显示整体" :label-width="firstLabelWidth">
        <el-checkbox @change="update" v-model="selectTargetData[0].option.whole" />
      </el-form-item>
    </div>
    <div class="flex flex-justify-between" style="width: 86%">
      <el-form-item label="千分位" :label-width="firstLabelWidth">
        <el-checkbox @change="update" v-model="selectTargetData[0].option.useGrouping" />
      </el-form-item>
      <el-form-item label="位数补全" :label-width="firstLabelWidth">
        <el-checkbox @change="update" v-model="selectTargetData[0].option.makeComplete" />
      </el-form-item>
    </div>

    <div class="flex flex-justify-between" style="width: 86%">
      <el-form-item label="首次延迟加载" :label-width="firstLabelWidth">
        <el-checkbox @change="update" v-model="selectTargetData[0].option.delayLoading" />
      </el-form-item>
      <el-form-item label="启动数值自增" :label-width="firstLabelWidth">
        <el-checkbox @change="update" v-model="selectTargetData[0].option.autoIncrement" />
      </el-form-item>
    </div>
    <el-form-item :label-width="firstLabelWidth" label="总位数" v-if="selectTargetData[0].option.makeComplete">
      <sw-input-number
        @change="update"
        v-model="selectTargetData[0].option.completeCount"
        :max="10"
        :min="5"
        controls
      />
    </el-form-item>
    <el-form-item :label-width="firstLabelWidth" label="精度">
      <sw-input-number @change="update" v-model="selectTargetData[0].option.decimals" controls />
    </el-form-item>
    <el-form-item :label-width="firstLabelWidth" label="列数">
      <sw-input-number @change="update" v-model="selectTargetData[0].option.span" controls />
    </el-form-item>
    <el-form-item label="文字间距" :label-width="firstLabelWidth">
      <sw-input-number @change="update" v-model="selectTargetData[0].option.letterSpace" controls />
    </el-form-item>
    <template v-if="selectTargetData[0].option.autoplay">
      <el-form-item :label-width="firstLabelWidth">
        <template #label>
          <span
            >动画时长
            <el-tooltip class="item" effect="dark" placement="right">
              <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
              <template #content>
                <p>若为0，则默认动画时长为2S</p>
              </template>
            </el-tooltip>
          </span>
        </template>
        <sw-input-number @change="update" v-model="selectTargetData[0].option.duration" unit="s" :min="0" />
      </el-form-item>
      <el-form-item label="动画间隔" :label-width="firstLabelWidth">
        <sw-input-number @change="update" v-model="selectTargetData[0].option.intervalTime" unit="s" :min="0" />
      </el-form-item>
    </template>
    <template v-if="selectTargetData[0].option.delayLoading">
      <el-form-item :label-width="firstLabelWidth">
        <template #label>
          <span
            >延迟时长
            <el-tooltip class="item" effect="dark" placement="right">
              <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
              <template #content>
                <p>若为0，则不设置延迟</p>
              </template>
            </el-tooltip>
          </span>
        </template>
        <sw-input-number @change="update" v-model="selectTargetData[0].option.delayTime" unit="s" :min="0" />
      </el-form-item>
    </template>

    <template v-if="selectTargetData[0].option.autoIncrement">
      <el-form-item :label-width="firstLabelWidth">
        <template #label>
          <span
            >自增频率
            <el-tooltip class="item" effect="dark" placement="right">
              <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
              <template #content>
                <p>启动数值自增，可以设置自增频率，时间单位为秒</p>
              </template>
            </el-tooltip>
          </span>
        </template>
        <sw-input-number @change="update" v-model="selectTargetData[0].option.incrementFrequency" />
      </el-form-item>
    </template>
    <template v-if="selectTargetData[0].option.autoIncrement">
      <el-form-item label="随机数范围" :label-width="firstLabelWidth">
        <template #label>
          <span
            >自增范围
            <el-tooltip class="item" effect="dark" placement="right">
              <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
              <template #content>
                <p style="width: 200px">启动数值自增，增加的数值为该范围获取的随机数</p>
              </template>
            </el-tooltip>
          </span>
        </template>
        <sw-input-number @change="update" v-model="selectTargetData[0].option.randomRange" />
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
