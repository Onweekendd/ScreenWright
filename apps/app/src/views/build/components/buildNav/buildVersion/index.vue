<template>
  <div class="build-version">
    <el-drawer
      class="sw-drawer"
      v-model="versionDrawerShow"
      title="版本管理"
      size="420px"
      :direction="direction"
      :before-close="handleClose"
    >
      <div class="sw-drawer__toolbar version-toolbar">
        <span class="cur"
          >当前版本 <b>V{{ navInfo.versionCode }}</b></span
        >
        <el-button class="sw-drawer__action" size="small" @click.stop="onAdd">
          <Icon type="Plus" size="12" style="margin-right: 4px" />新建版本
        </el-button>
      </div>

      <div class="sw-drawer__scroll" :class="{ 'is-switching': switching }">
        <div class="sw-vtable">
          <div class="sw-vtable__head">
            <div class="sw-vtable__cell col-ver">版本</div>
            <div class="sw-vtable__cell col-desc">描述</div>
            <div class="sw-vtable__cell col-op">操作</div>
          </div>
          <div
            class="sw-vtable__row"
            v-for="(item, i) in versionList"
            :key="i"
            :class="{ 'is-active': isCurrent(item) }"
            @click="!isCurrent(item) && onSwitchVersion(item)"
          >
            <div class="sw-vtable__cell col-ver">
              <Icon type="Promotion" v-if="item.status" size="12" title="已发布" />
              V{{ item.versionCode }}
              <span class="cur-tag" v-if="isCurrent(item)">当前</span>
            </div>
            <div class="sw-vtable__cell col-desc is-ellipsis">{{ item.versionDesc || "--" }}</div>
            <div class="sw-vtable__cell col-op" @click.stop>
              <el-dropdown trigger="click" placement="bottom" popper-class="sw-popper">
                <span class="tools-icon">
                  <Icon type="MoreFilled" size="12" />
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="op in operateDic.filter((it) => it.value !== 1 && it.value !== 5)"
                      :key="op.value"
                      @click="onOperation(op.value, item)"
                    >
                      {{ op.label }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
        <p class="switch-hint">点击任意版本行即可切换</p>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import type { DrawerProps } from "element-plus";

import Icon from "@/components/Icon/index.vue";
import type { ScreenVersion } from "@/model/Version";

import { operateDic, useBuildVersion, useVersion } from "./useBuildVersion";

const route = useRoute();
const direction = ref<DrawerProps["direction"]>("rtl");
const { navInfo, id, versionList, switching, onAdd, onOperation, onSwitchVersion, getVersionList } = useBuildVersion();
const { versionDrawerShow } = useVersion();

const isCurrent = (item: ScreenVersion) => String(navInfo.value.versionCode) === String(item.versionCode);

const handleClose = () => {
  versionDrawerShow.value = false;
};

onMounted(async () => {
  id.value = route.params.id as string;
  await getVersionList(Number(id.value));
});
</script>

<style lang="scss" scoped>
@import "src/style/theme.scss";

.version-toolbar {
  justify-content: space-between;

  .cur {
    color: $sw-text-dim;

    b {
      margin-left: 2px;
      color: $sw-text-strong;
      font-weight: 600;
    }
  }
}

.sw-drawer__scroll.is-switching {
  pointer-events: none;
  opacity: 0.6;
}

.sw-vtable {
  .col-ver {
    flex: 0 0 96px;
  }

  .col-op {
    flex: 0 0 60px;
  }

  .sw-vtable__row:not(.is-active) {
    cursor: pointer;
  }

  .cur-tag {
    padding: 1px 5px;
    font-size: 10px;
    line-height: 1.4;
    border-radius: 3px;
    color: $sw-text-strong;
    background: rgba(255, 255, 255, 0.16);
  }

  .tools-icon {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    padding: 2px;

    :deep(.el-icon) {
      color: inherit;
    }
  }
}

.switch-hint {
  margin: 10px 0 0;
  text-align: center;
  font-size: 11px;
  color: $sw-text-muted;
}
</style>

<style lang="scss">
.el-message-box__content {
  color: #dfe0e3 !important;
  .el-message-box__input {
    .el-input {
      .el-input__wrapper {
        box-shadow: none !important;
        background-color: rgba(24, 27, 36, 0.8) !important;
        padding-left: 5px;
        border: 1px solid #393b4a;
        .el-input__inner {
          height: 26px !important;
        }
        &:hover {
          box-shadow: 0 0 0 1px var(--sw-theme-color) inset !important;
        }
      }
    }
  }
}
</style>
