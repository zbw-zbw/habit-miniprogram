/**
 * 打卡记录控制器
 */
const { validationResult } = require('express-validator');
const Checkin = require('../models/checkin.model');
const Habit = require('../models/habit.model');
const User = require('../models/user.model');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

/**
 * 获取当前用户的所有打卡记录
 * @route GET /api/checkins
 */
exports.getCheckins = async (req, res) => {
  try {
    const { startDate, endDate, habitId, isCompleted, page = 1, limit = 20 } = req.query;
    
    // 构建查询条件
    const query = { user: req.user._id };
    
    if (habitId) {
      query.habit = habitId;
    }
    
    if (isCompleted !== undefined) {
      query.isCompleted = isCompleted === 'true';
    }
    
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }
    
    const skip = (page - 1) * limit;
    
    const checkins = await Checkin.find(query)
      .populate('habit', 'name category icon color')
      .sort({ date: -1, 'time.start': -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Checkin.countDocuments(query);
    
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
    console.error('获取打卡记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取打卡记录失败'
    });
  }
};

/**
 * 创建新打卡记录
 * @route POST /api/checkins
 */
exports.createCheckin = async (req, res) => {
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
      habit,
      habitId,
      date,
      isCompleted = true,
      value = 1,
      note,
      mood,
      difficulty,
      location,
      isBackfill = false
    } = req.body;
    
    // 使用habit或habitId作为习惯ID
    const actualHabitId = habit || habitId;
    
    // 检查习惯ID是否存在
    if (!actualHabitId) {
      return res.status(400).json({
        success: false,
        errors: [{
          type: 'field',
          msg: '习惯ID不能为空',
          path: 'habit',
          location: 'body'
        }]
      });
    }
    
    // 检查习惯是否存在
    const habitDoc = await Habit.findById(actualHabitId);
    
    if (!habitDoc) {
      return res.status(404).json({
        success: false,
        message: '习惯不存在'
      });
    }
    
    // 检查习惯是否属于当前用户
    if (habitDoc.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权操作此习惯'
      });
    }
    
    // 检查是否已存在该日期的打卡记录
    const existingCheckin = await Checkin.findOne({
      habit: actualHabitId,
      date
    });
    
    if (existingCheckin) {
      return res.status(400).json({
        success: false,
        message: '该日期已存在打卡记录'
      });
    }
    
    // 检查是否允许补签
    if (isBackfill && !habitDoc.advanced.allowBackfill) {
      return res.status(400).json({
        success: false,
        message: '该习惯不允许补签'
      });
    }
    
    // 创建新打卡记录
    const checkin = new Checkin({
      habit: actualHabitId,
      user: req.user._id,
      date,
      isCompleted,
      value,
      note,
      mood,
      difficulty,
      location,
      isBackfill
    });
    
    // 保存打卡记录
    await checkin.save();
    
    // 更新习惯统计数据
    if (isCompleted) {
      // 增加完成天数
      habitDoc.stats.completedDays += 1;
      
      // 更新最后完成日期
      habitDoc.stats.lastCompletedDate = new Date();
      
      // 更新连续打卡天数
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayFormatted = yesterday.toISOString().split('T')[0];
      
      const yesterdayCheckin = await Checkin.findOne({
        habit: actualHabitId,
        date: yesterdayFormatted,
        isCompleted: true
      });
      
      if (yesterdayCheckin || habitDoc.stats.currentStreak === 0) {
        habitDoc.stats.currentStreak += 1;
        
        // 更新最长连续天数
        if (habitDoc.stats.currentStreak > habitDoc.stats.longestStreak) {
          habitDoc.stats.longestStreak = habitDoc.stats.currentStreak;
        }
      } else {
        habitDoc.stats.currentStreak = 1;
      }
      
      // 更新用户统计数据（不使用事务）
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { completedCheckins: 1 }
      });
    }
    
    // 增加总天数
    habitDoc.stats.totalDays += 1;
    
    // 保存习惯文档
    await habitDoc.save();
    
    res.status(201).json({
      success: true,
      message: '打卡记录创建成功',
      data: checkin
    });
  } catch (error) {
    console.error('创建打卡记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，创建打卡记录失败'
    });
  }
};

/**
 * 创建带媒体文件的打卡记录
 * @route POST /api/checkins/with-media
 */
