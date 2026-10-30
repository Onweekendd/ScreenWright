# 网关的站点级配置：80（对外 / 回源）和 443（回源 TLS）两个 server 共用。
# 由 docker/nginx.conf、docker/nginx-tls.conf 通过 include 引入，不要放进 conf.d（会被当成顶层配置加载）。

# 素材（视频 / 图片）上传的体积上限
client_max_body_size 500m;

gzip on;
gzip_types text/plain text/css application/json application/javascript application/xml image/svg+xml;
gzip_min_length 1024;

# ── AI：对话 SSE、Mastra 内置接口 ──
location /customApi/ {
    proxy_pass http://ai_backend;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $forwarded_proto;
    # SSE：不能缓冲，否则对话要等整段结束才一次性吐出
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
}

location /api/ {
    proxy_pass http://ai_backend;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $forwarded_proto;
    proxy_buffering off;
    proxy_read_timeout 3600s;
}

# artifact-app 沙箱预览：HTTP + WebSocket（Vite HMR）
location /artifact-apps/ {
    proxy_pass http://ai_backend;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_read_timeout 3600s;
}

# ── 终端控制 WebSocket（在 api 里，必须排在 /bi-system/ 之前）──
location /bi-system/encodedControl/ {
    proxy_pass http://api_backend;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_read_timeout 3600s;
}

# ── API：业务接口、素材 blob、文档、探针 ──
location ~ ^/(user|bi-system|online|blobs|swagger|swagger-spec|healthz)(/|$) {
    proxy_pass http://api_backend;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $forwarded_proto;
    proxy_read_timeout 300s;
}

# 系统素材允许浏览器缓存；缩略图使用内容哈希，原图仍可重新验证更新。
location /screenwright/system/ {
    proxy_pass http://minio:9000;
    proxy_http_version 1.1;
    proxy_set_header Host minio:9000;
    proxy_hide_header Cache-Control;
    add_header Cache-Control "public, max-age=86400";
    proxy_buffering on;
}

location /screenwright/system-thumbnails/ {
    proxy_pass http://minio:9000;
    proxy_http_version 1.1;
    proxy_set_header Host minio:9000;
    proxy_hide_header Cache-Control;
    add_header Cache-Control "public, max-age=31536000, immutable";
    proxy_buffering on;
}

# ── 素材库：MinIO 的公开读桶，同域转发（URL 形如 /<bucket>/<key>）──
location /screenwright/ {
    proxy_pass http://minio:9000;
    proxy_http_version 1.1;
    # MinIO 按 Host 校验签名；匿名读取不涉及签名，但保持 Host 为 minio 最稳妥
    proxy_set_header Host minio:9000;
    proxy_buffering off;
}

# ── 前端静态文件 ──
root /usr/share/nginx/html;
index index.html;

# 带 hash 的构建产物可以长期缓存
location /static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
}

# index.html 不缓存，保证发版后用户拿到最新入口
location = /index.html {
    add_header Cache-Control "no-cache";
}

# 单页应用：未命中的路径回落到 index.html，由前端路由处理
location / {
    try_files $uri $uri/ /index.html;
}
