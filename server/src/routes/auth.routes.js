/**
 * 认证相关路由
 */
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');

/**
 * @route POST /api/auth/register
 * @desc 注册新用户
 * @access Public
 */
router.post(
  '/register',
  [
    body('username')
      .isLength({ min: 3, max: 30 })
      .withMessage('用户名长度应在3-30个字符之间')
      .isAlphanumeric()
      .withMessage('用户名只能包含字母和数字'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('密码长度至少为6个字符'),
    body('nickname')
      .optional()
      .isLength({ max: 30 })
      .withMessage('昵称长度不能超过30个字符'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('请提供有效的电子邮件地址')
  ],
  authController.register
);

/**
 * @route POST /api/auth/login
 * @desc 用户登录
 * @access Public
 */
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('请提供用户名'),
    body('password').notEmpty().withMessage('请提供密码')
  ],
  authController.login
);

/**
 * @route POST /api/auth/wx-login
 * @desc 微信小程序登录
 * @access Public
 */
router.post(
  '/wx-login',
  [
    body('code').notEmpty().withMessage('请提供微信登录code')
  ],
  authController.wxLogin
);

/**
 * @route POST /api/auth/refresh-token
 * @desc 刷新访问令牌
 * @access Public
 */
router.post(
  '/refresh-token',
  [
    body('refreshToken').notEmpty().withMessage('请提供刷新令牌')
  ],
  authController.refreshToken
);

/**
 * @route POST /api/auth/forgot-password
 * @desc 忘记密码
 * @access Public
 */
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('请提供有效的电子邮件地址')
  ],
  authController.forgotPassword
);

/**
 * @route POST /api/auth/reset-password
 * @desc 重置密码
 * @access Public
 */
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('请提供重置令牌'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('密码长度至少为6个字符')
  ],
  authController.resetPassword
);

/**
 * @route POST /api/auth/verify-email
 * @desc 验证电子邮件
 * @access Public
 */
router.post(
  '/verify-email',
  [
    body('token').notEmpty().withMessage('请提供验证令牌')
  ],
  authController.verifyEmail
);

/**
 * @route POST /api/auth/logout
 * @desc 用户登出
 * @access Private
 */
router.post('/logout', authController.logout);

/**
 * @route GET /api/auth/verify-token
 * @desc 验证令牌
 * @access Public
 */
router.get('/verify-token', authController.verifyToken);

module.exports = router; 
