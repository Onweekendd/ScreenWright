/**
 * 环境配置-env
 * VITE_PUBLIC_PATH 打包主目录
 * VITE_API_BASE_URL 系统接口服务: http://localhost:8080
 * VITE_MINIO_BASE_URL minio服务: http://localhost:9000/
 * VITE_MINIO_DEFAULT_PREFIX minio服务对应的库: version-test/
 * VITE_RESOURCE_BASE_URL 资源下载: http://localhost:8088
 * VITE_SOCKET_IO_URL Socket.IO: http://localhost:1000
 * VITE_DOCUMENT 说明文档
 * VITE_CITY_EDITOR 城市编辑器
 * VITE_WEBSITE_HOME // 官网登录地址 http://localhost:8088/login
 * 
 * 公共配置-public
 * WEB_APP_PUBLIC_PATH 打包主目录
 * WEB_APP_API_BASE_URL  // 系统接口服务
 * WEB_APP_MINIO_BASE_URL // minio服务
 * WEB_APP_MINIO_DEFAULT_PREFIX // minio服务对应的库: version-test/
 * WEB_APP_RESOURCE_BASE_URL // 资源下载
 * WEB_APP_SOCKET_IO_URL // 资源下载
 * WEB_APP_DOCUMENT // 说明文档
 * WEB_APP_CITY_EDITOR // 城市编辑器
 * WEB_APP_WEBSITE_HOME // 官网登录地址
 * WEB_APP_PRIVATE_DEPLOYMENT 私有化部署-登录
 * WEB_APP_SYSTEM_NAME BI平台
 * WEB_APP_SYSTEM_LOGO logo.png
 * WEB_APP_SYSTEM_FOOTER_ICP true // 显示登录页底部的版权信息等
 * 
 * 如：若设置外层则优先
 * const { VITE_API_BASE_URL } =  process.env
 * const { WEB_APP_API_BASE_URL } =  window.webconfig
 * const baseAPI =  WEB_APP_API_BASE_URL || VITE_API_BASE_URL
 */
window.webconfig = {
  WEB_APP_PRIVATE_DEPLOYMENT: false
};
