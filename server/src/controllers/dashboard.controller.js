/**
 * 仪表盘数据聚合控制器
 * 为前端提供聚合API，减少网络请求次数
 */
const Habit = require('../models/habit.model');
const Checkin = require('../models/checkin.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

/**
 * 获取仪表盘数据 - 聚合习惯、打卡记录和统计数据
 * @route GET /api/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const { date = new Date().toISOString().split('T')[0], days = 7 } =
      req.query;

    // 1. 获取所有习惯数据
    const habits = await Habit.find({ user: userId }).select('-__v');

    // 区分活跃习惯和归档习惯
    const activeHabits = habits.filter((h) => !h.isArchived);

    // 2. 获取今日打卡数据
    const todayCheckins = await Checkin.find({
      user: userId,
      date,
    }).populate('habit', 'name category icon color');

    // 3. 如果请求包含历史记录，获取过去几天的打卡记录
    const includeCheckins = days > 0;
    let recentCheckins = [];

    if (includeCheckins) {
      // 计算开始日期
      const startDate = new Date(date);
      startDate.setDate(startDate.getDate() - (days - 1));
      const startDateFormatted = startDate.toISOString().split('T')[0];

      recentCheckins = await Checkin.find({
        user: userId,
        date: { $gte: startDateFormatted, $lte: date },
      }).populate('habit', 'name category icon color');
    }

    // 4. 获取今日需要执行的习惯
    const todayDate = new Date(date);
    const dayOfWeek = todayDate.getDay(); // 0-6, 0表示周日

    // 根据习惯频率筛选今日需要执行的习惯
    const todayHabits = activeHabits.filter((habit) => {
      // 检查习惯频率类型
      const freqType = habit.frequency.type;
      let shouldInclude = false;

      if (freqType === 'daily') {
        shouldInclude = true;
      } else if (freqType === 'weekly') {
        // 检查当前星期是否在习惯频率的天数中
        shouldInclude =
          habit.frequency.days && habit.frequency.days.includes(dayOfWeek);
      } else if (freqType === 'monthly') {
        const dayOfMonth = todayDate.getDate();
        shouldInclude =
          habit.frequency.days && habit.frequency.days.includes(dayOfMonth);
      } else if (freqType === 'custom') {
        // 处理自定义频率 - 简化处理
        shouldInclude = true;
      } else if (freqType === 'workdays') {
        // 工作日为周一到周五 (1-5)
        // JavaScript中 dayOfWeek: 0是周日，1-5是周一到周五，6是周六
        shouldInclude = dayOfWeek >= 1 && dayOfWeek <= 5;
      } else if (freqType === 'weekends') {
        // 周末为周六和周日 (6, 0)
        shouldInclude = dayOfWeek === 0 || dayOfWeek === 6;
      } else {
        // 默认情况下包含习惯
        shouldInclude = true;
      }

      return shouldInclude;
    });

    // 5. 获取今日已完成的习惯
    const completedHabitIds = new Set();
    const habitCheckinMap = new Map(); // 存储习惯ID到打卡对象的映射
    
    todayCheckins.forEach((checkin) => {
      if (checkin.isCompleted) {
        completedHabitIds.add(checkin.habit._id.toString());
        habitCheckinMap.set(checkin.habit._id.toString(), checkin);
      }
    });

    const completedHabits = todayHabits.filter((habit) =>
      completedHabitIds.has(habit._id.toString())
    );

    // 对今日习惯进行排序：未完成的在前，已完成的按照打卡时间排序
    const sortedTodayHabits = [...todayHabits].sort((a, b) => {
      const aCompleted = completedHabitIds.has(a._id.toString());
      const bCompleted = completedHabitIds.has(b._id.toString());

      // 如果完成状态不同，未完成的排在前面
      if (aCompleted !== bCompleted) {
        return aCompleted ? 1 : -1;
      }

      // 如果都已完成，按照打卡时间排序（从新到旧）
      if (aCompleted && bCompleted) {
        const aCheckin = habitCheckinMap.get(a._id.toString());
        const bCheckin = habitCheckinMap.get(b._id.toString());
        
        // 比较创建时间
        const aTime = new Date(aCheckin.createdAt).getTime();
        const bTime = new Date(bCheckin.createdAt).getTime();
        
        return bTime - aTime; // 降序排列，最新的排在前面
      }

      // 如果都未完成，保持原有顺序
      return 0;
    });

    // 6. 计算统计数据
    const totalHabits = habits.length;
    const completedToday = completedHabits.length;
    const totalToday = todayHabits.length;
    const completionRate =
      totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

    // 7. 计算连续天数 - 使用用户的连续打卡记录
    const userStreakData = await User.findById(userId).select(
      'currentStreak longestStreak'
    );
    const currentStreak = userStreakData?.currentStreak || 0;
    const longestStreak = userStreakData?.longestStreak || 0;

    // 8. 构建习惯统计数据
    const habitStats = {};
    const habitStatsPromises = activeHabits.map(async (habit) => {
      const habitId = habit._id.toString();

      // 获取习惯的完成记录
      const totalCheckins = await Checkin.countDocuments({
        habit: habitId,
        user: userId,
      });

      const totalCompleted = await Checkin.countDocuments({
        habit: habitId,
        user: userId,
        isCompleted: true,
      });

      // 获取最后完成日期
      const lastCompletedCheckin = await Checkin.findOne({
        habit: habitId,
        user: userId,
        isCompleted: true,
      }).sort({ date: -1 });

      // 计算习惯完成率
      const completionRate =
        totalCheckins > 0 ? (totalCompleted / totalCheckins) * 100 : 0;

      // 存储习惯统计数据
      habitStats[habitId] = {
        completionRate,
        totalCompletions: totalCompleted,
        currentStreak: habit.stats?.currentStreak || 0,
        longestStreak: habit.stats?.longestStreak || 0,
        totalDays: totalCheckins,
        lastCompletedDate: lastCompletedCheckin
          ? lastCompletedCheckin.date
          : null,
      };
    });

    // 等待所有习惯统计数据计算完成
    await Promise.all(habitStatsPromises);

    // 9. 构建最终响应数据
    const dashboardData = {
      date,
      todayHabits: sortedTodayHabits,
      completedHabits,
      stats: {
        totalHabits,
        activeHabits: activeHabits.length,
        completedToday,
        completionRate,
        totalCheckins: recentCheckins.length,
        currentStreak,
        longestStreak,
      },
      recentCheckins,
      habitStats,
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('获取仪表盘数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取仪表盘数据失败',
    });
  }
};

/**
 * 获取所有习惯列表及相关数据 - 专为习惯页面设计
 * @route GET /api/habits/all
 */
exports.getAllHabits = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      includeArchived = true,
      includeStats = true,
      includeCheckins = false,
      days = 7,
      sort = 'createdAt',
      order = 'desc',
    } = req.query;

    // 转换字符串布尔值为实际布尔值
    const shouldIncludeArchived =
      includeArchived === 'true' || includeArchived === true;
    const shouldIncludeStats = includeStats === 'true' || includeStats === true;
    const shouldIncludeCheckins =
      includeCheckins === 'true' || includeCheckins === true;

    // 1. 构建查询条件
    const query = { user: userId };

    // 如果不包含归档习惯，则添加isArchived条件
    if (!shouldIncludeArchived) {
      query.isArchived = false;
    }

    // 2. 获取习惯数据
    const habits = await Habit.find(query).select('-__v');

    // 为每个习惯添加完成率和总计字段
    const habitsWithStats = await Promise.all(
      habits.map(async (habit) => {
        const habitObj = habit.toObject();

        // 计算完成率
        const completionRate =
          habitObj.stats && habitObj.stats.totalDays > 0
            ? Math.round(
                (habitObj.stats.completedDays / habitObj.stats.totalDays) * 100
              )
            : 0;

        // 确保stats对象存在
        if (!habitObj.stats) {
          habitObj.stats = {};
        }

        // 添加完成率和总计字段到stats对象中
        habitObj.stats.completionRate = completionRate;
        habitObj.stats.totalCompletions = habitObj.stats.completedDays || 0;

        return habitObj;
      })
    );

    // 3. 区分活跃和归档的习惯
    const activeHabits = habitsWithStats.filter((h) => !h.isArchived);
    const archivedHabits = habitsWithStats.filter((h) => h.isArchived);

    // 4. 提取所有使用的分类
    const categoriesSet = new Set();
    habitsWithStats.forEach((habit) => {
      if (habit.category) {
        categoriesSet.add(habit.category);
      }
    });
    const categories = Array.from(categoriesSet);

    // 5. 如果请求包含统计数据，获取习惯统计数据
    const habitStats = {};

    if (shouldIncludeStats) {
      const habitStatsPromises = habitsWithStats.map(async (habit) => {
        const habitId = habit._id.toString();

        // 获取习惯的完成记录
        const totalCheckins = await Checkin.countDocuments({
          habit: habitId,
          user: userId,
        });

        const totalCompleted = await Checkin.countDocuments({
          habit: habitId,
          user: userId,
          isCompleted: true,
        });

        // 获取最后完成日期
        const lastCompletedCheckin = await Checkin.findOne({
          habit: habitId,
          user: userId,
          isCompleted: true,
        }).sort({ date: -1 });

        // 计算习惯完成率
        const completionRate =
          totalCheckins > 0 ? (totalCompleted / totalCheckins) * 100 : 0;

        // 存储习惯统计数据
        habitStats[habitId] = {
          completionRate,
          totalCompletions: totalCompleted,
          currentStreak: habit.stats?.currentStreak || 0,
          longestStreak: habit.stats?.longestStreak || 0,
          totalDays: totalCheckins,
          lastCompletedDate: lastCompletedCheckin
            ? lastCompletedCheckin.date
            : null,
        };
      });

      // 等待所有习惯统计数据计算完成
      await Promise.all(habitStatsPromises);
    }

    // 6. 如果请求包含打卡记录，获取最近的打卡记录
    let recentCheckins = [];

    if (shouldIncludeCheckins) {
      const today = new Date().toISOString().split('T')[0];

      // 计算开始日期
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (days - 1));
      const startDateFormatted = startDate.toISOString().split('T')[0];

      recentCheckins = await Checkin.find({
        user: userId,
        date: { $gte: startDateFormatted, $lte: today },
      }).populate('habit', 'name category icon color');
    }

    // 7. 对习惯列表进行排序
    let sortedHabits = [...habitsWithStats];
    
    if (sort === 'default') {
      // 默认排序，保持原有顺序
    } else if (sort === 'name') {
      sortedHabits.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        return order === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    } else if (sort === 'createdAt') {
      sortedHabits.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return order === 'asc' ? dateA - dateB : dateB - dateA;
      });
    } else if (sort === 'completionRate') {
      sortedHabits.sort((a, b) => {
        const rateA = a.stats?.completionRate || 0;
        const rateB = b.stats?.completionRate || 0;
        return order === 'asc' ? rateA - rateB : rateB - rateA;
      });
    }

    // 8. 构建最终响应数据
    const habitsData = {
      habits: sortedHabits,
      activeHabits,
      archivedHabits,
      habitStats,
      categories,
      recentCheckins,
    };

    res.status(200).json({
      success: true,
      data: habitsData,
    });
  } catch (error) {
    console.error('获取习惯列表数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取习惯列表数据失败',
    });
  }
};

