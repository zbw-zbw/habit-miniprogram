/**
 * 数据分析控制器
 */
const Habit = require('../models/habit.model');
const Checkin = require('../models/checkin.model');
const User = require('../models/user.model');

/**
 * 获取仪表盘数据
 * @route GET /api/analytics/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // 获取今天的日期
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];
    
    // 获取本周开始日期（周一）
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    const startOfWeekFormatted = startOfWeek.toISOString().split('T')[0];
    
    // 获取本月开始日期
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfMonthFormatted = startOfMonth.toISOString().split('T')[0];
    
    // 查询习惯总数和已归档习惯数
    const totalHabits = await Habit.countDocuments({ user: userId });
    const archivedHabits = await Habit.countDocuments({ user: userId, isArchived: true });
    
    // 查询今日、本周和本月的打卡完成率
    const todayCheckins = await Checkin.find({
      user: userId,
      date: todayFormatted
    });
    
    const weekCheckins = await Checkin.find({
      user: userId,
      date: { $gte: startOfWeekFormatted, $lte: todayFormatted }
    });
    
    const monthCheckins = await Checkin.find({
      user: userId,
      date: { $gte: startOfMonthFormatted, $lte: todayFormatted }
    });
    
    const todayCompletionRate = todayCheckins.length > 0
      ? (todayCheckins.filter(c => c.isCompleted).length / todayCheckins.length) * 100
      : 0;
    
    const weekCompletionRate = weekCheckins.length > 0
      ? (weekCheckins.filter(c => c.isCompleted).length / weekCheckins.length) * 100
      : 0;
    
    const monthCompletionRate = monthCheckins.length > 0
      ? (monthCheckins.filter(c => c.isCompleted).length / monthCheckins.length) * 100
      : 0;
    
    // 查询最佳连续记录
    const bestStreak = await Habit.aggregate([
      { $match: { user: userId } },
      { $sort: { 'stats.longestStreak': -1 } },
      { $limit: 1 },
      { $project: { name: 1, category: 1, longestStreak: '$stats.longestStreak' } }
    ]);
    
    // 获取所有习惯并添加完成率和总计字段
    const habits = await Habit.find({ user: userId });
    const habitsWithStats = await Promise.all(habits.map(async habit => {
      const habitObj = habit.toObject();
      
      // 计算完成率
      const completionRate = habitObj.stats && habitObj.stats.totalDays > 0 
        ? Math.round((habitObj.stats.completedDays / habitObj.stats.totalDays) * 100) 
        : 0;
      
      // 确保stats对象存在
      if (!habitObj.stats) {
        habitObj.stats = {};
      }
      
      // 添加完成率和总计字段到stats对象中
      habitObj.stats.completionRate = completionRate;
      habitObj.stats.totalCompletions = habitObj.stats.completedDays || 0;
      
      return habitObj;
    }));
    
    // 构建仪表盘数据
    const dashboard = {
      habitsOverview: {
        total: totalHabits,
        active: totalHabits - archivedHabits,
        archived: archivedHabits
      },
      completionRates: {
        today: todayCompletionRate.toFixed(2),
        week: weekCompletionRate.toFixed(2),
        month: monthCompletionRate.toFixed(2)
      },
      bestStreak: bestStreak.length > 0 ? bestStreak[0] : null,
      user: {
        totalCheckins: req.user.completedCheckins,
        currentStreak: req.user.currentStreak,
        longestStreak: req.user.longestStreak
      },
      habits: habitsWithStats
    };
    
    res.status(200).json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('获取仪表盘数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取仪表盘数据失败'
    });
  }
};

/**
 * 获取习惯完成率数据
 * @route GET /api/analytics/habits/completion
 */
exports.getHabitsCompletion = async (req, res) => {
  try {
    const { startDate, endDate, habitId } = req.query;
    const userId = req.user._id;
    
    // 构建查询条件
    const matchStage = { user: userId };
    
    if (habitId) {
      matchStage._id = habitId;
    }
    
    // 获取习惯列表
    const habits = await Habit.find(matchStage);
    
    // 查询条件 - 打卡记录
    const checkinMatchStage = { user: userId };
    
    if (startDate && endDate) {
      checkinMatchStage.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      checkinMatchStage.date = { $gte: startDate };
    } else if (endDate) {
      checkinMatchStage.date = { $lte: endDate };
    }
    
    // 计算每个习惯的完成率
    const result = await Promise.all(habits.map(async (habit) => {
      const habitCheckinMatch = { ...checkinMatchStage, habit: habit._id };
      
      const totalCheckins = await Checkin.countDocuments(habitCheckinMatch);
      const completedCheckins = await Checkin.countDocuments({
        ...habitCheckinMatch,
        isCompleted: true
      });
      
      const completionRate = totalCheckins > 0
        ? (completedCheckins / totalCheckins) * 100
        : 0;
      
      // 计算stats中的完成率
      const statsCompletionRate = habit.stats && habit.stats.totalDays > 0 
        ? Math.round((habit.stats.completedDays / habit.stats.totalDays) * 100) 
        : 0;
      
      // 获取习惯对象并添加必要的字段
      const habitObj = habit.toObject();
      
      // 确保stats对象存在
      if (!habitObj.stats) {
        habitObj.stats = {};
      }
      
      // 添加完成率和总计字段到stats对象中
      habitObj.stats.completionRate = statsCompletionRate;
      habitObj.stats.totalCompletions = habitObj.stats.completedDays || 0;
      
      return {
        habitId: habit._id,
        name: habit.name,
        category: habit.category,
        color: habit.color,
        icon: habit.icon,
        totalCheckins,
        completedCheckins,
        completionRate: parseFloat(completionRate.toFixed(2)),
        stats: habitObj.stats
      };
    }));
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取习惯完成率数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取习惯完成率数据失败'
    });
  }
};

