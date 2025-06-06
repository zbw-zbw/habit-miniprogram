/**
 * 用户相关路由
 */
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const multer = require('multer');
const path = require('path');

// 配置头像上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (ext && mimetype) {
      return cb(null, true);
    }
    
    cb(new Error('只允许上传图片文件'));
  }
});

/**
 * @route GET /api/users/profile
 * @desc 获取当前用户资料
 * @access Private
 */
router.get('/profile', authMiddleware, userController.getProfile);

/**
 * @route GET /api/users/profile/all
 * @desc 获取用户资料聚合数据（包括基本信息、统计数据和成就）
 * @access Private
 */
router.get('/profile/all', authMiddleware, userController.getProfileAll);

/**
 * @route PUT /api/users/profile
 * @desc 更新当前用户资料
 * @access Private
 */
router.put(
  '/profile',
  authMiddleware,
  [
    body('nickname').optional().isLength({ min: 1, max: 30 }).withMessage('昵称长度应在1-30个字符之间'),
    body('gender').optional().isIn(['male', 'female', 'other', 'unknown']).withMessage('性别值无效')
  ],
  userController.updateProfile
);

/**
 * @route PUT /api/users/me
 * @desc 更新当前用户资料（包括昵称和头像）
 * @access Private
 */
router.put(
  '/me',
  authMiddleware,
  [
    body('nickName').optional().isLength({ min: 1, max: 30 }).withMessage('昵称长度应在1-30个字符之间'),
    body('avatarUrl').optional().isURL().withMessage('头像URL格式不正确')
  ],
  userController.updateProfile
);

/**
 * @route POST /api/users/avatar
 * @desc 上传用户头像
 * @access Private
 */
router.post(
  '/avatar',
  authMiddleware,
  upload.single('avatar'),
  userController.uploadAvatar
);

/**
 * @route POST /api/users/me/avatar
 * @desc 上传用户头像（别名）
 * @access Private
 */
router.post(
  '/me/avatar',
  authMiddleware,
  upload.single('avatar'),
  userController.uploadAvatar
);

/**
 * @route PUT /api/users/password
 * @desc 修改用户密码
 * @access Private
 */
router.put(
  '/password',
  authMiddleware,
  [
    body('currentPassword').notEmpty().withMessage('请提供当前密码'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('新密码长度至少为6个字符')
  ],
  userController.changePassword
);

/**
 * @route GET /api/users/settings
 * @desc 获取用户设置
 * @access Private
 */
router.get('/settings', authMiddleware, userController.getSettings);

/**
 * @route PUT /api/users/settings
 * @desc 更新用户设置
 * @access Private
 */
router.put('/settings', authMiddleware, userController.updateSettings);

/**
 * @route GET /api/users/achievements
 * @desc 获取用户成就
 * @access Private
 */
router.get('/achievements', authMiddleware, userController.getAchievements);

/**
 * @route GET /api/users/me/achievements
 * @desc 获取当前用户的所有成就
 * @access Private
 */
router.get('/me/achievements', authMiddleware, userController.getUserAchievements);

/**
 * @route GET /api/users/stats
 * @desc 获取用户统计数据
 * @access Private
 */
router.get('/stats', authMiddleware, userController.getUserStats);

/**
 * @route GET /api/users/admin/all
 * @desc 获取所有用户（管理员功能）
 * @access Private (Admin)
 */
router.get('/admin/all', authMiddleware, authMiddleware.isAdmin, userController.getAllUsers);

/**
 * @route PUT /api/users/admin/:userId
 * @desc 管理员更新用户信息
 * @access Private (Admin)
 */
router.put(
  '/admin/:userId',
  authMiddleware,
  authMiddleware.isAdmin,
  userController.adminUpdateUser
);

/**
 * @route DELETE /api/users/admin/:userId
 * @desc 管理员删除用户
 * @access Private (Admin)
 */
router.delete(
  '/admin/:userId',
  authMiddleware,
  authMiddleware.isAdmin,
  userController.adminDeleteUser
);

/**
 * @route GET /api/users/:userId
 * @desc 获取指定用户公开资料
 * @access Private
 */
router.get('/:userId', authMiddleware, userController.getUserPublicProfile);

/**
 * @route GET /api/users/:userId/habits
 * @desc 获取指定用户的习惯
 * @access Private
 */
router.get('/:userId/habits', authMiddleware, userController.getUserHabits);

/**
 * @route GET /api/users/:userId/achievements
 * @desc 获取指定用户的成就
 * @access Private
 */
router.get('/:userId/achievements', authMiddleware, userController.getUserAchievements);

module.exports = router; 
