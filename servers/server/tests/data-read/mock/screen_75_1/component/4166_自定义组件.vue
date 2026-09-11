<template>
  <div class="fun-card">{{ info.title }}</div>
</template>

<script>
/**
 * @param {import('@vue-part').VuePartInfo} info
 * @returns {import('@vue-part').Vue2ComponentOptions}
 * @__vp_types__
 */
function generate(info) {
  return {
    name: "fun-card",
    data() {
      return { title: info.title };
    }
  };
}

export default generate(/** @type {any} */ ({})); // @__vp_anchor__
</script>

<style>
.fun-card {
  color: #fff;
}
</style>