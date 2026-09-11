<template>
  <div class="ue-common-map-global" v-if="currentParentItem">
    <!--  -->
    <!-- 123456 -->
    <template v-if="currentParentItem.component.prop === 'ue-peer-streaming'">
      <peerStream />
    </template>
    <template v-if="currentParentItem.component.prop === 'ue-pixel-streaming'">
      <pixelStream />
    </template>
    <template v-if="currentParentItem.component.prop === 'ue-vessel'">
      <ueVessel />
    </template>
    <template v-if="currentParentItem.component.prop === 'sw-unreal-engine'">
      <unrealEngineGlobal />
    </template>
  </div>
</template>
<script setup lang="ts">
import { useChildrenDrawer } from "../../useChildrenDrawer";
import peerStream from "./ue-peer-streamingGlobal.vue";
import pixelStream from "./ue-pixel-streamingGlobal.vue";
import ueVessel from "./ue-vesselGlobal.vue";
import unrealEngineGlobal from "./unreal-engineGlobal.vue";

const { currentParentItem } = useChildrenDrawer();
console.log(currentParentItem.value, "currentChildrenItem");
</script>
