/**
 * 习惯卡片专用API模块
 * 用于解决习惯卡片数据获取问题
 */
import { get } from '../utils/request';
import { habitAPI, checkinAPI } from './api';
import { getCurrentDate } from '../utils/date';

/**
 * 为习惯卡片获取完整数据
 * @param habitId 习惯ID
 * @returns 包含习惯信息、统计数据和今日打卡状态的对象
 */
export const getHabitCardData = async (habitId: string) => {
  try {
    // 记录开始时间
    const startTime = Date.now();
    console.log(`开始获取习惯[${habitId}]数据...`);
    
    // 并行获取习惯详情、统计数据和今日打卡记录
    const [habit, stats, todayCheckins] = await Promise.all([
      habitAPI.getHabit(habitId),
      habitAPI.getHabitStats(habitId),
      checkinAPI.getCheckins({
        habitId,
        startDate: getCurrentDate(),
        endDate: getCurrentDate()
      })
    ]);
    
    // 检查今日是否已完成
    const isCompletedToday = todayCheckins.some(c => c.isCompleted);
    
    // 如果今日已完成，更新最后完成日期，但保留原始完成率
    if (isCompletedToday) {
      stats.lastCompletedDate = getCurrentDate();
      // 不再强制设置completionRate为100%
    }
    
    // 返回完整数据
    const result = {
      habit,
      stats,
      isCompletedToday
    };
    
    // 记录完成时间
    const endTime = Date.now();
    console.log(`习惯[${habitId}]数据获取完成，耗时: ${endTime - startTime}ms`);
    console.log('习惯详情:', habit);
    console.log('统计数据:', stats);
    console.log('今日打卡状态:', isCompletedToday);
    
    return result;
  } catch (error) {
    console.error(`获取习惯[${habitId}]数据失败:`, error);
    throw error;
  }
};

/**
 * 获取全部习惯卡片数据
 * @returns 包含所有习惯及其统计数据的数组
 */
export const getAllHabitCardsData = async () => {
  try {
    // 记录开始时间
    const startTime = Date.now();
    console.log('开始获取所有习惯卡片数据...');
    
    // 获取所有习惯
    const habits = await habitAPI.getHabits();
    console.log(`获取到${habits.length}个习惯`);
    
    // 获取今日日期
    const today = getCurrentDate();
    
    // 获取今日所有打卡记录
    const todayCheckins = await checkinAPI.getCheckins({
      startDate: today,
      endDate: today
    });
    console.log(`获取到${todayCheckins.length}条今日打卡记录`);
    
    // 创建已完成习惯ID的集合
    const completedHabitIds = new Set();
    todayCheckins.forEach(checkin => {
      if (checkin.isCompleted) {
        // 兼容不同格式的打卡记录
        const habitId = (checkin as any).habit || checkin.habitId;
        if (habitId) {
          completedHabitIds.add(habitId);
        }
      }
    });
    console.log('今日已完成习惯IDs:', [...completedHabitIds]);
    
    // 为每个习惯获取统计数据
    const habitsWithStats = await Promise.all(
      habits.map(async (habit) => {
        const habitId = habit._id;
        if (!habitId) return null;
        
        try {
          // 获取习惯统计数据
          const stats = await habitAPI.getHabitStats(habitId);
          
          // 检查是否今日已完成
          const isCompletedToday = completedHabitIds.has(habitId);
          
          // 如果今日已完成，更新最后完成日期，但保留原始完成率
          if (isCompletedToday) {
            stats.lastCompletedDate = today;
            // 不再强制设置completionRate为100%
          }
          
          return {
            habit,
            stats,
            isCompletedToday
          };
        } catch (error) {
          console.error(`获取习惯[${habitId}]统计数据失败:`, error);
          return null;
        }
      })
    );
    
    // 过滤掉null值
    const validHabitsWithStats = habitsWithStats.filter(Boolean);
    
    // 记录完成时间
    const endTime = Date.now();
    console.log(`所有习惯卡片数据获取完成，耗时: ${endTime - startTime}ms`);
    
    return validHabitsWithStats;
  } catch (error) {
    console.error('获取所有习惯卡片数据失败:', error);
    throw error;
  }
}; 
