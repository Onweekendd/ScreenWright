<template>
  <div class="echartpluralRosePiexAxis">
    <ItemRosePieTab v-model="active" />
    <template v-if="active === 'X'">
      <angleAxis />
    </template>
    <template v-else-if="active === 'Y'">
      <radiusAxis />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { XAxisType } from "../../components/xAxisConfigTab/type";
import angleAxis from "../ItemComponent/ItemechartpluralRosePiexAxis/angleAxis.vue";
import radiusAxis from "../ItemComponent/ItemechartpluralRosePiexAxis/radiusAxis.vue";
import ItemRosePieTab from "../ItemComponent/ItemRosePieTab/index.vue";

const active = ref(XAxisType.X);
</script>
