/**
 * 成就服务
 * 用于管理成就解锁和通知
 */

import { getStorage, setStorage } from './storage';

// 成就类型定义
export interface IAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  isCompleted: boolean;
  completedAt?: string;
  reward?: string;
}

// 里程碑类型定义
export interface IMilestone {
  title: string;
  description: string;
  value: number;
  isCompleted: boolean;
}

// 相关习惯类型定义
export interface IRelatedHabit {
  id: string;
  name: string;
  category: string;
  icon: string;
  color: string;
}

// 成就解锁条件类型
export type AchievementCondition = {
  type: 'streak' | 'count' | 'duration';
  habitId?: string;
  category?: string;
  value: number;
};

// 成就解锁回调类型
export type AchievementUnlockCallback = (achievement: IAchievement) => void;

class AchievementService {
  private achievements: IAchievement[] = [];
  private unlockCallbacks: AchievementUnlockCallback[] = [];
  private storageKey = 'achievements';
  
  /**
   * 初始化成就服务
   */
  async init() {
    await this.loadAchievements();
  }
  
  /**
   * 加载成就数据
   */
  private async loadAchievements() {
    try {
      const achievements = getStorage<IAchievement[]>(this.storageKey, []);
      
      if (achievements && achievements.length > 0) {
        this.achievements = achievements;
      } else {
        // 初始化默认成就
        this.achievements = this.getDefaultAchievements();
        await this.saveAchievements();
      }
    } catch (error) {
      console.error('加载成就数据失败:', error);
      this.achievements = this.getDefaultAchievements();
    }
  }
  
  /**
   * 保存成就数据
   */
  private async saveAchievements() {
    try {
      setStorage(this.storageKey, this.achievements);
    } catch (error) {
      console.error('保存成就数据失败:', error);
    }
  }
  
  /**
   * 获取默认成就列表
   */
  private getDefaultAchievements(): IAchievement[] {
    return [
      {
        id: 'achievement-1',
        title: '习惯养成者',
        description: '连续完成一个习惯30天',
        icon: 'medal',
        progress: 0,
        isCompleted: false
      },
      {
        id: 'achievement-2',
        title: '早起达人',
        description: '连续7天在7点前打卡"早起"习惯',
        icon: 'sun',
        progress: 0,
        isCompleted: false
      },
      {
        id: 'achievement-3',
        title: '阅读专家',
        description: '累计阅读时间达到100小时',
        icon: 'book',
        progress: 0,
        isCompleted: false
      },
      {
        id: 'achievement-4',
        title: '运动健将',
        description: '累计运动时间达到50小时',
        icon: 'run',
        progress: 0,
        isCompleted: false
      },
      {
        id: 'achievement-5',
        title: '社交达人',
        description: '在社区获得100个点赞',
        icon: 'like',
        progress: 0,
        isCompleted: false
      }
    ];
  }
  
  /**
   * 获取所有成就
   */
  async getAllAchievements(): Promise<IAchievement[]> {
    if (this.achievements.length === 0) {
      await this.loadAchievements();
    }
    
    return [...this.achievements];
  }
  
  /**
   * 获取已完成的成就
   */
  async getCompletedAchievements(): Promise<IAchievement[]> {
    const achievements = await this.getAllAchievements();
    return achievements.filter(a => a.isCompleted);
  }
  
  /**
   * 获取进行中的成就
   */
  async getInProgressAchievements(): Promise<IAchievement[]> {
    const achievements = await this.getAllAchievements();
    return achievements.filter(a => !a.isCompleted);
  }
  
  /**
   * 获取成就详情
   * @param achievementId 成就ID
   */
  async getAchievementById(achievementId: string): Promise<IAchievement | null> {
    const achievements = await this.getAllAchievements();
    return achievements.find(a => a.id === achievementId) || null;
  }
  
