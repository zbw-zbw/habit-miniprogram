/**
 * 数据流转集成测试
 * 测试从用户创建习惯、打卡记录到数据统计的完整流程
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/user.model');
const Habit = require('../../models/habit.model');
const Checkin = require('../../models/checkin.model');

// 测试数据
let testUser;
let accessToken;
let habitId;
let checkinId;

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
  // 清理测试数据
  if (testUser) {
    await User.deleteOne({ _id: testUser._id });
  }
  if (habitId) {
    await Habit.deleteOne({ _id: habitId });
  }
  if (checkinId) {
    await Checkin.deleteOne({ _id: checkinId });
  }
  
  await mongoose.connection.close();
});

describe('数据流转测试', () => {
  // 步骤1: 用户注册
  it('步骤1: 用户注册', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: `testuser_${Date.now()}`,
        password: 'password123',
        nickname: '数据流转测试用户'
      })
      .expect(201);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.accessToken).toBeDefined();
    
    // 保存用户信息和令牌
    testUser = res.body.data.user;
    accessToken = res.body.data.accessToken;
  });
  
  // 步骤2: 创建习惯
  it('步骤2: 创建习惯', async () => {
    const habitData = {
      name: '测试习惯',
      description: '用于测试数据流转的习惯',
      category: '测试',
      frequency: {
        type: 'daily'
      },
      reminder: {
        enabled: false
      },
      color: '#5E72E4',
      icon: 'star'
    };
    
    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(habitData)
      .expect(201);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.name).toBe(habitData.name);
    expect(res.body.data.userId).toBe(testUser._id);
    
    // 保存习惯ID
    habitId = res.body.data._id;
  });
  
  // 步骤3: 创建打卡记录
  it('步骤3: 创建打卡记录', async () => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const checkinData = {
      habitId,
      date: formattedDate,
      isCompleted: true,
      content: '测试打卡记录',
      note: '用于测试数据流转',
      duration: '00:30:00',
      mood: 'happy'
    };
    
    const res = await request(app)
      .post('/api/checkins')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(checkinData)
      .expect(201);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.habitId).toBe(habitId);
    expect(res.body.data.userId).toBe(testUser._id);
    expect(res.body.data.isCompleted).toBe(true);
    
    // 保存打卡记录ID
    checkinId = res.body.data._id;
  });
  
  // 步骤4: 验证习惯统计数据
  it('步骤4: 验证习惯统计数据', async () => {
    const res = await request(app)
      .get(`/api/habits/${habitId}/stats`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.totalCompletions).toBe(1);
    expect(res.body.data.currentStreak).toBe(1);
    expect(res.body.data.completionRate).toBeGreaterThan(0);
  });
  
  // 步骤5: 验证用户统计数据
  it('步骤5: 验证用户统计数据', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.totalHabits).toBe(1);
    expect(res.body.data.completedCheckins).toBeGreaterThanOrEqual(1);
    expect(res.body.data.currentStreak).toBeGreaterThanOrEqual(1);
  });
  
  // 步骤6: 创建多个打卡记录并验证趋势数据
  it('步骤6: 创建过去几天的打卡记录并验证趋势数据', async () => {
    // 创建过去3天的打卡记录
    const today = new Date();
    
    for (let i = 1; i <= 3; i++) {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - i);
      const formattedDate = pastDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const checkinData = {
        habitId,
        date: formattedDate,
        isCompleted: true,
        content: `测试过去第${i}天的打卡记录`,
        duration: '00:30:00'
      };
      
      await request(app)
        .post('/api/checkins')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(checkinData)
        .expect(201);
    }
    
    // 验证趋势数据
    const res = await request(app)
      .get('/api/analytics/trends')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ period: 'week' })
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.completions).toBeDefined();
    expect(res.body.data.completions.length).toBeGreaterThan(0);
    
    // 检查总完成次数是否至少为4（今天1次+过去3天）
    const totalCompletions = res.body.data.completions.reduce(
      (sum, day) => sum + day.count, 0
    );
    expect(totalCompletions).toBeGreaterThanOrEqual(4);
  });
}); 
