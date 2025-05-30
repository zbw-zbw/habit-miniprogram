import { formatDate, getCurrentDate } from '../../utils/date';
import { habitAPI, checkinAPI } from '../../services/api';
import { communityAPI } from '../../services/api';

interface IPageData {
  habitId: string;
  habitName: string;
  habit: IHabit | null;
  showForm: boolean;
  formData: {
    duration: string; // 格式：HH:MM:SS
    content: string;
    note: string;
    mood: 'great' | 'good' | 'neutral' | 'bad' | 'terrible' | null;
    photos: string[];
  };
  timer: {
    isRunning: boolean;
    startTime: number;
    elapsedTime: number;
    displayTime: string;
    intervalId: number | null;
  };
  todayCheckins: ICheckin[];
  weekDays: Array<{
    day: number;
    weekday: string;
    isToday: boolean;
    isCompleted: boolean;
    isDisabled: boolean;
  }>;
  completedHabits: IHabit[];
  date: string;
  time: string;
  duration: number;
  isCompleted: boolean;
  mood: number;
  difficulty: number;
  note: string;
  loading: boolean;
  submitting: boolean;
  today: string;
  showSuccessPopup: boolean;
  successMessage: {
    title: string;
    subtitle: string;
    streak: number;
    points: number;
  };
  photos: string[];
}

interface IPageMethods {
  loadHabit(): Promise<void>;
  loadTodayCheckins(): Promise<void>;
  loadCompletedHabits(): Promise<void>;
  initWeekDays(): void;
  toggleForm(): void;
  startTimer(): void;
  stopTimer(): void;
  resetTimer(): void;
  updateTimerDisplay(): void;
  inputContent(e: WechatMiniprogram.Input): void;
  inputNote(e: WechatMiniprogram.Input): void;
  selectMood(e: WechatMiniprogram.TouchEvent): void;
  chooseImage(): void;
  deleteImage(e: WechatMiniprogram.TouchEvent): void;
  submitCheckin(): void;
  viewWeeklyProgress(): void;
  uploadPhotos(photos: string[], checkinData: any): void;
  createCheckin(checkinData: any): void;
  closeSuccessPopup(): void;
  shareCheckin(): void;
  getCurrentTime(): string;
  convertMoodToEnum(mood: number): string;
}