  /**
   * 获取成就里程碑
   * @param achievementId 成就ID
   */
  async getMilestones(achievementId: string): Promise<IMilestone[]> {
    // 这里应该根据成就ID获取对应的里程碑
    // 这里仅作为示例，实际应该从服务器或本地存储获取
    
    const achievement = await this.getAchievementById(achievementId);
    
    if (!achievement) {
      return [];
    }
    
    switch (achievementId) {
      case 'achievement-1': // 习惯养成者
        return [
          { title: '第一步', description: '连续完成习惯7天', value: 7, isCompleted: achievement.progress >= 23 },
          { title: '坚持不懈', description: '连续完成习惯15天', value: 15, isCompleted: achievement.progress >= 50 },
          { title: '习惯养成', description: '连续完成习惯30天', value: 30, isCompleted: achievement.progress >= 100 }
        ];
      case 'achievement-2': // 早起达人
        return [
          { title: '起步', description: '连续3天早起', value: 3, isCompleted: achievement.progress >= 43 },
          { title: '习惯养成', description: '连续7天早起', value: 7, isCompleted: achievement.progress >= 100 }
        ];
      case 'achievement-3': // 阅读专家
        return [
          { title: '阅读入门', description: '累计阅读25小时', value: 25, isCompleted: achievement.progress >= 25 },
          { title: '阅读进阶', description: '累计阅读50小时', value: 50, isCompleted: achievement.progress >= 50 },
          { title: '阅读专家', description: '累计阅读100小时', value: 100, isCompleted: achievement.progress >= 100 }
        ];
      default:
        return [];
    }
  }
  
  /**
   * 获取相关习惯
   * @param achievementId 成就ID
   */
  async getRelatedHabits(achievementId: string): Promise<IRelatedHabit[]> {
    // 这里应该根据成就ID获取对应的相关习惯
    // 这里仅作为示例，实际应该从服务器或本地存储获取
    
    switch (achievementId) {
      case 'achievement-1': // 习惯养成者
        return [
          { id: 'habit-1', name: '每日冥想', category: '心理健康', icon: 'meditation', color: '#4F7CFF' }
        ];
      case 'achievement-2': // 早起达人
        return [
          { id: 'habit-2', name: '早起', category: '作息', icon: 'sun', color: '#E6A23C' }
        ];
      case 'achievement-3': // 阅读专家
        return [
          { id: 'habit-3', name: '阅读', category: '学习', icon: 'book', color: '#67C23A' }
        ];
      case 'achievement-4': // 运动健将
        return [
          { id: 'habit-4', name: '跑步', category: '运动', icon: 'run', color: '#F56C6C' },
          { id: 'habit-5', name: '健身', category: '运动', icon: 'dumbbell', color: '#909399' }
        ];
      default:
        return [];
    }
  }
  
  /**
   * 更新成就进度
   * @param condition 成就条件
   * @param value 进度值
   */
  async updateProgress(condition: AchievementCondition, value: number) {
    let updatedAchievements: IAchievement[] = [];
    
    // 根据条件更新对应成就的进度
    switch (condition.type) {
      case 'streak':
        // 更新连续打卡相关的成就
        updatedAchievements = await this.updateStreakAchievements(condition, value);
        break;
      case 'count':
        // 更新计数相关的成就
        updatedAchievements = await this.updateCountAchievements(condition, value);
        break;
      case 'duration':
        // 更新时长相关的成就
        updatedAchievements = await this.updateDurationAchievements(condition, value);
        break;
    }
    
    // 保存更新后的成就
    if (updatedAchievements.length > 0) {
      await this.saveAchievements();
      
      // 触发成就解锁回调
      updatedAchievements.forEach(achievement => {
        if (achievement.isCompleted) {
          this.triggerUnlockCallbacks(achievement);
        }
      });
    }
    
    return updatedAchievements;
  }
  
  /**
   * 更新连续打卡相关的成就
   */
  private async updateStreakAchievements(condition: AchievementCondition, value: number): Promise<IAchievement[]> {
    const updatedAchievements: IAchievement[] = [];
    
    // 根据习惯ID或分类更新对应的成就
    if (condition.habitId === 'habit-1') {
      // 习惯养成者成就
      const achievement = this.achievements.find(a => a.id === 'achievement-1');
      
      if (achievement && !achievement.isCompleted) {
        const progress = Math.min(Math.round((value / 30) * 100), 100);
        
        achievement.progress = progress;
        
        if (progress >= 100 && !achievement.isCompleted) {
          achievement.isCompleted = true;
          achievement.completedAt = new Date().toISOString().split('T')[0];
        }
        
        updatedAchievements.push(achievement);
      }
    } else if (condition.habitId === 'habit-2') {
      // 早起达人成就
      const achievement = this.achievements.find(a => a.id === 'achievement-2');
      
      if (achievement && !achievement.isCompleted) {
        const progress = Math.min(Math.round((value / 7) * 100), 100);
        
        achievement.progress = progress;
        
        if (progress >= 100 && !achievement.isCompleted) {
          achievement.isCompleted = true;
          achievement.completedAt = new Date().toISOString().split('T')[0];
        }
        
        updatedAchievements.push(achievement);
      }
    }
    
    return updatedAchievements;
  }
  
