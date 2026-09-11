<template>
  <div class="icon-ratio-series">
    <SwCollapseItem title="数据系列" open>
      <template #icon>
        <Icon type="CirclePlus" size="14" @click="handleAdd" />
        <Icon type="Delete" size="14" @click="handleDelete" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs
          v-model="activeIconTabsName"
          :tabs="selectTargetData[0].option.iconList.map((sl: any) => sl.iconTabsName)"
        />
        <div v-for="(il, ilIndex) in selectTargetData[0].option.iconList" :key="ilIndex">
          <div v-if="il.iconTabsName === activeIconTabsName">
            <el-form-item label="字段名" :label-width="secondLabelWidth">
              <sw-input v-model="il.iconKeyValue" @change="update" />
            </el-form-item>
            <el-form-item label="文本样式" :label-width="secondLabelWidth">
              <configTextStyle
                @change="
                  (key, value) => {
                    handleUnitTextChange(ilIndex, key, value);
                  }
                "
                :model-value="getUnitInput(il)"
              >
                <template #append>
                  <div class="flex flex-center-between" style="width: 100%">
                    <sw-input-number
                      style="margin-left: 12px"
                      v-model="il.iconLetterSpacing"
                      bottomLabel="字距"
                      @change="update"
                      width="60"
                    />
                    <sw-input-number v-model="il.iconLineHeight" bottomLabel="行距" @change="update" width="60" />
                  </div>
                </template>
              </configTextStyle>
            </el-form-item>
            <el-form-item label="图片" :label-width="secondLabelWidth">
              <sw-upload v-model="il.iconImgSrc" @change="update" @delete="update" />
              <div class="flex flex-justify-between" style="width: 100%">
                <sw-input-number controls width="90" v-model="il.iconImgWidth" bottomLabel="宽度" @change="update" />
                <sw-input-number controls width="90" v-model="il.iconImgHeight" bottomLabel="高度" @change="update" />
              </div>
            </el-form-item>

            <el-form-item label="偏移" :label-width="secondLabelWidth">
              <div class="flex flex-center-between" style="width: 100%">
                <sw-input-number width="90" controls v-model="il.iconTranslateX" bottomLabel="X" @change="update" />
                <sw-input-number width="90" controls v-model="il.iconTranslateY" @change="update" bottomLabel="Y" />
              </div>
            </el-form-item>
          </div>
        </div>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";

import { cloneDeep } from "lodash-es";

import { ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const activeIconTabsName = ref("系列1");
const getUnitInput = (sl: any) => {
  return {
    color: sl.iconColor,
    fontSize: sl.iconFontSize,
    fontWeight: sl.iconFontWeight,
    fontStyle: sl.iconFontStyle,
    fontFamily: sl.iconFontFamily
  };
};
const handleUnitTextChange = (index: number, key: string, value: any) => {
  const attrsMap: Record<string, any> = {
    color: "iconColor",
    fontSize: "iconFontSize",
    fontWeight: "iconFontWeight",
    fontStyle: "iconFontStyle",
    fontFamily: "iconFontFamily"
  };
  selectTargetData.value[0].option.iconList[index][attrsMap[key]] = value[key];
  update();
};

const handleAdd = () => {
  const target = selectTargetData.value[0].option.iconList.find(
    (item: any) => item.iconTabsName === activeIconTabsName.value
  );
  if (target) {
    const addData = cloneDeep(target);
    addData.iconTabsName = `系列${selectTargetData.value[0].option.iconList.length + 1}`;
    selectTargetData.value[0].option.iconList.push(addData);
    activeIconTabsName.value = addData.iconTabsName;
    update();
  }

  console.log(selectTargetData.value[0].option.iconList, "selectTargetData[0].option.sectionList");
};
const handleDelete = () => {
  if (selectTargetData.value[0].option.iconList.length <= 1) {
    return;
  }
  const index = selectTargetData.value[0].option.iconList.findIndex(
    (item: any) => item.iconTabsName === activeIconTabsName.value
  );
  if (index !== -1) {
    selectTargetData.value[0].option.iconList.splice(index, 1);
    selectTargetData.value[0].option.iconList.forEach((item: any, idx: number) => {
      item.iconTabsName = `系列${idx + 1}`;
    });

    if (selectTargetData.value[0].option.iconList.length === 1) {
      activeIconTabsName.value =
        selectTargetData.value[0].option.iconList[selectTargetData.value[0].option.iconList.length - 1].iconTabsName;
    }
    if (index === selectTargetData.value[0].option.iconList.length) {
      activeIconTabsName.value = selectTargetData.value[0].option.iconList[index - 1].iconTabsName;
    }

    update();
  }
};

onMounted(() => {
  if (selectTargetData.value.length > 0) {
    const iconList = selectTargetData.value[0].option.iconList;
    if (iconList && iconList.length > 0) {
      activeIconTabsName.value = iconList[0].iconTabsName;
    }
  }
});
</script>
