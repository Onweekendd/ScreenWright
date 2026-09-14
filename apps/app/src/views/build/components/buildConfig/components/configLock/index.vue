<template>
  <div class="config-lock">
    <div class="config-lock__card">
      <div class="config-lock__badge">
        <Icon type="iconfont-ai242" :size="24" color="var(--sw-theme-color)" />
      </div>
      <p class="config-lock__title">图层已锁定</p>
      <p class="config-lock__desc">锁定的图层不能在画布中选中或修改属性</p>
      <button class="config-lock__btn" type="button" @click="handleUnlock">
        <Icon type="iconfont-ai242" :size="13" color="#fff" />
        <span>解锁图层</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from "@/components/Icon/index.vue";
import { useAction } from "@/views/build/components/buildRender/hooks/useAction";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";

const { selectTargetData } = useEditStore();
const { handleSingleLock } = useAction();

const handleUnlock = () => {
  const target = selectTargetData.value[0];
  if (target?.isLock) {
    handleSingleLock(target);
  }
};
</script>

<style lang="scss" scoped>
@import "src/style/theme.scss";

.config-lock {
  position: absolute;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(24, 26, 36, 0.55);
  backdrop-filter: blur(2px);
  cursor: not-allowed;

  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 240px;
    padding: 26px 20px 22px;
    text-align: center;
    background: $sw-surface-1;
    border: 1px solid $sw-border;
    border-radius: 10px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  }

  &__badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    margin-bottom: 14px;
    border-radius: 50%;
    background: $sw-active-bg;
  }

  &__title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: $sw-text-strong;
  }

  &__desc {
    margin: 6px 0 0;
    font-size: 12px;
    line-height: 1.6;
    color: $sw-text-muted;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 18px;
    padding: 7px 18px;
    font-size: 13px;
    color: #fff;
    cursor: pointer;
    background: $sw-purple;
    border: none;
    border-radius: 6px;
    transition: background-color 0.15s;

    &:hover {
      background: $sw-purple-deep;
    }
  }
}
</style>
