/**
 * 认证API测试
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/user.model');

// 测试用户数据
const testUser = {
  username: 'testuser',
  password: 'testpassword',
  nickname: '测试用户'
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
  await User.deleteMany({ username: testUser.username });
  await mongoose.connection.close();
});

// 在每个测试开始前清理测试数据
beforeEach(async () => {
  await User.deleteMany({ username: testUser.username });
});

describe('认证API', () => {
  // 测试用户注册
  describe('POST /api/auth/register', () => {
    it('应该成功注册用户', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);
      
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('注册成功');
      expect(res.body.data.user.username).toBe(testUser.username);
      expect(res.body.data.user.nickname).toBe(testUser.nickname);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });
    
    it('应该拒绝注册已存在的用户名', async () => {
      // 先创建用户
      await User.create(testUser);
      
      // 尝试注册同名用户
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);
      
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('用户名已被使用');
    });
    
    it('应该验证用户名和密码', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'te',
          password: 'test'
        })
        .expect(400);
      
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });
  
  // 测试用户登录
  describe('POST /api/auth/login', () => {
    it('应该成功登录用户', async () => {
      // 先创建用户
      await User.create(testUser);
      
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('登录成功');
      expect(res.body.data.user.username).toBe(testUser.username);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });
    
    it('应该拒绝错误的密码', async () => {
      // 先创建用户
      await User.create(testUser);
      
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword'
        })
        .expect(401);
      
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('用户名或密码错误');
    });
    
    it('应该拒绝不存在的用户', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'testpassword'
        })
        .expect(401);
      
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('用户名或密码错误');
    });
  });
  
  // 测试刷新令牌
  describe('POST /api/auth/refresh-token', () => {
    it('应该成功刷新访问令牌', async () => {
      // 先创建用户并登录获取令牌
      await User.create(testUser);
      
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        });
      
      const refreshToken = loginRes.body.data.refreshToken;
      
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('令牌刷新成功');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });
    
    it('应该拒绝无效的刷新令牌', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalidtoken' })
        .expect(401);
      
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('刷新令牌无效或已过期');
    });
  });
}); 