  /**
   * 更新计数相关的成就
   */
  private async updateCountAchievements(condition: AchievementCondition, value: number): Promise<IAchievement[]> {
    const updatedAchievements: IAchievement[] = [];
    
    // 社交达人成就
    if (condition.type === 'count' && condition.category === 'social') {
      const achievement = this.achievements.find(a => a.id === 'achievement-5');
      
      if (achievement && !achievement.isCompleted) {
        const progress = Math.min(Math.round((value / 100) * 100), 100);
        
        achievement.progress = progress;
        
        if (progress >= 100 && !achievement.isCompleted) {
          achievement.isCompleted = true;
          achievement.completedAt = new Date().toISOString().split('T')[0];
        }
        
        updatedAchievements.push(achievement);
      }
    }
    
    return updatedAchievements;
  }
  
  /**
   * 更新时长相关的成就
   */
  private async updateDurationAchievements(condition: AchievementCondition, value: number): Promise<IAchievement[]> {
    const updatedAchievements: IAchievement[] = [];
    
    if (condition.habitId === 'habit-3') {
      // 阅读专家成就
      const achievement = this.achievements.find(a => a.id === 'achievement-3');
      
      if (achievement && !achievement.isCompleted) {
        const progress = Math.min(Math.round((value / 100) * 100), 100);
        
        achievement.progress = progress;
        
        if (progress >= 100 && !achievement.isCompleted) {
          achievement.isCompleted = true;
          achievement.completedAt = new Date().toISOString().split('T')[0];
        }
        
        updatedAchievements.push(achievement);
      }
    } else if (condition.category === 'exercise') {
      // 运动健将成就
      const achievement = this.achievements.find(a => a.id === 'achievement-4');
      
      if (achievement && !achievement.isCompleted) {
        const progress = Math.min(Math.round((value / 50) * 100), 100);
        
        achievement.progress = progress;
        
        if (progress >= 100 && !achievement.isCompleted) {
          achievement.isCompleted = true;
          achievement.completedAt = new Date().toISOString().split('T')[0];
        }
        
        updatedAchievements.push(achievement);
      }
    }
    
    return updatedAchievements;
  }
  
  /**
   * 注册成就解锁回调
   * @param callback 回调函数
   */
  onAchievementUnlock(callback: AchievementUnlockCallback) {
    this.unlockCallbacks.push(callback);
  }
  
  /**
   * 取消注册成就解锁回调
   * @param callback 回调函数
   */
  offAchievementUnlock(callback: AchievementUnlockCallback) {
    const index = this.unlockCallbacks.indexOf(callback);
    
    if (index !== -1) {
      this.unlockCallbacks.splice(index, 1);
    }
  }
  
  /**
   * 触发成就解锁回调
   * @param achievement 解锁的成就
   */
  private triggerUnlockCallbacks(achievement: IAchievement) {
    console.log('触发成就解锁回调，回调数量:', this.unlockCallbacks.length, '成就:', achievement);
    
    if (this.unlockCallbacks.length === 0) {
      // 如果没有注册回调，直接使用全局App实例显示通知
      const app = getApp();
      if (app && app.onAchievementUnlocked) {
        console.log('通过App实例直接触发成就解锁通知');
        app.onAchievementUnlocked(achievement);
      } else {
        console.error('App实例不存在或没有onAchievementUnlocked方法');
      }
    }
    
    this.unlockCallbacks.forEach(callback => {
      try {
        console.log('执行成就解锁回调');
        callback(achievement);
      } catch (error) {
        console.error('成就解锁回调执行失败:', error);
      }
    });
  }
  
  /**
   * 更新成就
   * @param achievement 要更新的成就
   */
  async updateAchievement(achievement: IAchievement): Promise<boolean> {
    try {
      // 查找成就
      const index = this.achievements.findIndex(a => a.id === achievement.id);
      
      if (index === -1) {
        return false;
      }
      
      // 获取旧成就状态
      const oldAchievement = this.achievements[index];
      const wasCompleted = oldAchievement.isCompleted;
      
      // 更新成就
      this.achievements[index] = achievement;
      
      // 保存更新
      await this.saveAchievements();
      
      // 如果成就从未完成变为已完成，触发解锁回调
      if (!wasCompleted && achievement.isCompleted) {
        this.triggerUnlockCallbacks(achievement);
      }
      
      return true;
    } catch (error) {
      console.error('更新成就失败:', error);
      return false;
    }
  }
}

export const achievementService = new AchievementService(); 
