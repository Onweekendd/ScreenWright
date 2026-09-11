# Figma 插件连接内网 HTTPS 服务配置指南

## 问题背景

Figma 插件 UI 运行在 `https://www.figma.com` 的 iframe 中，Figma 的 plugin sandbox（QuickJS WASM）只支持 HTTPS 请求。内网服务使用 HTTP，导致请求被拦截（`blocked:mixed-content`）。

---

## 解决方案：给内网服务器添加自签 HTTPS

### 第一步：生成自签证书（含 SAN 字段）

登录服务器执行：

```bash
mkdir -p /etc/nginx/ssl
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/screenwright.key \
  -out /etc/nginx/ssl/figma-helper.crt \
  -subj "/CN=localhost" \
  -addext "subjectAltName=IP:localhost"
```

> 必须加 `-addext "subjectAltName=IP:..."` 否则 Chrome 报 `ERR_CERT_COMMON_NAME_INVALID`

---

### 第二步：nginx 添加 443 配置

新建 `/etc/nginx/conf.d/443.conf`：

```nginx
server {
    listen 443 ssl;
    server_name localhost;

    ssl_certificate     /etc/nginx/ssl/figma-helper.crt;
    ssl_certificate_key /etc/nginx/ssl/screenwright.key;

    client_max_body_size 100m;

    location /ai {
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization';
            add_header 'Content-Length' 0;
            return 204;
        }

        rewrite ^/ai(/.*)$ $1 break;
        rewrite ^/ai$ / break;
        proxy_pass http://localhost:4111;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # 避免与后端 CORS 头重复冲突
        proxy_hide_header 'Access-Control-Allow-Origin';
        proxy_hide_header 'Access-Control-Allow-Methods';
        proxy_hide_header 'Access-Control-Allow-Headers';

        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization' always;
    }
}
```

```bash
nginx -t && nginx -s reload
```

---

### 第三步：客户端安装证书（每人操作一次）

1. 在服务器执行 `cat /etc/nginx/ssl/figma-helper.crt`，将输出内容保存为本地文件 `figma-helper.crt`
   - 打开记事本，粘贴内容，另存为时**保存类型选"所有文件"**，文件名填 `figma-helper.crt`
2. 双击 `figma-helper.crt` → 安装证书
3. 存储位置选 **本地计算机** → 下一步
4. 选 **将所有的证书都放入下列存储** → 浏览 → **受信任的根证书颁发机构**
5. 完成 → 重启 Figma Desktop

---

## 前端代码改动

### manifest.json

添加网络访问权限：

```json
"networkAccess": {
  "allowedDomains": ["*"],
  "reasoning": "This plugin connects to an internal company server to upload Figma node assets."
}
```

### useImageExport.ts

baseAPI 改为 HTTPS：

```ts
const baseAPI = "https://localhost/ai/customApi";
```

由于 Figma plugin sandbox 不支持 HTTP，所有请求通过 `sandboxFetch` 代理到 `code.ts`，再由 sandbox 发起 HTTPS 请求。

---

## 常见错误排查

| 错误 | 原因 | 解决 |
|------|------|------|
| `blocked:mixed-content` | 请求目标是 HTTP | 改为 HTTPS |
| `ERR_CERT_AUTHORITY_INVALID` | 证书未安装或未信任 | 安装证书到受信任根 |
| `ERR_CERT_COMMON_NAME_INVALID` | 证书缺少 SAN 字段 | 重新生成含 `-addext subjectAltName` 的证书 |
| `CORS error` | 后端和 nginx 同时返回 CORS 头冲突 | nginx 加 `proxy_hide_header` 隐藏后端 CORS 头 |
| `413 Request Entity Too Large` | nginx 限制请求体大小 | 加 `client_max_body_size 100m` |
| `404 Not Found` | 路径未包含 `/customApi` 前缀 | baseAPI 改为 `.../ai/customApi` |