Page<IPageData, IPageMethods>({
  data: {
    habitId: '',
    habitName: '',
    habit: null,
    showForm: false,
    formData: {
      duration: '00:30:00',
      content: '',
      note: '',
      mood: null,
      photos: []
    },
    timer: {
      isRunning: false,
      startTime: 0,
      elapsedTime: 0,
      displayTime: '00:00:00',
      intervalId: null
    },
    todayCheckins: [],
    weekDays: [],
    completedHabits: [],
    date: '',
    time: '',
    duration: 0,
    isCompleted: true,
    mood: 5,
    difficulty: 3,
    note: '',
    loading: true,
    submitting: false,
    today: '',
    showSuccessPopup: false,
    successMessage: {
      title: '打卡成功',
      subtitle: '继续保持',
      streak: 0,
      points: 0
    },
    photos: []
  },

  onLoad(options) {
    const today = getCurrentDate();
    
    this.setData({
      habitId: options.habitId || '',
      habitName: options.habitName ? decodeURIComponent(options.habitName) : '',
      date: today,
      today,
      time: this.getCurrentTime()
    });
    
    if (this.data.habitId) {
      this.loadHabit();
    } else {
      wx.showToast({
        title: '习惯ID不存在',
        icon: 'error'
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  onUnload() {
    // 清除定时器
    if (this.data.timer.intervalId) {
      clearInterval(this.data.timer.intervalId);
    }
  },

  // 加载习惯详情
  async loadHabit() {
    try {
      wx.showLoading({ title: '加载中' });
      const habit = await habitAPI.getHabit(this.data.habitId);
      
      if (habit) {
        this.setData({
          habit,
          habitName: habit.name || this.data.habitName
        });
        
        // 更新导航栏标题
        wx.setNavigationBarTitle({
          title: habit.name || '打卡'
        });
      }
      wx.hideLoading();
    } catch (error) {
      console.error('加载习惯失败:', error);
      
      // 创建一个默认的习惯对象，以防API调用失败
      const defaultHabit: IHabit = {
        id: this.data.habitId,
        name: this.data.habitName || '习惯',
        description: '',
        category: '其他',
        icon: 'star',
        color: '#5E72E4',
        frequency: {
          type: 'daily'
        },
        reminder: {
          enabled: false,
          time: '07:00'
        },
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startDate: new Date().toISOString().split('T')[0]
      };
      
      this.setData({
        habit: defaultHabit,
        habitName: defaultHabit.name
      });
      
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  // 加载今日打卡记录
  async loadTodayCheckins() {
    try {
      const today = formatDate(new Date());
      const checkins = await checkinAPI.getCheckins({
        habitId: this.data.habitId,
        startDate: today,
        endDate: today
      });
      
      this.setData({
        todayCheckins: checkins
      });
    } catch (error) {
      console.error('加载今日打卡记录失败:', error);
      this.setData({
        todayCheckins: []
      });
    }
  },

  // 加载已完成的习惯
  async loadCompletedHabits() {
    try {
      const today = formatDate(new Date());
      const checkins = await checkinAPI.getCheckins({
        startDate: today,
        endDate: today
      });
      
      // 获取已完成打卡的习惯ID
      const completedHabitIds = checkins
        .filter(checkin => checkin.isCompleted)
        .map(checkin => checkin.habitId);
      
      // 如果有已完成的习惯，获取习惯详情
      if (completedHabitIds.length > 0) {
        const habits = await habitAPI.getHabits();
        const completedHabits = habits.filter(habit => 
          completedHabitIds.includes(habit.id)
        );
        
        this.setData({
          completedHabits
        });
      } else {
        this.setData({
          completedHabits: []
        });
      }
    } catch (error) {
      console.error('加载已完成习惯失败:', error);
      this.setData({
        completedHabits: []
      });
    }
  },

  // 初始化周视图
  initWeekDays() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0是周日，1是周一
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // 调整到本周一
    
    const weekDays = [];
    const weekdayNames = ['一', '二', '三', '四', '五', '六', '日'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today;
      
      weekDays.push({
        day: date.getDate(),
        weekday: weekdayNames[i],
        isToday,
        isCompleted: isPast && !isToday, // 模拟数据：过去的日期都已完成
        isDisabled: date > today
      });
    }
    
    this.setData({
      weekDays
    });
  },

  // 切换打卡表单显示
  toggleForm() {
    this.setData({
      showForm: !this.data.showForm
    });
  },

  // 启动计时器
  startTimer() {
    if (this.data.timer.isRunning) {
      this.stopTimer();
      return;
    }

    const now = Date.now();
    const intervalId = setInterval(() => {
      this.updateTimerDisplay();
    }, 1000);

    this.setData({
      'timer.isRunning': true,
      'timer.startTime': now - this.data.timer.elapsedTime,
      'timer.intervalId': intervalId
    });
  },

  // 停止计时器
  stopTimer() {
    if (this.data.timer.intervalId) {
      clearInterval(this.data.timer.intervalId);
    }

    this.setData({
      'timer.isRunning': false,
      'timer.intervalId': null
    });
  },

  // 重置计时器
  resetTimer() {
    this.stopTimer();
    
    this.setData({
      'timer.elapsedTime': 0,
      'timer.displayTime': '00:00:00'
    });
  },

  // 更新计时器显示
  updateTimerDisplay() {
    const now = Date.now();
    const elapsed = now - this.data.timer.startTime;
    
    // 格式化时间显示
    const totalSeconds = Math.floor(elapsed / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const displayTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    this.setData({
      'timer.elapsedTime': elapsed,
      'timer.displayTime': displayTime,
      'formData.duration': displayTime
    });
  },

  // 输入内容
  inputContent(e: WechatMiniprogram.Input) {
    this.setData({
      'formData.content': e.detail.value
    });
  },

  // 输入笔记
  inputNote(e: WechatMiniprogram.Input) {
    this.setData({
      'formData.note': e.detail.value
    });
  },

  // 选择心情
  selectMood(e: WechatMiniprogram.TouchEvent) {
    const mood = e.currentTarget.dataset.mood as 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
    this.setData({
      'formData.mood': mood
    });
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 9 - this.data.formData.photos.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const photos = [...this.data.formData.photos, ...res.tempFilePaths];
        this.setData({
          'formData.photos': photos
        });
      }
    });
  },

  // 删除图片
  deleteImage(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    const photos = this.data.formData.photos;
    photos.splice(index, 1);
    this.setData({
      'formData.photos': photos
    });
  },

  // 查看每周进度
  viewWeeklyProgress() {
    wx.navigateTo({
      url: '/pages/analytics/analytics'
    });
  },

  // 提交打卡
  submitCheckin() {
    const { habitId, habit, date, time, duration, note, isCompleted, mood, difficulty, photos = [] } = this.data;
    
    if (!habitId || !habit) {
      wx.showToast({
        title: '习惯信息不完整',
        icon: 'none'
      });
      return;
    }
    
    // 显示加载中
    this.setData({ submitting: true });
    
    // 构建打卡数据
    const checkinData: any = {
      habitId,
      date,
      time,
      duration,
      note,
      isCompleted,
      mood: this.convertMoodToEnum(mood), // 转换mood数字为枚举值
      difficulty,
      // 小程序上传图片需要特殊处理，这里先不上传
      // photos 
    };
    
    // 检查是否需要上传图片
    if (photos && photos.length > 0) {
      // 上传图片，然后创建打卡记录
      this.uploadPhotos(photos, checkinData);
    } else {
      // 直接创建打卡记录
      this.createCheckin(checkinData);
    }
  },

  /**
   * 将数字心情值转换为枚举值
   */
  convertMoodToEnum(mood: number): string {
    const moodMap: Record<number, string> = {
      1: 'terrible',
      2: 'bad',
      3: 'neutral',
      4: 'good',
      5: 'great'
    };
    return moodMap[mood] || 'neutral'; // 默认返回neutral
  },

  /**
   * 获取当前时间
   */
  getCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  /**
   * 上传照片
   */
  uploadPhotos(photos: string[], checkinData: any) {
    const uploadPromises = photos.map(photo => {
      return new Promise<string>((resolve, reject) => {
        wx.uploadFile({
          url: getApp<IAppOption>().globalData.apiBaseUrl + '/api/upload',
          filePath: photo,
          name: 'file',
          success: (res) => {
            try {
              const data = JSON.parse(res.data);
              if (data.success) {
                resolve(data.url);
              } else {
                reject(new Error(data.message || '上传失败'));
              }
            } catch (error) {
              reject(new Error('解析响应失败'));
            }
          },
          fail: (error) => {
            reject(error);
          }
        });
      });
    });
    
    Promise.all(uploadPromises)
      .then(photoUrls => {
        // 添加上传后的图片URL
        checkinData.photos = photoUrls;
        
        // 创建打卡记录
        this.createCheckin(checkinData);
      })
      .catch(error => {
        console.error('上传图片失败:', error);
        
        this.setData({ submitting: false });
        
        wx.showToast({
          title: '上传图片失败',
          icon: 'none'
        });
      });
  },

  /**
   * 创建打卡记录
   */
  createCheckin(checkinData: any) {
    checkinAPI.createCheckin(checkinData)
      .then(result => {
        console.log('打卡成功:', result);
        
        this.setData({ submitting: false });
        
        // 获取习惯统计，用于展示打卡成功信息
        return habitAPI.getHabitStats(this.data.habitId).catch(err => {
          // 如果获取统计失败，使用默认值
          console.error('获取习惯统计失败:', err);
          return { currentStreak: 1 };
        });
      })
      .then(stats => {
        console.log('获取习惯统计:', stats);
        
        // 显示打卡成功弹窗
        this.setData({
          showSuccessPopup: true,
          successMessage: {
            title: '打卡成功',
            subtitle: '继续坚持，习惯成自然',
            streak: stats.currentStreak || 1,
            points: 5 + (stats.currentStreak > 7 ? 5 : 0) // 根据连续天数加分
          }
        });
      })
      .catch(error => {
        console.error('打卡失败:', error);
        
        this.setData({ submitting: false });
        
        wx.showToast({
          title: '打卡失败，请重试',
          icon: 'none',
          duration: 2000
        });
      });
  },

  /**
   * 关闭成功弹窗
   */
  closeSuccessPopup() {
    this.setData({ showSuccessPopup: false });
    
    // 返回上一页
    setTimeout(() => {
      wx.navigateBack({
        delta: 1
      });
    }, 300);
  },

  /**
   * 分享打卡记录
   */
  shareCheckin() {
    this.setData({ showSuccessPopup: false });
    
    wx.navigateTo({
      url: `/packageCommunity/pages/post/post?habitId=${this.data.habitId}&action=checkin`
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: `我完成了「${this.data.habitName}」的打卡`,
      path: '/pages/index/index'
    };
  }
});
