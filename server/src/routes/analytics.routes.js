/**
 * 数据分析相关路由
 */
const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * @route GET /api/analytics/dashboard
 * @desc 获取仪表盘数据
 * @access Private
 */
router.get('/dashboard', authMiddleware, analyticsController.getDashboard);

/**
 * @route GET /api/analytics/habits/completion
 * @desc 获取习惯完成率数据
 * @access Private
 */
router.get(
  '/habits/completion',
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
    query('habitId')
      .optional()
  ],
  analyticsController.getHabitsCompletion
);

/**
 * @route GET /api/analytics/habits/streak
 * @desc 获取习惯连续记录数据
 * @access Private
 */
router.get(
  '/habits/streak',
  authMiddleware,
  [
    query('habitId').optional()
  ],
  analyticsController.getHabitsStreak
);

/**
 * @route GET /api/analytics/habits/trends
 * @desc 获取习惯趋势数据
 * @access Private
 */
router.get(
  '/habits/trends',
  authMiddleware,
  [
    query('period')
      .optional()
      .isIn(['week', 'month', 'year'])
      .withMessage('周期必须是week、month或year之一'),
    query('habitId').optional()
  ],
  analyticsController.getHabitsTrends
);

/**
 * @route GET /api/analytics/habits/comparison
 * @desc 获取习惯对比数据
 * @access Private
 */
router.get(
  '/habits/comparison',
  authMiddleware,
  [
    query('habitIds')
      .notEmpty()
      .withMessage('必须提供习惯ID列表')
  ],
  analyticsController.getHabitsComparison
);

/**
 * @route GET /api/analytics/time/distribution
 * @desc 获取时间分布数据
 * @access Private
 */
router.get(
  '/time/distribution',
  authMiddleware,
  [
    query('habitId').optional(),
    query('type')
      .optional()
      .isIn(['hourly', 'daily', 'weekly', 'monthly'])
      .withMessage('类型必须是hourly、daily、weekly或monthly之一')
  ],
  analyticsController.getTimeDistribution
);

/**
 * @route GET /api/analytics/patterns
 * @desc 获取习惯模式数据
 * @access Private
 */
router.get('/patterns', authMiddleware, analyticsController.getPatterns);

/**
 * @route GET /api/analytics/insights
 * @desc 获取习惯洞察数据
 * @access Private
 */
router.get(
  '/insights',
  authMiddleware,
  [
    query('habitId').optional()
  ],
  analyticsController.getInsights
);

/**
 * @route GET /api/analytics/reports/weekly
 * @desc 获取周报告
 * @access Private
 */
router.get(
  '/reports/weekly',
  authMiddleware,
  [
    query('date')
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('日期格式应为YYYY-MM-DD')
  ],
  analyticsController.getWeeklyReport
);

/**
 * @route GET /api/analytics/reports/monthly
 * @desc 获取月报告
 * @access Private
 */
router.get(
  '/reports/monthly',
  authMiddleware,
  [
    query('month')
      .optional()
      .matches(/^\d{4}-\d{2}$/)
      .withMessage('月份格式应为YYYY-MM')
  ],
  analyticsController.getMonthlyReport
);

/**
 * @route GET /api/analytics/report
 * @desc 生成习惯报告
 * @access Private
 */
router.get(
  '/report',
  authMiddleware,
  [
    query('startDate')
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('开始日期格式应为YYYY-MM-DD'),
    query('endDate')
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('结束日期格式应为YYYY-MM-DD')
  ],
  analyticsController.generateReport
);

/**
 * @route GET /api/analytics/export
 * @desc 导出分析数据
 * @access Private
 */
router.get(
  '/export',
  authMiddleware,
  [
    query('format')
      .isIn(['csv', 'json', 'pdf'])
      .withMessage('格式必须是csv、json或pdf之一'),
    query('startDate')
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('开始日期格式应为YYYY-MM-DD'),
    query('endDate')
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('结束日期格式应为YYYY-MM-DD')
  ],
  analyticsController.exportData
);

module.exports = router; 
