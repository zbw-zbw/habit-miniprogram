/**
 * 用户控制器
 */
const { validationResult } = require('express-validator');
const User = require('../models/user.model');
const fs = require('fs');
const path = require('path');

/**
 * 获取当前用户资料
 * @route GET /api/users/profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('获取用户资料错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取用户资料失败',
    });
  }
};

/**
 * 更新当前用户资料
 * @route PUT /api/users/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { nickname, gender } = req.body;
    const user = req.user;

    // 更新用户资料
    if (nickname) user.nickname = nickname;
    if (gender) user.gender = gender;

    await user.save();

    res.status(200).json({
      success: true,
      message: '用户资料更新成功',
      data: user,
    });
  } catch (error) {
    console.error('更新用户资料错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，更新用户资料失败',
    });
  }
};

/**
 * 上传用户头像
 * @route POST /api/users/avatar
 */
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传头像文件',
      });
    }

    const user = req.user;

    // 如果用户已有头像，删除旧头像
    if (user.avatar) {
      const oldAvatarPath = path.join(__dirname, '../..', user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // 更新用户头像路径
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    res.status(200).json({
      success: true,
      message: '头像上传成功',
      data: {
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('上传头像错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，头像上传失败',
    });
  }
};

/**
 * 修改用户密码
 * @route PUT /api/users/password
 */
exports.changePassword = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { currentPassword, newPassword } = req.body;

    // 获取用户（包含密码字段）
    const user = await User.findById(req.user._id).select('+password');

    // 验证当前密码
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: '当前密码不正确',
      });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: '密码修改成功',
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，密码修改失败',
    });
  }
};

/**
 * 获取用户设置
 * @route GET /api/users/settings
 */
exports.getSettings = async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      data: user.settings,
    });
  } catch (error) {
    console.error('获取用户设置错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取用户设置失败',
    });
  }
};

/**
 * 更新用户设置
 * @route PUT /api/users/settings
 */
exports.updateSettings = async (req, res) => {
  try {
    const { theme, notifications, privacy } = req.body;
    const user = req.user;

    // 更新主题设置
    if (theme && ['light', 'dark', 'system'].includes(theme)) {
      user.settings.theme = theme;
    }

    // 更新通知设置
    if (notifications) {
      if (typeof notifications.enabled === 'boolean') {
        user.settings.notifications.enabled = notifications.enabled;
      }

      if (
        notifications.reminderTime &&
        /^([01]\d|2[0-3]):([0-5]\d)$/.test(notifications.reminderTime)
      ) {
        user.settings.notifications.reminderTime = notifications.reminderTime;
      }
    }

    // 更新隐私设置
    if (privacy) {
      if (typeof privacy.shareData === 'boolean') {
        user.settings.privacy.shareData = privacy.shareData;
      }

      if (typeof privacy.showInRankings === 'boolean') {
        user.settings.privacy.showInRankings = privacy.showInRankings;
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: '设置更新成功',
      data: user.settings,
    });
  } catch (error) {
    console.error('更新用户设置错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，更新用户设置失败',
    });
  }
};

/**
 * 获取用户成就
 * @route GET /api/users/achievements
 */
exports.getAchievements = async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      data: user.achievements,
    });
  } catch (error) {
    console.error('获取用户成就错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取用户成就失败',
    });
  }
};

/**
 * 获取用户统计数据
 * @route GET /api/users/stats
 */
exports.getUserStats = async (req, res) => {
  try {
    const user = req.user;

    const stats = {
      totalHabits: user.totalHabits,
      completedCheckins: user.completedCheckins,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      achievements: user.achievements.length,
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('获取用户统计数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取用户统计数据失败',
    });
  }
};

/**
 * 获取指定用户公开资料
 * @route GET /api/users/:userId
 */
exports.getUserPublicProfile = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      });
    }

    // 检查用户隐私设置
    if (!user.settings.privacy.shareData) {
      return res.status(403).json({
        success: false,
        message: '该用户已设置资料不公开',
      });
    }

    // 返回公开资料
    const publicProfile = {
      id: user._id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      totalHabits: user.totalHabits,
      completedCheckins: user.completedCheckins,
      achievements: user.achievements,
    };

    res.status(200).json({
      success: true,
      data: publicProfile,
    });
  } catch (error) {
    console.error('获取用户公开资料错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取用户公开资料失败',
    });
  }
};

