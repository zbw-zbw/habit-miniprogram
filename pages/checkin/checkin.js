"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const date_1 = require("../../utils/date");
const api_1 = require("../../services/api");
const habit_1 = require("../../utils/habit");
Page({
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
        photos: [],
        todayHabits: []
    },
    onLoad(options) {
        const today = (0, date_1.getCurrentDate)();
        this.setData({
            habitId: options.habitId || '',
            habitName: options.habitName ? decodeURIComponent(options.habitName) : '',
            date: today,
            today,
            time: this.getCurrentTime()
        });
        if (this.data.habitId) {
            this.loadHabit().then(() => {
                // 在习惯加载完成后，加载今日所有习惯
                this.loadTodayHabits();
            });
        }
        else {
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
            const habit = await api_1.habitAPI.getHabit(this.data.habitId);
            if (habit) {
                // 获取习惯统计数据
                try {
                    const stats = await api_1.habitAPI.getHabitStats(this.data.habitId);
                    habit.stats = stats; // 将统计数据添加到习惯对象中
                }
                catch (statsError) {
                    console.error('获取习惯统计数据失败:', statsError);
                    habit.stats = { currentStreak: 0, completedDays: 0, totalDays: 0 };
                }
                this.setData({
                    habit,
                    habitName: habit.name || this.data.habitName
                });
                // 更新导航栏标题
                wx.setNavigationBarTitle({
                    title: habit.name || '打卡'
                });
                // 检查今天是否应该打卡
                const today = (0, date_1.getCurrentDate)();
                const shouldDoToday = (0, habit_1.shouldDoHabitOnDate)(habit, today);
                // 如果今天不是打卡日，显示提示
                if (!shouldDoToday) {
                    wx.showModal({
                        title: '提示',
                        content: `今天不是"${habit.name}"的打卡日，请在指定日期打卡。`,
                        showCancel: false,
                        success: () => {
                            wx.navigateBack();
                        }
                    });
                }
            }
            wx.hideLoading();
        }
        catch (error) {
            console.error('加载习惯失败:', error);
            // 创建一个默认的习惯对象，以防API调用失败
            const defaultHabit = {
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
                startDate: new Date().toISOString().split('T')[0],
                stats: { currentStreak: 0, completedDays: 0, totalDays: 0 } // 添加默认统计数据
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
            const today = (0, date_1.formatDate)(new Date());
            const checkins = await api_1.checkinAPI.getCheckins({
                habitId: this.data.habitId,
                startDate: today,
                endDate: today
            });
            this.setData({
                todayCheckins: checkins
            });
        }
        catch (error) {
            console.error('加载今日打卡记录失败:', error);
            this.setData({
                todayCheckins: []
            });
        }
    },
    // 加载已完成的习惯
    async loadCompletedHabits() {
        try {
            const today = (0, date_1.formatDate)(new Date());
            const checkins = await api_1.checkinAPI.getCheckins({
                startDate: today,
                endDate: today
            });
            // 获取已完成打卡的习惯ID
            const completedHabitIds = checkins
                .filter(checkin => checkin.isCompleted)
                .map(checkin => checkin.habitId);
            // 如果有已完成的习惯，获取习惯详情
            if (completedHabitIds.length > 0) {
                const habits = await api_1.habitAPI.getHabits();
                const completedHabits = habits.filter(habit => completedHabitIds.includes(habit.id));
                // 为每个已完成习惯添加统计数据
                const habitsWithStats = await Promise.all(completedHabits.map(async (habit) => {
                    try {
                        const habitId = habit._id || habit.id;
                        if (!habitId)
                            return habit;
                        const stats = await api_1.habitAPI.getHabitStats(habitId);
                        return {
                            ...habit,
                            stats
                        };
                    }
                    catch (error) {
                        console.error(`获取习惯${habit.name}统计数据失败:`, error);
                        return {
                            ...habit,
                            stats: { currentStreak: 0, completedDays: 0, totalDays: 0 }
                        };
                    }
                }));
                this.setData({
                    completedHabits: habitsWithStats
                });
            }
            else {
                this.setData({
                    completedHabits: []
                });
            }
        }
        catch (error) {
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
                isCompleted: isPast && !isToday,
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
    inputContent(e) {
        this.setData({
            'formData.content': e.detail.value
        });
    },
    // 输入笔记
    inputNote(e) {
        this.setData({
            'formData.note': e.detail.value
        });
    },
    // 选择心情
    selectMood(e) {
        const mood = e.currentTarget.dataset.mood;
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
    deleteImage(e) {
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
    /**
     * 提交打卡
     */
    async submitCheckin() {
        // 防止重复提交
        if (this.data.submitting) {
            return;
        }
        // 设置提交状态
        this.setData({ submitting: true });
        try {
            // 准备打卡数据
            const checkinData = {
                habitId: this.data.habitId,
                date: this.data.date,
                time: this.data.time,
                isCompleted: this.data.isCompleted,
                note: this.data.formData.note,
                mood: this.data.formData.mood,
                content: this.data.formData.content,
                duration: this.data.timer.isRunning
                    ? Math.floor(this.data.timer.elapsedTime / 1000)
                    : this.data.formData.duration ? this.parseTimeStringToSeconds(this.data.formData.duration) : 0
            };
            // 如果有图片，先上传图片
            if (this.data.formData.photos && this.data.formData.photos.length > 0) {
                try {
                    await this.uploadPhotos(this.data.formData.photos, checkinData);
                }
                catch (error) {
                    console.error('上传图片失败:', error);
                    wx.showToast({
                        title: '上传图片失败，将只保存打卡记录',
                        icon: 'none',
                        duration: 2000
                    });
                }
            }
            // 创建打卡记录
            const response = await api_1.checkinAPI.createCheckin(checkinData);
            console.log('打卡成功:', response);
            // 停止计时器
            if (this.data.timer.isRunning) {
                this.stopTimer();
            }
            // 构建成功信息
            let streak = 0;
            let points = 0;
            try {
                // 获取当前习惯的统计数据
                const stats = await api_1.habitAPI.getHabitStats(this.data.habitId);
                streak = stats.currentStreak || 0;
                // 计算获得的积分（示例：基础5分 + 连续天数加成）
                points = 5 + Math.min(streak, 10);
            }
            catch (error) {
                console.error('获取习惯统计数据失败:', error);
                // 使用默认值
                streak = 1;
                points = 5;
            }
            // 显示成功弹窗
            this.setData({
                showSuccessPopup: true,
                successMessage: {
                    title: '打卡成功',
                    subtitle: streak > 1 ? `已连续坚持${streak}天` : '开始养成好习惯',
                    streak: streak,
                    points: points
                },
                submitting: false
            });
            // 通知首页刷新数据
            const pages = getCurrentPages();
            const indexPage = pages.find(page => page.route === 'pages/index/index');
            if (indexPage) {
                indexPage.loadData();
            }
            // 通知习惯详情页刷新数据
            const detailPage = pages.find(page => page.route === 'pages/habits/detail/detail');
            if (detailPage) {
                detailPage.loadCheckins();
                detailPage.loadStats();
            }
            // 延迟返回
            setTimeout(() => {
                // 如果不是从习惯详情页来的，则返回上一页
                const refererPage = pages[pages.length - 2];
                if (!refererPage || refererPage.route !== 'pages/habits/detail/detail') {
                    wx.navigateBack();
                }
            }, 3000);
        }
        catch (error) {
            console.error('打卡失败:', error);
            // 根据错误类型显示不同提示
            let errorMsg = '打卡失败，请稍后再试';
            if (error.message && error.message.includes('网络')) {
                errorMsg = '网络连接失败，请检查网络后重试';
            }
            else if (error.message && error.message.includes('习惯ID')) {
                errorMsg = '习惯信息有误，请返回重试';
            }
            wx.showToast({
                title: errorMsg,
                icon: 'none',
                duration: 2000
            });
            this.setData({ submitting: false });
        }
    },
    /**
     * 解析时间字符串为秒数
     * @param timeString 时间字符串，格式：HH:MM:SS
     * @returns 秒数
     */
    parseTimeStringToSeconds(timeString) {
        if (!timeString)
            return 0;
        const parts = timeString.split(':');
        if (parts.length !== 3)
            return 0;
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parseInt(parts[2], 10);
        return (hours * 3600) + (minutes * 60) + seconds;
    },
    /**
     * 将数字心情值转换为枚举值
     */
    convertMoodToEnum(mood) {
        const moodMap = {
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
    uploadPhotos(photos, checkinData) {
        const uploadPromises = photos.map(photo => {
            return new Promise((resolve, reject) => {
                wx.uploadFile({
                    url: getApp().globalData.apiBaseUrl + '/api/upload',
                    filePath: photo,
                    name: 'file',
                    success: (res) => {
                        try {
                            const data = JSON.parse(res.data);
                            if (data.success) {
                                resolve(data.url);
                            }
                            else {
                                reject(new Error(data.message || '上传失败'));
                            }
                        }
                        catch (error) {
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
    createCheckin(checkinData) {
        const { date, time, duration, note, mood, difficulty } = checkinData;
        this.setData({ submitting: true });
        console.log('开始创建打卡记录:', checkinData);
        api_1.checkinAPI.createCheckin({
            habit: this.data.habitId,
            date,
            time,
            isCompleted: true,
            value: 1,
            duration,
            note,
            mood: mood || undefined,
            difficulty: difficulty || undefined,
            isPublic: false
        })
            .then(result => {
            console.log('打卡成功:', result);
            this.setData({
                submitting: false,
                showSuccessPopup: true,
                successMessage: {
                    title: '打卡成功',
                    subtitle: '坚持的力量不可小觑',
                    streak: this.data.habit?.stats?.currentStreak ? this.data.habit.stats.currentStreak + 1 : 1,
                    points: 5
                }
            });
            // 触发全局事件通知首页刷新
            const app = getApp();
            if (app.globalData.habitService && typeof app.globalData.habitService.refreshData === 'function') {
                console.log('触发全局习惯刷新');
                app.globalData.habitService.refreshData();
            }
            // 通知打卡完成，用于返回上一页时刷新数据
            const eventChannel = this.getOpenerEventChannel();
            if (eventChannel && eventChannel.emit) {
                console.log('发送打卡完成事件');
                eventChannel.emit('checkinCompleted', { habitId: this.data.habitId });
            }
            // 清空本地存储
            wx.removeStorage({
                key: `checkin_draft_${this.data.habitId}`,
            });
            // 在首页展示成就解锁弹窗
            if (app.globalData.achievementService && typeof app.globalData.achievementService.checkAchievements === 'function') {
                app.globalData.achievementService.checkAchievements();
            }
            // 延迟关闭加载提示，确保成功弹窗显示
            setTimeout(() => {
                wx.hideLoading();
            }, 500);
        })
            .catch(error => {
            console.error('打卡失败:', error);
            this.setData({ submitting: false });
            wx.showToast({
                title: '打卡失败，请重试',
                icon: 'none'
            });
            wx.hideLoading();
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
            url: `/pages/community/post/post?habitId=${this.data.habitId}&action=checkin`
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
    },
    /**
     * 加载今日所有需要打卡的习惯
     */
    async loadTodayHabits() {
        try {
            const today = (0, date_1.getCurrentDate)();
            const habits = await api_1.habitAPI.getHabits();
            // 过滤出今日需要执行的习惯，并排除当前正在打卡的习惯
            const todayHabits = habits.filter(habit => {
                const habitId = habit._id || habit.id;
                return !habit.isArchived &&
                    (0, habit_1.shouldDoHabitOnDate)(habit, today) &&
                    habitId !== this.data.habitId; // 排除当前正在打卡的习惯
            });
            // 为每个习惯添加统计数据
            const habitsWithStats = await Promise.all(todayHabits.map(async (habit) => {
                try {
                    const habitId = habit._id || habit.id;
                    if (!habitId)
                        return habit;
                    const stats = await api_1.habitAPI.getHabitStats(habitId);
                    return {
                        ...habit,
                        stats
                    };
                }
                catch (error) {
                    console.error(`获取习惯${habit.name}统计数据失败:`, error);
                    return {
                        ...habit,
                        stats: { currentStreak: 0 }
                    };
                }
            }));
            this.setData({
                todayHabits: habitsWithStats
            });
        }
        catch (error) {
            console.error('加载今日习惯失败:', error);
            this.setData({
                todayHabits: []
            });
        }
    },
    /**
     * 导航到其他习惯的打卡页面
     */
    navigateToCheckin(e) {
        const habitId = e.currentTarget.dataset.id;
        if (!habitId)
            return;
        // 获取习惯名称
        const habit = this.data.todayHabits.find(h => (h._id || h.id) === habitId);
        const habitName = habit ? encodeURIComponent(habit.name) : '';
        // 导航到该习惯的打卡页面
        wx.redirectTo({
            url: `/pages/checkin/checkin?habitId=${habitId}&habitName=${habitName}`
        });
    }
});
