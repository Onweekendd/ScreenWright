<template>
  <div class="Curved-track-list-picList" v-if="selectTargetData[0].option.imageList">
    <SwCollapseItem title="图片系列" open>
      <template #icon>
        <Icon type="CirclePlus" size="14" @click="handleAddSeries" />
        <Icon type="Delete" size="14" @click="handleDeleteSeries" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs
          v-model="seriesTabs"
          :tabs="selectTargetData[0].option.imageList.map((sl: any) => sl.name)"
        />
        <div v-for="(item, index) in selectTargetData[0].option.imageList" :key="index">
          <template v-if="selectTargetData[0].option.imageList[index].name === seriesTabs">
            <el-form-item :label-width="secondLabelWidth" label="默认图片">
              <SwUpload
                v-model="selectTargetData[0].option.imageList[index].defaultImage"
                @change="update"
                @delete="update"
              />
            </el-form-item>
            <el-form-item :label-width="secondLabelWidth" label="选中图片">
              <SwUpload
                v-model="selectTargetData[0].option.imageList[index].activeImage"
                @change="update"
                @delete="update"
              />
            </el-form-item>
            <el-form-item label="name" :label-width="secondLabelWidth">
              <template #label>
                <span
                  >name
                  <el-tooltip class="item" effect="dark" placement="left">
                    <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
                    <template #content>
                      <p>用于数据交互字段name={{ selectTargetData[0].option.imageList[index].name }}</p>
                    </template>
                  </el-tooltip>
                </span>
              </template>
              <sw-input v-model="selectTargetData[0].option.imageList[index].name" :disabled="true" />
            </el-form-item>

            <el-form-item :label-width="secondLabelWidth" label="是否禁用">
              <el-switch
                v-model="selectTargetData[0].option.imageList[index].disabled"
                @change="update"
                class="ft-switch"
              />
            </el-form-item>
          </template>
        </div>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { has } from "lodash-es";

import { ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui";
import { SwInput } from "@screenwright/ui";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const seriesTabs = ref<string>("系列1");

const handleAddSeries = () => {
  console.log("handleAddSeries", selectTargetData.value[0].option);
  if (has(selectTargetData.value[0].option, "imageList")) {
    if (selectTargetData.value[0].option.imageList.length > 0) {
      const target = selectTargetData.value[0].option.imageList.find((it: any) => it.name === seriesTabs.value);
      if (target) {
        const data = JSON.parse(JSON.stringify(target));
        data.name = "系列" + (selectTargetData.value[0].option.imageList.length + 1);
        data.defaultImage = "";
        data.activeImage = "";
        data.disabled = false;
        selectTargetData.value[0].option.imageList.push(data);
        seriesTabs.value = data.name;
      }
    } else {
      seriesTabs.value = "系列1";
      const data = {
        name: "系列1",
        defaultImage: "",
        activeImage: ""
      };

      selectTargetData.value[0].option.imageList.push(data);
    }
    update();
  }
};

const handleDeleteSeries = () => {
  if (has(selectTargetData.value[0].option, "imageList") && selectTargetData.value[0].option.imageList.length > 1) {
    const index = selectTargetData.value[0].option.imageList.findIndex((it: any) => it.name === seriesTabs.value);
    if (index === selectTargetData.value[0].option.imageList.length - 1) {
      seriesTabs.value = selectTargetData.value[0].option.imageList[index - 1].name;
    }
    selectTargetData.value[0].option.imageList.splice(index, 1);
    selectTargetData.value[0].option.imageList.forEach((item: any, index: number) => {
      item.name = "系列" + (index + 1);
    });
    update();
  } else {
    if (selectTargetData.value[0].option.imageList.length === 1) {
      selectTargetData.value[0].option.imageList = [];
      seriesTabs.value = "";
      update();
    }
  }
};
</script>
