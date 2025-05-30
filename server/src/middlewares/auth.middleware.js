/**
 * 认证中间件
 */
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * 验证JWT令牌
 */
const authenticate = async (req, res, next) => {
  try {
    // 获取请求头中的Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }
    
    // 提取令牌
    const token = authHeader.split(' ')[1];
    
    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    
    // 查找用户
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在或令牌无效'
      });
    }
    
    // 检查用户是否处于活跃状态
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: '用户账号已被禁用'
      });
    }
    
    // 将用户信息添加到请求对象
    req.user = user;
    
    // 更新用户最后登录时间
    user.lastLogin = new Date();
    await user.save();
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '认证令牌已过期'
      });
    }
    
    console.error('认证中间件错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 验证用户角色是否为管理员
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '未认证用户'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '权限不足，需要管理员权限'
    });
  }
  
  next();
};

/**
 * 验证资源所有权
 * @param {String} modelName 模型名称，如 'Habit', 'Checkin'
 * @param {String} paramName 参数名称，如 'habitId', 'checkinId'
 */
const isOwner = (modelName, paramName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未认证用户'
        });
      }
      
      const resourceId = req.params[paramName];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: `未提供${paramName}`
        });
      }
      
      // 动态导入模型
      const Model = require(`../models/${modelName.toLowerCase()}.model`);
      
      // 查找资源
      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: '资源不存在'
        });
      }
      
      // 检查所有权
      if (resource.user && resource.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: '权限不足，您不是此资源的所有者'
        });
      }
      
      // 将资源添加到请求对象
      req.resource = resource;
      
      next();
    } catch (error) {
      console.error('所有权验证中间件错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  };
};

// 使authenticate作为默认导出函数，同时在exports对象上附加其他方法
authenticate.isAdmin = isAdmin;
authenticate.isOwner = isOwner;

module.exports = authenticate; 
