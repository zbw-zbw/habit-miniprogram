/**
 * 习惯控制器
 */
const { validationResult } = require('express-validator');
const Habit = require('../models/habit.model');
const Checkin = require('../models/checkin.model');
const HabitTemplate = require('../models/habit-template.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

/**
 * 获取当前用户的所有习惯
 * @route GET /api/habits
 */
exports.getHabits = async (req, res) => {
  try {
    const { category, isArchived, sort = 'createdAt', order = 'desc' } = req.query;
    
    // 构建查询条件
    const query = { user: req.user._id };
    
    if (category) {
      query.category = category;
    }
    
    if (isArchived !== undefined) {
      query.isArchived = isArchived === 'true';
    }
    
    // 构建排序条件
    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;
    
    const habits = await Habit.find(query)
      .sort(sortOptions)
      .populate('advanced.templateId', 'name description scientificBasis');
    
    // 为每个习惯添加完成率和总计字段
    const habitsWithStats = await Promise.all(habits.map(async (habit) => {
      const habitObj = habit.toObject();
      
      // 获取习惯的打卡记录数量
      const totalCheckins = await Checkin.countDocuments({
        habit: habit._id,
        user: req.user._id
      });
      
      // 获取已完成的打卡记录数量
      const completedCheckins = await Checkin.countDocuments({
        habit: habit._id,
        user: req.user._id,
        isCompleted: true
      });
      
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
    
    res.status(200).json({
      success: true,
      count: habitsWithStats.length,
      data: habitsWithStats
    });
  } catch (error) {
    console.error('获取习惯列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取习惯列表失败'
    });
  }
};

/**
 * 创建新习惯
 * @route POST /api/habits
 */
exports.createHabit = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const {
      name,
      description,
      category,
      icon,
      color,
      frequency,
      goal,
      timeSettings,
      startDate,
      endDate,
      advanced
    } = req.body;
    
    // 检查是否已存在同名习惯
    const existingHabit = await Habit.findOne({
      user: req.user._id,
      name
    });
    
    if (existingHabit) {
      return res.status(400).json({
        success: false,
        message: '已存在同名习惯'
      });
    }
    
    // 创建新习惯
    const habit = new Habit({
      name,
      description,
      category,
      icon,
      color,
      user: req.user._id,
      frequency,
      goal,
      timeSettings,
      startDate,
      endDate,
      advanced
    });
    
    await habit.save();
    
    // 更新用户习惯总数
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalHabits: 1 }
    });
    
    res.status(201).json({
      success: true,
      message: '习惯创建成功',
      data: habit
    });
  } catch (error) {
    console.error('创建习惯错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，创建习惯失败'
    });
  }
};

/**
 * 获取指定习惯详情
 * @route GET /api/habits/:habitId
 */
exports.getHabit = async (req, res) => {
  try {
    // 习惯已在中间件中获取并添加到req.resource
    const habit = req.resource;
    
    res.status(200).json({
      success: true,
      data: habit
    });
  } catch (error) {
    console.error('获取习惯详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取习惯详情失败'
    });
  }
};

/**
 * 更新指定习惯
 * @route PUT /api/habits/:habitId
 */
