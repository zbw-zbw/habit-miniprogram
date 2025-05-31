/**
 * 习惯相关类型定义
 */

/**
 * 习惯频率类型
 */
type FrequencyType = 'daily' | 'weekly' | 'custom';

/**
 * 习惯提醒设置
 */
interface IHabitReminder {
  /**
   * 是否启用提醒
   */
  enabled: boolean;
  
  /**
   * 提醒时间（格式：HH:MM）
   */
  time: string;
  
  /**
   * 提前几分钟提醒
   */
  advanceMinutes?: number;
  
  /**
   * 提醒内容
   */
  message?: string;
}

/**
 * 习惯频率设置
 */
interface IHabitFrequency {
  /**
   * 频率类型
   */
  type: FrequencyType;
  
  /**
   * 每周执行的星期（用于type=weekly）
   * 0表示周日，1-6表示周一至周六
   */
  daysOfWeek?: number[];
  
  /**
   * 自定义执行日期（用于type=custom）
   * 格式：YYYY-MM-DD
   */
  customDates?: string[];
  
  /**
   * 间隔天数（用于特殊周期）
   * 例如：每隔3天执行一次
   */
  intervalDays?: number;
}

/**
 * 习惯界面
 */
interface IHabit {
  /**
   * 习惯ID（MongoDB ID）
   */
  _id?: string;
  
  /**
   * 习惯ID（兼容字段）
   */
  id?: string;
  
  /**
   * 习惯名称
   */
  name: string;
  
  /**
   * 习惯描述
   */
  description?: string;
  
  /**
   * 习惯分类
   */
  category: string;
  
  /**
   * 习惯图标
   */
  icon: string;
  
  /**
   * 习惯颜色
   */
  color: string;
  
  /**
   * 习惯频率设置
   */
  frequency: IHabitFrequency;
  
  /**
   * 习惯提醒设置
   */
  reminder?: IHabitReminder;
  
  /**
   * 目标完成次数
   */
  targetCount?: number;
  
  /**
   * 目标持续天数
   */
  targetDays?: number;
  
  /**
   * 是否归档
   */
  isArchived: boolean;
  
  /**
   * 创建时间
   */
  createdAt: string;
  
  /**
   * 更新时间
   */
  updatedAt?: string;
  
  /**
   * 开始日期
   */
  startDate: string;
  
  /**
   * 结束日期
   */
  endDate?: string;
  
  /**
   * 用户ID（创建者）
   */
  userId?: string;
  
  /**
   * 标签
   */
  tags?: string[];
  
  /**
   * 今日是否已完成
   */
  isCompletedToday?: boolean;
  
  /**
   * 附加数据
   */
  meta?: Record<string, any>;
}

/**
 * 习惯统计数据
 */
interface IHabitStats {
  /**
   * 习惯ID
   */
  habitId?: string;
  
  /**
   * 总完成次数
   */
  totalCompletions: number;
  
  /**
   * 总天数
   */
  totalDays: number;
  
  /**
   * 完成率
   */
  completionRate: number;
  
  /**
   * 当前连续天数
   */
  currentStreak: number;
  
  /**
   * 最长连续天数
   */
  longestStreak: number;
  
  /**
   * 最后完成日期
   */
  lastCompletedDate: string | null;
  
  /**
   * 最佳星期几（0-6，0表示周日）
   */
  bestDayOfWeek?: number;
  
  /**
   * 最佳时间段
   */
  bestTimeOfDay?: string;
  
  /**
   * 完成日历（按月份分组）
   */
  calendar?: Record<string, string[]>;
} 
