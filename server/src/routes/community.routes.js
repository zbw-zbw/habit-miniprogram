/**
 * 社区相关路由
 */
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middlewares/auth.middleware');
const postController = require('../controllers/post.controller');
const commentController = require('../controllers/comment.controller');
const followController = require('../controllers/follow.controller');
const challengeController = require('../controllers/challenge.controller');
const searchController = require('../controllers/search.controller');

// 资源所有者权限中间件
const checkResourceOwner = (req, res, next) => {
  if (req.resource && req.resource.user && req.resource.user.toString() === req.user._id.toString()) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: '无权操作此资源'
  });
};

// 动态相关路由
router.get('/posts', authMiddleware, postController.getPosts);
router.post('/posts', [
  authMiddleware,
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('动态内容长度应在1-1000字之间'),
  body('privacy').optional().isIn(['public', 'friends', 'private']).withMessage('隐私设置值无效')
], postController.createPost);
router.get('/posts/:postId', authMiddleware, postController.getPost);
router.put('/posts/:postId', [
  authMiddleware,
  body('content').optional().trim().isLength({ min: 1, max: 1000 }).withMessage('动态内容长度应在1-1000字之间'),
  body('privacy').optional().isIn(['public', 'friends', 'private']).withMessage('隐私设置值无效')
], postController.checkPostOwner, checkResourceOwner, postController.updatePost);
router.delete('/posts/:postId', authMiddleware, postController.checkPostOwner, checkResourceOwner, postController.deletePost);
router.post('/posts/:postId/like', authMiddleware, postController.likePost);
router.post('/posts/:postId/unlike', authMiddleware, postController.unlikePost);

// 评论相关路由
router.get('/posts/:postId/comments', authMiddleware, commentController.getComments);
router.post('/posts/:postId/comments', [
  authMiddleware,
  body('content').trim().isLength({ min: 1, max: 500 }).withMessage('评论内容长度应在1-500字之间')
], commentController.createComment);
router.put('/comments/:commentId', [
  authMiddleware,
  body('content').trim().isLength({ min: 1, max: 500 }).withMessage('评论内容长度应在1-500字之间')
], commentController.checkCommentOwner, checkResourceOwner, commentController.updateComment);
router.delete('/comments/:commentId', authMiddleware, commentController.checkCommentOwner, checkResourceOwner, commentController.deleteComment);
router.post('/comments/:commentId/like', authMiddleware, commentController.likeComment);
router.post('/comments/:commentId/unlike', authMiddleware, commentController.unlikeComment);

// 用户关注相关路由
router.get('/users/following', authMiddleware, followController.getFollowing);
router.get('/users/followers', authMiddleware, followController.getFollowers);
router.post('/users/:userId/follow', authMiddleware, followController.followUser);
router.post('/users/:userId/unfollow', authMiddleware, followController.unfollowUser);
router.get('/users/:userId/following', authMiddleware, followController.getUserFollowing);
router.get('/users/:userId/followers', authMiddleware, followController.getUserFollowers);

// 挑战相关路由
router.get('/challenges', authMiddleware, challengeController.getChallenges);
router.post('/challenges', [
  authMiddleware,
  body('name').trim().isLength({ min: 3, max: 100 }).withMessage('挑战名称长度应在3-100字之间'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('挑战描述长度应在10-1000字之间'),
  body('targetHabit.name').trim().isLength({ min: 1 }).withMessage('目标习惯名称不能为空'),
  body('requirements.targetCount').isInt({ min: 1 }).withMessage('目标完成次数必须大于0'),
  body('dateRange.startDate').isISO8601().withMessage('开始日期格式无效'),
  body('dateRange.endDate').isISO8601().withMessage('结束日期格式无效')
], challengeController.createChallenge);
router.get('/challenges/:challengeId', authMiddleware, challengeController.getChallenge);
router.put('/challenges/:challengeId', [
  authMiddleware,
  body('name').optional().trim().isLength({ min: 3, max: 100 }).withMessage('挑战名称长度应在3-100字之间'),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('挑战描述长度应在10-1000字之间')
], challengeController.checkChallengeOwner, checkResourceOwner, challengeController.updateChallenge);
router.delete('/challenges/:challengeId', authMiddleware, challengeController.checkChallengeOwner, checkResourceOwner, challengeController.deleteChallenge);
router.post('/challenges/:challengeId/join', authMiddleware, challengeController.joinChallenge);
router.post('/challenges/:challengeId/leave', authMiddleware, challengeController.leaveChallenge);
router.get('/challenges/:challengeId/participants', authMiddleware, challengeController.getChallengeParticipants);
router.get('/challenges/:challengeId/leaderboard', authMiddleware, challengeController.getChallengeLeaderboard);
router.get('/my-challenges', authMiddleware, challengeController.getUserChallenges);

// 用户推荐和搜索路由
router.get('/recommend-users', authMiddleware, followController.getRecommendUsers);
router.get('/search/users', authMiddleware, followController.searchUsers);

// 社区搜索路由
router.get('/search', authMiddleware, searchController.search);
router.get('/hot-searches', authMiddleware, searchController.getHotSearches);
router.get('/hot-topics', authMiddleware, searchController.getHotTopics);

module.exports = router; 
 