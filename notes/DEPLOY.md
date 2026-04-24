# Autorun Harness Dashboard - 部署指南

## 访问地址

- 域名：https://harness-dashboard.yamsfeer.site/
- 本地：http://localhost:9100
- 默认账号：admin / 111

## 服务管理

### 开发模式（当前启用）

使用 `tsx watch`，代码变更自动重启服务。

```bash
# 启动 / 停止 / 重启
sudo systemctl start harness-dashboard
sudo systemctl stop harness-dashboard
sudo systemctl restart harness-dashboard

# 查看状态和日志
sudo systemctl status harness-dashboard
sudo journalctl -u harness-dashboard -f
```

服务文件：`/etc/systemd/system/harness-dashboard.service`

### 生产模式

不使用 watch，需先构建前端。

```bash
# 1. 构建前端
npm run build

# 2. 切换到生产服务
sudo systemctl stop harness-dashboard
sudo systemctl disable harness-dashboard
sudo systemctl enable harness-dashboard-prod
sudo systemctl start harness-dashboard-prod
```

服务文件：`/etc/systemd/system/harness-dashboard-prod.service`

### 切回开发模式

```bash
sudo systemctl stop harness-dashboard-prod
sudo systemctl disable harness-dashboard-prod
sudo systemctl enable harness-dashboard
sudo systemctl start harness-dashboard
```

## Nginx 配置

- 配置文件：`/www/server/panel/vhost/nginx/harness-dashboard.yamsfeer.site.conf`
- 代理目标：`127.0.0.1:9100`
- SSL 证书：`/www/server/panel/vhost/nginx/certificates/`
- 项目内参考配置：`nginx/harness-dashboard.conf`

修改 Nginx 配置后需重载：

```bash
sudo /www/server/nginx/sbin/nginx -t && sudo /www/server/nginx/sbin/nginx -s reload
```

## 项目配置

- 配置目录：`~/.config/autorun-harness/`
- 配置文件：`dashboard.config.json`（首次启动自动生成）
- 内容：项目列表、JWT 密钥、端口号

## 端口

| 服务 | 端口 |
|---|---|
| Dashboard 后端 | 9100 |
| Vite 开发服务器（仅前端开发用） | 5173，代理 API 到 9100 |

## 端口变更流程

如果需要改端口，需同步修改三处：

1. `server/config.ts` 中的 `DEFAULT_CONFIG.port`
2. `vite.config.ts` 中的 proxy target 端口
3. Nginx 配置中的 `proxy_pass` 端口

改完后：

```bash
sudo systemctl restart harness-dashboard
sudo /www/server/nginx/sbin/nginx -t && sudo /www/server/nginx/sbin/nginx -s reload
```
