<template>
  <div class="custom-table-list-row-config">
    <TableStyle />
    <HighLight />
    <MouseHover />
    <RowStatus />
  </div>
</template>

<script setup lang="ts">
import HighLight from "../textConfig/components/TextSwCustomTableListConfig/rowConfig/highLight.vue";
import MouseHover from "../textConfig/components/TextSwCustomTableListConfig/rowConfig/mouseHover.vue";
import RowStatus from "../textConfig/components/TextSwCustomTableListConfig/rowConfig/rowStatus.vue";
import TableStyle from "../textConfig/components/TextSwCustomTableListConfig/rowConfig/tableStyle.vue";
</script>