exports.updateHabit = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const {
      name,
      description,
      category,
      icon,
      color,
      frequency,
      goal,
      timeSettings,
      startDate,
      endDate,
      advanced
    } = req.body;
    
    const habit = req.resource;
    
    // 检查是否存在同名习惯（排除当前习惯）
    if (name && name !== habit.name) {
      const existingHabit = await Habit.findOne({
        user: req.user._id,
        name,
        _id: { $ne: habit._id }
      });
      
      if (existingHabit) {
        return res.status(400).json({
          success: false,
          message: '已存在同名习惯'
        });
      }
      
      habit.name = name;
    }
    
    // 更新习惯信息
    if (description !== undefined) habit.description = description;
    if (category) habit.category = category;
    if (icon) habit.icon = icon;
    if (color) habit.color = color;
    
    // 更新频率设置
    if (frequency) {
      if (frequency.type) habit.frequency.type = frequency.type;
      if (frequency.days) habit.frequency.days = frequency.days;
      if (frequency.interval) habit.frequency.interval = frequency.interval;
    }
    
    // 更新目标设置
    if (goal) {
      if (goal.type) habit.goal.type = goal.type;
      if (goal.value !== undefined) habit.goal.value = goal.value;
      if (goal.unit) habit.goal.unit = goal.unit;
    }
    
    // 更新时间设置
    if (timeSettings) {
      if (timeSettings.hasTime !== undefined) habit.timeSettings.hasTime = timeSettings.hasTime;
      if (timeSettings.startTime) habit.timeSettings.startTime = timeSettings.startTime;
      if (timeSettings.endTime) habit.timeSettings.endTime = timeSettings.endTime;
      if (timeSettings.reminderTime) habit.timeSettings.reminderTime = timeSettings.reminderTime;
    }
    
    // 更新日期范围
    if (startDate) habit.startDate = startDate;
    if (endDate !== undefined) habit.endDate = endDate;
    
    // 更新高级设置
    if (advanced) {
      if (advanced.isPublic !== undefined) habit.advanced.isPublic = advanced.isPublic;
      if (advanced.allowBackfill !== undefined) habit.advanced.allowBackfill = advanced.allowBackfill;
      if (advanced.reminderEnabled !== undefined) habit.advanced.reminderEnabled = advanced.reminderEnabled;
    }
    
    // 处理归档状态
    if (req.body.isArchived !== undefined) {
      habit.isArchived = req.body.isArchived;
    }
    
    await habit.save();
    
    res.status(200).json({
      success: true,
      message: '习惯更新成功',
      data: habit
    });
  } catch (error) {
    console.error('更新习惯错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，更新习惯失败'
    });
  }
};

/**
 * 删除指定习惯
 * @route DELETE /api/habits/:habitId
 */
exports.deleteHabit = async (req, res) => {
  try {
    const habit = req.resource;
    
    if (!habit) {
      return res.status(404).json({
        success: false,
        message: '习惯不存在'
      });
    }

    // 获取习惯ID，确保是字符串格式
    const habitId = habit._id.toString();
    
    // 不使用事务，改为顺序操作
    console.log(`开始删除习惯: ${habitId}`);
    
    // 1. 删除习惯相关的打卡记录
    try {
      const deleteCheckinResult = await Checkin.deleteMany({ habit: habitId });
      console.log(`删除了 ${deleteCheckinResult.deletedCount} 条打卡记录`);
    } catch (checkinError) {
      console.error('删除打卡记录失败:', checkinError);
      return res.status(500).json({
        success: false,
        message: '删除打卡记录失败'
      });
    }
    
    // 2. 删除习惯
    try {
      const deleteHabitResult = await Habit.findByIdAndDelete(habitId);
      if (!deleteHabitResult) {
        console.error('找不到要删除的习惯');
        return res.status(404).json({
          success: false,
          message: '找不到要删除的习惯'
        });
      }
      console.log('习惯删除成功');
    } catch (habitError) {
      console.error('删除习惯失败:', habitError);
      return res.status(500).json({
        success: false,
        message: '删除习惯失败'
      });
    }
    
    // 3. 更新用户习惯总数
    try {
      const updateUserResult = await User.findByIdAndUpdate(
        req.user._id,
        { $inc: { totalHabits: -1 } },
        { new: true }
      );
      
      if (!updateUserResult) {
        console.error('更新用户习惯总数失败: 找不到用户');
        // 不阻止流程，继续返回成功
      } else {
        console.log('用户习惯总数更新成功');
      }
    } catch (userError) {
      console.error('更新用户习惯总数失败:', userError);
      // 不阻止流程，继续返回成功
    }
    
    // 所有操作完成，返回成功
    res.status(200).json({
      success: true,
      message: '习惯删除成功'
    });
  } catch (error) {
    console.error('删除习惯错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，删除习惯失败'
    });
  }
};

/**
 * 获取指定习惯的打卡记录
 * @route GET /api/habits/:habitId/checkins
 */
