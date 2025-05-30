/**
 * 习惯打卡小程序后端服务启动脚本
 * 此脚本会自动查找可用端口并启动服务器
 */
const { spawn } = require('child_process');
const net = require('net');
const path = require('path');
const fs = require('fs');

// 默认端口范围
const START_PORT = 3000;
const END_PORT = 3010;

/**
 * 检查端口是否可用
 * @param {number} port 要检查的端口
 * @returns {Promise<boolean>} 如果端口可用，则返回true
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', () => {
      // 端口被占用
      resolve(false);
    });
    
    server.once('listening', () => {
      // 端口可用，关闭服务器
      server.close(() => {
        resolve(true);
      });
    });
    
    server.listen(port);
  });
}

/**
 * 查找可用端口
 * @param {number} startPort 起始端口
 * @param {number} endPort 结束端口
 * @returns {Promise<number>} 可用端口
 */
async function findAvailablePort(startPort, endPort) {
  for (let port = startPort; port <= endPort; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  
  throw new Error(`在端口范围 ${startPort}-${endPort} 中没有找到可用端口`);
}

/**
 * 更新API基础URL
 * @param {number} port 端口号
 */
function updateApiBaseUrl(port) {
  const appJsPath = path.join(__dirname, '..', 'app.js');
  
  if (fs.existsSync(appJsPath)) {
    let content = fs.readFileSync(appJsPath, 'utf8');
    
    // 更新API基础URL
    content = content.replace(
      /apiBaseUrl: ['"]http:\/\/localhost:\d+['"]/,
      `apiBaseUrl: 'http://localhost:${port}'`
    );
    
    fs.writeFileSync(appJsPath, content, 'utf8');
    console.log(`已更新小程序API基础URL为 http://localhost:${port}`);
  } else {
    console.warn('未找到app.js文件，无法更新API基础URL');
  }
}

/**
 * 启动服务器
 * @param {number} port 端口号
 */
function startServer(port) {
  console.log(`正在端口 ${port} 上启动服务器...`);
  
  // 设置环境变量
  const env = { ...process.env, PORT: port.toString() };
  
  // 启动服务器
  const server = spawn('node', ['src/app.js'], {
    cwd: __dirname,
    env,
    stdio: 'inherit'
  });
  
  server.on('error', (err) => {
    console.error('启动服务器时出错:', err);
    process.exit(1);
  });
  
  server.on('exit', (code) => {
    if (code !== 0) {
      console.error(`服务器进程以代码 ${code} 退出`);
      process.exit(code);
    }
  });
  
  // 监听Ctrl+C信号
  process.on('SIGINT', () => {
    console.log('正在关闭服务器...');
    server.kill();
    process.exit(0);
  });
}

/**
 * 主函数
 */
async function main() {
  try {
    // 查找可用端口
    const port = await findAvailablePort(START_PORT, END_PORT);
    
    // 更新API基础URL
    updateApiBaseUrl(port);
    
    // 启动服务器
    startServer(port);
  } catch (err) {
    console.error('启动服务器失败:', err);
    process.exit(1);
  }
}

// 执行主函数
main(); 