/**
 * 获取分析数据 - 专为分析页面设计
 * @route GET /api/analytics
 */
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate, timeRange = 'month' } = req.query;

    // 1. 计算日期范围
    let startDateObj, endDateObj;

    if (startDate && endDate) {
      startDateObj = new Date(startDate);
      endDateObj = new Date(endDate);
    } else {
      endDateObj = new Date();

      if (timeRange === 'week') {
        startDateObj = new Date(endDateObj);
        startDateObj.setDate(endDateObj.getDate() - 7);
      } else if (timeRange === 'month') {
        startDateObj = new Date(endDateObj);
        startDateObj.setMonth(endDateObj.getMonth() - 1);
      } else if (timeRange === 'year') {
        startDateObj = new Date(endDateObj);
        startDateObj.setFullYear(endDateObj.getFullYear() - 1);
      } else {
        // 默认为一个月
        startDateObj = new Date(endDateObj);
        startDateObj.setMonth(endDateObj.getMonth() - 1);
      }
    }

    const startDateFormatted = startDateObj.toISOString().split('T')[0];
    const endDateFormatted = endDateObj.toISOString().split('T')[0];

    // 2. 获取所有习惯数据
    const habits = await Habit.find({ user: userId }).select('-__v');

    // 为每个习惯添加完成率和总计字段
    const habitsWithStats = await Promise.all(
      habits.map(async (habit) => {
        const habitObj = habit.toObject();

        // 计算完成率
        const completionRate =
          habitObj.stats && habitObj.stats.totalDays > 0
            ? Math.round(
                (habitObj.stats.completedDays / habitObj.stats.totalDays) * 100
              )
            : 0;

        // 确保stats对象存在
        if (!habitObj.stats) {
          habitObj.stats = {};
        }

        // 添加完成率和总计字段到stats对象中
        habitObj.stats.completionRate = completionRate;
        habitObj.stats.totalCompletions = habitObj.stats.completedDays || 0;

        return habitObj;
      })
    );

    // 3. 获取指定日期范围内的打卡记录
    const checkins = await Checkin.find({
      user: userId,
      date: { $gte: startDateFormatted, $lte: endDateFormatted },
    }).populate('habit', 'name category icon color');

    // 4. 计算总体统计数据
    const activeHabits = habitsWithStats.filter((h) => !h.isArchived);
    const totalHabits = habitsWithStats.length;
    const totalCheckins = checkins.length;
    const completedCheckins = checkins.filter((c) => c.isCompleted).length;

    // 5. 计算本周打卡次数
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoFormatted = oneWeekAgo.toISOString().split('T')[0];

    const thisWeekCheckins = checkins.filter(
      (c) =>
        c.date >= oneWeekAgoFormatted &&
        c.date <= endDateFormatted &&
        c.isCompleted
    ).length;

    // 6. 计算上周打卡次数（用于计算趋势）
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const twoWeeksAgoFormatted = twoWeeksAgo.toISOString().split('T')[0];

    const lastWeekCheckins = await Checkin.countDocuments({
      user: userId,
      date: { $gte: twoWeeksAgoFormatted, $lt: oneWeekAgoFormatted },
      isCompleted: true,
    });

    // 7. 计算周趋势
    const weeklyTrend =
      lastWeekCheckins > 0
        ? ((thisWeekCheckins - lastWeekCheckins) / lastWeekCheckins) * 100
        : thisWeekCheckins > 0
        ? 100
        : 0;

    // 8. 计算每个习惯的统计数据
    const habitStats = {};
    const habitStatsPromises = habitsWithStats.map(async (habit) => {
      const habitId = habit._id.toString();

      // 获取习惯的完成记录
      const habitCheckins = checkins.filter(
        (c) => c.habit._id.toString() === habitId
      );
      const totalHabitCheckins = habitCheckins.length;
      const completedHabitCheckins = habitCheckins.filter(
        (c) => c.isCompleted
      ).length;

      // 计算习惯完成率
      const completionRate =
        totalHabitCheckins > 0
          ? (completedHabitCheckins / totalHabitCheckins) * 100
          : 0;

      // 存储习惯统计数据
      habitStats[habitId] = {
        habit,
        completionRate,
        totalCompletions: completedHabitCheckins,
        currentStreak: habit.stats?.currentStreak || 0,
        longestStreak: habit.stats?.longestStreak || 0,
      };
    });

    // 等待所有习惯统计数据计算完成
    await Promise.all(habitStatsPromises);

    // 9. 计算各分类的完成率
    const categoryData = {};

    activeHabits.forEach((habit) => {
      const category = habit.category || 'other';
      const habitId = habit._id.toString();

      if (!categoryData[category]) {
        categoryData[category] = { count: 0, completed: 0, totalStreak: 0 };
      }

      categoryData[category].count++;

      // 添加连续天数和完成次数
      if (habitStats[habitId]) {
        categoryData[category].totalStreak +=
          habitStats[habitId].currentStreak || 0;
        categoryData[category].completed +=
          habitStats[habitId].totalCompletions || 0;
      }
    });

    // 10. 找出最佳分类
    let bestCategory = 'other';
    let bestCompletionRate = 0;

    Object.entries(categoryData).forEach(([category, data]) => {
      const completionRate = data.count > 0 ? data.completed / data.count : 0;
      if (completionRate > bestCompletionRate) {
        bestCompletionRate = completionRate;
        bestCategory = category;
      }
    });

    // 11. 计算平均完成率
    const averageCompletionRate =
      totalCheckins > 0 ? (completedCheckins / totalCheckins) * 100 : 0;

    // 12. 获取最长连续天数和当前连续天数
    const userStreakData = await User.findById(userId).select(
      'currentStreak longestStreak'
    );
    const currentStreak = userStreakData?.currentStreak || 0;
    const bestStreak = userStreakData?.longestStreak || 0;

    // 13. 生成时间线数据
    const timelineData = [];

    // 获取日期范围内的所有日期
    const dateRange = [];
    for (
      let d = new Date(startDateObj);
      d <= endDateObj;
      d.setDate(d.getDate() + 1)
    ) {
      dateRange.push(d.toISOString().split('T')[0]);
    }

    // 计算每天的完成率
    dateRange.forEach((date) => {
      const dayCheckins = checkins.filter((c) => c.date === date);
      const completedHabitIds = new Set();

      dayCheckins.forEach((checkin) => {
        if (checkin.isCompleted) {
          completedHabitIds.add(checkin.habit._id.toString());
        }
      });

      const totalHabitsForDay = activeHabits.length; // 简化，实际应根据日期判断
      const completedHabitsForDay = completedHabitIds.size;
      const completionRate =
        totalHabitsForDay > 0
          ? (completedHabitsForDay / totalHabitsForDay) * 100
          : 0;

      timelineData.push({
        date,
        completionRate,
        totalCompleted: completedHabitsForDay,
        totalHabits: totalHabitsForDay,
      });
    });

    // 14. 生成分类数据
    const categoryDataArray = Object.entries(categoryData).map(
      ([category, data]) => {
        return {
          category,
          count: data.count,
          completionRate:
            data.count > 0 ? (data.completed / data.count) * 100 : 0,
          averageStreak: data.count > 0 ? data.totalStreak / data.count : 0,
        };
      }
    );

    // 15. 生成热图数据
    const heatmapData = checkins
      .filter((c) => c.isCompleted)
      .map((c) => ({
        date: c.date,
        count: 1,
      }));

    // 16. 构建最终响应数据
    const analyticsData = {
      summary: {
        totalHabits,
        activeHabits: activeHabits.length,
        averageCompletionRate,
        bestStreak,
        currentStreak,
        bestCategory,
        totalCheckins,
        thisWeekCheckins,
        weeklyTrend,
      },
      habitStats,
      timelineData,
      categoryData: categoryDataArray,
      heatmapData,
    };

    res.status(200).json({
      success: true,
      data: analyticsData,
    });
  } catch (error) {
    console.error('获取分析数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取分析数据失败',
    });
  }
};
