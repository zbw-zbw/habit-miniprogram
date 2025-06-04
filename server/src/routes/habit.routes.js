/**
 * 习惯相关路由
 */
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const habitController = require('../controllers/habit.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { findResource } = require('../middlewares/resource-finder.middleware');

/**
 * 检查资源所有权的中间件
 */
const isOwner = (modelName, paramName) => {
  return findResource(modelName, paramName, true);
};

/**
 * @route GET /api/habits/categories
 * @desc 获取习惯分类
 * @access Public
 */
router.get('/categories', habitController.getCategories);

/**
 * @route GET /api/habits/templates
 * @desc 获取习惯模板
 * @access Public
 */
router.get('/templates', habitController.getTemplates);

/**
 * @route GET /api/habits/templates/:templateId
 * @desc 获取指定习惯模板
 * @access Public
 */
router.get('/templates/:templateId', habitController.getTemplate);

/**
 * @route POST /api/habits/from-template/:templateId
 * @desc 从模板创建习惯
 * @access Private
 */
router.post('/from-template/:templateId', authMiddleware, habitController.createFromTemplate);

/**
 * @route GET /api/habits
 * @desc 获取所有习惯
 * @access Private
 */
router.get('/', authMiddleware, habitController.getHabits);

/**
 * @route GET /api/habits/with-stats
 * @desc 获取多个习惯及其统计数据（聚合API）
 * @access Private
 */
router.get('/with-stats', authMiddleware, habitController.getHabitsWithStats);

/**
 * @route POST /api/habits
 * @desc 创建新习惯
 * @access Private
 */
router.post(
  '/',
  authMiddleware,
  [
    body('name').notEmpty().withMessage('习惯名称不能为空'),
    body('frequency.type')
      .isIn(['daily', 'weekly', 'monthly', 'custom', 'weekends', 'workdays'])
      .withMessage('无效的频率类型')
  ],
  habitController.createHabit
);

/**
 * @route GET /api/habits/:habitId
 * @desc 获取指定习惯
 * @access Private
 */
router.get('/:habitId', authMiddleware, isOwner('Habit', 'habitId'), habitController.getHabit);

/**
 * @route GET /api/habits/:habitId/with-stats
 * @desc 获取指定习惯的详情及统计数据（聚合API）
 * @access Private
 */
router.get('/:habitId/with-stats', authMiddleware, isOwner('Habit', 'habitId'), habitController.getHabitWithStats);

/**
 * @route PUT /api/habits/:habitId
 * @desc 更新指定习惯
 * @access Private
 */
router.put(
  '/:habitId',
  authMiddleware,
  isOwner('Habit', 'habitId'),
  [
    body('name').optional().notEmpty().withMessage('习惯名称不能为空'),
    body('frequency.type')
      .optional()
      .isIn(['daily', 'weekly', 'monthly', 'custom', 'weekends', 'workdays'])
      .withMessage('无效的频率类型')
  ],
  habitController.updateHabit
);

/**
 * @route DELETE /api/habits/:habitId
 * @desc 删除指定习惯
 * @access Private
 */
router.delete('/:habitId', authMiddleware, isOwner('Habit', 'habitId'), habitController.deleteHabit);

/**
 * @route GET /api/habits/:habitId/checkins
 * @desc 获取指定习惯的打卡记录
 * @access Private
 */
router.get('/:habitId/checkins', authMiddleware, isOwner('Habit', 'habitId'), habitController.getHabitCheckins);

/**
 * @route GET /api/habits/:habitId/stats
 * @desc 获取指定习惯的统计数据
 * @access Private
 */
router.get('/:habitId/stats', authMiddleware, isOwner('Habit', 'habitId'), habitController.getHabitStats);

/**
 * @route POST /api/habits/:habitId/archive
 * @desc 归档/取消归档指定习惯
 * @access Private
 */
router.post('/:habitId/archive', authMiddleware, isOwner('Habit', 'habitId'), habitController.archiveHabit);

/**
 * @route GET /api/habits/categories
 * @desc 获取习惯分类列表
 * @access Private
 */

module.exports = router; 
