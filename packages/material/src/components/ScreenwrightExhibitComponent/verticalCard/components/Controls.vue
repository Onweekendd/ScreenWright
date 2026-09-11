<template>
  <div class="carousel-3d-controls">
    <a
      href="#"
      class="prev"
      @click.prevent="handlePrevClick"
      :class="{ disabled: !parent.isPrevPossible }"
      :style="`width: ${width}px; height: ${height}px; line-height: ${height}px;`"
      aria-label="Previous slide"
    >
      <span v-html="prevHtml" />
    </a>
    <a
      href="#"
      class="next"
      @click.prevent="handleNextClick"
      :class="{ disabled: !parent.isNextPossible }"
      :style="`width: ${width}px; height: ${height}px; line-height: ${height}px;`"
      aria-label="Next slide"
    >
      <span v-html="nextHtml" />
    </a>
  </div>
</template>

<script>
export default {
  name: "Controls",
  props: {
    /**
     * Width in pixels of the navigation buttons
     */
    width: {
      type: [String, Number],
      default: 50
    },
    /**
     * Height in pixels of the navigation buttons
     */
    height: {
      type: [String, Number],
      default: 60
    },
    /**
     * Text content of the navigation prev button
     */
    prevHtml: {
      type: String,
      default: "&lsaquo;"
    },
    /**
     * Text content of the navigation next button
     */
    nextHtml: {
      type: String,
      default: "&rsaquo;"
    }
  },
  data() {
    return {
      parent: this.$parent
    };
  },
  methods: {
    handleNextClick() {
      console.log("fffffnext");
      // this.parent.goNext();
      this.$emit("next-click");
    },
    handlePrevClick() {
      console.log("fffffprev");
      // this.parent.goPrev();
      this.$emit("prev-click");
    }
  }
};
</script>

<style scoped>
.carousel-3d-controls {
  position: absolute;
  top: 50%;
  height: 0;
  margin-top: -30px;
  left: 0;
  width: 100%;
  z-index: 1000;
}

.next,
.prev {
  width: 100px;
  position: absolute;
  z-index: 1010;
  font-size: 100px;
  height: 100px;
  line-height: 100px;
  color: #333;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  text-decoration: none;
  top: 0;
}

.next:hover,
.prev:hover {
  cursor: pointer;
  opacity: 0.7;
}

.prev {
  left: 10px;
  text-align: left;
}

.next {
  right: 10px;
  text-align: right;
}

.disabled {
  opacity: 0.2;
  cursor: default;
}

.disabled:hover {
  cursor: default;
  opacity: 0.2;
}
</style>