exports.createCheckinWithMedia = async (req, res) => {
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
      habit: habitId,
      date,
      isCompleted = true,
      value = 1,
      note,
      mood,
      difficulty,
      location,
      isBackfill = false,
      isPublic = false
    } = req.body;
    
    // 检查习惯是否存在
    const habit = await Habit.findById(habitId);
    
    if (!habit) {
      return res.status(404).json({
        success: false,
        message: '习惯不存在'
      });
    }
    
    // 检查习惯是否属于当前用户
    if (habit.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权操作此习惯'
      });
    }
    
    // 检查是否已存在该日期的打卡记录
    const existingCheckin = await Checkin.findOne({
      habit: habitId,
      date
    });
    
    if (existingCheckin) {
      return res.status(400).json({
        success: false,
        message: '该日期已存在打卡记录'
      });
    }
    
    // 处理上传的媒体文件
    const media = [];
    
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const fileType = file.mimetype.startsWith('image/') ? 'image' :
                         file.mimetype.startsWith('video/') ? 'video' :
                         file.mimetype.startsWith('audio/') ? 'audio' : null;
        
        if (fileType) {
          media.push({
            type: fileType,
            url: `/uploads/${file.filename}`,
            thumbnail: fileType === 'video' ? `/uploads/thumbnails/${file.filename.replace(/\.[^/.]+$/, '.jpg')}` : null
          });
        }
      });
    }
    
    // 创建新打卡记录
    const checkin = new Checkin({
      habit: habitId,
      user: req.user._id,
      date,
      isCompleted,
      value,
      note,
      mood,
      difficulty,
      location,
      media,
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
      
      // 更新用户统计数据（不使用事务）
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { completedCheckins: 1 }
      });
    }
    
    // 增加总天数
    habit.stats.totalDays += 1;
    
    // 保存习惯文档
    await habit.save();
    
    res.status(201).json({
      success: true,
      message: '打卡记录创建成功',
      data: checkin
    });
  } catch (error) {
    console.error('创建带媒体的打卡记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，创建打卡记录失败'
    });
  }
};

/**
 * 获取指定打卡记录详情
 * @route GET /api/checkins/:checkinId
 */
exports.getCheckin = async (req, res) => {
  try {
    // 打卡记录已在中间件中获取并添加到req.resource
    const checkin = req.resource;
    
    // 填充习惯信息
    await checkin.populate('habit', 'name category icon color');
    
    res.status(200).json({
      success: true,
      data: checkin
    });
  } catch (error) {
    console.error('获取打卡记录详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取打卡记录详情失败'
    });
  }
};

/**
 * 更新指定打卡记录
 * @route PUT /api/checkins/:checkinId
 */
exports.updateCheckin = async (req, res) => {
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
      isCompleted,
      value,
      note,
      mood,
      difficulty,
      location,
      isPublic
    } = req.body;
    
    const checkin = req.resource;
    const oldIsCompleted = checkin.isCompleted;
    
    // 更新打卡记录信息
    if (isCompleted !== undefined) checkin.isCompleted = isCompleted;
    if (value !== undefined) checkin.value = value;
    if (note !== undefined) checkin.note = note;
    if (mood !== undefined) checkin.mood = mood;
    if (difficulty !== undefined) checkin.difficulty = difficulty;
    if (location !== undefined) checkin.location = location;
    if (isPublic !== undefined) checkin.isPublic = isPublic;
    
    // 保存打卡记录
    await checkin.save();
    
    // 如果完成状态发生变化，更新习惯和用户统计数据
    if (isCompleted !== undefined && isCompleted !== oldIsCompleted) {
      const habit = await Habit.findById(checkin.habit);
      
      if (isCompleted) {
        // 从未完成变为完成
        habit.stats.completedDays += 1;
        
        // 更新用户统计数据
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { completedCheckins: 1 }
        });
      } else {
        // 从完成变为未完成
        habit.stats.completedDays = Math.max(0, habit.stats.completedDays - 1);
        
        // 更新用户统计数据
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { completedCheckins: -1 }
        });
      }
      
      // 重新计算连续打卡天数
      const recentCheckins = await Checkin.find({
        habit: habit._id,
        isCompleted: true
      }).sort({ date: -1 });
      
      let currentStreak = 0;
      let previousDate = null;
      
      for (const c of recentCheckins) {
        const checkinDate = new Date(c.date);
        
        if (!previousDate) {
          currentStreak = 1;
          previousDate = checkinDate;
          continue;
        }
        
        const dayDiff = Math.floor((previousDate - checkinDate) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          currentStreak += 1;
          previousDate = checkinDate;
        } else {
          break;
        }
      }
      
      habit.stats.currentStreak = currentStreak;
      
      // 更新最长连续天数
      if (currentStreak > habit.stats.longestStreak) {
        habit.stats.longestStreak = currentStreak;
      }
      
      // 保存习惯文档
      await habit.save();
    }
    
    res.status(200).json({
      success: true,
      message: '打卡记录更新成功',
      data: checkin
    });
  } catch (error) {
    console.error('更新打卡记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，更新打卡记录失败'
    });
  }
};

