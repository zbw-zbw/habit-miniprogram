/**
 * 测试工具
 * 用于全面测试系统功能
 */
import { habitAPI, checkinAPI, userAPI, communityAPI } from '../services/api';
import { formatDate } from './date';

/**
 * 测试管理器
 */
export class TestManager {
  /**
   * 测试API服务可用性
   */
  static async testAPIAvailability(): Promise<boolean> {
    try {
      // 尝试获取习惯列表
      await habitAPI.getHabits();
      console.log('✅ API服务可用');
      return true;
    } catch (error) {
      console.error('❌ API服务不可用:', error);
      return false;
    }
  }

  /**
   * 测试数据流程
   */
  static async testDataFlow(): Promise<void> {
    console.log('开始测试数据流程...');
    
    try {
      // 1. 创建一个测试习惯
      console.log('1. 创建测试习惯');
      const habitData = {
        name: '测试习惯' + Date.now(),
        description: '用于测试的习惯',
        category: 'test',
        icon: 'test',
        color: '#4F7CFF',
        frequency: {
          type: 'daily' as const
        },
        reminder: {
          enabled: false,
          time: '08:00'
        },
        isArchived: false,
        startDate: formatDate(new Date())
      };
      
      const habit = await habitAPI.createHabit(habitData);
      console.log('✅ 习惯创建成功:', habit);
      
      // 2. 创建一个测试打卡
      console.log('2. 创建测试打卡');
      const checkinData = {
        habitId: habit.id,
        date: formatDate(new Date()),
        isCompleted: true,
        note: '测试打卡',
        time: new Date().toTimeString().substring(0, 5)
      };
      
      const checkin = await checkinAPI.createCheckin(checkinData);
      console.log('✅ 打卡创建成功:', checkin);
      
      // 3. 获取习惯统计
      console.log('3. 获取习惯统计');
      const stats = await habitAPI.getHabitStats(habit.id);
      console.log('✅ 习惯统计获取成功:', stats);
      
      // 4. 更新习惯
      console.log('4. 更新习惯');
      const updatedHabitData = {
        ...habitData,
        name: habitData.name + ' (已更新)',
        description: habitData.description + ' (已更新)'
      };
      
      const updatedHabit = await habitAPI.updateHabit(habit.id, updatedHabitData);
      console.log('✅ 习惯更新成功:', updatedHabit);
      
      // 5. 归档习惯
      console.log('5. 归档习惯');
      const archivedHabit = await habitAPI.updateHabit(habit.id, {
        isArchived: true
      });
      console.log('✅ 习惯归档成功:', archivedHabit);
      
      // 6. 获取习惯列表
      console.log('6. 获取习惯列表');
      const habits = await habitAPI.getHabits();
      console.log('✅ 习惯列表获取成功, 数量:', habits.length);
      
      // 7. 删除测试习惯
      console.log('7. 删除测试习惯');
      const deleteResult = await habitAPI.deleteHabit(habit.id);
      console.log('✅ 习惯删除成功:', deleteResult);
      
      console.log('✅ 数据流程测试完成');
    } catch (error) {
      console.error('❌ 数据流程测试失败:', error);
    }
  }

  /**
   * 测试离线功能
   */
  static testOfflineFeatures(): void {
    console.log('开始测试离线功能...');
    
    try {
      // 测试本地存储
      console.log('1. 测试本地存储');
      wx.setStorageSync('testKey', { value: 'testValue', timestamp: Date.now() });
      const storedValue = wx.getStorageSync('testKey');
      
      if (storedValue && storedValue.value === 'testValue') {
        console.log('✅ 本地存储测试成功');
      } else {
        console.error('❌ 本地存储测试失败');
      }
      
      // 清理测试数据
      wx.removeStorageSync('testKey');
      
      console.log('✅ 离线功能测试完成');
    } catch (error) {
      console.error('❌ 离线功能测试失败:', error);
    }
  }

  /**
   * 测试同步管理器
   */
  static testSyncManager(): void {
    console.log('开始测试同步管理器...');
    
    try {
      // 创建一个测试打卡记录
      const testCheckin = {
        habitId: 'test-habit-id',
        date: formatDate(new Date()),
        isCompleted: true,
        note: '测试离线打卡',
        pendingSync: true,
        createdAt: new Date().toISOString()
      };
      
      // 保存到待同步列表
      const pendingCheckins = wx.getStorageSync('pendingCheckins') || [];
      pendingCheckins.push(testCheckin);
      wx.setStorageSync('pendingCheckins', pendingCheckins);
      
      console.log('✅ 测试打卡已添加到待同步列表');
      
      // 导入同步管理器
      const SyncManager = require('./sync-manager').SyncManager;
      
      // 测试同步功能
      SyncManager.syncPendingCheckins()
        .then(hasMoreData => {
          console.log('✅ 同步功能测试完成, 是否还有待同步数据:', hasMoreData);
        })
        .catch(error => {
          console.error('❌ 同步功能测试失败:', error);
        });
      
      console.log('✅ 同步管理器测试完成');
    } catch (error) {
      console.error('❌ 同步管理器测试失败:', error);
    }
  }

  /**
   * 运行所有测试
   */
  static async runAllTests(): Promise<void> {
    console.log('=== 开始全面系统测试 ===');
    
    // 测试API可用性
    const apiAvailable = await this.testAPIAvailability();
    
    // 如果API可用，测试数据流程
    if (apiAvailable) {
      await this.testDataFlow();
    }
    
    // 测试离线功能
    this.testOfflineFeatures();
    
    // 测试同步管理器
    this.testSyncManager();
    
    console.log('=== 全面系统测试完成 ===');
  }
} 
