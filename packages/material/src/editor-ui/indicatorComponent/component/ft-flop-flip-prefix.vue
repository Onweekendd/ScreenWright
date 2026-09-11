<template>
  <div class="ft-flop-flip-prefix">
    <el-form-item
      label="是否换行"
      v-if="selectTargetData[0].option[typeAttrsMap[attrsValue].Inline]"
      :label-width="firstLabelWidth"
    >
      <el-select
        v-model="selectTargetData[0].option[typeAttrsMap[attrsValue].Inline]"
        popper-class="sw-select-dropdown"
        placeholder="请选择"
        style="width: 100%"
        @change="update"
      >
        <el-option v-for="item in disabledOption" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="前缀内容" :label-width="firstLabelWidth">
      <sw-input @change="update" v-model="selectTargetData[0].option[typeAttrsMap[attrsValue].Text]" />
    </el-form-item>
    <el-form-item label="文本样式" title="文本样式" :label-width="firstLabelWidth">
      <configTextStyle v-model="input" @change="handleConfigTextChange" />
    </el-form-item>
    <ItemSelectAlign
      label="对齐方式"
      :type="typeAttrs.default"
      v-model="selectTargetData[0].option[typeAttrsMap[attrsValue].TextAlign]"
      @change="update"
      :label-width="firstLabelWidth"
      v-if="!selectTargetData[0].option.row"
    />
    <el-form-item label="X间距" :label-width="firstLabelWidth">
      <sw-slider @change="update" v-model="selectTargetData[0].option[typeAttrsMap[attrsValue].Splitx]" />
    </el-form-item>
    <el-form-item label="Y间距" :label-width="firstLabelWidth">
      <sw-slider @change="update" v-model="selectTargetData[0].option[typeAttrsMap[attrsValue].Splity]" />
    </el-form-item>

    <SwCollapseItem title="字体渐变">
      <template #content>
        <el-form-item label="字体渐变" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.suffixSetFontLinear" @change="update" />
        </el-form-item>
        <el-form-item
          label="字体颜色"
          v-if="selectTargetData[0].option.suffixSetFontLinear"
          :label-width="secondLabelWidth"
        >
          <sw-color-picker
            field="textGradientColor"
            :options="{ colorTypeOption: 'linear-gradient,single' }"
            v-model:color="selectTargetData[0].option.suffixFontLinearColor"
            :opacity="100"
            inputDisabled
            returnType="str"
            @change="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwInput } from "@screenwright/ui/input";
import { SwSlider } from "@screenwright/ui/slider";
import ItemSelectAlign from "@editor/textComponent/textConfig/ItemComponent/ItemSelectAlign/index.vue";
import { typeAttrs } from "@editor/textComponent/textConfig/ItemComponent/ItemSelectAlign/ItemSelectAlign";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

interface Props {
  attrsValue: string;
}
interface typeAttrsMapProps {
  [key: string]: {
    Inline: string;
    Text: string;
    FontFamily: string;
    FontStyle: string;
    FontWeight: string;
    FontSize: string;
    Color: string;
    TextAlign: string;
    Splitx: string;
    Splity: string;
  };
}
const props = defineProps<Props>();

const typeAttrsMap = ref<typeAttrsMapProps>({
  prefixObj: {
    Inline: "prefixInline",
    Text: "prefixText",
    FontFamily: "prefixFontFamily",
    FontStyle: "prefixFontStyle",
    FontWeight: "prefixFontWeight",
    FontSize: "prefixFontSize",
    Color: "prefixColor",
    TextAlign: "prefixTextAlign",
    Splitx: "prefixSplitx",
    Splity: "prefixSplity"
  },
  suffixObj: {
    Inline: "suffixInline",
    Text: "suffixText",
    FontFamily: "suffixFontFamily",
    FontStyle: "suffixFontStyle",
    FontWeight: "suffixFontWeight",
    FontSize: "suffixFontSize",
    Color: "suffixColor",
    TextAlign: "suffixTextAlign",
    Splitx: "suffixSplitx",
    Splity: "suffixSplity"
  }
});
const { selectTargetData, update } = useUpdateInstance();
const disabledOption = ref([
  { label: "换行", value: "block" },
  { label: "不换行", value: "inline-block" }
]);
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: typeAttrsMap.value[props.attrsValue].FontFamily,
  fontStyle: typeAttrsMap.value[props.attrsValue].FontStyle,
  fontWeight: typeAttrsMap.value[props.attrsValue].FontWeight,
  fontSize: typeAttrsMap.value[props.attrsValue].FontSize,
  color: typeAttrsMap.value[props.attrsValue].Color
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
