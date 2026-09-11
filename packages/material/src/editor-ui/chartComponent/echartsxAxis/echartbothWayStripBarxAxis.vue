<template>
  <div class="echart-threed-bar-and-line-x-axis">
    <!-- 选择轴 -->
    <xAxisTab v-model="active" :type="TypeAttrs.row_l" />
    <!-- 是否启用 -->
    <ItemBothWayStripBarxAxisShow :type="active" />

    <!-- 左右X轴 -->
    <div v-if="active.includes('X')" :key="active">
      <ItemBothWayBarX :active="active" :key="active" />
    </div>
    <!-- Y轴 -->
    <xAxisConfig v-else-if="active === 'Y'" :showLabelLimit="false" />
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { XAxisType } from "../../components/xAxisConfigTab/type";
import { TypeAttrs } from "../../components/xAxisConfigTab/useAttrsByReverse";
import { useAttrsByReverse } from "../../components/xAxisConfigTab/useAttrsByReverse";
import xAxisConfig from "../../components/xAxisConfigTab/xAxisConfig.vue";
import xAxisTab from "../../components/xAxisConfigTab/xAxisTab.vue";
import ItemBothWayBarX from "../ItemComponent/ItemBothWayBarX/index.vue";
import ItemBothWayStripBarxAxisShow from "../ItemComponent/ItemBothWayStripBarxAxisShow/index.vue";

const active = ref(XAxisType.X_L);

const { setProps } = useAttrsByReverse();
setProps(TypeAttrs.column);
</script>
