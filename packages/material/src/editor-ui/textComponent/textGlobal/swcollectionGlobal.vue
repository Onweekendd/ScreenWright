<template>
  <div class="ft-collection-global">
    <!-- 自动滚动 -->
    <TextAutoScroll />
    <!-- 滚动方向 -->
    <TextScrollDirection v-if="selectTargetData[0].option.scroll" />
    <!-- 滚动速度 -->
    <TextScrollSpeed />
    <!-- 背景色 -->
    <TextBgColor />
    <!-- 视频控制 -->
    <TextVideoControl />
  </div>
</template>

<script setup lang="ts">
import { useUpdateInstance } from "../../useUpdateInstance";
import TextBgColor from "../textConfig/components/TextSwCollectionConfig/TextBgColor.vue";
import TextVideoControl from "../textConfig/components/TextSwCollectionConfig/TextVideoControl.vue";
import TextScrollDirection from "../textConfig/ItemComponent/ItemScrollDirection/index.vue";
import TextScrollSpeed from "../textConfig/ItemComponent/ItemScrollSpeed/index.vue";
import TextAutoScroll from "../textConfig/ItemComponent/TextAutoScroll/index.vue";

const { selectTargetData } = useUpdateInstance();
</script>
