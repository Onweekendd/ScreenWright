<template>
  <div
    class="seriesBg"
    :style="{
      position: 'absolute',
      transform: 'translate(-50%, -100%)',
      left: style.left,
      top: style.top
    }"
  >
    <img
      :style="{
        width: style.width,
        height: style.height
      }"
      v-if="style.src && style.src.length > 0"
      :src="style.src"
      alt=""
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  style: {
    left: string;
    top: string;
    width: string;
    height: string;
    src: string;
  };
}

defineProps<Props>();
</script>