/**
 * 获取所有用户（管理员功能）
 * @route GET /api/users/admin/all
 */
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-settings')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取所有用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取所有用户失败',
    });
  }
};

/**
 * 管理员更新用户信息
 * @route PUT /api/users/admin/:userId
 */
exports.adminUpdateUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { isActive, role } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      });
    }

    // 更新用户状态
    if (typeof isActive === 'boolean') {
      user.isActive = isActive;
    }

    // 更新用户角色
    if (role && ['user', 'admin'].includes(role)) {
      user.role = role;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: '用户信息更新成功',
      data: user,
    });
  } catch (error) {
    console.error('管理员更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，更新用户信息失败',
    });
  }
};

/**
 * 管理员删除用户
 * @route DELETE /api/users/admin/:userId
 */
exports.adminDeleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      });
    }

    // 删除用户头像
    if (user.avatar) {
      const avatarPath = path.join(__dirname, '../..', user.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    // 删除用户
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: '用户删除成功',
    });
  } catch (error) {
    console.error('管理员删除用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，删除用户失败',
    });
  }
};

/**
 * 获取用户资料聚合数据（包括基本信息、统计数据和成就）
 * @route GET /api/users/profile/all
 */
exports.getProfileAll = async (req, res) => {
  try {
    const user = req.user;

    // 查询用户的所有习惯和打卡记录，计算最新统计数据
    const Habit = require('../models/habit.model');
    const Checkin = require('../models/checkin.model');

    console.log('开始获取用户聚合数据，用户ID:', user._id);

    // 获取用户的所有习惯
    const habits = await Habit.find({ user: user._id });
    console.log(`找到用户习惯: ${habits.length}个`);

    // 获取今日日期
    const today = new Date().toISOString().split('T')[0];
    console.log('今日日期:', today);

    // 获取今日完成的打卡记录
    const todayCheckins = await Checkin.find({
      user: user._id,
      date: today,
      isCompleted: true,
    });
    console.log(`今日完成打卡: ${todayCheckins.length}个`);

    // 获取所有打卡记录
    const allCheckins = await Checkin.find({
      user: user._id,
      isCompleted: true,
    });
    console.log(`总完成打卡: ${allCheckins.length}个`);

    // 从习惯中获取当前最长连续打卡天数
    let maxCurrentStreak = 0;
    let maxLongestStreak = 0;

    // 遍历所有习惯，找出最长的连续天数
    habits.forEach((habit) => {
      if (habit.stats && habit.stats.currentStreak) {
        maxCurrentStreak = Math.max(
          maxCurrentStreak,
          habit.stats.currentStreak
        );
      }
      if (habit.stats && habit.stats.longestStreak) {
        maxLongestStreak = Math.max(
          maxLongestStreak,
          habit.stats.longestStreak
        );
      }
    });

    // 如果没有习惯统计数据，使用用户模型中的数据
    if (maxCurrentStreak === 0) {
      maxCurrentStreak = user.currentStreak || 0;
    }

    if (maxLongestStreak === 0) {
      maxLongestStreak = user.longestStreak || 0;
    }

    // 处理成就数据
    console.log('开始处理用户成就数据');

    let achievements = [];

    if (
      user.achievements &&
      Array.isArray(user.achievements) &&
      user.achievements.length > 0
    ) {
      console.log('用户有成就数据，数量:', user.achievements.length);
      achievements = user.achievements.map((achievement) => ({
        id: achievement.id,
        title: achievement.name || '未命名成就',
        description: achievement.description || '完成特定目标解锁此成就',
        icon: achievement.icon || 'award',
        progress: achievement.unlockedAt ? 100 : 0,
        isCompleted: !!achievement.unlockedAt,
      }));
    } else {
      console.log('用户没有成就数据，使用默认成就');
    }

    console.log('处理后成就数量:', achievements.length);

    // 构建响应数据
    const profileData = {
      userInfo: {
        id: user._id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        gender: user.gender,
      },
      stats: {
        totalHabits: habits.length,
        activeHabits: habits.filter((h) => !h.isArchived).length,
        completedToday: todayCheckins.length,
        totalCheckins: allCheckins.length,
        currentStreak: maxCurrentStreak,
        longestStreak: maxLongestStreak,
      },
      achievements: achievements.slice(0, 3), // 只返回前3个成就
      settings: user.settings,
    };

    res.status(200).json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    console.error('获取用户聚合数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取用户聚合数据失败',
    });
  }
};

