<template>
  <div class="ft-translation">
    <div class="content" v-if="isBuild.value">
      <span>默认：{{ defaultName }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { filter, forEach, map, reduce } from "lodash-es";

import { useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";

interface dictListType {
  id: string;
  name: string;
  value: string;
  alias: string;
}

// 或者使用 Record 类型
type TranslationItem = Record<string, string>;

const props = defineProps<{
  element: ComponentType;
}>();

const { isBuild, option, dataChart } = useBaseData(props.element);
const currentLanguage = ref<string>("zh");
const translationData = ref<any>({});
const defaultName = computed(() => {
  return option.value.dictList.find((a: dictListType) => a.value === option.value.defaultKey).alias;
});

watch(
  () => dataChart.value,
  (newValue) => {
    initTranslation(newValue);
  }
);

const initTranslation = (data: TranslationItem[]) => {
  const { defaultKey, dictList, initLoad } = option.value;
  const languages = map(dictList, (item: dictListType) => item.value);

  const result: any = {};

  // 为每个目标语言构建翻译映射
  forEach(languages, (targetLang: string) => {
    // 使用 reduce 构建翻译映射，避免嵌套循环
    result[targetLang] = reduce(
      data,
      (acc: Record<string, any>, translationItem: any) => {
        const targetText = translationItem[targetLang];

        if (targetText) {
          const sourceLanguages = filter(languages, (sourceLang: any) => sourceLang !== targetLang);

          forEach(sourceLanguages, (sourceLang: any) => {
            const sourceText = translationItem[sourceLang];
            if (sourceText) {
              acc[sourceText] = targetText;
            }
          });
        }

        return acc;
      },
      {}
    );
  });

  translationData.value = result;
  console.log("initTranslation value", translationData.value);
  // 初始化加载
  if (initLoad && !isBuild.value) {
    setTimeout(() => {
      changeLanguage(defaultKey);
    }, 2000);
  }
};

const changeLanguage = (lang: string) => {
  currentLanguage.value = lang || "zh";
  globalReplace();
};

const globalReplace = () => {
  const elements = document.querySelectorAll("[data-translate]");
  console.log("globalReplace elements", elements);
  elements.forEach((el) => {
    const key = el.getAttribute("data-translate");
    el.textContent = convertTranslation(key as string);
  });
};

const convertTranslation = (key: string, _variables = {}) => {
  const translation = translationData.value[currentLanguage.value] || {};

  const text = translation[key] || key;

  return text;
};
</script>

<style lang="scss" scoped>
.ft-translation {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  .content {
    color: #ffffff;
  }
}
</style>