/**
 * 删除指定打卡记录
 * @route DELETE /api/checkins/:checkinId
 */
exports.deleteCheckin = async (req, res) => {
  try {
    const checkin = req.resource;
    
    // 更新习惯统计数据
    if (checkin.isCompleted) {
      const habit = await Habit.findById(checkin.habit);
      
      // 减少完成天数
      habit.stats.completedDays = Math.max(0, habit.stats.completedDays - 1);
      
      // 减少总天数
      habit.stats.totalDays = Math.max(0, habit.stats.totalDays - 1);
      
      // 重新计算连续打卡天数
      const recentCheckins = await Checkin.find({
        habit: habit._id,
        isCompleted: true,
        _id: { $ne: checkin._id }
      }).sort({ date: -1 });
      
      let currentStreak = 0;
      let previousDate = null;
      
      for (const c of recentCheckins) {
        const checkinDate = new Date(c.date);
        
        if (!previousDate) {
          currentStreak = 1;
          previousDate = checkinDate;
          continue;
        }
        
        const dayDiff = Math.floor((previousDate - checkinDate) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          currentStreak += 1;
          previousDate = checkinDate;
        } else {
          break;
        }
      }
      
      habit.stats.currentStreak = currentStreak;
      
      // 保存习惯数据
      await habit.save();
      
      // 更新用户统计数据
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { completedCheckins: -1 }
      });
    }
    
    // 删除媒体文件
    if (checkin.media && checkin.media.length > 0) {
      checkin.media.forEach(media => {
        const mediaPath = path.join(__dirname, '../..', media.url);
        if (fs.existsSync(mediaPath)) {
          fs.unlinkSync(mediaPath);
        }
        
        if (media.thumbnail) {
          const thumbnailPath = path.join(__dirname, '../..', media.thumbnail);
          if (fs.existsSync(thumbnailPath)) {
            fs.unlinkSync(thumbnailPath);
          }
        }
      });
    }
    
    // 删除打卡记录
    await Checkin.findByIdAndDelete(checkin._id);
    
    res.status(200).json({
      success: true,
      message: '打卡记录删除成功'
    });
  } catch (error) {
    console.error('删除打卡记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，删除打卡记录失败'
    });
  }
};

/**
 * 为打卡记录添加媒体文件
 * @route POST /api/checkins/:checkinId/media
 */
exports.addCheckinMedia = async (req, res) => {
  try {
    const checkin = req.resource;
    
    // 处理上传的媒体文件
    const newMedia = [];
    
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const fileType = file.mimetype.startsWith('image/') ? 'image' :
                         file.mimetype.startsWith('video/') ? 'video' :
                         file.mimetype.startsWith('audio/') ? 'audio' : null;
        
        if (fileType) {
          newMedia.push({
            type: fileType,
            url: `/uploads/${file.filename}`,
            thumbnail: fileType === 'video' ? `/uploads/thumbnails/${file.filename.replace(/\.[^/.]+$/, '.jpg')}` : null
          });
        }
      });
    }
    
    if (newMedia.length === 0) {
      return res.status(400).json({
        success: false,
        message: '未提供有效的媒体文件'
      });
    }
    
    // 更新打卡记录
    checkin.media = [...checkin.media, ...newMedia];
    await checkin.save();
    
    res.status(200).json({
      success: true,
      message: '媒体文件添加成功',
      data: {
        media: checkin.media
      }
    });
  } catch (error) {
    console.error('添加媒体文件错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，添加媒体文件失败'
    });
  }
};

/**
 * 删除打卡记录的媒体文件
 * @route DELETE /api/checkins/:checkinId/media/:mediaId
 */
