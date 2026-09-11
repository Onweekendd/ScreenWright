<template>
  <div class="sw-settings" v-loading="loading">
    <div class="sw-settings__body">
      <header class="sw-settings__head">
        <h1>模型设置</h1>
        <p>配置保存在本地数据库，运行时热更新（下一次对话生效）。留空则回退到安装目录 .env 里的兜底值。</p>
      </header>

      <section v-for="meta in ROLE_META" :key="meta.role" class="sw-card">
        <div class="sw-card__head">
          <h2>{{ meta.title }}</h2>
          <span class="sw-card__role">{{ meta.role }}</span>
        </div>
        <p class="sw-card__desc">{{ meta.desc }}</p>

        <template v-if="states[meta.role]">
          <div class="sw-field">
            <label>Base URL</label>
            <el-input v-model="states[meta.role]!.form.baseUrl" placeholder="https://api.example.com/v1" />
          </div>

          <div class="sw-field">
            <label>API Key</label>
            <el-input
              v-model="states[meta.role]!.form.apiKey"
              type="password"
              show-password
              :placeholder="states[meta.role]!.vo.hasApiKey ? '已配置，留空则不改动' : '未配置'"
            />
          </div>

          <div class="sw-field">
            <label>模型 ID</label>
            <el-input v-model="states[meta.role]!.form.modelId" :placeholder="meta.modelPlaceholder" />
          </div>

          <div v-if="meta.role === 'reasoning'" class="sw-field">
            <label>上下文窗口</label>
            <el-input-number
              v-model="states[meta.role]!.form.contextLength"
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
              v-model="states[meta.role]!.form.dimensions"
              :min="1"
              :controls="false"
              placeholder="如 1024"
            />
            <span class="sw-field__note">须与模型实际输出维度一致，改动后必须重建索引</span>
          </div>

          <div class="sw-card__foot">
            <div class="sw-card__test" v-if="states[meta.role]!.testResult">
              <Icon
                :type="states[meta.role]!.testResult!.ok ? 'CircleCheck' : 'CircleClose'"
                :size="14"
                :color="states[meta.role]!.testResult!.ok ? '#4ade80' : '#f87171'"
              />
              <span :class="{ 'is-err': !states[meta.role]!.testResult!.ok }">
                {{ states[meta.role]!.testResult!.text }}
              </span>
            </div>
            <div class="sw-card__actions">
              <el-button
                v-if="meta.role === 'embedding'"
                :loading="reindexing"
                @click="reindex"
              >
                重建索引
              </el-button>
              <el-button :loading="states[meta.role]!.testing" @click="test(meta.role)">测试连接</el-button>
              <el-button class="sw-btn-primary" :loading="states[meta.role]!.saving" @click="save(meta.role)">
                保存
              </el-button>
            </div>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from "@/components/Icon/index.vue";

import { ROLE_META, useAiModelSettings } from "./useAiModelSettings";

const { loading, reindexing, states, save, test, reindex } = useAiModelSettings();
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
    max-width: 760px;
    margin: 0 auto;
    padding: 28px 24px 60px;
  }

  &__head {
    margin-bottom: 20px;

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
  padding: 18px 20px 16px;
  margin-bottom: 16px;
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

  &__role {
    padding: 1px 7px;
    font-size: 11px;
    color: $sw-purple-light;
    background: $sw-active-bg;
    border-radius: 4px;
  }

  &__desc {
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
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid $sw-border;
  }

  &__test {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: $sw-text-dim;

    .is-err {
      color: #f87171;
    }
  }

  &__actions {
    display: flex;
    gap: 8px;
    margin-left: auto;
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

  :deep(.el-input__wrapper),
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

  :deep(.el-input__inner) {
    color: $sw-text-strong;

    &::placeholder {
      color: $sw-text-muted;
    }
  }

  :deep(.el-input-number) {
    width: 220px;

    .el-input__wrapper {
      border: none;
    }
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
