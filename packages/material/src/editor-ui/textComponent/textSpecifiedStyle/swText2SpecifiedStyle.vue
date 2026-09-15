<template>
  <sw-collapse-item title="样式列表" open>
    <template #icon>
      <Icon type="CirclePlus" @click="changeCardList('add')" size="14" />
      <Icon type="Delete" @click="changeCardList('delete')" size="14" />
    </template>
    <template #content>
      <ScreenwrightSeriesTabs
        v-model="activeCardTab"
        :tabs="selectTargetData[0].option.cardList.map((ilItem: any) => ilItem.tabsName)"
      />
      <div v-for="(cardItem, cardIndex) in selectTargetData[0].option.cardList" :key="cardIndex">
        <template v-if="cardItem.tabsName === activeCardTab">
          <el-form-item label="值类型" :label-width="secondLabelWidth">
            <el-select v-model="cardItem.mappingValueType" popper-class="sw-select-dropdown" @change="update">
              <el-option v-for="item in valueTypeOption" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="对应文本值" :label-width="secondLabelWidth">
            <div class="flex flex-justify-between" style="width: 100%">
              <el-select
                size="small"
                style="width: calc(100% - 100px); top: 4px"
                @change="update"
                v-model="cardItem.conditions"
                v-if="cardItem.mappingValueType === 'number'"
                popper-class="sw-select-dropdown"
              >
                <el-option v-for="item in conditionCompare" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
              <sw-input
                :width="cardItem.mappingValueType === 'number' ? 70 : '100%'"
                v-model="cardItem.mappingValue"
                @change="update"
              />
            </div>
          </el-form-item>
          <el-form-item label="文本样式" :label-width="secondLabelWidth">
            <textFontStyle :modelValue="cardItem" @change="update" style="margin-bottom: 10px" />
            <SwLabelType :modelValue="cardItem" @change="update" />
          </el-form-item>
          <el-form-item label="字体填充" :label-width="secondLabelWidth">
            <el-select v-model="cardItem.selectedTextType" popper-class="sw-select-dropdown" @change="update">
              <el-option v-for="item in textColorType" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <template v-if="cardItem.selectedTextType === 'normal'">
            <el-form-item label="颜色" :label-width="secondLabelWidth">
              <sw-single-color-picker field="textColor" v-model="cardItem.color" @change="update" />
            </el-form-item>
            <el-form-item label="字体背景" :label-width="secondLabelWidth">
              <sw-single-color-picker v-model="cardItem.backgroundColor" field="backgroundColor" @change="update" />
            </el-form-item>
          </template>
          <el-form-item label="颜色" :label-width="secondLabelWidth" v-if="cardItem.selectedTextType === 'gradient'">
            <sw-color-picker
              :options="{ colorTypeOption: 'linear-gradient,single' }"
              v-model:color="cardItem.selectedTextColor"
              v-model:opacity="cardItem.selectedTextOpacity"
              field="textGradientColor"
              :input-disabled="true"
              @change="update"
            />
          </el-form-item>
        </template>
      </div>
    </template>
  </sw-collapse-item>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { onMounted } from "vue";

import { cloneDeep } from "lodash-es";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwInput } from "@screenwright/ui/input";
import { SwLabelType } from "@screenwright/ui/label-type";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import Icon from "@editor/base/Icon/index.vue";
import textFontStyle from "@editor/components/configTextStyle/textFontStyle.vue";

import { useUpdateInstance } from "../../useUpdateInstance";
import { conditionCompare, textColorType, valueTypeOption } from "../textConfig/constants";
import { secondLabelWidth } from "../textConfig/textConfig";

interface CardItem {
  backgroundColor: string;
  color: string;
  conditions: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: string;
  fontWeight: string;
  mappingValue: string;
  mappingValueType: string;
  selectedTextColor: string;
  selectedTextOpacity: number;
  selectedTextType: string;
  tabsName: string;
}
const { update, selectTargetData } = useUpdateInstance();
const activeCardTab = ref("样式1");

const changeCardList = (type: string) => {
  if (type === "add") {
    const last = cloneDeep(
      selectTargetData.value[0].option.cardList[selectTargetData.value[0].option.cardList.length - 1]
    );
    last.tabsName = `样式${selectTargetData.value[0].option.cardList.length + 1}`;
    selectTargetData.value[0].option.cardList.push(last);
    activeCardTab.value = last.tabsName;
  } else {
    if (selectTargetData.value[0].option.cardList.length > 1) {
      const index = selectTargetData.value[0].option.cardList.findIndex((item: CardItem) => {
        return item.tabsName === activeCardTab.value;
      });
      selectTargetData.value[0].option.cardList.splice(index, 1);
      selectTargetData.value[0].option.cardList.forEach((item: CardItem, idx: number) => {
        item.tabsName = `样式${idx + 1}`;
      });

      if (selectTargetData.value[0].option.cardList.length === 1) {
        activeCardTab.value =
          selectTargetData.value[0].option.cardList[selectTargetData.value[0].option.cardList.length - 1].tabsName;
      }
      if (index === selectTargetData.value[0].option.cardList.length) {
        activeCardTab.value = selectTargetData.value[0].option.cardList[index - 1].tabsName;
      }
      update();
    }
  }
};
const init = () => {
  if (selectTargetData.value[0].option.cardList && selectTargetData.value[0].option.cardList.length > 0) {
    activeCardTab.value = selectTargetData.value[0].option.cardList[0].tabsName;
  }
};
onMounted(() => {
  init();
});
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

</style>
