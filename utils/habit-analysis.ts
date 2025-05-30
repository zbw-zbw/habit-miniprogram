/**
 * 习惯分析工具函数
 * 提供高级习惯分析和科学建议
 */

// 使用工具函数
import { calculateStreak, calculateCompletionRate } from './habit';
import { getDayOfWeek, formatDate, getCurrentDate, daysBetween } from './date';

// 类型定义已在全局 typings/index.d.ts 中定义，无需导入

// 扩展打卡记录接口，添加时间字段
interface ICheckinWithTime extends ICheckin {
  time?: string; // 打卡时间，HH:MM 格式
}

/**
 * 分析习惯表现水平
 * @param completionRate 完成率
 * @returns 表现水平 'excellent' | 'good' | 'average' | 'needsImprovement'
 */
export function analyzePerformanceLevel(completionRate: number): string {
  if (completionRate >= 90) {
    return 'excellent';
  } else if (completionRate >= 70) {
    return 'good';
  } else if (completionRate >= 50) {
    return 'average';
  } else {
    return 'needsImprovement';
  }
}

/**
 * 分析习惯最佳时段
 * @param habit 习惯对象
 * @param checkins 打卡记录
 * @returns 最佳时段分析
 */
export function analyzeBestPeriods(habit: IHabit, checkins: ICheckin[]): any {
  const completedCheckins = checkins.filter(c => c.isCompleted);
  
  // 按星期几分组
  const dayPerformance = [0, 0, 0, 0, 0, 0, 0]; // 周日到周六
  const dayCompletions = [0, 0, 0, 0, 0, 0, 0]; // 周日到周六的完成次数
  const dayTotals = [0, 0, 0, 0, 0, 0, 0]; // 周日到周六的总次数
  
  // 统计每天的表现
  completedCheckins.forEach(checkin => {
    const date = new Date(checkin.date);
    const day = date.getDay(); // 0-6，周日到周六
    dayCompletions[day]++;
  });
  
  // 计算每天应该完成的总次数
  const startDate = new Date(habit.startDate);
  const today = new Date();
  
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const day = d.getDay(); // 0-6，周日到周六
    
    // 检查这一天是否需要执行习惯
    const dateStr = formatDate(d);
    if (shouldDoHabitOnDate(habit, dateStr)) {
      dayTotals[day]++;
    }
  }
  
  // 计算每天的完成率
  for (let i = 0; i < 7; i++) {
    dayPerformance[i] = dayTotals[i] > 0 ? (dayCompletions[i] / dayTotals[i]) * 100 : 0;
  }
  
  // 找出最佳和最差的日期
  const bestDayIndex = dayPerformance.indexOf(Math.max(...dayPerformance.filter(p => dayTotals[dayPerformance.indexOf(p)] > 0)));
  const worstDayIndex = dayPerformance.indexOf(Math.min(...dayPerformance.filter(p => p > 0 && dayTotals[dayPerformance.indexOf(p)] > 0)));
  
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  
  return {
    bestDay: {
      day: dayNames[bestDayIndex],
      rate: dayPerformance[bestDayIndex].toFixed(1),
      index: bestDayIndex
    },
    worstDay: {
      day: dayNames[worstDayIndex],
      rate: dayPerformance[worstDayIndex].toFixed(1),
      index: worstDayIndex
    },
    dayPerformance: dayPerformance.map(p => parseFloat(p.toFixed(1))),
    dayNames
  };
}

/**
 * 分析习惯模式
 * @param habit 习惯对象
 * @param checkins 打卡记录
 * @returns 习惯模式分析
 */
export function analyzeHabitPatterns(habit: IHabit, checkins: ICheckin[]): any {
  const completedCheckins = checkins.filter(c => c.isCompleted);
  
  // 按时间排序
  const sortedCheckins = [...completedCheckins].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // 分析连续性
  const streakData = analyzeStreaks(sortedCheckins);
  
  // 分析周期性
  const periodicityData = analyzePeriodicity(sortedCheckins);
  
  // 分析时间分布
  const timeDistribution = analyzeTimeDistribution(completedCheckins);
  
  return {
    streaks: streakData,
    periodicity: periodicityData,
    timeDistribution
  };
}

/**
 * 分析连续性
 * @param sortedCheckins 按时间排序的打卡记录
 * @returns 连续性分析
 */
