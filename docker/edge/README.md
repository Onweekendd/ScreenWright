# 香港边缘节点

国内源站带宽只有 5Mbps，页面资源传输慢。这里在香港放一台只做 HTTPS 入口和缓存的机器：

```
浏览器 ──HTTPS──▶ Caddy ──▶ nginx(缓存) ──HTTPS(固定证书)──▶ 国内源站网关(docker/nginx.conf 那个 web 容器)
                  香港 30M 带宽                              国内 5M，只承担首次回源和接口
```

- 香港机器**不跑业务、不存数据**，国内的部署（GitHub Actions 发版、PG、MinIO）不变。
- 缓存范围：`/static/`（带 hash 的构建产物）、`/screenwright/system/`、`/screenwright/system-thumbnails/`。接口、`index.html`、用户素材一律透传，不缓存。
- 回滚：把域名 A 记录改回源站即可。

## 部署

**顺序很重要：先源站，后香港。** 香港一旦切到 HTTPS 回源而源站还没开 8443，整个站点会 502。

### 1. 源站（国内）

1. 生成自签证书（证书里写 IP，不需要域名，也不需要备案）：

   ```bash
   mkdir -p /root/funbi/certs && cd /root/funbi/certs
   openssl req -x509 -newkey rsa:2048 -nodes -days 3650 \
     -keyout origin.key -out origin.crt \
     -subj "/CN=<源站IP>" -addext "subjectAltName=IP:<源站IP>"
   chmod 600 origin.key && chmod 644 origin.crt
   ```

2. 安全组放行 TCP `HTTPS_PORT`（默认 8443），**来源只填香港机器 IP**。
3. 发版（让新的 web 镜像和 compose 上线）。web 容器检测到 `./certs/origin.{crt,key}` 才会监听 443，没证书就只监听 80，旧部署不受影响。
4. 在香港机器上验证：`curl -sk https://<源站IP>:8443/healthz`，返回 `{"status":"ok",...}`。

### 2. 域名

`screenwright.design` 的 A 记录（`@` 和 `www`）指向香港机器公网 IP。证书由 Caddy 自动申请，解析生效后才能签发。

### 3. 香港机器

安全组放行 80 / 443 / SSH 端口，不要开放别的。

```bash
mkdir -p /root/edge && cd /root/edge
# 把 docker/edge/ 下的 docker-compose.yml nginx.conf.template Caddyfile .env.example 传上来
# 再把源站的 origin.crt（只要公钥，不要 origin.key）放到本目录
cp .env.example .env        # 填 DOMAIN / ORIGIN / ORIGIN_HOST
docker compose up -d
docker compose logs -f caddy   # 看到 certificate obtained successfully 即成功
```

### 4. 源站 `.env`

把 `PUBLIC_ORIGIN` 改成 `https://screenwright.design`，让素材直链走域名，然后重建 api / ai / worker：

```bash
cd /root/funbi && docker compose up -d --force-recreate --no-deps api ai worker
```

## 验证

```bash
# 第一次 MISS，第二次 HIT
curl -sI https://screenwright.design/static/<某个构建产物>.js | grep -i x-edge-cache
```

## 为什么回源用 TLS + 固定证书，而不是 WireGuard

实测香港到国内源站，UDP（WireGuard）双向丢包 40%~60%，而 TCP 重传率只有 0.04%，跨境线路对 UDP 做了限速。所以回源走 TCP：

- 源站用自签证书，香港 nginx 用 `proxy_ssl_verify` 加 `proxy_ssl_trusted_certificate` **只信任这一张证书**，别的证书（包括公共 CA 签发的）一律拒绝，防中间人。
- 不依赖域名：证书里写的是 IP，校验名用 `ORIGIN_HOST`。

## 踩过的坑

- **回源 Host 必须是源站 IP:端口**。京东云等国内云厂商的前置网关（响应头 `Server: JDTP`）会拦截 Host 为未备案域名的 HTTP 请求，返回 403「网页禁止访问」，且生效有几分钟延迟，刚部署时可能还是通的。所以 `nginx.conf.template` 里 `Host` 用 `${ORIGIN}`，真实域名放在 `X-Forwarded-Host`。
- **必须 `gzip_proxied any`**。Caddy 转发会带 `Via` 头，nginx 默认把它当成代理请求，既不压缩，还会把缓存里的 gzip 解开，用户白白多传约 3 倍流量。
- **香港到源站的真实延迟约 140ms**，不是 TCP 连接时间看到的 40ms（那是云厂商前置网关的响应）。经香港访问接口，新连接比直连多约 0.45 秒，所以边缘节点只对静态资源是净收益。
- 本机开了 Clash 等 TUN / fake-ip 代理时，`nslookup` 会返回 `198.18.0.x`，不要用它判断解析；用 DoH 或 `curl --resolve` 验证。

## 已知限制

- 源站看到的客户端 IP 是香港机器的 IP，真实 IP 在 `X-Forwarded-For` 里；依赖客户端 IP 的功能（限流、审计）需要另外处理。
- 新发版后的首个访问者要回源拉取新的构建产物，之后才走香港缓存。
