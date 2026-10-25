<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="login-title">Screenwright</h1>
      <p class="login-subtitle">AI 原生的数据大屏编辑器</p>

      <el-form ref="formRef" :model="form" :rules="rules" size="large" @submit.prevent="handleSubmit">
        <el-form-item prop="username">
          <el-input
            v-model.trim="form.username"
            placeholder="用户名"
            autocomplete="username"
            :prefix-icon="User"
            autofocus
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            autocomplete="current-password"
            show-password
            :prefix-icon="Lock"
            @keyup.enter="handleSubmit"
          />
        </el-form-item>
        <el-button class="login-submit" type="primary" native-type="submit" :loading="loading" @click="handleSubmit">
          登录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { Lock, User } from "@element-plus/icons-vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";

import { useUserStore } from "@/store/modules/user";
import { safeRedirectTarget } from "@/utils/session";

defineOptions({ name: "LoginPage" });

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const formRef = ref<FormInstance>();
const loading = ref(false);
const form = reactive({ username: "", password: "" });
const rules: FormRules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }]
};

const handleSubmit = async () => {
  if (loading.value) {
    return;
  }
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  loading.value = true;
  try {
    await userStore.login(form);
    await router.replace(safeRedirectTarget(route.query.redirect));
  } catch (err: unknown) {
    ElMessage.error(err instanceof Error ? err.message : "登录失败");
    form.password = "";
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
@import "src/style/theme.scss";

.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: $sw-bg;
}

.login-card {
  width: 360px;
  padding: 36px 32px 28px;
  border: 1px solid $sw-border;
  border-radius: 12px;
  background: $sw-surface-1;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
}

.login-title {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: $sw-text-strong;
  text-align: center;
}

.login-subtitle {
  margin: 8px 0 28px;
  font-size: 13px;
  color: $sw-text-muted;
  text-align: center;
}

:deep(.el-input__wrapper) {
  background: $sw-control-bg;
  box-shadow: 0 0 0 1px $sw-border inset;

  &.is-focus {
    box-shadow: 0 0 0 1px var(--sw-theme-color) inset;
  }
}

:deep(.el-input__inner) {
  color: $sw-text;
}

.login-submit {
  width: 100%;
  margin-top: 4px;
}
</style>
