<script setup lang="ts">
import { appMeta } from "../app-meta";

const stack = [appMeta.framework, appMeta.runtime, appMeta.styling];
</script>

<template>
  <section class="mx-auto flex max-w-5xl flex-col gap-10">
    <div class="space-y-5">
      <span
        class="inline-flex rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-sm text-violet-200"
      >
        Screenwright Artifact App
      </span>
      <h1 class="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
        从这里开始构建你的应用
      </h1>
      <p class="max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
        这个目录是 Pi Agent 创建前端项目时使用的统一起点。页面会在 Artifact
        预览组件中实时展示。
      </p>
    </div>

    <ul class="grid gap-4 sm:grid-cols-3">
      <li
        v-for="item in stack"
        :key="item"
        class="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200 shadow-2xl shadow-black/20"
      >
        {{ item }}
      </li>
    </ul>
  </section>
</template>