function analyzeStreaks(sortedCheckins: ICheckin[]): any {
  if (sortedCheckins.length === 0) {
    return {
      longestStreak: 0,
      averageStreak: 0,
      streakDistribution: []
    };
  }
  
  let currentStreak = 1;
  let longestStreak = 1;
  let streakStart = sortedCheckins[0].date;
  let streakEnd = sortedCheckins[0].date;
  let longestStreakStart = streakStart;
  let longestStreakEnd = streakEnd;
  
  const streaks = [];
  
  for (let i = 1; i < sortedCheckins.length; i++) {
    const prevDate = new Date(sortedCheckins[i-1].date);
    const currDate = new Date(sortedCheckins[i].date);
    
    // 检查是否为连续日期
    const dayDiff = daysBetween(prevDate, currDate);
    
    if (dayDiff === 1) {
      // 连续
      currentStreak++;
      streakEnd = sortedCheckins[i].date;
    } else {
      // 不连续，记录当前连续记录
      streaks.push({
        length: currentStreak,
        start: streakStart,
        end: streakEnd
      });
      
      // 更新最长连续记录
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
        longestStreakStart = streakStart;
        longestStreakEnd = streakEnd;
      }
      
      // 重置
      currentStreak = 1;
      streakStart = sortedCheckins[i].date;
      streakEnd = sortedCheckins[i].date;
    }
  }
  
  // 处理最后一个连续记录
  streaks.push({
    length: currentStreak,
    start: streakStart,
    end: streakEnd
  });
  
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
    longestStreakStart = streakStart;
    longestStreakEnd = streakEnd;
  }
  
  // 计算平均连续长度
  const averageStreak = streaks.reduce((sum, streak) => sum + streak.length, 0) / streaks.length;
  
  // 连续长度分布
  const streakDistribution = [0, 0, 0, 0, 0]; // 1天, 2-3天, 4-7天, 8-14天, 15+天
  
  streaks.forEach(streak => {
    if (streak.length === 1) {
      streakDistribution[0]++;
    } else if (streak.length <= 3) {
      streakDistribution[1]++;
    } else if (streak.length <= 7) {
      streakDistribution[2]++;
    } else if (streak.length <= 14) {
      streakDistribution[3]++;
    } else {
      streakDistribution[4]++;
    }
  });
  
  return {
    longestStreak,
    longestStreakStart,
    longestStreakEnd,
    averageStreak: parseFloat(averageStreak.toFixed(1)),
    streakDistribution,
    streaks
  };
}

/**
 * 分析周期性
 * @param sortedCheckins 按时间排序的打卡记录
 * @returns 周期性分析
 */
function analyzePeriodicity(sortedCheckins: ICheckin[]): any {
  if (sortedCheckins.length < 7) {
    return {
      hasPattern: false,
      confidence: 0,
      pattern: null
    };
  }
  
  // 分析每周模式
  const weekdayPattern = [0, 0, 0, 0, 0, 0, 0]; // 周日到周六
  
  sortedCheckins.forEach(checkin => {
    const date = new Date(checkin.date);
    const day = date.getDay();
    weekdayPattern[day]++;
  });
  
  // 计算每天的比例
  const total = weekdayPattern.reduce((sum, count) => sum + count, 0);
  const weekdayRatios = weekdayPattern.map(count => (count / total) * 100);
  
  // 检测是否有明显的周期性模式
  const threshold = 20; // 比例阈值
  const highDays = weekdayRatios.filter(ratio => ratio > threshold);
  const hasPattern = highDays.length > 0 && highDays.length < 5;
  
  // 计算置信度
  const stdDev = calculateStandardDeviation(weekdayRatios);
  const confidence = Math.min(100, stdDev * 5); // 标准差越大，模式越明显
  
  return {
    hasPattern,
    confidence: parseFloat(confidence.toFixed(1)),
    weekdayPattern: weekdayRatios.map(ratio => parseFloat(ratio.toFixed(1))),
    dominantDays: weekdayRatios
      .map((ratio, index) => ({ ratio, index }))
      .filter(item => item.ratio > threshold)
      .map(item => item.index)
  };
}

/**
 * 分析时间分布
 * @param checkins 打卡记录
 * @returns 时间分布分析
 */
