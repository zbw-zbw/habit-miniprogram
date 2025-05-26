import { formatDate, getCurrentDate, daysBetween, getDayOfWeek, parseDate, isSameDay } from './date';

/**
 * 检查指定日期是否应该执行习惯
 * @param habit 习惯对象
 * @param date 指定日期，默认为当前日期
 * @returns 如果应该执行习惯，则返回 true
 */
export const shouldDoHabitOnDate = (habit: IHabit, date: string = getCurrentDate()): boolean => {
  const targetDate = new Date(date);
  
  // 检查日期是否在习惯的有效期内
  const startDate = new Date(habit.startDate);
  startDate.setHours(0, 0, 0, 0);
  
  if (targetDate < startDate) {
    return false;
  }
  
  if (habit.endDate) {
    const endDate = new Date(habit.endDate);
    endDate.setHours(23, 59, 59, 999);
    
    if (targetDate > endDate) {
      return false;
    }
  }
  
  // 根据频率类型检查
  const dayOfWeek = targetDate.getDay() || 7; // 转换为1-7，表示周一到周日
  const dayOfMonth = targetDate.getDate();
  
  switch (habit.frequency.type) {
    case 'daily':
      return true;
      
    case 'weekly':
      return habit.frequency.days?.includes(dayOfWeek) ?? false;
      
    case 'monthly':
      return habit.frequency.days?.includes(dayOfMonth) ?? false;
      
    case 'custom':
      if (!habit.frequency.interval) {
        return false;
      }
      
      // 计算从开始日期到目标日期的天数
      const daysSinceStart = daysBetween(startDate, targetDate);
      
      // 如果天数能被间隔整除，则应该执行习惯
      return daysSinceStart % habit.frequency.interval === 0;
      
    default:
      return false;
  }
};

/**
 * 计算习惯的连续天数
 * @param checkins 打卡记录数组
 * @returns 当前连续天数
 */
