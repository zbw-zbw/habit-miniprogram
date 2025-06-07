# 习惯打卡小程序后端服务部署指南

本文档详细记录了习惯打卡小程序后端服务的完整部署流程，包括从零开始在阿里云服务器上部署的全过程。

## 目录

1. [服务器环境准备](#服务器环境准备)
2. [数据库安装配置](#数据库安装配置)
3. [项目部署](#项目部署)
4. [网络安全配置](#网络安全配置)
5. [域名和HTTPS配置](#域名和https配置)
6. [监控和维护](#监控和维护)
7. [故障排查](#故障排查)

## 服务器环境准备

### 服务器规格推荐

- **操作系统**: Alibaba Cloud Linux 3.2104 LTS 64位
- **配置**: 2核4G内存（最低1核2G）
- **磁盘**: 40GB SSD
- **带宽**: 5Mbps

### 1. 基础环境配置

```bash
# 更新系统包
sudo yum update -y

# 安装基础工具
sudo yum install -y curl wget git vim net-tools

# 安装Node.js 16.x
curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node --version  # 应该显示 v16.x.x
npm --version   # 应该显示 8.x.x

# 安装PM2进程管理器
sudo npm install -g pm2
```

### 2. 创建部署目录

```bash
# 创建项目目录
sudo mkdir -p /opt/habit-tracker
sudo chown $USER:$USER /opt/habit-tracker
cd /opt/habit-tracker
```

## 数据库安装配置

### 方案一：本地MongoDB安装（推荐）

```bash
# 下载MongoDB预编译包
cd /tmp
wget https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel70-5.0.15.tgz

# 解压并安装
tar -zxvf mongodb-linux-x86_64-rhel70-5.0.15.tgz
sudo mv mongodb-linux-x86_64-rhel70-5.0.15 /opt/mongodb

# 创建符号链接
sudo ln -s /opt/mongodb/bin/* /usr/local/bin/

# 创建MongoDB用户和目录
sudo useradd -r -s /bin/false mongod
sudo mkdir -p /var/lib/mongo
sudo mkdir -p /var/log/mongodb
sudo mkdir -p /var/run/mongodb
sudo chown mongod:mongod /var/lib/mongo
sudo chown mongod:mongod /var/log/mongodb
sudo chown mongod:mongod /var/run/mongodb
```

### 创建MongoDB配置文件

```bash
# 创建配置文件
sudo tee /etc/mongod.conf > /dev/null << 'EOF'
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

storage:
  dbPath: /var/lib/mongo
  journal:
    enabled: true

processManagement:
  fork: true
  pidFilePath: /var/run/mongodb/mongod.pid

net:
  port: 27017
  bindIp: 127.0.0.1
EOF
```

### 创建systemd服务

```bash
# 创建服务文件
sudo tee /etc/systemd/system/mongod.service > /dev/null << 'EOF'
[Unit]
Description=MongoDB Database Server
Documentation=https://docs.mongodb.org/manual
After=network-online.target
Wants=network-online.target

[Service]
User=mongod
Group=mongod
ExecStart=/usr/local/bin/mongod --config /etc/mongod.conf
PIDFile=/var/run/mongodb/mongod.pid
LimitFSIZE=infinity
LimitCPU=infinity
LimitAS=infinity
LimitNOFILE=64000
LimitNPROC=64000
LimitMEMLOCK=infinity
TasksMax=infinity
TasksAccounting=false
ExecReload=/bin/kill -HUP $MAINPID
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 启动MongoDB服务
sudo systemctl daemon-reload
sudo systemctl start mongod
sudo systemctl enable mongod

# 验证安装
sudo systemctl status mongod
mongo --eval "db.runCommand({connectionStatus : 1})"
```

### 方案二：MongoDB Atlas云数据库

如果不想在服务器上安装MongoDB，可以使用MongoDB Atlas：

1. 访问 https://www.mongodb.com/cloud/atlas
2. 创建免费账户和集群
3. 配置网络访问（添加服务器IP）
4. 创建数据库用户
5. 获取连接字符串

## 项目部署

### 1. 上传项目代码

```bash
# 方法一：使用Git克隆
cd /opt/habit-tracker
git clone <你的仓库地址>
cd habit-tracker/server

# 方法二：使用SCP上传
# 在本地执行：
scp -r server/ root@47.92.33.113:/opt/habit-tracker/
```

### 2. 安装项目依赖

```bash
cd /opt/habit-tracker/server
npm install --production
```

### 3. 配置环境变量

```bash
# 创建环境变量文件
cat > .env << 'EOF'
# 服务器环境
NODE_ENV=production

# 服务器配置
PORT=3000
BASE_URL=http://47.92.33.113:3000

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/habit-tracker

# JWT安全配置
JWT_SECRET=h8dKl3pQr7sT9vX2zAcB4eF6gH1jK5mN8pQw1eR5tY7uI9oP
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 文件上传配置
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# CORS配置
CORS_ORIGIN=*

# 日志级别
LOG_LEVEL=error
EOF

# 设置环境变量文件权限
chmod 600 .env
```

### 4. 创建必要目录

```bash
# 创建上传目录
mkdir -p uploads
chmod 755 uploads
```

### 5. 部署应用

```bash
# 使用部署脚本
chmod +x deploy.sh
./deploy.sh

# 或手动部署
pm2 start start-server.js --name habit-tracker-api
pm2 save
pm2 startup
```

### 6. 验证部署

```bash
# 检查进程状态
pm2 status

# 查看应用日志
pm2 logs habit-tracker-api --lines 20

# 测试本地访问
curl http://localhost:3000
curl http://localhost:3000/api/health

# 检查端口监听
sudo netstat -tulpn | grep :3000
```

## 网络安全配置

### 1. 配置阿里云安全组

在阿里云控制台进行以下配置：

1. **登录阿里云控制台**
2. **进入ECS管理页面**
3. **选择你的服务器实例**
4. **点击"安全组"选项卡**
5. **点击安全组ID进入规则管理**
6. **添加入方向规则**：

| 规则 | 协议类型 | 端口范围 | 授权对象 | 描述 |
|------|----------|----------|----------|------|
| 1 | TCP | 22/22 | 你的IP/32 | SSH访问 |
| 2 | TCP | 3000/3000 | 0.0.0.0/0 | API服务 |
| 3 | TCP | 80/80 | 0.0.0.0/0 | HTTP |
| 4 | TCP | 443/443 | 0.0.0.0/0 | HTTPS |

### 2. 服务器防火墙配置

```bash
# 检查防火墙状态
sudo systemctl status firewalld

# 如果防火墙运行正常，配置规则
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload

# 查看开放的端口
sudo firewall-cmd --list-ports
```

### 3. 测试外部访问

```bash
# 在本地电脑测试
curl http://47.92.33.113:3000
curl http://47.92.33.113:3000/api/health
```

## 域名和HTTPS配置

### 1. 安装Nginx

```bash
# 安装Nginx
sudo yum install -y nginx

# 启动并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. 配置Nginx反向代理

```bash
# 创建站点配置
sudo tee /etc/nginx/conf.d/habit-tracker.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name api.yourdomain.com;  # 替换为你的域名

    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;  # 替换为你的域名

    # SSL证书路径（稍后配置）
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # 代理设置
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 文件上传大小限制
    client_max_body_size 10M;
}
EOF

# 测试配置
sudo nginx -t

# 重新加载配置
sudo systemctl reload nginx
```

### 3. 配置SSL证书

```bash
# 安装certbot
sudo yum install -y certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d api.yourdomain.com

# 设置自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### 4. 更新环境变量

```bash
# 更新BASE_URL为HTTPS域名
sed -i 's|BASE_URL=.*|BASE_URL=https://api.yourdomain.com|' .env

# 重启应用
pm2 restart habit-tracker-api
```

## 监控和维护

### 1. 设置PM2监控

```bash
# 安装PM2日志轮转
pm2 install pm2-logrotate

# 配置日志轮转
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true

# 查看PM2监控界面
pm2 monit
```

### 2. 数据库备份脚本

```bash
# 创建备份脚本
sudo tee /opt/habit-tracker/backup.sh > /dev/null << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
mongodump --db habit-tracker --out $BACKUP_DIR/$DATE

# 压缩备份
tar -czf $BACKUP_DIR/habit-tracker_$DATE.tar.gz -C $BACKUP_DIR/$DATE .
rm -rf $BACKUP_DIR/$DATE

# 删除30天前的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "备份完成: $BACKUP_DIR/habit-tracker_$DATE.tar.gz"
EOF

# 设置权限
chmod +x /opt/habit-tracker/backup.sh

# 设置定时备份
sudo crontab -e
# 添加以下行（每天凌晨2点备份）：
# 0 2 * * * /opt/habit-tracker/backup.sh
```

### 3. 监控脚本

```bash
# 创建监控脚本
sudo tee /opt/habit-tracker/monitor.sh > /dev/null << 'EOF'
#!/bin/bash
LOG_FILE="/var/log/habit-tracker-monitor.log"

# 检查API服务
if ! curl -s http://localhost:3000/api/health > /dev/null; then
    echo "$(date): API服务异常，尝试重启" >> $LOG_FILE
    pm2 restart habit-tracker-api
fi

# 检查MongoDB服务
if ! systemctl is-active --quiet mongod; then
    echo "$(date): MongoDB服务异常，尝试重启" >> $LOG_FILE
    sudo systemctl restart mongod
fi

# 检查磁盘空间
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): 磁盘空间不足，当前使用率: ${DISK_USAGE}%" >> $LOG_FILE
fi
EOF

# 设置权限
chmod +x /opt/habit-tracker/monitor.sh

# 设置定时检查（每5分钟）
sudo crontab -e
# 添加以下行：
# */5 * * * * /opt/habit-tracker/monitor.sh
```

## 故障排查

### 常见问题及解决方案

#### 1. 应用无法启动

```bash
# 检查进程状态
pm2 status

# 查看详细日志
pm2 logs habit-tracker-api

# 检查端口占用
sudo lsof -i :3000

# 手动启动查看错误
cd /opt/habit-tracker/server
node start-server.js
```

#### 2. 数据库连接失败

```bash
# 检查MongoDB服务
sudo systemctl status mongod

# 查看MongoDB日志
sudo tail -f /var/log/mongodb/mongod.log

# 测试连接
mongo mongodb://localhost:27017/habit-tracker --eval "db.stats()"

# 重启MongoDB
sudo systemctl restart mongod
```

#### 3. 外部无法访问

```bash
# 检查本地访问
curl http://localhost:3000

# 检查端口监听
sudo netstat -tulpn | grep :3000

# 检查防火墙
sudo firewall-cmd --list-ports

# 检查阿里云安全组设置
```

#### 4. 性能问题

```bash
# 查看系统资源
top
free -h
df -h

# 查看PM2监控
pm2 monit

# 查看MongoDB性能
mongo --eval "db.stats()"

# 查看应用日志
pm2 logs habit-tracker-api --lines 100
```

### 日志位置

- **应用日志**: `~/.pm2/logs/`
- **MongoDB日志**: `/var/log/mongodb/mongod.log`
- **Nginx日志**: `/var/log/nginx/`
- **系统日志**: `/var/log/messages`

### 性能优化建议

1. **数据库优化**
   - 为常用查询添加索引
   - 定期清理过期数据
   - 配置合适的内存设置

2. **应用优化**
   - 启用压缩中间件
   - 配置缓存策略
   - 优化数据库查询

3. **服务器优化**
   - 调整文件描述符限制
   - 配置合适的swap空间
   - 定期更新系统

## 部署清单

### 部署前检查

- [ ] 服务器规格满足要求
- [ ] 域名DNS解析配置
- [ ] SSL证书准备就绪
- [ ] 备份策略制定

### 部署步骤

- [ ] 环境准备完成
- [ ] MongoDB安装配置
- [ ] 项目代码部署
- [ ] 环境变量配置
- [ ] PM2服务启动
- [ ] 网络安全配置
- [ ] Nginx反向代理
- [ ] SSL证书配置
- [ ] 监控脚本部署

### 部署后验证

- [ ] 本地API访问正常
- [ ] 外部API访问正常
- [ ] 数据库连接正常
- [ ] 文件上传功能正常
- [ ] 监控告警正常
- [ ] 备份策略生效

## 总结

本部署指南记录了完整的生产环境部署流程。关键要点：

1. **使用正确的启动脚本**: `start-server.js`
2. **PM2进程管理**: 确保服务稳定运行
3. **安全配置**: 防火墙和安全组配置
4. **监控告警**: 及时发现和处理问题
5. **备份策略**: 确保数据安全

遵循本指南可以确保服务稳定、安全地运行在生产环境中。 
