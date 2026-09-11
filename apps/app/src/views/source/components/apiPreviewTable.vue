<template>
  <div class="tab-content">
    <div class="body-content">
      <div class="form-header flex flex-center">
        <div class="list">参数名</div>
        <div class="list">参数值</div>
        <div class="list">类型</div>
        <div class="list">操作</div>
      </div>
      <div class="form-content">
        <el-scrollbar style="width: 100%; height: 100%">
          <div class="content-list flex" v-for="item in listData" :key="item.type">
            <div class="list list-item">
              <el-input v-model="item.key" placeholder="请输入内容" />
            </div>
            <div class="list list-item">
              <el-input v-model="item.value" placeholder="请输入内容" />
            </div>

            <div class="list list-item">
              <el-select
                v-model="item.type"
                popper-class="sw-select-dropdown"
                class="sw-select"
                placeholder="请选择"
              >
                <el-option label="字符串" value="String" />
                <el-option label="数字" value="Number" />
              </el-select>
            </div>
          </div>
          <div class="add-list flex flex-center">
            <Icon type="CirclePlus" @click="handleAddClick" />
          </div>
        </el-scrollbar>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import Icon from "@/components/Icon/index.vue";

interface Props {
  listData: Array<{ key: string; value: string; type: string }>;
}
defineProps<Props>();
const emits = defineEmits(["add"]);
const handleAddClick = () => {
  emits("add");
};
</script>
<style lang="scss" scoped>
@import "../style/apiPreviewTable.scss";
</style>
