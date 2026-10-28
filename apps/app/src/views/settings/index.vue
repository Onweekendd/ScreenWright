<template>
  <div class="sw-settings" v-loading="loading">
    <div class="sw-settings__body">
      <header class="sw-settings__head">
        <h1>模型设置</h1>
        <p>
          每类模型可存多条配置，标「默认」的那条用于新对话，对话里可在输入框单独切换。配置保存在数据库，运行时热更新。API
          Key 留空则保留已存密钥；.env 仅用于首次初始化。
        </p>
      </header>

      <section v-for="meta in ROLE_META" :key="meta.role" class="sw-card">
        <div class="sw-card__head">
          <img class="sw-card__icon" :src="meta.image" alt="" width="36" height="36" />
          <h2>{{ meta.title }}</h2>
          <span class="sw-card__role">{{ meta.role }}</span>
        </div>
        <p class="sw-card__desc">{{ meta.desc }}</p>

        <ul class="sw-list">
          <li
            v-for="item in states[meta.role].items"
            :key="item.id"
            class="sw-list__item"
            :class="{ 'is-editing': states[meta.role].editingId === item.id }"
            @click="select(meta.role, item.id)"
          >
            <div class="sw-list__main">
              <span class="sw-list__name">{{ aiModelLabel(item) }}</span>
              <span v-if="item.isDefault" class="sw-list__default">默认</span>
              <span class="sw-list__host">{{ hostOf(item.baseUrl) }}</span>
            </div>
            <div class="sw-list__ops" @click.stop>
              <button v-if="!item.isDefault" type="button" @click="setDefault(meta.role, item.id)">设为默认</button>
              <button type="button" @click="duplicate(meta.role, item)">复制</button>
              <button v-if="states[meta.role].items.length > 1" type="button" class="is-danger" @click="remove(item)">
                删除
              </button>
            </div>
          </li>
          <li
            class="sw-list__add"
            :class="{ 'is-editing': states[meta.role].editingId === NEW_ID }"
            @click="startCreate(meta.role)"
          >
            + 新增配置
          </li>
        </ul>

        <div class="sw-field">
          <label>名称</label>
          <el-input v-model="states[meta.role].form.name" placeholder="选填，留空显示模型 ID" />
        </div>

        <div class="sw-field">
          <label>Base URL</label>
          <el-input
            v-model="states[meta.role].form.baseUrl"
            :placeholder="meta.baseUrlPlaceholder || 'https://api.example.com/v1'"
          />
        </div>

        <div class="sw-field">
          <label>API Key</label>
          <el-input
            v-model="states[meta.role].form.apiKey"
            type="password"
            show-password
            :placeholder="apiKeyPlaceholder(meta.role)"
          />
          <el-select
            v-if="states[meta.role].editingId === NEW_ID && keySources.length > 0"
            v-model="states[meta.role].copyKeyFrom"
            clearable
            placeholder="或沿用已有配置的密钥"
            popper-class="sw-select-dropdown"
            class="sw-field__key-source"
          >
            <el-option v-for="source in keySources" :key="source.id" :label="source.label" :value="source.id" />
          </el-select>
        </div>

        <div class="sw-field">
          <label>模型 ID</label>
          <el-input v-model="states[meta.role].form.modelId" :placeholder="meta.modelPlaceholder" />
        </div>

        <div v-if="meta.role === 'reasoning'" class="sw-field">
          <label>上下文窗口</label>
          <el-input-number
            v-model="states[meta.role].form.contextLength"
            :min="0"
            :step="10000"
            :controls="false"
            placeholder="如 1000000，留空用默认"
          />
          <span class="sw-field__note">用于对话页上下文进度条的分母</span>
        </div>

        <div v-if="meta.role === 'embedding'" class="sw-field">
          <label>向量维度</label>
          <el-input-number
            v-model="states[meta.role].form.dimensions"
            :min="1"
            :controls="false"
            placeholder="如 1024"
          />
          <span class="sw-field__note">须与模型实际输出维度一致，改动默认配置后必须重建索引</span>
        </div>

        <div class="sw-card__foot">
          <div class="sw-card__test" v-if="states[meta.role].testResult">
            <Icon
              :type="states[meta.role].testResult!.ok ? 'CircleCheck' : 'CircleClose'"
              :size="14"
              :color="states[meta.role].testResult!.ok ? '#4ade80' : '#f87171'"
            />
            <span :class="{ 'is-err': !states[meta.role].testResult!.ok }">
              {{ states[meta.role].testResult!.text }}
            </span>
          </div>
          <div class="sw-card__actions">
            <el-button v-if="meta.role === 'embedding'" :loading="reindexing" @click="reindex"> 重建索引 </el-button>
            <el-button :loading="states[meta.role].testing" @click="test(meta.role)">
              {{ meta.role === "video" ? "测试提交" : "测试连接" }}
            </el-button>
            <el-button class="sw-btn-primary" :loading="states[meta.role].saving" @click="save(meta.role)">
              {{ states[meta.role].editingId === NEW_ID ? "新增" : "保存" }}
            </el-button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { aiModelLabel } from "@/api/aiModel";
