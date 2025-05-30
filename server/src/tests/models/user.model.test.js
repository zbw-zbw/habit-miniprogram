/**
 * 用户模型单元测试
 */
const mongoose = require('mongoose');
const User = require('../../models/user.model');

// 测试用户数据
const testUserData = {
  username: 'testuser',
  password: 'password123',
  nickname: '测试用户',
  gender: 'male'
};

// 在所有测试开始前连接数据库
beforeAll(async () => {
  const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/habit-tracker-test';
  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

// 在所有测试结束后断开数据库连接
afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

// 在每个测试开始前清理测试数据
beforeEach(async () => {
  await User.deleteMany({});
});

describe('User Model', () => {
  it('应该创建并保存一个新用户', async () => {
    const validUser = new User(testUserData);
    const savedUser = await validUser.save();
    
    // 验证保存的用户
    expect(savedUser._id).toBeDefined();
    expect(savedUser.username).toBe(testUserData.username);
    expect(savedUser.nickname).toBe(testUserData.nickname);
    expect(savedUser.gender).toBe(testUserData.gender);
    
    // 密码应该被加密
    expect(savedUser.password).not.toBe(testUserData.password);
  });
  
  it('应该比较密码', async () => {
    const validUser = new User(testUserData);
    await validUser.save();
    
    // 获取用户并测试密码比较
    const user = await User.findOne({ username: testUserData.username }).select('+password');
    const isMatch = await user.comparePassword(testUserData.password);
    expect(isMatch).toBe(true);
    
    // 测试错误密码
    const isNotMatch = await user.comparePassword('wrongpassword');
    expect(isNotMatch).toBe(false);
  });
  
  it('应该正确转换为JSON', async () => {
    const validUser = new User(testUserData);
    await validUser.save();
    
    // 获取用户
    const user = await User.findOne({ username: testUserData.username });
    
    // 转换为JSON
    const userJSON = user.toJSON();
    
    // 验证
    expect(userJSON).toBeDefined();
    expect(userJSON.username).toBe(testUserData.username);
    expect(userJSON.password).toBeUndefined();
  });
  
  it('应该需要必填字段', async () => {
    const userWithoutRequired = new User({
      nickname: '测试用户',
      gender: 'male'
    });
    
    // 验证失败
    let err;
    try {
      await userWithoutRequired.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeDefined();
    expect(err.errors.username).toBeDefined();
    expect(err.errors.password).toBeDefined();
  });
  
  it('应该验证字段长度', async () => {
    const userWithInvalidFields = new User({
      username: 'te', // 太短
      password: '12345', // 太短
      nickname: '这是一个非常长的昵称，超过了最大长度限制这是一个非常长的昵称，超过了最大长度限制', // 太长
      gender: 'male'
    });
    
    // 验证失败
    let err;
    try {
      await userWithInvalidFields.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeDefined();
    expect(err.errors.username).toBeDefined();
    expect(err.errors.password).toBeDefined();
    expect(err.errors.nickname).toBeDefined();
  });
  
  it('应该验证性别枚举值', async () => {
    const userWithInvalidGender = new User({
      username: 'testuser2',
      password: 'password123',
      nickname: '测试用户2',
      gender: 'invalid' // 无效的性别值
    });
    
    // 验证失败
    let err;
    try {
      await userWithInvalidGender.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeDefined();
    expect(err.errors.gender).toBeDefined();
  });
  
  it('应该验证用户名唯一性', async () => {
    // 先创建一个用户
    const firstUser = new User(testUserData);
    await firstUser.save();
    
    // 尝试创建同名用户
    const duplicateUser = new User(testUserData);
    
    // 验证失败
    let err;
    try {
      await duplicateUser.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // MongoDB 重复键错误代码
  });
  
  it('应该正确设置默认值', async () => {
    const user = new User({
      username: 'testuser3',
      password: 'password123'
    });
    
    await user.save();
    
    // 验证默认值
    expect(user.gender).toBe('unknown');
    expect(user.totalHabits).toBe(0);
    expect(user.completedCheckins).toBe(0);
    expect(user.currentStreak).toBe(0);
    expect(user.longestStreak).toBe(0);
    expect(user.isActive).toBe(true);
    expect(user.role).toBe('user');
    expect(user.settings.theme).toBe('system');
    expect(user.settings.notifications.enabled).toBe(true);
    expect(user.settings.privacy.shareData).toBe(true);
  });
}); 