exports.getHabitCheckins = async (req, res) => {
  try {
    const habitId = req.params.habitId;
    const { startDate, endDate, limit = 30, page = 1 } = req.query;
    
    // 构建查询条件
    const query = { habit: habitId };
    
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }
    
    const skip = (page - 1) * limit;
    
    let checkins = [];
    let total = 0;
    
    // 检查习惯ID是否为MongoDB ObjectId格式
    if (mongoose.Types.ObjectId.isValid(habitId)) {
      // 正常查询数据库
      checkins = await Checkin.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
      total = await Checkin.countDocuments(query);
    } else {
      // 对于非ObjectId格式（如本地测试的habit-1），返回模拟数据
      console.log(`使用本地ID ${habitId}，返回模拟打卡记录`);
      
      // 获取日期范围
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const startDateObj = startDate ? new Date(startDate) : thirtyDaysAgo;
      const endDateObj = endDate ? new Date(endDate) : today;
      
      // 生成模拟打卡记录
      const allCheckins = generateMockCheckins(
        habitId, 
        startDateObj.toISOString().split('T')[0], 
        endDateObj.toISOString().split('T')[0]
      );
      
      // 模拟分页
      total = allCheckins.length;
      checkins = allCheckins
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(skip, skip + parseInt(limit));
    }
    
    res.status(200).json({
      success: true,
      count: checkins.length,
      data: checkins,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取习惯打卡记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取习惯打卡记录失败'
    });
  }
};

/**
 * 获取指定习惯的统计数据
 * @route GET /api/habits/:habitId/stats
 */
exports.getHabitStats = async (req, res) => {
  try {
    const habit = req.resource;
    
    // 获取最近30天的打卡记录
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    const formattedThirtyDaysAgo = thirtyDaysAgo.toISOString().split('T')[0];
    
    let recentCheckins = [];
    
    // 检查习惯ID是否为MongoDB ObjectId格式
    if (mongoose.Types.ObjectId.isValid(habit._id)) {
      // 正常查询数据库
      recentCheckins = await Checkin.find({
      habit: habit._id,
      date: { $gte: formattedThirtyDaysAgo, $lte: formattedToday }
    }).sort({ date: 1 });
    } else {
      // 对于非ObjectId格式（如本地测试的habit-1），返回模拟数据
      console.log(`使用本地ID ${habit._id}，返回模拟打卡数据`);
      // 创建模拟打卡数据
      recentCheckins = generateMockCheckins(habit._id, formattedThirtyDaysAgo, formattedToday);
    }
    
    // 计算最近30天的完成率
    const totalDaysInPeriod = 30;
    const completedDaysInPeriod = recentCheckins.filter(checkin => checkin.isCompleted).length;
    const recentCompletionRate = totalDaysInPeriod > 0 
      ? (completedDaysInPeriod / totalDaysInPeriod) * 100 
      : 0;
    
    // 确保习惯有stats属性
    const habitStats = habit.stats || {
      totalDays: 0,
      completedDays: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null
    };
    
    // 计算总完成率
    const completionRate = habitStats.totalDays > 0 
      ? Math.round((habitStats.completedDays / habitStats.totalDays) * 100)
      : 0;
    
    // 构建返回数据
    const resultData = {
      stats: {
        totalDays: habitStats.totalDays || 0,
        completedDays: habitStats.completedDays || 0,
        completionRate: completionRate,
        currentStreak: habitStats.currentStreak || 0,
        longestStreak: habitStats.longestStreak || 0,
        lastCompletedDate: habitStats.lastCompletedDate || null,
        totalCompletions: habitStats.completedDays || 0
      },
      recentStats: {
        recentCompletionRate: parseFloat(recentCompletionRate.toFixed(2)),
        recentCheckins
      }
    };
    
    res.status(200).json({
      success: true,
      data: resultData
    });
  } catch (error) {
    console.error('获取习惯统计数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取习惯统计数据失败'
    });
  }
};

/**
 * 生成模拟打卡数据
 * @param {string} habitId 习惯ID
 * @param {string} startDate 开始日期
 * @param {string} endDate 结束日期
 * @returns {Array} 模拟打卡数据数组
 */