import Icon from "@/components/Icon/index.vue";

import { NEW_ID, ROLE_META, useAiModelSettings } from "./useAiModelSettings";

const {
  apiKeyPlaceholder,
  duplicate,
  keySources,
  loading,
  reindex,
  reindexing,
  remove,
  save,
  select,
  setDefault,
  startCreate,
  states,
  test
} = useAiModelSettings();

const hostOf = (baseUrl: string) => (URL.canParse(baseUrl) ? new URL(baseUrl).host : baseUrl || "未填地址");
</script>

<style lang="scss" scoped>
@import "src/style/theme.scss";

.sw-settings {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background-color: $sw-bg;
  color: $sw-text;

  &__body {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
    gap: 20px;
    max-width: 1600px;
    margin: 0 auto;
    padding: 28px 28px 60px;
  }

  &__head {
    grid-column: 1 / -1;

    h1 {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 600;
      color: $sw-text-strong;
    }

    p {
      margin: 0;
      font-size: 12px;
      line-height: 1.7;
      color: $sw-text-muted;
    }
  }
}

.sw-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 18px 20px 16px;
  background-color: $sw-surface-2;
  border: 1px solid $sw-border;
  border-radius: 10px;

  &__head {
    display: flex;
    align-items: center;
    gap: 10px;

    h2 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: $sw-text-strong;
    }
  }

  &__icon {
    display: block;
    flex-shrink: 0;
    object-fit: contain;
  }

  &__role {
    padding: 1px 7px;
    font-size: 11px;
    color: $sw-purple-light;
    background: $sw-active-bg;
    border-radius: 4px;
  }

  &__desc {
    min-height: 58px;
    margin: 8px 0 16px;
    font-size: 12px;
    line-height: 1.6;
    color: $sw-text-muted;
  }

  &__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: auto;
    padding-top: 14px;
    border-top: 1px solid $sw-border;
  }

  &__test {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    min-width: 0;
    overflow-wrap: anywhere;
    color: $sw-text-dim;

    .is-err {
      color: #f87171;
    }
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    margin-left: auto;

    :deep(.el-button + .el-button) {
      margin-left: 0;
    }
  }
}

.sw-list {
  margin: 0 0 16px;
  padding: 0;
  list-style: none;
  border: 1px solid $sw-border;
  border-radius: 8px;
  overflow: hidden;

  &__item,
  &__add {
    padding: 8px 10px;
    cursor: pointer;
    border-left: 2px solid transparent;

    &:hover {
      background: $sw-hover-bg;
    }

    &.is-editing {
      background: $sw-active-bg;
      border-left-color: $sw-active-bar;
    }

    & + & {
      border-top: 1px solid $sw-divider;
    }
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__main {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 6px;
    min-width: 0;
  }

  &__name {
    font-size: 13px;
    color: $sw-text-strong;
    overflow-wrap: anywhere;
  }

  &__default {
    padding: 0 6px;
    font-size: 10px;
    line-height: 16px;
    color: $sw-purple-light;
    background: $sw-active-bg;
    border-radius: 3px;
  }

  &__host {
    flex-basis: 100%;
    font-size: 11px;
    color: $sw-text-muted;
    overflow-wrap: anywhere;
  }

  &__ops {
    display: flex;
    flex-shrink: 0;
    gap: 2px;

    button {
      padding: 2px 6px;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: $sw-text-dim;
      font-size: 11px;
      cursor: pointer;

      &:hover {
        color: $sw-text-strong;
        background: $sw-hover-bg;
      }

      &.is-danger:hover {
        color: #f87171;
      }
    }
  }

  &__add {
    font-size: 12px;
    color: $sw-text-dim;
  }
}

.sw-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;

  label {
    font-size: 12px;
    color: $sw-text-dim;
  }

  &__note {
    font-size: 11px;
    color: $sw-text-muted;
  }

  &__key-source {
    width: 100%;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper),
  :deep(.el-input-number) {
    background-color: $sw-bg;
    box-shadow: none;
    border: 1px solid $sw-border;
    border-radius: 6px;

    &:hover,
    &.is-focus {
      border-color: $sw-purple-deep;
    }
  }

  :deep(.el-input__inner),
  :deep(.el-select__selected-item) {
    color: $sw-text-strong;

    &::placeholder {
      color: $sw-text-muted;
    }
  }

  :deep(.el-select__placeholder.is-transparent) {
    color: $sw-text-muted;
  }

  :deep(.el-input-number) {
    width: 100%;

    .el-input__wrapper {
      border: none;
    }
  }
}

@media (max-width: 600px) {
  .sw-settings__body {
    padding: 20px 16px 40px;
    gap: 16px;
  }

  .sw-card__desc {
    min-height: 0;
  }
}

.sw-btn-primary.el-button {
  color: #fff;
  border: none;
  background: $sw-purple-gradient;

  &:hover {
    opacity: 0.88;
  }
}
</style>
