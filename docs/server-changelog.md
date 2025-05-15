# 📦 服务器变更日志

## 项目环境变更记录（2025-05-14 ~ 2025-05-15）

**项目**：Munich Weekly 摄影周刊平台  
**环境**：Hetzner 云服务器 Ubuntu，使用 root 用户部署  
**服务器IP**：188.245.71.169

---

## ✅ SSH 相关修复与安全加固

### 🚨 问题回顾

- 原本使用 SSH key 登录失效，系统退回 password 登录，导致无法远程操作
- 最终通过 Rescue 模式进入系统，修复了 SSH 公钥与权限配置

### 🔧 修复操作

- 使用 Hetzner Rescue 模式挂载 /dev/sda1 至 /mnt
- 找回 /mnt/root/.ssh/authorized_keys 并修复权限：

```bash
chmod 700 /mnt/root/.ssh
chmod 600 /mnt/root/.ssh/authorized_keys
```

- 重启后恢复免密登录

### 🔐 SSH 安全配置

已写入 `/etc/ssh/sshd_config`：

```
PasswordAuthentication no
PubkeyAuthentication yes
PermitRootLogin yes
MaxAuthTries 3
LoginGraceTime 20
```

### ✨ 快捷方式配置

在本地 `~/.ssh/config` 中添加：

```
Host munichweekly
    HostName 188.245.71.169
    User root
    IdentityFile ~/.ssh/id_ed25519
```

---

## ✅ 前端服务异常修复与部署守护

### 🚨 问题回顾

- 网站主页出现 502 Bad Gateway，Nginx 能连通但前端服务未监听端口 3000
- 原因是此前使用 npm run dev 启动的服务在终端关闭后中断

### ✅ 项目目录确认

通过 find 命令找到项目根目录：

```
/opt/munich-weekly
```

前端目录：

```
/opt/munich-weekly/frontend
```

### 🚀 正确启动前端

```bash
cd /opt/munich-weekly/frontend
npm install
npm run dev
```

前端页面恢复后，502 问题消失。

---

## ✅ PM2 部署与守护配置

已使用 PM2 管理 Next.js 服务，避免意外中断，并配置为开机自动启动：

```bash
npm install -g pm2
pm2 start npm --name munich-frontend -- run dev
pm2 save
pm2 startup
# 执行提示的 systemctl enable 命令
```

当前状态：

```bash
pm2 status
```

输出：

```
munich-frontend │ fork │ online │ port 3000 │ dev 模式运行中
```

---

## ✅ 整体状态

- 前端服务正常运行并受PM2守护
- SSH安全性已显著提升，使用密钥认证
- Nginx反向代理配置正常
- 系统启动时自动启动所有服务

如需继续部署后端 Spring Boot，可补充 systemd 或容器化方案后添加部署文档。 