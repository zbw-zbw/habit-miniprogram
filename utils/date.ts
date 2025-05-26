/**
 * 日期工具函数
 */

/**
 * 获取当前日期，格式为YYYY-MM-DD
 */
export function getCurrentDate(): string {
  const now = new Date();
  return formatDate(now);
}

/**
 * 格式化日期，格式为YYYY-MM-DD
 * @param date 日期对象
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 解析日期字符串，格式为YYYY-MM-DD
 * @param dateStr 日期字符串
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * 获取两个日期之间的天数
 * @param startDate 开始日期
 * @param endDate 结束日期
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  const oneDay = 24 * 60 * 60 * 1000; // 一天的毫秒数
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return Math.round(Math.abs((start.getTime() - end.getTime()) / oneDay));
}

/**
 * 获取日期是星期几（0-6，0表示星期日）
 * @param date 日期对象
 */
export function getDayOfWeek(date: Date): number {
  return date.getDay();
}

/**
 * 获取日期是一个月中的第几天（1-31）
 * @param date 日期对象
 */
export function getDayOfMonth(date: Date): number {
  return date.getDate();
}

/**
 * 获取一个月的天数
 * @param year 年份
 * @param month 月份（1-12）
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * 获取前n天的日期
 * @param days 天数
 */
export function getDateBefore(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * 获取后n天的日期
 * @param days 天数
 */
export function getDateAfter(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * 获取过去n天的日期数组
 * @param days 天数
 */
export function getPastDates(days: number): string[] {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = getDateBefore(i);
    dates.push(formatDate(date));
  }
  return dates;
}

/**
 * 判断两个日期是否是同一天
 * @param date1 日期1
 * @param date2 日期2
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * 获取日期所在周的第一天（星期日）
 * @param date 日期对象
 */
export function getFirstDayOfWeek(date: Date): Date {
  const day = date.getDay();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - day);
}

/**
 * 获取日期所在月的第一天
 * @param date 日期对象
 */
export function getFirstDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * 获取日期所在月的最后一天
 * @param date 日期对象
 */
export function getLastDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * 计算两个日期之间的天数差
 * @param date1 第一个日期
 * @param date2 第二个日期，默认为当前日期
 * @returns 天数差
 */
export const daysBetween = (date1: Date | string, date2: Date | string = new Date()): number => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  // 将时间部分设置为0，只比较日期
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  
  // 计算毫秒差并转换为天数
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * 检查是否为连续日期
 * @param date1 第一个日期
 * @param date2 第二个日期
 * @returns 如果两个日期相邻，则返回 true
 */
export const isConsecutiveDate = (date1: Date | string, date2: Date | string): boolean => {
  return daysBetween(date1, date2) === 1;
};

/**
 * 获取一周的日期范围
 * @param date 指定日期，默认为当前日期
 * @param startDay 一周的起始日，0表示周日，1表示周一，默认为1
 * @returns 包含一周日期的数组，格式为 'YYYY-MM-DD'
 */
export const getWeekRange = (date: Date | string = new Date(), startDay: number = 1): string[] => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDay(); // 0-6，0表示周日
  
  // 计算本周第一天的偏移量
  const diff = (day < startDay ? 7 : 0) + day - startDay;
  
  // 获取本周第一天
  const firstDay = new Date(d);
  firstDay.setDate(d.getDate() - diff);
  
  // 生成一周的日期
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(firstDay);
    currentDate.setDate(firstDay.getDate() + i);
    weekDates.push(formatDate(currentDate));
  }
  
  return weekDates;
};

/**
 * 获取一个月的日期范围
 * @param year 年份，默认为当前年份
 * @param month 月份（1-12），默认为当前月份
 * @returns 包含一个月所有日期的数组，格式为 'YYYY-MM-DD'
 */
export const getMonthRange = (year: number = new Date().getFullYear(), month: number = new Date().getMonth() + 1): string[] => {
  // 获取指定月份的天数
  const daysInMonth = new Date(year, month, 0).getDate();
  
  // 生成月份的所有日期
  const monthDates: string[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month - 1, i);
    monthDates.push(formatDate(date));
  }
  
  return monthDates;
}; 
