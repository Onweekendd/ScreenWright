<template>
  <div class="ft-translation-dic">
    <SwCollapseItem title="字典系列" open>
      <template #icon>
        <Icon type="CirclePlus" size="14" @click="handleAdd" />
        <Icon type="Delete" size="14" @click="handleDelete" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs v-model="seriesTabs" :tabs="selectTargetData[0].option.dictList.map((sl: any) => sl.name)" />

        <div v-for="(sl, slIndex) in selectTargetData[0].option.dictList" :key="slIndex" style="color: azure">
          <div v-if="sl.name === seriesTabs">
            <el-form-item label="字段值" :label-width="secondLabelWidth">
              <sw-input v-model="sl.value" @change="update" />
            </el-form-item>
            <el-form-item label="字段别名" :label-width="secondLabelWidth">
              <sw-input v-model="sl.alias" @change="update" />
            </el-form-item>
          </div>
        </div>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { cloneDeep } from "lodash-es";

import { ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui";
import { SwInput } from "@screenwright/ui";
import Icon from "@editor/base/Icon/index.vue";

import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();

const seriesTabs = ref("译文1");
const handleAdd = () => {
  const index = selectTargetData.value[0].option.dictList.findIndex((item: any) => {
    return item.name == seriesTabs.value;
  });

  const cpTarget = cloneDeep(selectTargetData.value[0].option.dictList[index]);
  cpTarget.name = "译文" + (selectTargetData.value[0].option.dictList.length + 1);
  selectTargetData.value[0].option.dictList.push(cpTarget);
  seriesTabs.value = cpTarget.name;

  update();
};
const handleDelete = () => {
  const index = selectTargetData.value[0].option.dictList.findIndex((item: any) => {
    return item.name == seriesTabs.value;
  });
  selectTargetData.value[0].option.dictList.splice(index, 1);

  selectTargetData.value[0].option.dictList.forEach((item: any, index: number) => {
    item.name = "译文" + (index + 1);
    item.id = index + 1;
  });

  if (index > selectTargetData.value[0].option.dictList.length - 1) {
    seriesTabs.value = "译文" + selectTargetData.value[0].option.dictList.length;
  }

  update();
};
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
</style>
