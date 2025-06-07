FROM node:16-alpine

WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制所有文件
COPY . .

# 创建上传目录
RUN mkdir -p uploads && chmod 777 uploads

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "src/app.js"] 
