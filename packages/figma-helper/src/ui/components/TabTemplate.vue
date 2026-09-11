<script setup lang="ts">
defineProps<{
  createSubtabTemplate: () => void;
}>();
</script>

<template>
  <div class="section">
    <div class="section-title">选项卡</div>
    <div class="template-grid">
      <button class="template-card" @click="createSubtabTemplate">
        <div class="template-preview">
          <div class="preview-subtab">
            <div class="preview-item active">
              <div class="preview-img"></div>
              <span>三大发展历程</span>
            </div>
            <div class="preview-item">
              <div class="preview-img"></div>
              <span>四大核心技术</span>
            </div>
            <div class="preview-item">
              <div class="preview-img"></div>
              <span>五大深耕行业</span>
            </div>
          </div>
        </div>
        <div class="template-label">选项卡（3项）</div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.template-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #f9fafb;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  width: 100%;
}

.template-card:hover {
  border-color: #818cf8;
  background: #eef2ff;
}

.template-preview {
  width: 100%;
}

.preview-subtab {
  display: flex;
  gap: 0;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  flex: 1;
  background: #fff;
  font-size: 9px;
  color: #374151;
  border-right: 1px solid #e5e7eb;
}

.preview-item:last-child {
  border-right: none;
}

.preview-item.active {
  background: #eef2ff;
  color: #4338ca;
  font-weight: 600;
}

.preview-img {
  width: 36px;
  height: 26px;
  background: #e5e7eb;
  border-radius: 2px;
}

.preview-item.active .preview-img {
  background: #c7d2fe;
}

.template-label {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
}
</style>
