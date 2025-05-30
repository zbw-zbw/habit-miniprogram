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
      data: user
    });
  } catch (error) {
    console.error('获取用户资料错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取用户资料失败'
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
        errors: errors.array()
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
      data: user
    });
  } catch (error) {
    console.error('更新用户资料错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，更新用户资料失败'
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
        message: '请上传头像文件'
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
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('上传头像错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，头像上传失败'
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
        errors: errors.array()
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
        message: '当前密码不正确'
      });
    }
    
    // 更新密码
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，密码修改失败'
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
      data: user.settings
    });
  } catch (error) {
    console.error('获取用户设置错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取用户设置失败'
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
      
      if (notifications.reminderTime && /^([01]\d|2[0-3]):([0-5]\d)$/.test(notifications.reminderTime)) {
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
      data: user.settings
    });
  } catch (error) {
    console.error('更新用户设置错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，更新用户设置失败'
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
      data: user.achievements
    });
  } catch (error) {
    console.error('获取用户成就错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取用户成就失败'
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
      achievements: user.achievements.length
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取用户统计数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取用户统计数据失败'
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
        message: '用户不存在'
      });
    }
    
    // 检查用户隐私设置
    if (!user.settings.privacy.shareData) {
      return res.status(403).json({
        success: false,
        message: '该用户已设置资料不公开'
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
      achievements: user.achievements
    };
    
    res.status(200).json({
      success: true,
      data: publicProfile
    });
  } catch (error) {
    console.error('获取用户公开资料错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取用户公开资料失败'
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
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取所有用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取所有用户失败'
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
        message: '用户不存在'
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
      data: user
    });
  } catch (error) {
    console.error('管理员更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，更新用户信息失败'
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
        message: '用户不存在'
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
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('管理员删除用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，删除用户失败'
    });
  }
}; 