function analyzeTimeDistribution(checkins: ICheckinWithTime[]): any {
  const timeSlots = [0, 0, 0, 0]; // 早晨(5-11), 下午(12-17), 晚上(18-22), 深夜(23-4)
  
  checkins.forEach(checkin => {
    if (!checkin.time) return;
    
    const [hour] = checkin.time.split(':').map(Number);
    
    if (hour >= 5 && hour < 12) {
      timeSlots[0]++;
    } else if (hour >= 12 && hour < 18) {
      timeSlots[1]++;
    } else if (hour >= 18 && hour < 23) {
      timeSlots[2]++;
    } else {
      timeSlots[3]++;
    }
  });
  
  const total = timeSlots.reduce((sum, count) => sum + count, 0);
  if (total === 0) return null;
  
  const timeDistribution = timeSlots.map(count => (count / total) * 100);
  
  const timeNames = ['早晨', '下午', '晚上', '深夜'];
  const bestTimeIndex = timeDistribution.indexOf(Math.max(...timeDistribution));
  
  return {
    distribution: timeDistribution.map(ratio => parseFloat(ratio.toFixed(1))),
    bestTime: {
      name: timeNames[bestTimeIndex],
      ratio: timeDistribution[bestTimeIndex].toFixed(1)
    },
    timeNames
  };
}

/**
 * 生成科学建议
 * @param habit 习惯对象
 * @param analysisResults 分析结果
 * @returns 科学建议
 */
export function generateRecommendations(habit: IHabit, analysisResults: any): any[] {
  const recommendations = [];
  
  // 基于表现水平的建议
  if (analysisResults.performanceLevel === 'needsImprovement') {
    recommendations.push({
      type: 'improvement',
      title: '习惯养成挑战',
      description: '你的习惯完成率较低，建议设置更小的目标，逐步提高难度。',
      actionText: '调整目标',
      actionType: 'adjustGoal'
    });
  }
  
  // 基于最佳时段的建议
  if (analysisResults.bestPeriods && analysisResults.bestPeriods.bestDay) {
    recommendations.push({
      type: 'timing',
      title: '最佳执行时间',
      description: `你在${analysisResults.bestPeriods.bestDay.day}的完成率最高，建议将重要习惯安排在这一天。`,
      actionText: '查看详情',
      actionType: 'viewBestTimes'
    });
  }
  
  // 基于习惯模式的建议
  if (analysisResults.patterns && analysisResults.patterns.periodicity) {
    const { hasPattern, confidence } = analysisResults.patterns.periodicity;
    
    if (hasPattern && confidence > 60) {
      recommendations.push({
        type: 'pattern',
        title: '习惯模式发现',
        description: '我们发现了你的习惯执行模式，可以据此优化你的习惯计划。',
        actionText: '查看模式',
        actionType: 'viewPattern'
      });
    }
  }
  
  // 基于连续性的建议
  if (analysisResults.currentStreak > 0) {
    recommendations.push({
      type: 'streak',
      title: '保持连续',
      description: `你已经连续执行这个习惯${analysisResults.currentStreak}天，继续保持！`,
      actionText: '查看记录',
      actionType: 'viewStreak'
    });
  } else {
    recommendations.push({
      type: 'restart',
      title: '重新开始',
      description: '连续记录已中断，现在是重新开始的好时机。',
      actionText: '立即打卡',
      actionType: 'checkin'
    });
  }
  
  // 根据习惯类型的特定建议
  if (habit.category === '健身') {
    recommendations.push({
      type: 'category',
      title: '健身小贴士',
      description: '适当的休息对于健身同样重要，建议每周安排1-2天的恢复日。',
      actionText: '了解更多',
      actionType: 'learnMore',
      category: '健身'
    });
  } else if (habit.category === '学习') {
    recommendations.push({
      type: 'category',
      title: '学习效率提升',
      description: '研究表明，短时间高专注学习配合适当休息效果最佳。',
      actionText: '了解更多',
      actionType: 'learnMore',
      category: '学习'
    });
  }
  
  return recommendations;
}

/**
 * 计算标准差
 * @param values 数值数组
 * @returns 标准差
 */
function calculateStandardDeviation(values: number[]): number {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
  const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * 判断某日期是否应该执行习惯
 * @param habit 习惯对象
 * @param dateStr 日期字符串 YYYY-MM-DD
 * @returns 是否应该执行
 */
function shouldDoHabitOnDate(habit: IHabit, dateStr: string): boolean {
  const date = new Date(dateStr);
  const day = date.getDay(); // 0-6，周日到周六
  
  // 检查习惯开始日期
  if (new Date(dateStr) < new Date(habit.startDate)) {
    return false;
  }
  
  // 检查习惯结束日期
  if (habit.endDate && new Date(dateStr) > new Date(habit.endDate)) {
    return false;
  }
  
  // 根据频率类型判断
  switch (habit.frequency.type) {
    case 'daily':
      return true;
    case 'weekly':
      // 检查是否为指定的星期几
      return habit.frequency.days?.includes(day) || false;
    case 'monthly':
      // 每月固定日期
      return date.getDate() === habit.frequency.interval;
    default:
      // 其他类型暂不支持
      return false;
  }
} 