/**
 * 获取习惯连续记录数据
 * @route GET /api/analytics/habits/streak
 */
exports.getHabitsStreak = async (req, res) => {
  try {
    const { habitId } = req.query;
    const userId = req.user._id;
    
    // 构建查询条件
    const matchStage = { user: userId };
    
    if (habitId) {
      matchStage._id = habitId;
    }
    
    // 查询习惯的连续记录数据
    const habits = await Habit.find(matchStage)
      .select('name category color icon stats');
    
    const result = await Promise.all(habits.map(async habit => {
      // 获取习惯的打卡记录数量
      const totalCheckins = await Checkin.countDocuments({
        habit: habit._id,
        user: userId
      });
      
      // 获取已完成的打卡记录数量
      const completedCheckins = await Checkin.countDocuments({
        habit: habit._id,
        user: userId,
        isCompleted: true
      });
      
      // 计算完成率
      const completionRate = habit.stats && habit.stats.totalDays > 0 
        ? Math.round((habit.stats.completedDays / habit.stats.totalDays) * 100) 
        : 0;
      
      return {
        habitId: habit._id,
        name: habit.name,
        category: habit.category,
        color: habit.color,
        icon: habit.icon,
        currentStreak: habit.stats.currentStreak,
        longestStreak: habit.stats.longestStreak,
        completionRate: completionRate,
        totalCompletions: habit.stats.completedDays || 0,
        stats: {
          ...habit.stats.toObject(),
          completionRate: completionRate,
          totalCompletions: habit.stats.completedDays || 0
        }
      };
    }));
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取习惯连续记录数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取习惯连续记录数据失败'
    });
  }
};

/**
 * 获取习惯趋势数据
 * @route GET /api/analytics/habits/trends
 */
exports.getHabitsTrends = async (req, res) => {
  try {
    const { period = 'week', habitId } = req.query;
    const userId = req.user._id;
    
    // 获取日期范围
    const today = new Date();
    let startDate, endDate, format, groupBy;
    
    if (period === 'week') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      endDate = today;
      format = '%Y-%m-%d';
      groupBy = '$date';
    } else if (period === 'month') {
      startDate = new Date(today);
      startDate.setMonth(today.getMonth() - 1);
      endDate = today;
      format = '%Y-%m-%d';
      groupBy = '$date';
    } else if (period === 'year') {
      startDate = new Date(today);
      startDate.setFullYear(today.getFullYear() - 1);
      endDate = today;
      format = '%Y-%m';
      groupBy = { $substr: ['$date', 0, 7] };
    }
    
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    // 构建查询条件
    const matchStage = { 
      user: userId,
      date: { $gte: formattedStartDate, $lte: formattedEndDate }
    };
    
    if (habitId) {
      matchStage.habit = habitId;
    }
    
    // 查询习惯数据
    let habits;
    if (habitId) {
      habits = await Habit.find({ _id: habitId, user: userId });
    } else {
      habits = await Habit.find({ user: userId });
    }
    
    // 添加completionRate和totalCompletions字段到stats对象中
    const habitsWithStats = await Promise.all(habits.map(async habit => {
      const habitObj = habit.toObject();
      
      // 计算完成率
      const completionRate = habitObj.stats && habitObj.stats.totalDays > 0 
        ? Math.round((habitObj.stats.completedDays / habitObj.stats.totalDays) * 100) 
        : 0;
      
      // 确保stats对象存在
      if (!habitObj.stats) {
        habitObj.stats = {};
      }
      
      // 添加完成率和总计字段到stats对象中
      habitObj.stats.completionRate = completionRate;
      habitObj.stats.totalCompletions = habitObj.stats.completedDays || 0;
      
      return habitObj;
    }));
    
    // 查询打卡记录
    const checkins = await Checkin.find(matchStage)
      .populate('habit', 'name category color icon');
    
    // 按习惯和日期分组
    const trendsMap = {};
    
    checkins.forEach(checkin => {
      const habitId = checkin.habit._id.toString();
      const habitName = checkin.habit.name;
      const date = period === 'year' ? checkin.date.substring(0, 7) : checkin.date;
      
      if (!trendsMap[habitId]) {
        // 查找对应的习惯，包含stats字段
        const habit = habitsWithStats.find(h => h._id.toString() === habitId);
        
        trendsMap[habitId] = {
          habitId,
          name: habitName,
          category: checkin.habit.category,
          color: checkin.habit.color,
          icon: checkin.habit.icon,
          stats: habit ? habit.stats : {},
          data: {}
        };
      }
      
      if (!trendsMap[habitId].data[date]) {
        trendsMap[habitId].data[date] = {
          total: 0,
          completed: 0
        };
      }
      
      trendsMap[habitId].data[date].total += 1;
      if (checkin.isCompleted) {
        trendsMap[habitId].data[date].completed += 1;
      }
    });
    
    // 转换数据格式
    const result = Object.values(trendsMap).map(habit => {
      const dataPoints = Object.entries(habit.data).map(([date, stats]) => ({
        date,
        completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
      }));
      
      return {
        ...habit,
        data: dataPoints.sort((a, b) => a.date.localeCompare(b.date))
      };
    });
    
    res.status(200).json({
      success: true,
      period,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      data: result
    });
  } catch (error) {
    console.error('获取习惯趋势数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取习惯趋势数据失败'
    });
  }
};