exports.deleteCheckinMedia = async (req, res) => {
  try {
    const checkin = req.resource;
    const mediaId = req.params.mediaId;
    
    // 查找媒体文件
    const mediaIndex = checkin.media.findIndex(m => m._id.toString() === mediaId);
    
    if (mediaIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '媒体文件不存在'
      });
    }
    
    const media = checkin.media[mediaIndex];
    
    // 删除文件
    const mediaPath = path.join(__dirname, '../..', media.url);
    if (fs.existsSync(mediaPath)) {
      fs.unlinkSync(mediaPath);
    }
    
    if (media.thumbnail) {
      const thumbnailPath = path.join(__dirname, '../..', media.thumbnail);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }
    
    // 更新打卡记录
    checkin.media.splice(mediaIndex, 1);
    await checkin.save();
    
    res.status(200).json({
      success: true,
      message: '媒体文件删除成功',
      data: {
        media: checkin.media
      }
    });
  } catch (error) {
    console.error('删除媒体文件错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，删除媒体文件失败'
    });
  }
};

/**
 * 分享打卡记录到社区
 * @route POST /api/checkins/:checkinId/share
 */
exports.shareCheckin = async (req, res) => {
  try {
    const checkin = req.resource;
    
    checkin.isPublic = true;
    await checkin.save();
    
    res.status(200).json({
      success: true,
      message: '打卡记录已分享到社区',
      data: checkin
    });
  } catch (error) {
    console.error('分享打卡记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，分享打卡记录失败'
    });
  }
};

/**
 * 取消分享打卡记录
 * @route POST /api/checkins/:checkinId/unshare
 */
exports.unshareCheckin = async (req, res) => {
  try {
    const checkin = req.resource;
    
    checkin.isPublic = false;
    await checkin.save();
    
    res.status(200).json({
      success: true,
      message: '已取消分享打卡记录',
      data: checkin
    });
  } catch (error) {
    console.error('取消分享打卡记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，取消分享打卡记录失败'
    });
  }
};

/**
 * 获取指定日期的打卡记录
 * @route GET /api/checkins/date/:date
 */
exports.getCheckinsByDate = async (req, res) => {
  try {
    const { date } = req.params;
    
    const checkins = await Checkin.find({
      user: req.user._id,
      date
    }).populate('habit', 'name category icon color');
    
    res.status(200).json({
      success: true,
      count: checkins.length,
      data: checkins
    });
  } catch (error) {
    console.error('获取日期打卡记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取日期打卡记录失败'
    });
  }
};

/**
 * 获取打卡统计摘要
 * @route GET /api/checkins/stats/summary
 */
exports.getCheckinStatsSummary = async (req, res) => {
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
    
    // 查询今日打卡
    const todayCheckins = await Checkin.countDocuments({
      user: userId,
      date: todayFormatted,
      isCompleted: true
    });
    
    // 查询本周打卡
    const weekCheckins = await Checkin.countDocuments({
      user: userId,
      date: { $gte: startOfWeekFormatted, $lte: todayFormatted },
      isCompleted: true
    });
    
    // 查询本月打卡
    const monthCheckins = await Checkin.countDocuments({
      user: userId,
      date: { $gte: startOfMonthFormatted, $lte: todayFormatted },
      isCompleted: true
    });
    
    // 查询总打卡次数
    const totalCheckins = await Checkin.countDocuments({
      user: userId,
      isCompleted: true
    });
    
    // 查询习惯总数
    const totalHabits = await Habit.countDocuments({
      user: userId
    });
    
    // 查询活跃习惯数（本周有打卡记录的习惯）
    const activeHabits = await Checkin.distinct('habit', {
      user: userId,
      date: { $gte: startOfWeekFormatted, $lte: todayFormatted }
    });
    
    // 查询用户最长连续打卡天数
    const user = await User.findById(userId);
    
    const summary = {
      today: {
        date: todayFormatted,
        completed: todayCheckins
      },
      week: {
        startDate: startOfWeekFormatted,
        endDate: todayFormatted,
        completed: weekCheckins
      },
      month: {
        startDate: startOfMonthFormatted,
        endDate: todayFormatted,
        completed: monthCheckins
      },
      total: {
        habits: totalHabits,
        activeHabits: activeHabits.length,
        checkins: totalCheckins
      },
      streaks: {
        current: user.currentStreak,
        longest: user.longestStreak
      }
    };
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('获取打卡统计摘要错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取打卡统计摘要失败'
    });
  }
}; 
