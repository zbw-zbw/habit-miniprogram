/**
 * 认证控制器
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/user.model');

/**
 * 生成JWT令牌
 * @param {Object} user 用户对象
 * @returns {Object} 包含访问令牌和刷新令牌的对象
 */
const generateTokens = (user) => {
  const payload = {
    id: user._id,
    username: user.username,
    role: user.role
  };
  
  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key',
    { expiresIn: '30d' }
  );
  
  return { accessToken, refreshToken };
};

/**
 * 用户注册
 * @route POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { username, password, nickname, email } = req.body;
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已被使用'
      });
    }
    
    // 创建新用户
    const newUser = new User({
      username,
      password,
      nickname: nickname || username,
      email
    });
    
    // 保存用户（密码会在保存前自动加密）
    await newUser.save();
    
    // 生成令牌
    const tokens = generateTokens(newUser);
    
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: newUser._id,
          username: newUser.username,
          nickname: newUser.nickname,
          avatar: newUser.avatar
        },
        ...tokens
      }
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，注册失败'
    });
  }
};

/**
 * 用户登录
 * @route POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { username, password } = req.body;
    
    // 查找用户
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    // 检查用户状态
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: '账号已被禁用'
      });
    }
    
    // 验证密码
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();
    
    // 生成令牌
    const tokens = generateTokens(user);
    
    res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user._id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role
        },
        ...tokens
      }
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，登录失败'
    });
  }
};

/**
 * 微信小程序登录
 * @route POST /api/auth/wx-login
 */
exports.wxLogin = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { code, userInfo } = req.body;
    
    // 调用微信接口获取openid和session_key
    // 这里需要实现微信登录的逻辑，可能需要使用第三方库如axios来请求微信API
    
    // 示例代码，实际需要替换为真实的微信API调用
    const wxApiUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${process.env.WX_APPID}&secret=${process.env.WX_SECRET}&js_code=${code}&grant_type=authorization_code`;
    
    // 使用axios或其他HTTP客户端请求微信API
    // const response = await axios.get(wxApiUrl);
    // const { openid, session_key, unionid } = response.data;
    
    // 模拟返回数据，实际开发中应使用真实的微信API返回数据
    const timestamp = Date.now();
    const openid = 'simulated_openid_' + timestamp;
    // 不设置unionid，避免null值导致的唯一性约束冲突
    
    // 查找或创建用户
    let user = await User.findOne({ openid });
    
    if (!user) {
      // 创建新用户，使用时间戳确保用户名唯一
      const username = `wx_user_${timestamp}`;
      const nickname = userInfo?.nickName || `微信用户${Math.floor(Math.random() * 10000)}`;
      const avatar = userInfo?.avatarUrl || '';
      
      user = new User({
        username,
        password: await bcrypt.hash(openid, 10), // 使用openid作为初始密码
        nickname,
        avatar,
        openid
        // 不设置unionid字段
      });
      
      await user.save();
    } else {
      // 如果用户已存在但提供了新的用户信息，则更新用户信息
      if (userInfo) {
        user.nickname = userInfo.nickName || user.nickname;
        user.avatar = userInfo.avatarUrl || user.avatar;
        await user.save();
      }
      
      // 检查用户状态
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: '账号已被禁用'
        });
      }
    }
    
    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();
    
    // 生成令牌
    const tokens = generateTokens(user);
    
    res.status(200).json({
      success: true,
      message: '微信登录成功',
      data: {
        user: {
          id: user._id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role
        },
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，微信登录失败'
    });
  }
};

/**
 * 刷新访问令牌
 * @route POST /api/auth/refresh-token
 */
exports.refreshToken = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { refreshToken } = req.body;
    
    // 验证刷新令牌
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key'
    );
    
    // 查找用户
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在或令牌无效'
      });
    }
    
    // 检查用户状态
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: '账号已被禁用'
      });
    }
    
    // 生成新令牌
    const tokens = generateTokens(user);
    
    res.status(200).json({
      success: true,
      message: '令牌刷新成功',
      data: tokens
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '刷新令牌无效或已过期'
      });
    }
    
    
    res.status(500).json({
      success: false,
      message: '服务器错误，令牌刷新失败'
    });
  }
};

/**
 * 忘记密码
 * @route POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { email } = req.body;
    
    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      // 出于安全考虑，即使用户不存在也返回成功
      return res.status(200).json({
        success: true,
        message: '如果该邮箱已注册，重置密码链接将发送到您的邮箱'
      });
    }
    
    // 生成重置令牌
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_RESET_SECRET || 'your_jwt_reset_secret_key',
      { expiresIn: '1h' }
    );
    
    // 在实际应用中，这里应该发送重置密码邮件
    // 为了演示，我们只返回令牌
    
    res.status(200).json({
      success: true,
      message: '如果该邮箱已注册，重置密码链接将发送到您的邮箱',
      data: { resetToken } // 实际应用中不应返回此字段
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，处理忘记密码请求失败'
    });
  }
};

/**
 * 重置密码
 * @route POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { token, password } = req.body;
    
    // 验证重置令牌
    const decoded = jwt.verify(
      token,
      process.env.JWT_RESET_SECRET || 'your_jwt_reset_secret_key'
    );
    
    // 查找用户
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: '无效的重置令牌'
      });
    }
    
    // 更新密码
    user.password = password;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: '密码重置成功'
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: '重置令牌无效或已过期'
      });
    }
    
    
    res.status(500).json({
      success: false,
      message: '服务器错误，密码重置失败'
    });
  }
};

/**
 * 验证电子邮件
 * @route POST /api/auth/verify-email
 */
exports.verifyEmail = async (req, res) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { token } = req.body;
    
    // 验证邮箱验证令牌
    const decoded = jwt.verify(
      token,
      process.env.JWT_EMAIL_SECRET || 'your_jwt_email_secret_key'
    );
    
    // 查找用户
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: '无效的验证令牌'
      });
    }
    
    // 在实际应用中，这里应该更新用户的邮箱验证状态
    // user.isEmailVerified = true;
    // await user.save();
    
    res.status(200).json({
      success: true,
      message: '邮箱验证成功'
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: '验证令牌无效或已过期'
      });
    }
    
    
    res.status(500).json({
      success: false,
      message: '服务器错误，邮箱验证失败'
    });
  }
};

/**
 * 用户登出
 * @route POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    // 在实际应用中，可能需要处理令牌黑名单等逻辑
    
    res.status(200).json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，登出失败'
    });
  }
}; 

/**
 * 验证令牌
 * @route GET /api/auth/verify-token
 */
exports.verifyToken = async (req, res) => {
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
    
    try {
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
      
      // 令牌有效，返回成功响应
      res.status(200).json({
        success: true,
        message: '令牌有效',
        data: {
          user: {
            id: user._id,
            username: user.username,
            nickname: user.nickname,
            avatar: user.avatar,
            role: user.role
          }
        }
      });
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
      
      throw error;
    }
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '服务器错误，令牌验证失败'
    });
  }
}; 
