/**
 * 习惯打卡小程序后端服务
 */
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// 导入路由
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const habitRoutes = require('./routes/habit.routes');
const checkinRoutes = require('./routes/checkin.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const communityRoutes = require('./routes/community.routes');
const notificationRoutes = require('./routes/notification.routes');
const settingsRoutes = require('./routes/settings.routes');
const friendsRoutes = require('./routes/friends.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const groupRoutes = require('./routes/group.routes');
const mediaRoutes = require('./routes/media.routes');
const uploadRoutes = require('./routes/upload.routes');

// 导入控制器
const postController = require('./controllers/post.controller');
const challengeController = require('./controllers/challenge.controller');
const authMiddleware = require('./middlewares/auth.middleware');

// 初始化Express应用
const app = express();
const PORT = process.env.PORT || 3002;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/upload', uploadRoutes);

// 聚合API路由
app.use('/api', dashboardRoutes);

// 直接访问社区接口
app.get('/api/posts', authMiddleware, postController.getPosts);
app.post('/api/posts', authMiddleware, postController.createPost);
app.get('/api/posts/:postId', authMiddleware, postController.getPost);
app.post('/api/posts/:postId/like', authMiddleware, postController.likePost);
app.post('/api/posts/:postId/unlike', authMiddleware, postController.unlikePost);
app.get('/api/posts/:postId/comments', authMiddleware, require('./controllers/comment.controller').getComments);
app.post('/api/posts/:postId/comments', authMiddleware, require('./controllers/comment.controller').createComment);

// 评论相关操作
const commentController = require('./controllers/comment.controller');
app.post('/api/comments/:commentId/like', authMiddleware, commentController.likeComment);
app.post('/api/comments/:commentId/unlike', authMiddleware, commentController.unlikeComment);
app.delete('/api/comments/:commentId', authMiddleware, commentController.checkCommentOwner, commentController.deleteComment);

// 挑战相关操作
app.get('/api/challenges', authMiddleware, challengeController.getChallenges);
app.post('/api/challenges', authMiddleware, challengeController.createChallenge);
app.get('/api/challenges/:challengeId', authMiddleware, challengeController.getChallenge);
app.post('/api/challenges/:challengeId/join', authMiddleware, challengeController.joinChallenge);
app.post('/api/challenges/:challengeId/leave', authMiddleware, challengeController.leaveChallenge);
app.get('/api/challenges/:challengeId/participants', authMiddleware, challengeController.getChallengeParticipants);
app.get('/api/challenges/:challengeId/leaderboard', authMiddleware, challengeController.getChallengeLeaderboard);
app.post('/api/challenges/:challengeId/dismiss', authMiddleware, (req, res, next) => {
  // 设置资源对象，以便后续中间件可以使用
  req.resource = { creator: req.user._id };
  next();
}, challengeController.deleteChallenge); // 使用deleteChallenge作为解散挑战的处理函数

// 消息相关路由
app.use('/api/messages', require('./routes/message.routes'));

// 根路由
app.get('/', (req, res) => {
  res.json({
    message: '习惯打卡小程序API服务',
    version: '1.0.0',
    status: 'running'
  });
});

// 健康检查路由
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/habit-tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('数据库连接成功');
  // 启动服务器
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
  });
})
.catch((err) => {
  console.error('数据库连接失败:', err);
  process.exit(1);
});

module.exports = app; 
 