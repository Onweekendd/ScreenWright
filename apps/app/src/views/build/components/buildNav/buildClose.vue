<template>
  <div class="build-close flex flex-center" @click="close">
    <Icon color="#b4b7c1" type="iconfont-closeToHomepage" size="18" style="position: relative; top: -3px" />
  </div>
</template>
<script setup lang="ts">
import Icon from "@/components/Icon/index.vue";

const emits = defineEmits(["close"]);
const close = () => {
  emits("close");
};
</script>
<style lang="scss" scoped>
.build-close {
  background-image: url("@/assets/image/button/close_bg.png");
  background-repeat: no-repeat;
  background-size: contain;
  width: 46px;
  height: 46px;
  color: #fff;
  cursor: pointer;
  position: relative;
  top: 0px;
}
</style>
