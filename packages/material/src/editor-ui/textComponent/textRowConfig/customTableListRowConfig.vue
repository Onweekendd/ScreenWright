<template>
  <div class="custom-table-list-row-config">
    <TableStyle />
    <HighLight />
    <MouseHover />
    <RowStatus />
  </div>
</template>

<script setup lang="ts">
import HighLight from "../textConfig/components/TextFtCustomTableListConfig/rowConfig/highLight.vue";
import MouseHover from "../textConfig/components/TextFtCustomTableListConfig/rowConfig/mouseHover.vue";
import RowStatus from "../textConfig/components/TextFtCustomTableListConfig/rowConfig/rowStatus.vue";
import TableStyle from "../textConfig/components/TextFtCustomTableListConfig/rowConfig/tableStyle.vue";
</script>
