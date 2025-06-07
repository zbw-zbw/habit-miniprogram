console.log('检查所有路由和控制器文件...');

// 所有需要检查的文件
const filesToCheck = [
  // 路由文件
  './src/routes/auth.routes',
  './src/routes/user.routes',
  './src/routes/habit.routes',
  './src/routes/checkin.routes',
  './src/routes/analytics.routes',
  './src/routes/community.routes',
  './src/routes/notification.routes',
  './src/routes/settings.routes',
  './src/routes/friends.routes',
  './src/routes/dashboard.routes',
  './src/routes/group.routes',
  './src/routes/media.routes',
  './src/routes/upload.routes',
  './src/routes/message.routes',
  
  // 控制器文件
  './src/controllers/post.controller',
  './src/controllers/challenge.controller',
  './src/controllers/comment.controller',
  
  // 中间件文件
  './src/middlewares/auth.middleware'
];

console.log('开始检查文件...\n');

filesToCheck.forEach(filePath => {
  try {
    require(filePath);
    console.log(`✓ ${filePath}`);
  } catch (err) {
    console.log(`✗ ${filePath}`);
    console.log(`  错误: ${err.message}`);
    if (err.stack) {
      console.log(`  详细: ${err.stack.split('\n')[1]?.trim()}`);
    }
    console.log('');
  }
});

console.log('\n检查完成！'); 