// 计算习惯养成者成就进度 (连续完成一个习惯30天)
function calculateHabitMasterProgress(habits) {
  if (!habits || habits.length === 0) return 0;

  // 找出连续天数最长的习惯
  const maxStreak = Math.max(
    ...habits.map((h) => (h.stats && h.stats.currentStreak) || 0)
  );

  // 计算进度百分比 (最大30天)
  return Math.min(100, Math.round((maxStreak / 30) * 100));
}

// 计算早起达人成就进度 (连续7天在早上7点前打卡"早起"习惯)
function calculateEarlyBirdProgress(habits, checkins) {
  // 查找"早起"相关习惯
  const earlyRiseHabits = habits.filter(
    (h) =>
      h.name.includes('早起') ||
      h.name.includes('早醒') ||
      h.category === 'morning'
  );

  if (earlyRiseHabits.length === 0) return 0;

  // 查找早起习惯的ID
  const earlyRiseHabitIds = earlyRiseHabits.map((h) => h._id.toString());

  // 过滤出早上7点前完成的早起习惯打卡
  const earlyCheckins = checkins.filter((c) => {
    // 检查是否是早起习惯
    if (!earlyRiseHabitIds.includes(c.habit.toString())) return false;

    // 检查打卡时间是否在早上7点前
    const checkinTime = new Date(c.createdAt);
    return checkinTime.getHours() < 7;
  });

  // 如果没有早起打卡记录，返回0
  if (earlyCheckins.length === 0) return 0;

  // 计算连续打卡天数 (简化版)
  return Math.min(100, Math.round((earlyCheckins.length / 7) * 100));
}

// 计算阅读专家成就进度 (累计阅读时间达到100小时)
function calculateReadingExpertProgress(habits, checkins) {
  // 查找"阅读"相关习惯
  const readingHabits = habits.filter(
    (h) =>
      h.name.includes('阅读') ||
      h.name.includes('读书') ||
      h.category === 'reading'
  );

  if (readingHabits.length === 0) return 0;

  // 查找阅读习惯的ID
  const readingHabitIds = readingHabits.map((h) => h._id.toString());

  // 过滤出阅读习惯的打卡
  const readingCheckins = checkins.filter((c) =>
    readingHabitIds.includes(c.habit.toString())
  );

  // 计算总阅读时间 (假设每次打卡平均30分钟)
  const totalReadingHours = readingCheckins.length * 0.5;

  // 计算进度百分比 (目标100小时)
  return Math.min(100, Math.round((totalReadingHours / 100) * 100));
}

/**
 * 获取用户的所有成就
 * @route GET /api/users/me/achievements
 */
exports.getUserAchievements = async (req, res) => {
  try {
    const user = req.user;

    // 查询用户的所有习惯和打卡记录，计算最新成就数据
    const Habit = require('../models/habit.model');
    const Checkin = require('../models/checkin.model');

    console.log('开始获取用户成就数据，用户ID:', user._id);

    // 获取用户的所有习惯
    const habits = await Habit.find({ user: user._id });

    // 获取所有打卡记录
    const allCheckins = await Checkin.find({
      user: user._id,
      isCompleted: true,
    });

    // 处理成就数据
    let achievements = [];

    if (user.achievements && Array.isArray(user.achievements)) {
      achievements = user.achievements.map((achievement) => ({
        id: achievement.id,
        title: achievement.name || '未命名成就',
        description: achievement.description || '完成特定目标解锁此成就',
        icon: achievement.icon || 'award',
        progress: achievement.unlockedAt ? 100 : 0,
        isCompleted: !!achievement.unlockedAt,
      }));
    }

    console.log('处理后成就数量:', achievements.length);

    res.status(200).json({
      success: true,
      data: achievements,
    });
  } catch (error) {
    console.error('获取用户成就数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取用户成就数据失败',
    });
  }
};
