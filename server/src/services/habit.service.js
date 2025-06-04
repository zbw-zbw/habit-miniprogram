/**
 * 习惯服务
 */
const Habit = require('../models/habit.model');
const Checkin = require('../models/checkin.model');

/**
 * 获取习惯详情及统计数据
 * @param {string} habitId 习惯ID
 * @param {Object} user 用户对象
 * @returns {Promise<Object>} 习惯详情及统计数据
 */
exports.getHabitWithStats = async (habitId, user) => {
  // 获取习惯详情
  const habit = await Habit.findOne({ _id: habitId, user: user._id });
  
  if (!habit) {
    throw new Error('习惯不存在');
  }
  
  // 确保stats字段存在
  const stats = habit.stats || {
    totalDays: 0,
    completedDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null
  };
  
  // 计算完成率
  const completionRate = stats.totalDays > 0 ? stats.completedDays / stats.totalDays : 0;
  
  // 获取最近一周的打卡记录
  const today = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(today.getDate() - 7);
  
  const recentCheckins = await Checkin.find({
    habit: habit._id,
    date: { $gte: oneWeekAgo.toISOString().split('T')[0] }
  }).sort({ date: 1 });
  
  // 获取每周每天的完成情况
  const weeklyData = [0, 0, 0, 0, 0, 0, 0]; // 周一到周日
  
  recentCheckins.forEach(checkin => {
    if (checkin.isCompleted) {
      const date = new Date(checkin.date);
      const dayOfWeek = date.getDay(); // 0是周日，1是周一
      const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 转换为周一为0
      weeklyData[index]++;
    }
  });
  
  // 准备返回的统计数据
  const statsData = {
    totalCompletions: stats.completedDays,
    totalDays: stats.totalDays,
    completionRate,
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    lastCompletedDate: stats.lastCompletedDate,
    weeklyData
  };
  
  return {
    habit,
    stats: statsData
  };
};

/**
 * 获取多个习惯及其统计数据
 * @param {Object} query 查询条件
 * @param {Object} user 用户对象
 * @returns {Promise<Array>} 习惯数组及其统计数据
 */
exports.getHabitsWithStats = async (query, user) => {
  const {
    date,
    category,
    includeArchived,
    excludeHabitId,
    sort = 'createdAt',
    order = 'desc',
  } = query;

  // 构建查询条件
  const dbQuery = { user: user._id };

  if (category) {
    dbQuery.category = category;
  }

  if (excludeHabitId) {
    dbQuery._id = { $ne: excludeHabitId };
  }

  // 正确处理includeArchived参数
  if (includeArchived !== undefined) {
    // 将字符串转换为布尔值
    const shouldIncludeArchived =
      includeArchived === 'true' || includeArchived === true;

    // 如果不包含归档习惯，则添加isArchived=false条件
    if (!shouldIncludeArchived) {
      dbQuery.isArchived = false;
    }
  }

  // 构建排序条件
  const sortOptions = {};
  sortOptions[sort] = order === 'desc' ? -1 : 1;

  const habits = await Habit.find(dbQuery)
    .sort(sortOptions)
    .populate('advanced.templateId', 'name description scientificBasis');

  // 为每个习惯添加统计数据
  const habitsWithStats = await Promise.all(
    habits.map(async (habit) => {
      const habitObj = habit.toObject();

      // 确保stats对象存在
      const stats = habitObj.stats || {
        totalDays: 0,
        completedDays: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null
      };

      // 计算完成率
      const completionRate = stats.totalDays > 0 ? stats.completedDays / stats.totalDays : 0;

      // 如果提供了日期，检查当天是否已完成
      if (date) {
        const checkin = await Checkin.findOne({
          habit: habit._id,
          date,
          isCompleted: true
        });
        
        habitObj.isCompleted = !!checkin;
      }

      // 添加统计数据
      habitObj.stats = {
        totalCompletions: stats.completedDays,
        totalDays: stats.totalDays,
        completionRate,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        lastCompletedDate: stats.lastCompletedDate
      };

      return habitObj;
    })
  );

  return {
    habits: habitsWithStats
  };
}; 
