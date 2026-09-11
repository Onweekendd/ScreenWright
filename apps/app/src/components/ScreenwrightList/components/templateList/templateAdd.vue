<template>
  <gridItem>
    <div class="template-add" @click="handleClick">
      <div class="content__info">
        <!-- <img :src="defaultContentAdd" alt="" /> -->
      </div>
      <div class="content__main">
        <span class="content__name">{{ labelText }}</span>
      </div>
    </div>
  </gridItem>
</template>
<script setup lang="ts">
import gridItem from "../grid/grid-item.vue";

// import defaultContentAdd from "@/assets/image/bg/default_content_add.png"

interface Props {
  labelText?: string;
}
withDefaults(defineProps<Props>(), {
  labelText: "新建空白应用"
});

const emits = defineEmits(["click"]);

const handleClick = () => {
  emits("click");
};
</script>
<style lang="scss" scoped>
@import "../style/templateAdd.scss";
</style>
