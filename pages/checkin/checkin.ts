import { formatDate } from '../../utils/date';

interface IPageData {
  habitId: string;
  habitName: string;
  habit: IHabit | null;
  showForm: boolean;
  formData: {
    duration: string; // 格式：HH:MM:SS
    content: string;
    note: string;
    mood: 'happy' | 'calm' | 'thinking' | 'tired' | 'sad' | null;
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
    completedHabits: []
  },

  onLoad(options) {
    if (options.habitId) {
      this.setData({
        habitId: options.habitId,
        habitName: options.habitName || '习惯打卡'
      });
      
      wx.setNavigationBarTitle({
        title: options.habitName || '习惯打卡'
      });

      this.loadHabit();
      this.loadTodayCheckins();
      this.loadCompletedHabits();
      this.initWeekDays();
    } else {
      wx.showToast({
        title: '参数错误',
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
      // 导入获取习惯的函数
      const { getHabitById } = require('../../utils/storage');
      
      // 获取习惯信息
      const habit = getHabitById(this.data.habitId);
      
      if (habit) {
        this.setData({
          habit,
          habitName: habit.name || this.data.habitName
        });
        
        // 更新导航栏标题
        wx.setNavigationBarTitle({
          title: habit.name || '打卡'
        });
      } else {
        // 如果没有找到习惯，创建一个默认的阅读习惯
        const defaultHabit: IHabit = {
          id: this.data.habitId,
          name: this.data.habitName || '阅读',
          description: '每天30分钟，培养阅读习惯',
          category: '学习',
          icon: 'book',
          color: '#5E72E4',
          frequency: {
            type: 'daily'
          },
          reminder: {
            enabled: true,
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
      }
    } catch (error) {
      console.error('加载习惯失败:', error);
      
      // 创建一个默认的阅读习惯
      const defaultHabit: IHabit = {
          id: this.data.habitId,
          name: this.data.habitName || '阅读',
          description: '每天30分钟，培养阅读习惯',
          category: '学习',
          icon: 'book',
          color: '#5E72E4',
          frequency: {
            type: 'daily'
          },
          reminder: {
            enabled: true,
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
      
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  // 加载今日打卡记录
  async loadTodayCheckins() {
    try {
      // 模拟API请求
      // 实际项目中应替换为真实API调用
      setTimeout(() => {
        const todayCheckins: ICheckin[] = [];
        this.setData({
          todayCheckins
        });
      }, 500);
    } catch (error) {
      wx.showToast({
        title: '记录加载失败',
        icon: 'error'
      });
    }
  },

  // 加载已完成习惯
  async loadCompletedHabits() {
    try {
      // 模拟API请求
      // 实际项目中应替换为真实API调用
      setTimeout(() => {
        const completedHabits: IHabit[] = [
          {
            id: 'habit-2',
            name: '运动',
            description: '每天运动45分钟',
            category: '健康',
            icon: 'run',
            color: '#67C23A',
            frequency: {
              type: 'daily'
            },
            reminder: {
              enabled: true,
              time: '18:00'
            },
            isArchived: false,
            createdAt: '2023-05-15',
            updatedAt: '2023-06-15',
            startDate: '2023-05-15'
          },
          {
            id: 'habit-3',
            name: '写作',
            description: '每天写作500字',
            category: '学习',
            icon: 'edit',
            color: '#9254DE',
            frequency: {
              type: 'daily'
            },
            reminder: {
              enabled: true,
              time: '20:00'
            },
            isArchived: false,
            createdAt: '2023-05-20',
            updatedAt: '2023-06-15',
            startDate: '2023-05-20'
          }
        ];

        this.setData({
          completedHabits
        });
      }, 500);
    } catch (error) {
      wx.showToast({
        title: '数据加载失败',
        icon: 'error'
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
    const mood = e.currentTarget.dataset.mood as 'happy' | 'calm' | 'thinking' | 'tired' | 'sad';
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
    const photos = [...this.data.formData.photos];
    photos.splice(index, 1);
    this.setData({
      'formData.photos': photos
    });
  },

  // 提交打卡
  submitCheckin() {
    const { duration, content, note, mood, photos } = this.data.formData;
    
    if (!content.trim()) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '提交中'
    });
    
    // 模拟API请求
    // 实际项目中应替换为真实API调用
    setTimeout(() => {
      wx.hideLoading();
      
      wx.showToast({
        title: '打卡成功',
        icon: 'success'
      });
      
      // 重置表单
      this.setData({
        showForm: false,
        formData: {
          duration: '00:30:00',
          content: '',
          note: '',
          mood: null,
          photos: []
        }
      });
      
      // 刷新数据
      this.loadTodayCheckins();
      this.loadCompletedHabits();
    }, 1000);
  },



});