export const calculateStreak = (checkins: ICheckin[]): number => {
  if (!checkins.length) {
    return 0;
  }
  
  // 按日期降序排序
  const sortedCheckins = [...checkins].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // 检查最近一次打卡是否为今天或昨天
  const latestDate = new Date(sortedCheckins[0].date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  if (latestDate < yesterday) {
    return 0; // 连续性已中断
  }
  
  // 计算连续天数
  let streak = 1;
  let currentDate = latestDate;
  
  for (let i = 1; i < sortedCheckins.length; i++) {
    const checkDate = new Date(sortedCheckins[i].date);
    
    // 检查是否为前一天
    const expectedPrevDate = new Date(currentDate);
    expectedPrevDate.setDate(currentDate.getDate() - 1);
    
    if (checkDate.getTime() === expectedPrevDate.getTime()) {
      streak++;
      currentDate = checkDate;
    } else {
      break; // 连续性中断
    }
  }
  
  return streak;
};

/**
 * 计算习惯的完成率
 * @param habit 习惯对象
 * @param checkins 打卡记录数组
 * @param startDate 开始日期，默认为习惯的开始日期
 * @param endDate 结束日期，默认为当前日期
 * @returns 完成率（0-100）
 */
export const calculateCompletionRate = (
  habit: IHabit,
  checkins: ICheckin[],
  startDate: string = habit.startDate,
  endDate: string = getCurrentDate()
): number => {
  // 获取日期范围内应该执行习惯的天数
  let totalDays = 0;
  let completedDays = 0;
  
  // 转换为日期对象
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  // 创建打卡记录的映射，以便快速查找
  const checkinMap: Record<string, ICheckin> = {};
  checkins.forEach(checkin => {
    if (checkin.isCompleted) {
      checkinMap[checkin.date] = checkin;
    }
  });
  
  // 遍历日期范围
  const current = new Date(start);
  while (current <= end) {
    const dateStr = formatDate(current);
    
    // 检查是否应该在这一天执行习惯
    if (shouldDoHabitOnDate(habit, dateStr)) {
      totalDays++;
      
      // 检查是否完成
      if (checkinMap[dateStr]) {
        completedDays++;
      }
    }
    
    // 移动到下一天
    current.setDate(current.getDate() + 1);
  }
  
  // 计算完成率
  return totalDays > 0 ? (completedDays / totalDays) * 100 : 0;
};

/**
 * 生成习惯统计数据
 * @param habit 习惯对象
 * @param checkins 打卡记录数组
 * @returns 习惯统计数据
 */
export const generateHabitStats = (habit: IHabit, checkins: ICheckin[]): IHabitStats => {
  // 只考虑已完成的打卡
  const completedCheckins = checkins.filter(c => c.isCompleted);
  
  // 总完成次数
  const totalCompletions = completedCheckins.length;
  
  // 计算总天数（从创建日期到今天）
  const createdDate = new Date(habit.createdAt);
  const today = new Date();
  let totalDays = 0;
  
  // 遍历从创建日期到今天的每一天
  for (let d = new Date(createdDate); d <= today; d.setDate(d.getDate() + 1)) {
    // 检查这一天是否需要执行习惯
    if (shouldDoHabitOnDate(habit, formatDate(d))) {
      totalDays++;
    }
  }
  
  // 计算完成率
  const completionRate = totalDays > 0 ? Math.round((totalCompletions / totalDays) * 100) : 0;
  
  // 获取最后一次完成日期
  let lastCompletedDate: string | null = null;
  if (completedCheckins.length > 0) {
    // 按日期排序
    const sortedCheckins = [...completedCheckins].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    lastCompletedDate = sortedCheckins[0].date;
  }
  
  // 计算当前连续天数
  let currentStreak = 0;
  if (lastCompletedDate) {
    const lastDate = parseDate(lastCompletedDate);
    const todayStr = formatDate(today);
    
    // 检查最后完成日期是否是今天
    if (isSameDay(lastDate, today)) {
      currentStreak = 1;
      
      // 向前检查连续天数
      let checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - 1);
      
      while (true) {
        const checkDateStr = formatDate(checkDate);
        
        // 检查这一天是否需要执行习惯
        if (shouldDoHabitOnDate(habit, checkDateStr)) {
          // 检查是否有完成记录
          const hasCompleted = completedCheckins.some(c => 
            c.date === checkDateStr && c.isCompleted
          );
          
          if (hasCompleted) {
            currentStreak++;
          } else {
            break;
          }
        }
        
        checkDate.setDate(checkDate.getDate() - 1);
      }
    } else {
      // 最后完成日期不是今天，检查是否是昨天
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (isSameDay(lastDate, yesterday)) {
        // 如果今天不需要执行这个习惯，连续天数仍然有效
        if (!shouldDoHabitOnDate(habit, todayStr)) {
          currentStreak = 1;
          
          // 向前检查连续天数
          let checkDate = new Date(yesterday);
          checkDate.setDate(checkDate.getDate() - 1);
          
          while (true) {
            const checkDateStr = formatDate(checkDate);
            
            // 检查这一天是否需要执行习惯
            if (shouldDoHabitOnDate(habit, checkDateStr)) {
              // 检查是否有完成记录
              const hasCompleted = completedCheckins.some(c => 
                c.date === checkDateStr && c.isCompleted
              );
              
              if (hasCompleted) {
                currentStreak++;
              } else {
                break;
              }
            }
            
            checkDate.setDate(checkDate.getDate() - 1);
          }
        }
      }
    }
  }
  
  // 计算最长连续天数
  let longestStreak = currentStreak;
  let currentCount = 0;
  let checkDate = new Date(createdDate);
  const endDate = new Date(today);
  
  while (checkDate <= endDate) {
    const checkDateStr = formatDate(checkDate);
    
    // 检查这一天是否需要执行习惯
    if (shouldDoHabitOnDate(habit, checkDateStr)) {
      // 检查是否有完成记录
      const hasCompleted = completedCheckins.some(c => 
        c.date === checkDateStr && c.isCompleted
      );
      
      if (hasCompleted) {
        currentCount++;
        longestStreak = Math.max(longestStreak, currentCount);
      } else {
        currentCount = 0;
      }
    }
    
    checkDate.setDate(checkDate.getDate() + 1);
  }
  
  return {
    totalCompletions,
    totalDays,
    completionRate,
    currentStreak,
    longestStreak,
    lastCompletedDate
  };
}; 