function generateMockCheckins(habitId, startDate, endDate) {
  const checkins = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // 为每一天创建一个模拟打卡记录
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const isCompleted = Math.random() > 0.3; // 70%的概率完成
    const formattedDate = date.toISOString().split('T')[0];
    
    checkins.push({
      _id: `checkin-${habitId}-${formattedDate}`,
      habit: habitId,
      date: formattedDate,
      isCompleted,
      value: isCompleted ? Math.floor(Math.random() * 10) + 1 : 0,
      notes: isCompleted ? '模拟打卡记录' : '',
      createdAt: date,
      updatedAt: date
    });
  }
  
  return checkins;
}

/**
 * 归档指定习惯
 * @route POST /api/habits/:habitId/archive
 */
exports.archiveHabit = async (req, res) => {
  try {
    const habit = req.resource;
    
    // 切换归档状态
    habit.isArchived = !habit.isArchived;
    await habit.save();
    
    const statusMessage = habit.isArchived ? '习惯归档成功' : '习惯取消归档成功';
    
    res.status(200).json({
      success: true,
      message: statusMessage,
      data: habit
    });
  } catch (error) {
    console.error('归档习惯错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，归档习惯失败'
    });
  }
};

/**
 * 获取习惯分类列表
 * @route GET /api/habits/categories
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = [
      { id: 'health', name: '健康', icon: 'heart' },
      { id: 'learning', name: '学习', icon: 'book' },
      { id: 'work', name: '工作', icon: 'briefcase' },
      { id: 'social', name: '社交', icon: 'users' },
      { id: 'finance', name: '财务', icon: 'dollar-sign' },
      { id: 'other', name: '其他', icon: 'more-horizontal' }
    ];
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('获取习惯分类错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取习惯分类失败'
    });
  }
};

/**
 * 获取习惯模板列表
 * @route GET /api/habits/templates
 */
exports.getTemplates = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    
    // 构建查询条件
    const query = { isPublic: true };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const templates = await HabitTemplate.find(query)
      .sort({ isFeatured: -1, stats: { usageCount: -1 } })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await HabitTemplate.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取习惯模板列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取习惯模板列表失败'
    });
  }
};

/**
 * 获取指定习惯模板详情
 * @route GET /api/habits/templates/:templateId
 */
exports.getTemplate = async (req, res) => {
  try {
    const templateId = req.params.templateId;
    
    const template = await HabitTemplate.findById(templateId);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: '习惯模板不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('获取习惯模板详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取习惯模板详情失败'
    });
  }
};

/**
 * 从模板创建习惯
 * @route POST /api/habits/from-template/:templateId
 */
exports.createFromTemplate = async (req, res) => {
  try {
    const templateId = req.params.templateId;
    
    // 获取模板
    const template = await HabitTemplate.findById(templateId);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: '习惯模板不存在'
      });
    }
    
    // 创建新习惯
    const habit = new Habit({
      name: template.name,
      description: template.description,
      category: template.category,
      icon: template.icon,
      color: template.color,
      user: req.user._id,
      frequency: {
        type: template.defaultFrequency.type,
        days: template.defaultFrequency.days,
        interval: template.defaultFrequency.interval
      },
      goal: {
        type: template.defaultGoal.type,
        value: template.defaultGoal.value,
        unit: template.defaultGoal.unit
      },
      timeSettings: {
        hasTime: template.defaultTimeSettings.hasTime,
        startTime: template.defaultTimeSettings.startTime,
        endTime: template.defaultTimeSettings.endTime,
        reminderTime: template.defaultTimeSettings.reminderTime
      },
      startDate: new Date(),
      advanced: {
        isFromTemplate: true,
        templateId: template._id
      }
    });
    
    await habit.save();
    
    // 更新模板使用统计
    template.stats.usageCount += 1;
    await template.save();
    
    // 更新用户习惯总数
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalHabits: 1 }
    });
    
    res.status(201).json({
      success: true,
      message: '从模板创建习惯成功',
      data: habit
    });
  } catch (error) {
    console.error('从模板创建习惯错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，从模板创建习惯失败'
    });
  }
}; 
