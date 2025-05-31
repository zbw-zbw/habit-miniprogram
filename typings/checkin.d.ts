/**
 * 打卡相关类型定义
 */

/**
 * 心情枚举
 */
type MoodType = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

/**
 * 打卡记录接口
 */
interface ICheckin {
  /**
   * 打卡记录ID
   */
  _id?: string;
  
  /**
   * 打卡记录ID（兼容字段）
   */
  id?: string;
  
  /**
   * 习惯ID
   */
  habitId: string;
  
  /**
   * 习惯对象引用（兼容字段）
   */
  habit?: string;
  
  /**
   * 用户ID
   */
  userId?: string;
  
  /**
   * 打卡日期，格式：YYYY-MM-DD
   */
  date: string;
  
  /**
   * 打卡时间，格式：HH:MM:SS
   */
  time?: string;
  
  /**
   * 是否完成
   */
  isCompleted: boolean;
  
  /**
   * 持续时间（秒）
   */
  duration?: number;
  
  /**
   * 打卡内容
   */
  content?: string;
  
  /**
   * 心情
   */
  mood?: MoodType;
  
  /**
   * 难度（1-5）
   */
  difficulty?: number;
  
  /**
   * 备注
   */
  note?: string;
  
  /**
   * 图片列表
   */
  photos?: string[];
  
  /**
   * 位置信息
   */
  location?: {
    /**
     * 经度
     */
    longitude: number;
    
    /**
     * 纬度
     */
    latitude: number;
    
    /**
     * 位置名称
     */
    name?: string;
    
    /**
     * 详细地址
     */
    address?: string;
  };
  
  /**
   * 创建时间
   */
  createdAt?: string;
  
  /**
   * 更新时间
   */
  updatedAt?: string;
  
  /**
   * 社区分享ID
   */
  postId?: string;
  
  /**
   * 是否已分享到社区
   */
  isShared?: boolean;
  
  /**
   * 自定义数据
   */
  meta?: Record<string, any>;
} 
