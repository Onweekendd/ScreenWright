#!/bin/sh
# nginx 官方镜像启动时会执行 /docker-entrypoint.d/*.sh。
# 证书在才启用回源 TLS 的 server；没挂证书就只跑 80，保证旧部署照常启动，不会因为缺证书起不来。
set -eu

if [ -f /etc/nginx/certs/origin.crt ] && [ -f /etc/nginx/certs/origin.key ]; then
  cp /etc/nginx/nginx-tls.conf /etc/nginx/conf.d/tls.conf
  echo "web-enable-tls: 已启用 443（回源 TLS）"
else
  echo "web-enable-tls: 未挂载 /etc/nginx/certs/origin.{crt,key}，只监听 80"
fi
