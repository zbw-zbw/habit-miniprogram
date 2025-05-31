/**
 * 仪表盘数据聚合路由
 */
const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * @route GET /api/dashboard
 * @desc 获取仪表盘数据（聚合习惯、打卡记录和统计数据）
 * @access Private
 */
router.get(
  '/dashboard',
  authMiddleware,
  [
    query('date')
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('日期格式应为YYYY-MM-DD'),
    query('days')
      .optional()
      .isInt({ min: 0, max: 365 })
      .withMessage('天数必须是0-365之间的整数')
  ],
  dashboardController.getDashboard
);

/**
 * @route GET /api/habits/all
 * @desc 获取所有习惯列表及相关数据（专为习惯页面设计）
 * @access Private
 */
router.get(
  '/habits/all',
  authMiddleware,
  [
    query('includeArchived')
      .optional()
      .isBoolean()
      .withMessage('includeArchived必须是布尔值'),
    query('includeStats')
      .optional()
      .isBoolean()
      .withMessage('includeStats必须是布尔值'),
    query('includeCheckins')
      .optional()
      .isBoolean()
      .withMessage('includeCheckins必须是布尔值'),
    query('days')
      .optional()
      .isInt({ min: 0, max: 365 })
      .withMessage('天数必须是0-365之间的整数')
  ],
  dashboardController.getAllHabits
);

/**
 * @route GET /api/analytics
 * @desc 获取分析数据（专为分析页面设计）
 * @access Private
 */
router.get(
  '/analytics',
  authMiddleware,
  [
    query('startDate')
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('开始日期格式应为YYYY-MM-DD'),
    query('endDate')
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('结束日期格式应为YYYY-MM-DD'),
    query('timeRange')
      .optional()
      .isIn(['week', 'month', 'year', 'all'])
      .withMessage('时间范围必须是week、month、year或all之一')
  ],
  dashboardController.getAnalytics
);

module.exports = router; 
 