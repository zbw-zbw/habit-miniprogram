/**
 * 打卡服务
 */
const Checkin = require('../models/checkin.model');
const Habit = require('../models/habit.model');
const User = require('../models/user.model');

/**
 * 创建打卡记录并返回详细信息
 * @param {Object} data 打卡数据
 * @param {Object} user 用户对象
 * @returns {Promise<Object>} 打卡记录及相关数据
 */
exports.createCheckinWithDetails = async (data, user) => {
  const {
    habit: habitId,
    date,
    time,
    isCompleted = true,
    value = 1,
    duration,
    note,
    mood,
    difficulty,
    media = [],
    location,
    isBackfill = false,
    isPublic = false
  } = data;
  
  // 检查习惯是否存在
  const habit = await Habit.findById(habitId);
  
  if (!habit) {
    throw new Error('习惯不存在');
  }
  
  // 检查习惯是否属于当前用户
  if (habit.user.toString() !== user._id.toString()) {
    throw new Error('无权操作此习惯');
  }
  
  // 检查是否已存在该日期的打卡记录
  const existingCheckin = await Checkin.findOne({
    habit: habitId,
    date
  });
  
  if (existingCheckin) {
    throw new Error('该日期已存在打卡记录');
  }
  
  // 创建新打卡记录
  const checkin = new Checkin({
    habit: habitId,
    user: user._id,
    date,
    time,
    isCompleted,
    value,
    duration,
    note,
    mood,
    difficulty,
    media,
    location,
    isBackfill,
    isPublic
  });
  
  // 保存打卡记录
  await checkin.save();
  
  // 更新习惯统计数据
  if (isCompleted) {
    // 增加完成天数
    habit.stats.completedDays += 1;
    
    // 更新最后完成日期
    habit.stats.lastCompletedDate = new Date();
    
    // 更新连续打卡天数
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayFormatted = yesterday.toISOString().split('T')[0];
    
    const yesterdayCheckin = await Checkin.findOne({
      habit: habitId,
      date: yesterdayFormatted,
      isCompleted: true
    });
    
    if (yesterdayCheckin || habit.stats.currentStreak === 0) {
      habit.stats.currentStreak += 1;
      
      // 更新最长连续天数
      if (habit.stats.currentStreak > habit.stats.longestStreak) {
        habit.stats.longestStreak = habit.stats.currentStreak;
      }
    } else {
      habit.stats.currentStreak = 1;
    }
    
    // 更新用户统计数据
    await User.findByIdAndUpdate(user._id, {
      $inc: { completedCheckins: 1 }
    });
  }
  
  // 增加总天数
  habit.stats.totalDays += 1;
  
  // 计算完成率
  habit.stats.completionRate = habit.stats.completedDays / habit.stats.totalDays;
  
  // 保存习惯文档
  await habit.save();
  
  // 准备返回的统计数据
  const stats = {
    totalCompletions: habit.stats.completedDays,
    totalDays: habit.stats.totalDays,
    completionRate: habit.stats.completionRate,
    currentStreak: habit.stats.currentStreak,
    longestStreak: habit.stats.longestStreak,
    lastCompletedDate: habit.stats.lastCompletedDate
  };
  
  return {
    checkin,
    habit: {
      id: habit._id,
      name: habit.name,
      category: habit.category,
      icon: habit.icon,
      color: habit.color
    },
    stats
  };
};

/**
 * 获取打卡记录
 * @param {Object} query 查询条件
 * @param {Object} user 用户对象
 * @returns {Promise<Array>} 打卡记录数组
 */
exports.getCheckins = async (query, user) => {
  const { startDate, endDate, habitId, isCompleted, page = 1, limit = 20 } = query;
  
  // 构建查询条件
  const dbQuery = { user: user._id };
  
  if (habitId) {
    dbQuery.habit = habitId;
  }
  
  if (isCompleted !== undefined) {
    dbQuery.isCompleted = isCompleted === 'true';
  }
  
  if (startDate && endDate) {
    dbQuery.date = { $gte: startDate, $lte: endDate };
  } else if (startDate) {
    dbQuery.date = { $gte: startDate };
  } else if (endDate) {
    dbQuery.date = { $lte: endDate };
  }
  
  const skip = (page - 1) * limit;
  
  const checkins = await Checkin.find(dbQuery)
    .populate('habit', 'name category icon color')
    .sort({ date: -1, 'time.start': -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Checkin.countDocuments(dbQuery);
  
  return {
    checkins,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  };
}; 