// 其他分析功能方法预留，可根据需要实现
exports.getHabitsComparison = async (req, res) => {
  // 实现习惯对比分析功能
  res.status(200).json({
    success: true,
    message: '习惯对比分析功能待实现'
  });
};

exports.getTimeDistribution = async (req, res) => {
  // 实现时间分布分析功能
  res.status(200).json({
    success: true,
    message: '时间分布分析功能待实现'
  });
};

exports.getPatterns = async (req, res) => {
  // 实现习惯模式分析功能
  res.status(200).json({
    success: true,
    message: '习惯模式分析功能待实现'
  });
};

exports.getInsights = async (req, res) => {
  // 实现习惯洞察功能
  res.status(200).json({
    success: true,
    message: '习惯洞察功能待实现'
  });
};

exports.getWeeklyReport = async (req, res) => {
  // 实现周报告功能
  res.status(200).json({
    success: true,
    message: '周报告功能待实现'
  });
};

exports.getMonthlyReport = async (req, res) => {
  // 实现月报告功能
  res.status(200).json({
    success: true,
    message: '月报告功能待实现'
  });
};

/**
 * 生成习惯报告
 * @route GET /api/analytics/report
 */
exports.generateReport = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // 获取日期范围参数，默认为过去30天
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const startDateFormatted = startDate.toISOString().split('T')[0];
    const endDateFormatted = endDate.toISOString().split('T')[0];
    
    // 获取用户的习惯数据
    const habits = await Habit.find({ 
      user: userId
    }).select('-__v');
    
    // 获取打卡记录
    const checkins = await Checkin.find({
      user: userId,
      date: { $gte: startDateFormatted, $lte: endDateFormatted }
    }).populate('habit', 'name category icon color');
    
    // 计算总体概览数据
    const totalHabits = habits.length;
    const activeHabits = habits.filter(h => !h.isArchived).length;
    
    // 计算打卡数据
    const totalCheckins = checkins.filter(c => c.isCompleted).length;
    const totalDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    // 计算完成率
    const completionRate = habits.length > 0
      ? Math.round((totalCheckins / (activeHabits * totalDays)) * 100)
      : 0;
    
    // 获取用户数据
    const user = await User.findById(userId);
    
    // 获取今日完成的习惯数
    const today = endDateFormatted;
    const todayCheckins = checkins.filter(c => c.date === today && c.isCompleted);
    const completedToday = todayCheckins.length;
    
    // 计算习惯详情
    const habitDetails = habits.map(habit => {
      const habitId = habit._id.toString();
      const habitCheckins = checkins.filter(c => 
        c.habit && (c.habit._id.toString() === habitId || c.habit === habitId)
      );
      
      const completedCheckins = habitCheckins.filter(c => c.isCompleted);
      
      // 计算习惯完成率
      const habitTotalDays = Math.min(
        totalDays,
        Math.round((endDate - new Date(habit.createdAt)) / (1000 * 60 * 60 * 24))
      );
      
      const habitCompletionRate = habitTotalDays > 0
        ? Math.round((completedCheckins.length / habitTotalDays) * 100)
        : 0;
      
      return {
        id: habitId,
        name: habit.name,
        category: habit.category,
        icon: habit.icon || 'star',
        color: habit.color || '#4F7CFF',
        completionRate: habitCompletionRate,
        streak: habit.stats?.currentStreak || 0,
        totalCheckins: completedCheckins.length,
        bestDay: '周一', // 这里需要进一步分析数据确定
        bestTime: '上午' // 这里需要进一步分析数据确定
      };
    });
    
    // 构建报告数据
    const reportData = {
      overview: {
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        totalHabits,
        activeHabits,
        totalCheckins,
        completionRate,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
        totalDays,
        completedToday
      },
      habitDetails: habitDetails.sort((a, b) => b.completionRate - a.completionRate),
      trends: {
        // 这里可以添加趋势数据
        weeklyData: [],
        monthlyData: []
      }
    };
    
    res.status(200).json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('生成习惯报告错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，生成习惯报告失败'
    });
  }
};

exports.exportData = async (req, res) => {
  // 实现数据导出功能
  res.status(200).json({
    success: true,
    message: '数据导出功能待实现'
  });
}; 
