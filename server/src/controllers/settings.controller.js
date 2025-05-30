/**
 * 设置系统控制器
 */
const User = require('../models/user.model');
const Settings = require('../models/settings.model');

/**
 * 获取用户设置
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
exports.getSettings = async (req, res, next) => {
  try {
    // 查找用户设置，如果不存在则创建默认设置
    let settings = await Settings.findOne({ user: req.user.id });
    
    if (!settings) {
      settings = await Settings.create({
        user: req.user.id,
        theme: 'system',
        language: 'zh_CN',
        notification: true,
        sound: true,
        vibration: true
      });
    }
    
    res.status(200).json({
      theme: settings.theme,
      language: settings.language,
      notification: settings.notification,
      sound: settings.sound,
      vibration: settings.vibration
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新用户设置
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
exports.updateSettings = async (req, res, next) => {
  try {
    const { theme, language, notification, sound, vibration } = req.body;
    
    // 查找用户设置，如果不存在则创建
    let settings = await Settings.findOne({ user: req.user.id });
    
    if (!settings) {
      settings = new Settings({
        user: req.user.id
      });
    }
    
    // 更新设置
    if (theme !== undefined) settings.theme = theme;
    if (language !== undefined) settings.language = language;
    if (notification !== undefined) settings.notification = notification;
    if (sound !== undefined) settings.sound = sound;
    if (vibration !== undefined) settings.vibration = vibration;
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      message: '设置已更新',
      settings: {
        theme: settings.theme,
        language: settings.language,
        notification: settings.notification,
        sound: settings.sound,
        vibration: settings.vibration
      }
    });
  } catch (error) {
    next(error);
  }
}; 
