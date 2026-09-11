<template>
  <div class="title-txt flex flex-center" @click="handleClick" :style="titleStyle">
    <span
      :style="{
        transform: `translate(${option.textTranslateX || 0}px, ${option.textTranslateY || 0}px)`
      }"
      >{{ item.title }}</span
    >
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  titleStyle: {
    type: Object,
    required: true
  },
  option: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(["change"]);

const handleClick = () => {
  emit("change", props.item);
};
</script>

<style lang="scss" scoped>
.title-txt {
  height: 30px;
  background-repeat: no-repeat;
  background-size: 100% 100%;
}
</style>
